import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  format,
  isBefore,
  isAfter,
  isSameDay,
  parse,
  parseISO,
  startOfToday,
  startOfDay,
  differenceInMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import { getApiErrorMessage } from '../../services/errorUtils';
import { useFocusEffect } from '@react-navigation/native';
import { useAccessibility, ColorPalette } from '../../contexts/AccessibilityContext';
import { RootStackParamList } from '../../../App';

import Header from '../../components/Header';
import CalendarComponent from '../../components/CalendarComponent';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import LogoAmparo from '../../assets/LogoAmparoPreto.png';
import MedicationGroupCard from '../../components/MedicacaoGroupCard';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface MedicamentoType {
  id: number;
  nome: string;
  dosagem_valor: string;
  dosagem_unidade: string;
  observacao: string | null;
  estoque_atual: string;
  aviso_estoque_minimo: string;
  is_active: boolean;
  horario_inicio: string | null;
  horario_fim: string | null;
  intervalo: number | null;
  duracao_valor: number | null;
}

export interface AgendamentoType {
  id: number;
  horario: string;
  frequencia: 'Diário' | 'Semanal';
  medicamento: MedicamentoType;
  data_fim: string | null;
  created_at: string;
}

interface RegistroType {
  id: number;
  data_hora_tomada: string;
  tomou: boolean;
  agendamento: {
    id: number;
    horario: string;
    medicamento: { id: number; nome: string };
  };
}

// Adherence thresholds in minutes
const PONTUAL_THRESHOLD = 60;
const ATRASADO_THRESHOLD = 360;

const CAL_COLORS = {
  pontual: '#5891d4',
  atrasado: '#FFD700',
  registradoDepois: '#0047AB',
  agendado: '#BBBBBB',
};

function classifyRegistro(registro: RegistroType): 'pontual' | 'atrasado' | 'registradoDepois' {
  const tomadaDate = parseISO(registro.data_hora_tomada);
  const scheduledDateStr = format(tomadaDate, 'yyyy-MM-dd');
  const scheduledDateTime = parse(
    `${scheduledDateStr} ${registro.agendamento.horario}`,
    'yyyy-MM-dd HH:mm:ss',
    new Date(),
  );

  const diffMin = differenceInMinutes(tomadaDate, scheduledDateTime);

  if (diffMin < 0 || Math.abs(diffMin) <= PONTUAL_THRESHOLD) return 'pontual';
  if (diffMin <= ATRASADO_THRESHOLD) return 'atrasado';
  return 'registradoDepois';
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, fontScale } = useAccessibility();
  const styles = useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [agendamentos, setAgendamentos] = useState<AgendamentoType[]>([]);
  const [registros, setRegistros] = useState<RegistroType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [agRes, regRes] = await Promise.all([
        api.get('/api/agendamentos/'),
        api.get('/api/registros/'),
      ]);
      setAgendamentos(agRes.data);
      setRegistros(regRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(React.useCallback(() => { fetchData(); }, []));

  // Build markedDates for the calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Add adherence dots from registros (only for taken doses)
    registros
      .filter(r => r.tomou)
      .forEach(r => {
        const dateKey = format(parseISO(r.data_hora_tomada), 'yyyy-MM-dd');
        if (!marks[dateKey]) marks[dateKey] = { dots: [] };
        if (!marks[dateKey].dots) marks[dateKey].dots = [];

        const classification = classifyRegistro(r);
        const color = CAL_COLORS[classification];
        const key = classification;

        const alreadyHas = marks[dateKey].dots.some((d: any) => d.key === key);
        if (!alreadyHas) {
          marks[dateKey].dots.push({ key, color });
        }
      });

    // Highlight selected date — preserve existing dots
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
    };

    return marks;
  }, [registros, selectedDate, colors.primary]);

  // Group agendamentos into medication cards for the selected date
  const lembretesAgrupados = useMemo(() => {
    const agora = new Date();
    const hoje = startOfToday();
    const dataSelecionadaObj = parseISO(selectedDate);

    const agendamentosValidos = agendamentos.filter(ag => {
      const dataInicio = startOfDay(parseISO(ag.created_at));

      if (isBefore(dataSelecionadaObj, dataInicio)) return false;

      if (ag.data_fim) {
        const dataFim = parseISO(ag.data_fim);
        if (isAfter(dataSelecionadaObj, dataFim)) return false;
      }

      return true;
    });

    if (agendamentosValidos.length === 0) return [];

    const grupos = agendamentosValidos.reduce(
      (acc, agendamento) => {
        const medId = agendamento.medicamento.id;
        if (!acc[medId]) {
          acc[medId] = { ...agendamento.medicamento, horarios: [], data_fim: agendamento.data_fim };
        }
        acc[medId].horarios.push(agendamento.horario);
        return acc;
      },
      {} as { [key: number]: MedicamentoType & { horarios: string[]; data_fim: string | null } },
    );

    return Object.values(grupos)
      .map(grupo => {
        const horariosOrdenados = grupo.horarios.sort();
        const horariosFuturos = isSameDay(dataSelecionadaObj, hoje)
          ? horariosOrdenados.filter(h => isAfter(parse(h, 'HH:mm:ss', new Date()), agora))
          : horariosOrdenados;

        const proximoHorario = horariosFuturos[0] ?? null;
        const outrosHorarios = horariosFuturos.slice(1);
        const estaraFinalizado = grupo.data_fim
          ? isAfter(dataSelecionadaObj, parseISO(grupo.data_fim))
          : false;

        return {
          ...grupo,
          proximoHorario: estaraFinalizado
            ? null
            : proximoHorario
              ? format(parse(proximoHorario, 'HH:mm:ss', new Date()), 'HH:mm')
              : null,
          outrosHorarios: estaraFinalizado
            ? []
            : outrosHorarios.map(h => format(parse(h, 'HH:mm:ss', new Date()), 'HH:mm')),
          estaraFinalizado,
          dataFim: grupo.data_fim,
        };
      })
      .sort((a, b) =>
        (a.proximoHorario || '23:59').localeCompare(b.proximoHorario || '23:59'),
      );
  }, [agendamentos, selectedDate]);

  // Summary info for the selected day
  const daySummary = useMemo(() => {
    const hoje = startOfToday();
    const dataSelecionadaObj = parseISO(selectedDate);
    const isPast = isBefore(dataSelecionadaObj, hoje);
    const isToday = isSameDay(dataSelecionadaObj, hoje);

    const registrosDoDia = registros.filter(
      r => format(parseISO(r.data_hora_tomada), 'yyyy-MM-dd') === selectedDate,
    );
    const tomados = registrosDoDia.filter(r => r.tomou).length;
    const total = registrosDoDia.length;

    return { isPast, isToday, tomados, total, totalAgendados: lembretesAgrupados.length };
  }, [registros, selectedDate, lembretesAgrupados]);

  const renderSummaryCard = () => {
    const dateLabel = format(new Date(`${selectedDate}T12:00:00`), "d 'de' MMMM", { locale: ptBR });
    const title = daySummary.isToday ? `Hoje, ${dateLabel}` : dateLabel;

    let subtitle = '';
    if (daySummary.totalAgendados === 0) {
      subtitle = 'Nenhum medicamento agendado';
    } else if (daySummary.isPast && !daySummary.isToday) {
      subtitle =
        daySummary.total > 0
          ? `${daySummary.tomados} de ${daySummary.total} dose${daySummary.total !== 1 ? 's' : ''} registrada${daySummary.total !== 1 ? 's' : ''}`
          : 'Sem registros para este dia';
    } else {
      subtitle = `${daySummary.totalAgendados} medicamento${daySummary.totalAgendados !== 1 ? 's' : ''} agendado${daySummary.totalAgendados !== 1 ? 's' : ''}`;
    }

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summarySubtitle}>{subtitle}</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />;
    if (error) return <Text style={styles.errorText}>{error}</Text>;
    if (lembretesAgrupados.length === 0) {
      return <Text style={styles.emptyText}>Nenhum lembrete para este dia.</Text>;
    }
    return lembretesAgrupados.map(grupo => (
      <MedicationGroupCard
        key={grupo.id}
        nomeMedicamento={grupo.nome}
        dosagem={grupo.dosagem_valor + ' ' + grupo.dosagem_unidade}
        estoqueAtual={grupo.estoque_atual}
        proximoHorario={grupo.proximoHorario}
        outrosHorarios={grupo.outrosHorarios}
        estaraFinalizado={grupo.estaraFinalizado}
        dataFim={grupo.dataFim}
        onPress={() => navigation.navigate('Gerenciamento')}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <Header logoSource={LogoAmparo} />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <CalendarComponent
          onDayPress={day => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          currentMonth={''}
        />
        {renderSummaryCard()}
        {renderContent()}
      </ScrollView>
      <BottomNavigationBar activeTab="calendar" />
    </View>
  );
};

const makeStyles = (colors: ColorPalette, fontScale: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 130,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    summaryTitle: {
      color: colors.primary,
      fontSize: 16 * fontScale,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    summarySubtitle: {
      color: colors.textSecondary,
      fontSize: 13 * fontScale,
    },
    errorText: {
      color: colors.error,
      fontSize: 16 * fontScale,
      textAlign: 'center',
      marginTop: 20,
      marginHorizontal: 16,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16 * fontScale,
      textAlign: 'center',
      marginTop: 20,
      marginHorizontal: 16,
    },
  });

export default HomeScreen;
