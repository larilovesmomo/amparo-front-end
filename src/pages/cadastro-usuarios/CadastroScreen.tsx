import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { makeStyles } from './styles';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import LogoAmparo from '../../assets/LogoAmparo.png';

export default function CadastroScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [loading, setLoading] = useState(false);

  const { colors, fontScale, highContrast } = useAccessibility();
  const styles = React.useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);

  const navigation = useNavigation();

  const handleKeyPress = (num: string) => {
    if (password.length < 4) setPassword(password + num);
  };

  const handleBackspace = () => {
    setPassword(password.slice(0, -1));
  };

  const handleConfirm = async () => {
    if (!username.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o nome de usuário.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Atenção', 'O PIN deve ter 4 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await axios.post(`${apiUrl}/api/pacientes/`, {
        username: username,
        password: password,
      });

      Alert.alert(
        'Sucesso!',
        'Sua conta foi criada. Por favor, faça o login.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
      );

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro no cadastro:", JSON.stringify(error.response?.data));
      } else {
        console.error("Erro no cadastro:", error);
      }
      let errorMessage = 'Não foi possível criar a conta. Tente novamente.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const errors = error.response.data;
        if (errors.username) {
            errorMessage = `Nome de usuário: ${errors.username[0]}`;
        } else if (errors.password) {
            errorMessage = `Senha: ${errors.password[0]}`;
        } else if (errors.error) {
            errorMessage = errors.error;
        }
      }
      Alert.alert('Erro de Cadastro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const keypadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'], 
  ];

  const renderPinInputs = () => (
    <View style={styles.pinContainer}>
      {Array(4).fill(0).map((_, index) => (
        <View key={index} style={styles.pinBox}>
          {password.length > index && (
            <Text style={styles.pinText}>*</Text>
          )}
        </View>
      ))}
    </View>
);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={highContrast ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={28} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Image
            source={LogoAmparo}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Cadastre-se agora!</Text>

          <Text style={styles.label}>Nome de Usuário</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome de usuário"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Crie seu PIN</Text>
          {renderPinInputs()}

          <View style={styles.keypad}>
            {keypadLayout.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((item) => {
                  if (item === 'backspace') {
                    return (
                      <TouchableOpacity
                        key={item}
                        style={styles.keypadButton}
                        onPress={handleBackspace}
                      >
                        <Ionicons name="backspace-outline" size={32} color={colors.textOnPrimary} />
                      </TouchableOpacity>
                    );
                  }
                  
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.keypadButton,
                        item === '' && { backgroundColor: 'transparent' },
                      ]}
                      onPress={() => item !== '' && handleKeyPress(item)}
                      disabled={item === ''}
                    >
                      <Text style={styles.keypadButtonText}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Botão de confirmação com estado de carregamento */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            )}
          </TouchableOpacity>
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}