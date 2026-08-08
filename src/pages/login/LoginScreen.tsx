import React, { useMemo } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { makeStyles } from './style'; 
import LogoAmparo from '../../assets/LogoAmparo.png';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack'; 
import { RootStackParamList } from '../../../App'; 
import { AuthProvider, useAuth  } from '../../contexts/AuthContext'; 
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getApiErrorMessage } from '../../services/errorUtils';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn } = useAuth(); 
  const { colors, fontScale } = useAccessibility();
  const style = useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);

  const handleLogin = async () => {
    
    if(!username || !password){
      Alert.alert('Atenção', 'Por favor, preencha o usuário e a senha');
      return;
    }

    setLoading(true);

    try {
      await signIn(username, password);

    } catch (error) {

      console.error("Erro no login:", error);
      Alert.alert('Erro de Login', getApiErrorMessage(error, { isLogin: true }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={style.container}>
      <View style={style.boxTop}>
        <Image
          style={style.logo}
          source={LogoAmparo}
          resizeMode="contain"
        />
      </View>

      <View style={style.boxMid}>
        <Text style={style.textTitle}>USUÁRIO</Text>
        <View style={style.boxInput}>
          <TextInput
            style={style.textInput}
            placeholder="Digite seu usuário"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none" 
          />
          <AntDesign
            name='user'
            size={24}
            color={colors.text}
          />
        </View>

        <Text style={style.textTitle}>SENHA</Text>
        <View style={style.boxInput}>
          <TextInput
            style={style.textInput}
            placeholder="Digite sua senha"
            value={password}
            onChangeText={setPassword}
            keyboardType="number-pad"
            secureTextEntry={!showPassword}
            maxLength={4}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Entypo
              name={showPassword ? "eye-with-line" : "eye"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
        <View style={style.rowBetween}>
          <TouchableOpacity
            style={style.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={rememberMe ? "check-box" : "check-box-outline-blank"}
              size={20}
              color={colors.textOnPrimary}
            />
            <Text style={style.rememberMeText}>Lembre-se de mim</Text>
          </TouchableOpacity>
          <TouchableOpacity> 
            <Text style={style.textForget}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={style.boxBottom}>
        <TouchableOpacity 
          style={[style.button, loading && {backgroundColor: '#ccc'}]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={style.textButton}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Ajuste o nome da tela de cadastro se necessário */}
      <TouchableOpacity onPress={() => navigation.navigate('CadastroUsuario' as never)}>
        <Text style={style.textBotton}>Não tem conta? Criar agora!</Text>
      </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}