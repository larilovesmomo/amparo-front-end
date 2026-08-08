import React, { useState, useRef } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { format, parseISO } from 'date-fns';
import { notificarEstoqueBaixo } from '../../services/notificacao';
import { getApiErrorMessage } from '../../services/errorUtils';
import { useAccessibility, ColorPalette } from '../../contexts/AccessibilityContext';

export default function AlarmScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { agendamentoId: initialAgendamentoId } = route.params;

  const [currentAgendamentoId, setCurrentAgendamentoId] = useState(initialAgendamentoId);
  const [agendamento, setAgendamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { colors, fontScale, highContrast } = useAccessibility();
  const styles = React.useMemo(() => makeStyles(colors, fontScale, highContrast), [colors, fontScale, highContrast]);

  const agendamentoRef = useRef<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchAgendamentoDetails = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/api/agendamentos/${currentAgendamentoId}/`);
          setAgendamento(response.data);
          agendamentoRef.current = response.data; 
        } catch (error: any) {
          
          if (error.response && error.response.status === 404 && agendamentoRef.current) {
            console.log("Procurando o agendamento recriado pós-edição...");
            try {
              const listaResponse = await api.get('/api/agendamentos/');
              const novaLista = listaResponse.data;

              const novoAgendamento = novaLista.find((a: any) =>
                a.medicamento.id === agendamentoRef.current.medicamento.id &&
                a.horario === agendamentoRef.current.horario
              );

              if (novoAgendamento) {
                setCurrentAgendamentoId(novoAgendamento.id);
                setAgendamento(novoAgendamento);
                agendamentoRef.current = novoAgendamento;
                setLoading(false);
                return; 
              }
            } catch (e) {
              console.error("Erro na busca de recuperação:", e);
            }
          }

          Alert.alert("Lembrete Expirado", "O horário deste tratamento foi alterado e este alarme não é mais válido.");
          navigation.navigate('Home');
        } finally {
          setLoading(false);
        }
      };

      fetchAgendamentoDetails();
    }, [currentAgendamentoId]) 
  );

  const handleRegister = async (tomou: boolean) => {
    try {
      const response = await api.post('/api/registros/', {
        agendamento: currentAgendamentoId, 
        tomou: tomou,
        data_hora_tomada: new Date().toISOString(),
      });

      Alert.alert("Registrado!", tomou ? "Bom trabalho!" : "Dose registrada como não tomada.");
      
      if (tomou) {
        const medBackend = response.data?.agendamento?.medicamento;
        if (medBackend) {
          const estoqueAtual = parseFloat(medBackend.estoque_atual);
          const avisoMinimo = parseInt(medBackend.aviso_estoque_minimo, 10);
          if (estoqueAtual <= avisoMinimo) {
            await notificarEstoqueBaixo(medBackend.nome, estoqueAtual);
          }
        }
      }
      navigation.navigate('Home'); 
    } catch (error) {
      console.error("Erro ao registrar tomada:", error);
      Alert.alert("Erro", getApiErrorMessage(error));
    }
  };

  if (loading || !agendamento) {
    return <View style={styles.container}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const estoqueAtual = parseFloat(agendamento.medicamento.estoque_atual) || 0;
  const semEstoque = estoqueAtual <= 0;

  return (
    <View style={styles.container}>
      {semEstoque ? (
        <MaterialCommunityIcons name="package-variant-remove" size={80} color={colors.error} style={styles.bellIcon} />
      ) : (
        <FontAwesome5 name="bell" size={80} color={colors.primary} style={styles.bellIcon} />
      )}

      <Text style={[styles.title, semEstoque && { color: colors.error }]}>
        {semEstoque ? 'Estoque Esgotado!' : 'Hora da Medicação!'}
      </Text>
      
      <Text style={styles.time}>{format(parseISO(`1970-01-01T${agendamento.horario}`), 'HH:mm')}</Text>
      <Text style={styles.medication}>
        {agendamento.medicamento.nome} {agendamento.medicamento.dosagem_valor} {agendamento.medicamento.dosagem_unidade}
      </Text>

      {semEstoque && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Você não possui este medicamento em estoque no aplicativo. Registre que pulou a dose ou atualize seu estoque.
          </Text>
        </View>
      )}

      {!semEstoque ? (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleRegister(true)}>
            <Text style={styles.primaryButtonText}>Remédio tomado!</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleRegister(false)}>
            <Text style={styles.secondaryButtonText}>Pular dose.</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.navigate('CadastroMedicamento', { isEditing: true, medicamentoData: agendamento.medicamento })}
          >
            <Text style={styles.primaryButtonText}>Renovar Estoque</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => handleRegister(false)}>
            <Text style={styles.secondaryButtonText}>Pular dose</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ColorPalette, fontScale: number, highContrast: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bellIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28 * fontScale,
    fontWeight: 'bold',
    color: colors.primary,
  },
  time: {
    fontSize: 72 * fontScale,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 10,
  },
  medication: {
    fontSize: 24 * fontScale,
    color: colors.textSecondary,
    marginBottom: 60,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    width: '80%',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 18 * fontScale,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.inputBackground,
    width: '80%',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 18 * fontScale,
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: highContrast ? '#332200' : '#fff3cd',
    borderColor: highContrast ? '#443300' : '#ffeeba',
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    width: '90%',
    marginBottom: 30,
  },
  warningText: {
    color: highContrast ? '#ffdd99' : '#856404',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14 * fontScale,
  },
  linkButton: {
    marginTop: 25,
    padding: 10,
  },
  linkButtonText: {
    color: colors.primary,
    fontSize: 16 * fontScale,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  }
});