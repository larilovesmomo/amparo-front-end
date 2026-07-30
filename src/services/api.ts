// src/services/api.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { clearAuthStorage } from './authStorage';

// Esta variável impede loops infinitos de refresh
let isRefreshing = false;
// Fila de requisições que falharam e estão esperando um novo token
type FailedRequest = {
  resolve: (token: string) => void;
  reject: (err: any) => void;
};

let failedRequestsQueue: FailedRequest[] = [];

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedCallback(callback: () => void) {
  onUnauthorized = callback;
}

// O interceptor de REQUISIÇÃO continua o mesmo
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// NOVO: Adicionamos um interceptor de RESPOSTA para lidar com erros 401
api.interceptors.response.use(
  
  // Se a resposta for sucesso, não faz nada
  (response) => response,
  
  // Se a resposta for erro, executa esta função
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh de token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/token/')) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true; // Marca que já tentamos refazer esta requisição

        try {
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (!refreshToken) {
              failedRequestsQueue = [];
              if (onUnauthorized) {
              onUnauthorized();
              console.log("Sem refresh token disponível. Limpando sessão.");
            }

            // Se não há refresh token, desloga o usuário
            return Promise.reject(error);
          }

          // Faz a chamada para o endpoint de refresh do Django
          const { data } = await api.post('/api/token/refresh/', {
            refresh: refreshToken,
          });

          // Salva o novo access token
          await SecureStore.setItemAsync('accessToken', data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

          // Executa todas as requisições que estavam na fila de espera
          failedRequestsQueue.forEach(promise => promise.resolve(data.access));
          failedRequestsQueue = [];

          // Retorna a requisição original com o novo token
          return api(originalRequest);

        } catch (refreshError) {
          if (onUnauthorized) {
          onUnauthorized(); 
          // Se o refresh falhar, desloga o usuário
          await clearAuthStorage();
          failedRequestsQueue.forEach(promise => promise.reject(refreshError));
          failedRequestsQueue = [];
          // (Aqui você chamaria sua função global de signOut)
          console.log("Refresh token inválido, sessão removida.");
        }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Se já estivermos atualizando o token, adiciona a requisição à fila
      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          resolve: (token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;