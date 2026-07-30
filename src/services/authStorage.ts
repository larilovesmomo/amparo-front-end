import * as SecureStore from 'expo-secure-store';

export async function clearAuthStorage() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}