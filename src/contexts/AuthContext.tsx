import React, { createContext, useState, useEffect, useContext, useMemo, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setUnauthorizedCallback } from '../services/api';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AgendamentoType } from '../pages/home/HomeScreen'; 
import { clearAuthStorage } from '../services/authStorage';
import { differenceInMinutes, isToday, parse, parseISO, set } from 'date-fns';
import { Alert } from 'react-native';

type AuthContextType = {
  signIn: (username: string, password: string) => Promise<void>;
  signOut: (automatic?: boolean) => Promise<void>;
  userToken: string | null;
  isLoading: boolean;
  checkAndRegisterDoses: () => Promise<void>;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldHandleWhileInForeground: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
const signOut = async (automatic = false): Promise<void> => {  
  try {
    await clearAuthStorage();
    setUserToken(null);

    if (automatic) {
      Alert.alert(
        "Sessão expirada",
        "Faça login novamente para continuar."
      );
    }

  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }  
}

  const checkAndRegisterDoses = async () => {
    console.log("4. checkAndRegisterDoses: DENTRO da função, iniciando chamadas API...");

    try{
      const [agendamentosResponse, registrosResponse] = await Promise.all([
        api.get('/api/agendamentos/'),
        api.get('/api/registros/')
      ])

      const agendamentos: AgendamentoType[] = agendamentosResponse.data;
      const registros: any[] = registrosResponse.data;
      const agora = new Date();
      const toleranciaMinutos = 1;

      for (const ag of agendamentos) {
        if (ag.frequencia !== 'Diário') continue;

        const horarioAlarme = parse(ag.horario, 'HH:mm:ss', new Date());

        if (differenceInMinutes(agora, horarioAlarme) > toleranciaMinutos) {
          
          const jaRegistradoHoje = registros.some(r => 
            r.agendamento.id === ag.id && isToday(parseISO(r.data_hora_tomada))
          );

          if (!jaRegistradoHoje) {
            console.log(`Dose não tomada detectada para: ${ag.medicamento.nome} às ${ag.horario}. Registrando...`);
            await api.post('/api/registros/', {
              agendamento: ag.id,
              tomou: false,
              data_hora_tomada: set(horarioAlarme, { seconds: 0 }).toISOString(), 
            });
          }
        }
      }

    }catch (error) {
      console.error("Erro ao verificar doses não tomadas:", error)
      throw error;
    }
  }

  useEffect(() => {
    const bootstrapAsync = async () => {
      console.log("1. bootstrapAsync: Iniciando verificação de token...");
      
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        setUserToken(token);
        console.log(token);
        console.log("2. bootstrapAsync: Token encontrado no SecureStore:", token ? `Sim (tamanho: ${token.length})` : 'Não (null)');

        if (token) {
          console.log("3. bootstrapAsync: Token existe, VOU CHAMAR a verificação de doses.");
          await checkAndRegisterDoses(); 
          console.log("5. bootstrapAsync: Verificação de doses CONCLUÍDA."); 
        } else {
          console.log("3. bootstrapAsync: Token NÃO existe");
          setUserToken(null);
        }
      } catch (e) {
        console.error('ERRO CRÍTICO no bootstrapAsync:', e);
        await signOut();
      } finally {
        console.log("6. bootstrapAsync: Finalizando, setIsLoading(false).");
        setIsLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Falha ao obter permissão para notificações! Os alarmes podem não funcionar.');
        return;
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 500, 250, 250, 500],
          lightColor: '#FF231F7C',
          bypassDnd: true,
          sound: 'alarm.mp3',
        });
      }
    };

    registerForPushNotificationsAsync();
  }, []); 

  const authContextValue = useMemo(
    () => ({
      isLoading,
      userToken,
      signIn: async (username: any, password: any) => {

        const response = await api.post('/api/token/', { username, password });
        const { access, refresh } = response.data;
        await SecureStore.setItemAsync('accessToken', access);
        await SecureStore.setItemAsync('refreshToken', refresh);
        
        setUserToken(access);
        await checkAndRegisterDoses();
      },
      signOut,
      checkAndRegisterDoses,
    }),
    [isLoading, userToken, signOut, checkAndRegisterDoses]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};