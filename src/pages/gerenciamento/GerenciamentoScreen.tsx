import React, { useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import TreatmentCard from '../../components/TratamentoCard'; 
import Header from '../../components/Header'; 
import LogoAmparo from '../../assets/LogoAmparoPreto.png';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import { makeStyles } from './styles'; 
import { limparAlarmesAntigos } from '../../services/notificacao';
import { getApiErrorMessage } from '../../services/errorUtils';
import { useAccessibility } from '../../contexts/AccessibilityContext';


interface Medicamento {
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

export default function GerenciamentoScreen({ navigation }: any) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'search' | 'add' | 'timer' | 'settings'>('search');

  const { colors, fontScale } = useAccessibility();
  const styles = React.useMemo(() => makeStyles(colors, fontScale), [colors, fontScale]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/api/medicamentos/');
      setMedicamentos(response.data);
    } catch (error) {
      console.error("Erro ao carregar tratamentos:", error);
      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handleEdit = (medicamento: Medicamento) => {
    navigation.navigate('CadastroMedicamento', { isEditing: true, medicamentoData: medicamento });
  };

  const handleDelete = (medicamento: Medicamento) => {
    Alert.alert(
      "Excluir Tratamento",
      "Isso irá apagar este medicamento e todos os seus lembretes permanentemente. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            try {
              await limparAlarmesAntigos(medicamento.nome);
              await api.delete(`/api/medicamentos/${medicamento.id}/`);
              setMedicamentos(prev => prev.filter(m => m.id !== medicamento.id));
            } catch (error) {
              Alert.alert("Erro", getApiErrorMessage(error));
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
        <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header logoSource={LogoAmparo}/>
        <Text style={styles.title}>Meus Tratamentos</Text>

        <FlatList
          data={medicamentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TreatmentCard
              medicamento={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>Você ainda não cadastrou nenhum tratamento.</Text>
            </View>
          }
          
          onRefresh={fetchData}
          refreshing={refreshing}
          
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      
      <BottomNavigationBar
        activeTab={activeTab} 
      />
    </View>
  );
}