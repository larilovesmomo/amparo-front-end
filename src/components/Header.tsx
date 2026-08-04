import React, { useMemo } from 'react';
import { View, Image, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { useAccessibility } from '../contexts/AccessibilityContext';
import LogoAmparo from '../assets/LogoAmparo.png';

interface HeaderProps {
  logoSource?: any;
}

const Header: React.FC<HeaderProps> = () => {
  const { colors, highContrast } = useAccessibility();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={highContrast ? 'dark-content' : 'light-content'} />
      <View style={styles.container}>
        <Image source={LogoAmparo} style={styles.logo} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.primary,
      paddingTop: getStatusBarHeight(),
    },
    container: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 10,
      width: '100%',
    },
    logo: {
      height: 40,
      width: 100,
    },
  });

export default Header;
