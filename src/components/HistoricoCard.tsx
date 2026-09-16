// src/components/HistoricoCard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useAccessibility } from '../contexts/AccessibilityContext';

type HistoricoCardProps = {
  registro: {
    tomou: boolean;
    data_hora_tomada: string;
    agendamento: {
      horario: string;
      medicamento: {
        nome: string;
        dosagem_formatada: string;
        is_active: boolean;
      }
    }
  }

  onPress: () => void;
};

const HistoricoCard: React.FC<HistoricoCardProps> = ({ registro, onPress }) => {
  const { colors, fontScale } = useAccessibility();
  const styles = useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);
  const medicamento = registro?.agendamento?.medicamento;
  const horario = registro?.agendamento?.horario;
  const tomou = registro?.tomou;
  const isInactive = medicamento?.is_active === false;

  const cardStyle = [styles.card, !tomou && styles.cardMissed, isInactive && styles.cardInactive];
  const textStyle = [styles.baseText, !tomou && styles.textMissed, isInactive && styles.textInactive];
  const iconColor = tomou ? colors.cardBlueText : colors.cardBlueSubtext;

  if (!medicamento || !horario) {
    return (
      <View style={[styles.card, styles.cardError]}>
        <Text style={styles.errorText}>Erro ao carregar este registro.</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={cardStyle}>
        <View style={styles.leftContent}>
          <View style={styles.nameRow}>
            <Text style={[styles.medicationText, textStyle]}>{medicamento.nome}</Text>
            {isInactive && <Text style={styles.inactiveText}> (Inativo)</Text>}
          </View>
          <Text style={[styles.dosageText, textStyle]}>{medicamento.dosagem_formatada ?? ''}</Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={[styles.timeText, textStyle]}>{format(parseISO(`1970-01-01T${horario}`), 'HH:mm')}</Text>
          <MaterialCommunityIcons
            name={tomou ? "check-circle" : "close-circle"}
            size={24}
            color={iconColor}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (colors: any, fontScale: number) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBlue,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      marginBottom: 10,
      marginHorizontal: 16,
    },
    cardMissed: {
      backgroundColor: colors.navBar,
      borderColor: colors.border,
      borderWidth: 1,
    },
    cardInactive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    cardError: {
      backgroundColor: '#FFEBEE',
      borderColor: colors.error,
      borderWidth: 1,
    },
    errorText: {
      color: colors.error,
      fontStyle: 'italic',
    },
    leftContent: {
      flex: 1,
      justifyContent: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    medicationText: {
      fontSize: 16 * fontScale,
      fontWeight: 'bold',
      color: colors.cardBlueText,
    },
    dosageText: {
      fontSize: 14 * fontScale,
      color: colors.cardBlueSubtext,
    },
    timeText: {
      fontSize: 16 * fontScale,
      fontWeight: 'bold',
      color: colors.cardBlueText,
      marginRight: 8,
    },
    baseText: {
      color: colors.cardBlueText,
    },
    textMissed: {
      color: colors.cardBlueText,
    },
    textInactive: {
      color: colors.textSecondary,
    },
    inactiveText: {
      fontSize: 12 * fontScale,
      color: '#F44336',
      fontWeight: '500',
      marginTop: 1,
      fontStyle: 'italic',
    },
  });

export default HistoricoCard;