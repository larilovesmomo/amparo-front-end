import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility, FontSizeLevel, ColorPalette } from '../../contexts/AccessibilityContext';

import Header from '../../components/Header';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import SettingsRow from '../../components/SettingsRow';
import LogoAmparo from '../../assets/LogoAmparoPreto.png';

const FONT_SIZE_OPTIONS: { label: string; value: FontSizeLevel }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Grande', value: 'large' },
  { label: 'Extra\nGrande', value: 'xlarge' },
];

export default function SettingsScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const { highContrast, toggleHighContrast, fontSizeLevel, setFontSizeLevel, colors, fontScale } =
    useAccessibility();

  const styles = useMemo(() => makeStyles(colors, fontScale, highContrast), [colors, fontScale, highContrast]);

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Você tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Configurações</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência e Acessibilidade</Text>

          <SettingsRow
            label="Modo de contraste"
            value={highContrast}
            onValueChange={toggleHighContrast}
          />

          <View style={styles.fontSizeRow}>
            <Text style={styles.fontSizeLabel}>Tamanho da fonte</Text>
            <View style={styles.fontSizeButtons}>
              {FONT_SIZE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.fontSizeButton,
                    fontSizeLevel === opt.value && styles.fontSizeButtonActive,
                  ]}
                  onPress={() => setFontSizeLevel(opt.value)}
                >
                  <Text
                    style={[
                      styles.fontSizeButtonText,
                      fontSizeLevel === opt.value && styles.fontSizeButtonTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 20,
            fontSize: 14 * fontScale,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Versão {Constants.expoConfig?.version}
        </Text>
      </ScrollView>
      <BottomNavigationBar activeTab="settings" />
    </View>
  );
}

const makeStyles = (colors: ColorPalette, fontScale: number, highContrast: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    title: {
      fontSize: 24 * fontScale,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginVertical: 20,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14 * fontScale,
      color: colors.textSecondary,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      paddingVertical: 15,
    },
    fontSizeRow: {
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    fontSizeLabel: {
      fontSize: 16 * fontScale,
      color: colors.text,
      marginBottom: 12,
    },
    fontSizeButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    fontSizeButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    fontSizeButtonActive: {
      backgroundColor: colors.primary,
    },
    fontSizeButtonText: {
      fontSize: 13 * fontScale,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    fontSizeButtonTextActive: {
      color: colors.textOnPrimary,
    },
    logoutButton: {
      marginTop: 10,
      padding: 15,
      borderRadius: 10,
      backgroundColor: highContrast ? '#330000' : '#FFDDDD',
      alignItems: 'center',
    },
    logoutButtonText: {
      color: colors.error,
      fontWeight: 'bold',
      fontSize: 16 * fontScale,
    },
  });
