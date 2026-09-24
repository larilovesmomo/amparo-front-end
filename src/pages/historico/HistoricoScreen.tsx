import React, { useState, useMemo } from 'react';
import { View, Text, SectionList, ActivityIndicator, Modal, Alert, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO, isToday, isYesterday, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../../services/api';
import Header from '../../components/Header';
import HistoricoRecordCard from '../../components/HistoricoCard';
import LogoAmparo from '../../assets/LogoAmparo.png';
import LogoAmparoForeground from '../../../assets/logoAForeground.png';
import { makeStyles } from './styles'; 
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { useAuth } from '../../contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import { notificarEstoqueBaixo } from '../../services/notificacao';
import { getApiErrorMessage } from '../../services/errorUtils';
import { useAccessibility, ColorPalette } from '../../contexts/AccessibilityContext';


type RegistroType = any;

const escapeHtml = (value: any) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDosagem = (medicamento: any) => {
  const { dosagem_valor, dosagem_unidade } = medicamento ?? {};
  if (dosagem_valor && dosagem_unidade) return `${dosagem_valor} ${dosagem_unidade}`;
  return '';
};

const carregarLogoBase64 = async () => {
  const asset = Asset.fromModule(LogoAmparoForeground);
  await asset.downloadAsync();
  const base64 = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/png;base64,${base64}`;
}; 

export default function HistoricoScreen() {
  const [registros, setRegistros] = useState<RegistroType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'search' | 'add' | 'timer' | 'settings'>('timer');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegistroType | null>(null);
  const [editHour, setEditHour] = useState('');
  const [editMinute, setEditMinute] = useState('');
  const [downloading, setDownloading] = useState(false);
  const { checkAndRegisterDoses } = useAuth();
  
  const { colors, fontScale } = useAccessibility();
  const styles = React.useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);

  const fetchHistorico = async () => {
    try {
      setRefreshing(true);
      await checkAndRegisterDoses();
      const response = await api.get('/api/registros/');
      setRegistros(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const gerarHtmlHistorico = (logoUri: string) => {
    const secoes = groupedRecords
      .map(({ title, data }) => {
        const linhas = data
          .map((registro: RegistroType) => {
            const medicamento = registro?.agendamento?.medicamento;
            const nome = medicamento?.nome ?? 'Medicamento';
            const dosagem = formatDosagem(medicamento);
            const horario = format(parseISO(registro.data_hora_tomada), 'HH:mm');
            const tomou = !!registro.tomou;
            const status = tomou ? 'Tomado' : 'Não tomado';
            const statusColor = tomou ? '#2e7d32' : '#c62828';
            return `
              <tr>
                <td>${escapeHtml(nome)}</td>
                <td>${escapeHtml(dosagem)}</td>
                <td>${escapeHtml(horario)}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
              </tr>`;
          })
          .join('');

        return `
          <div class="section">
            <h2>${escapeHtml(title)}</h2>
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosagem</th>
                  <th>Horário</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${linhas}</tbody>
            </table>
          </div>`;
      })
      .join('');

    const dataGeracao = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #333; padding: 24px; }
            .brand { margin-bottom: 8px; }
            .brand img { width: 96px; height: auto; }
            h1 { color: #5C9EDC; margin: 4px 0 0; font-size: 28px; }
            .subtitle { color: #666; margin: 4px 0 0; }
            h2 { color: #2c3e50; margin-top: 24px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e0e0e0; font-size: 14px; }
            th { background-color: #f0f6fb; color: #2c3e50; }
          </style>
        </head>
        <body>
          <div class="brand">
            <img src="${escapeHtml(logoUri)}" alt="Amparo" />
            <h1>AMPARO</h1>
          </div>
          <p class="subtitle">Histórico de Medicamentos</p>
          <p class="subtitle">Gerado em ${escapeHtml(dataGeracao)}</p>
          ${secoes}
        </body>
      </html>`;
  };

  const handleBaixarHistorico = async () => {
    if (registros.length === 0) {
      Alert.alert("Histórico vazio", "Não há registros para gerar o PDF.");
      return;
    }

    setDownloading(true);
    try {
      const logoUri = await carregarLogoBase64();
      const { uri } = await Print.printToFileAsync({ html: gerarHtmlHistorico(logoUri) });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Erro", "Compartilhamento não disponível neste dispositivo.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Histórico de Medicamentos',
        UTI: 'com.adobe.pdf',
      });

      Alert.alert("Histórico exportado", "O histórico de medicamentos foi gerado com sucesso.");
    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF do histórico.");
    } finally {
      setDownloading(false);
    }
  };

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
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Histórico de Medicamentos</Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleBaixarHistorico}
          disabled={downloading || loading}
          accessibilityLabel="Baixar histórico"
          accessibilityRole="button"
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

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
          onRefresh={fetchHistorico}
          refreshing={refreshing}
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

