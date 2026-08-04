import 'react-native-gesture-handler'; 

import React, {useState, useEffect, useRef} from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

import Splash from './src/pages/splashe'; 
import LoginScreen from './src/pages/login/LoginScreen'; 
import HomeScreen from './src/pages/home/HomeScreen'; 
import CadastroMedicamentos from './src/pages/cadastrar-medicamentos/Cadastro';  
import CadastroUsuario from './src/pages/cadastro-usuarios/CadastroScreen';    
import ConfiguracaoScreen from './src/pages/configuracao/ConfiguracaoScreen';
import AlarmScreen from './src/pages/Alarme/AlarmeScreen';
import GerenciamentoScreen from './src/pages/gerenciamento/GerenciamentoScreen';
import HistoricoScreen from './src/pages/historico/HistoricoScreen';

export type RootStackParamList = {
  Splash: undefined; 
  Gerenciamento: undefined;
  Login: undefined;  
  Home: undefined;  
  CadastroMedicamento: undefined;
  CadastroUsuario: undefined;
  Configuracao: undefined;
  Alarm: { agendamentoId: string };
  Historico: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { userToken, isLoading } = useAuth(); 
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [pendingNotification, setPendingNotification] = useState<any>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data.screen === 'Alarm' && data.agendamentoId) {
        console.log('Ação de alarme anotada:', data.agendamentoId);
        setPendingNotification({ name: 'Alarm', params: { agendamentoId: data.agendamentoId } });
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isLoading && pendingNotification) {
      if (userToken) {
        console.log('Usuário está logado, executando ação pendente...');
        navigationRef.navigate(pendingNotification.name, pendingNotification.params);
      
        setPendingNotification(null);
      }
    }
  }, [isLoading, userToken, pendingNotification, navigationRef]);

  if (isLoading) {
    return <Splash />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CadastroUsuario" component={CadastroUsuario} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Configuracao" component={ConfiguracaoScreen} />
            <Stack.Screen name="CadastroMedicamento" component={CadastroMedicamentos} />
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Alarm" component={AlarmScreen} />
            <Stack.Screen name="Gerenciamento" component={GerenciamentoScreen} />
            <Stack.Screen name="Historico" component={HistoricoScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </AccessibilityProvider>
  );
}
