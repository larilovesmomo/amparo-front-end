import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAccessibility } from '../contexts/AccessibilityContext';

type MedicacaoGroupCardProps = {
  nomeMedicamento: string;
  dosagem: string;
  estoqueAtual?: string | null;
  proximoHorario: string | null;
  outrosHorarios: string[];
  estaraFinalizado: boolean;
  dataFim: string | null;
};

const formatEstoque = (value?: string | null): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return String(parseFloat(num.toFixed(2)));
};

const MedicacaoGroupCard: React.FC<MedicacaoGroupCardProps> = ({
  nomeMedicamento,
  dosagem,
  estoqueAtual,
  proximoHorario,
  outrosHorarios,
  estaraFinalizado,
  dataFim,
}) => {
  const { colors, fontScale } = useAccessibility();
  const styles = useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);
  const estoqueFormatado = formatEstoque(estoqueAtual);

  return (
    <View style={[styles.card, estaraFinalizado && styles.cardFinished]}>
      <View style={styles.row}>
        <Text style={[styles.medicationText, estaraFinalizado && styles.textFinished]}>
          {nomeMedicamento}
        </Text>
        <Text style={[styles.dosageText, estaraFinalizado && styles.textFinished]}>
          {' '}
          - {dosagem}
        </Text>
      </View>

      {estaraFinalizado ? (
        <View style={[styles.row, { marginTop: 8 }]}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#616161" style={styles.icon} />
          <Text style={styles.finishedMessage}>
            Tratamento finalizado em{' '}
            {dataFim ? format(parseISO(dataFim), 'dd/MM/yyyy', { locale: ptBR }) : ''}
          </Text>
        </View>
      ) : (
        <>
          {estoqueFormatado !== null && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={16}
                color={colors.cardBlueSubtext}
                style={styles.icon}
              />
              <Text style={styles.stockText}>
                Estoque atual: <Text style={styles.stockValueText}>{estoqueFormatado}</Text>
              </Text>
            </View>
          )}

          {proximoHorario && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={20}
                color={colors.cardBlueSubtext}
                style={styles.icon}
              />
              <Text style={styles.detailsText}>Próximo às </Text>
              <Text style={styles.timeText}>{proximoHorario}</Text>
            </View>
          )}

          {outrosHorarios.length > 0 && (
            <View style={[styles.row, { marginTop: 4 }]}>
              <View style={{ width: 20, marginRight: 8 }} />
              <Text style={styles.footerText}>Também às {outrosHorarios.join(', ')}</Text>
            </View>
          )}

          {!proximoHorario && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={colors.cardBlueSubtext}
                style={styles.icon}
              />
              <Text style={styles.allTakenText}>Nenhum lembrete futuro para hoje.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const makeStyles = (colors: any, fontScale: number) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBlue,
      borderRadius: 10,
      marginBottom: 12,
      marginHorizontal: 16,
      padding: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    cardFinished: {
      backgroundColor: colors.border,
    },
    textFinished: {
      color: '#616161',
    },
    finishedMessage: {
      color: '#424242',
      fontSize: 14 * fontScale,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: 8,
    },
    medicationText: {
      color: colors.cardBlueText,
      fontSize: 18 * fontScale,
      fontWeight: 'bold',
    },
    dosageText: {
      color: colors.cardBlueSubtext,
      fontSize: 16 * fontScale,
      fontWeight: '500',
    },
    detailsText: {
      color: colors.cardBlueSubtext,
      fontSize: 14 * fontScale,
    },
    stockText: {
      color: colors.cardBlueSubtext,
      fontSize: 13 * fontScale,
      fontStyle: 'italic',
    },
    stockValueText: {
      fontWeight: 'bold',
    },
    timeText: {
      color: colors.cardBlueText,
      fontSize: 16 * fontScale,
      fontWeight: 'bold',
    },
    footerText: {
      color: colors.cardBlueSubtext,
      fontSize: 12 * fontScale,
      fontStyle: 'italic',
    },
    allTakenText: {
      color: colors.cardBlueSubtext,
      fontSize: 14 * fontScale,
      fontStyle: 'italic',
    },
  });

export default MedicacaoGroupCard;
