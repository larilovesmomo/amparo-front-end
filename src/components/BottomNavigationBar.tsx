import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface BottomNavigationBarProps {
  activeTab: 'calendar' | 'search' | 'add' | 'timer' | 'settings';
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ activeTab }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useAccessibility();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const iconColor = (tab: string) =>
    activeTab === tab ? colors.navBarIconActive : colors.navBarIcon;

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' && {
          height: 80 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
        },
      ]}
    >
      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
        <MaterialCommunityIcons name="calendar-month" size={28} color={iconColor('calendar')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Gerenciamento')}>
        <MaterialCommunityIcons name="text-box-search-outline" size={28} color={iconColor('search')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CadastroMedicamento')}>
        <Feather name="plus" size={38} color={iconColor('add')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Historico')}>
        <MaterialCommunityIcons name="clock-time-four-outline" size={28} color={iconColor('timer')} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Configuracao')}>
        <MaterialCommunityIcons name="cog" size={28} color={iconColor('settings')} />
      </TouchableOpacity>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: colors.navBar,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      paddingBottom: 10,
    },
    iconButton: {
      padding: 10,
    },
  });

export default BottomNavigationBar;
