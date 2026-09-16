import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Switch, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { parseISO, isAfter } from 'date-fns'
import { useAccessibility } from '../contexts/AccessibilityContext';

type TratamentoCardProps = {
  medicamento: any; 
  onEdit: () => void;
  onDelete: () => void;
  onInativar: () => void;
  onToggleActive?: (medicamento: any, novoEstado: boolean) => void;
  isToggling?: boolean;
};

const TratamentoCard: React.FC<TratamentoCardProps> = ({ medicamento, onEdit, onDelete, onInativar, onToggleActive, isToggling }) => {
  const { colors, fontScale } = useAccessibility();
  const styles = useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);
  const dataFimString = medicamento.agendamentos?.[0]?.data_fim;
  const isFinished = dataFimString ? isAfter(new Date(), parseISO(dataFimString)) : false;
  const isInactive = medicamento.is_active === false;

  const renderRightActions = (progress: any, dragX: any) => {
    if (isInactive) return null;
    const trans = dragX.interpolate({
      inputRange: [-150, 0],
      outputRange: [0, 150],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.actionsContainer, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
          <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.inativarButton]} onPress={onInativar}>
          <MaterialCommunityIcons name="pause-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <GestureHandlerRootView>
      <Swipeable renderRightActions={renderRightActions} enabled={!isInactive}>
        <TouchableOpacity onPress={isInactive ? undefined : onEdit} activeOpacity={0.7}>
          <View style={[styles.card, isFinished && styles.cardFinished, isInactive && styles.cardInactive]}>
            <FontAwesome5 name="pills" size={24} color={isInactive ? colors.textSecondary : isFinished ? colors.textSecondary : colors.primary} style={styles.iconContainer} />
            <View style={styles.infoContainer}>
              <Text style={[styles.medicationName, (isFinished || isInactive) && styles.textFinished]}>{medicamento.nome}</Text>
              <Text style={[styles.dosage, (isFinished || isInactive) && styles.textFinished]}>{medicamento.dosagem_valor} {medicamento.dosagem_unidade}</Text>
              {isInactive ? (
                <Text style={styles.inactiveText}>Inativo</Text>
              ) : (
                <Text style={styles.statusText}>{isFinished ? 'Tratamento finalizado' : 'Em andamento'}</Text>
              )}
            </View>
            <View style={styles.toggleContainer}>
              {isToggling ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={!isInactive}
                  onValueChange={(value) => onToggleActive?.(medicamento, value)}
                  disabled={isFinished}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={isInactive ? colors.textSecondary : '#fff'}
                  accessibilityLabel={`Alternar estado do medicamento ${medicamento.nome}`}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const makeStyles = (colors: any, fontScale: number) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    cardFinished: {
      backgroundColor: colors.border,
    },
    cardInactive: {
      backgroundColor: colors.border,
      opacity: 0.7,
    },
    iconContainer: {
      marginRight: 16,
    },
    infoContainer: {
      flex: 1,
    },
    medicationName: {
      fontSize: 18 * fontScale,
      fontWeight: 'bold',
      color: colors.text,
    },
    dosage: {
      fontSize: 14 * fontScale,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusText: {
      fontSize: 12 * fontScale,
      color: '#00897B',
      fontWeight: '500',
      marginTop: 4,
      fontStyle: 'italic',
    },
    inactiveText: {
      fontSize: 12 * fontScale,
      color: '#F44336',
      fontWeight: '500',
      marginTop: 4,
      fontStyle: 'italic',
    },
    textFinished: {
      color: colors.textSecondary,
    },
    swipeIndicator: {
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.6,
    },
    actionsContainer: {
      flexDirection: 'row',
      width: 240,
      marginBottom: 12,
      marginRight: 16,
    },
    actionButton: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionText: {
      color: '#fff',
      fontSize: 12,
      marginTop: 4,
    },
    editButton: {
      backgroundColor: '#2196F3',
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    inativarButton: {
      backgroundColor: '#FF9800',
    },
    deleteButton: {
      backgroundColor: '#F44336',
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },
    toggleContainer: {
      marginLeft: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default TratamentoCard;