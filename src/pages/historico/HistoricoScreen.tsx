import React, { useState, useMemo } from 'react';
import { View, Text, SectionList, ActivityIndicator, Modal, Alert, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO, isToday, isYesterday, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import Header from '../../components/Header';
import HistoricoRecordCard from '../../components/HistoricoCard';
import LogoAmparo from '../../assets/LogoAmparoPreto.png';
import { makeStyles } from './styles'; 
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { useAuth } from '../../contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import { notificarEstoqueBaixo } from '../../services/notificacao';
import { getApiErrorMessage } from '../../services/errorUtils';
import { useAccessibility, ColorPalette } from '../../contexts/AccessibilityContext';


type RegistroType = any; 

export default function HistoricoScreen() {
  const [registros, setRegistros] = useState<RegistroType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'search' | 'add' | 'timer' | 'settings'>('timer');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegistroType | null>(null);
  const [editHour, setEditHour] = useState('');
  const [editMinute, setEditMinute] = useState('');
  const { checkAndRegisterDoses } = useAuth();
  
  const { colors, fontScale } = useAccessibility();
  const styles = React.useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      await checkAndRegisterDoses();
      const response = await api.get('/api/registros/');
      setRegistros(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => { fetchHistorico(); }, []));

  const formatSectionTitle = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };
  
  const groupedRecords = useMemo(() => {
    if (registros.length === 0) return [];
    
    
    const groups = registros.reduce((acc, registro) => {
      const dateKey = format(parseISO(registro.data_hora_tomada), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(registro);
      return acc;
    }, {} as { [key: string]: RegistroType[] });


    return Object.keys(groups).map(date => ({
      title: formatSectionTitle(date),
      data: groups[date],
    }));
  }, [registros]);

  const handleOpenEditModal = (registro: any) => {
    setSelectedRecord(registro);
    const initialDate = parseISO(registro.data_hora_tomada);
    setEditHour(format(initialDate, 'HH'));
    setEditMinute(format(initialDate, 'mm'));
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };

  const handleUpdateRecord = async (tomou: boolean) => {
    if (!selectedRecord) return;

    const hour = parseInt(editHour, 10);
    const minute = parseInt(editMinute, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      Alert.alert("Erro", "Por favor, insira um horário válido (HH:mm).");
      return;
    }

    const originalDate = parseISO(selectedRecord.data_hora_tomada);
    const finalDate = set(originalDate, { hours: hour, minutes: minute });

    const payload = {
      tomou: tomou,
      data_hora_tomada: finalDate.toISOString(),
    };

    try {
      setLoading(true);
      const response = await api.patch(`/api/registros/${selectedRecord.id}/`, payload);

      setRegistros(prev => prev.map(r => r.id === selectedRecord.id ? response.data : r));
      handleCloseModal();

      if (tomou) {
        const medId = response.data.agendamento.medicamento;
        const estoqueAtual = parseFloat(medId.estoque_atual);
        const avisoMinimo = parseInt(medId.aviso_estoque_minimo, 10);
        const nomeMed = medId.nome;

        if (estoqueAtual <= avisoMinimo) {
          await notificarEstoqueBaixo(nomeMed, estoqueAtual);
        }
      }

      Alert.alert("Sucesso", "Registro atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header logoSource={LogoAmparo} />
      <Text style={styles.title}>Histórico de Medicamentos</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }}/>
      ) : (
        <SectionList
          sections={groupedRecords}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          renderItem={({ item }) => <HistoricoRecordCard registro={item} onPress={() => handleOpenEditModal(item)} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          ListEmptyComponent={
            <View style={styles.centerContent}>
                <Text style={styles.emptyText}>Seu histórico está vazio.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {selectedRecord && (
        <Modal
          visible={isModalVisible}
          onRequestClose={handleCloseModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                accessibilityLabel="Fechar"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Editar Registro</Text>
              <Text style={styles.modalMedication}>{selectedRecord.agendamento.medicamento.nome}</Text>

              <Text style={styles.inputLabel}>Horário do Registro</Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                    style={styles.timeInputBox}
                    value={editHour}
                    onChangeText={setEditHour}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="HH"
                    placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.timeInputSeparator}>:</Text>
                <TextInput
                    style={styles.timeInputBox}
                    value={editMinute}
                    onChangeText={setEditMinute}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="mm"
                    placeholderTextColor={colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleUpdateRecord(true)}
              >
                <Text style={styles.modalButtonText}>USEI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonError]}
                onPress={() => handleUpdateRecord(false)}
              >
                <Text style={styles.modalButtonText}>NÃO USEI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <BottomNavigationBar
        activeTab={activeTab} 
      />
    </View>
  );
}

