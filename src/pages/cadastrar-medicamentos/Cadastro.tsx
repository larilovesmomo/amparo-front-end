import React, { useMemo, useState } from 'react';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addHours, format, set, parse } from 'date-fns';
import { makeStyles } from './style';
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import api from '../../services/api';
import { scheduleReminder, limparAlarmesAntigos } from '../../services/notificacao';
import { AgendamentoType} from '../home/HomeScreen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App'; 
import { useRoute, usePreventRemove } from '@react-navigation/native';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Alert, 
  Modal, 
  ActivityIndicator,
  Keyboard, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView,
  ScrollView 
} from 'react-native';
import { useAccessibility } from '../../contexts/AccessibilityContext';


import Header from '../../components/Header';
import BottomNavigationBar from '../../components/BottomNavigationBar';
import LogoAmparo from '../../assets/LogoAmparo.png';
import AntDesign from '@expo/vector-icons/AntDesign';

type MedicamentoFormData = {
  nome: string;
  horario_inicio: Date;
  horario_fim: Date | null; 
  intervalo: string ;
  duracao_valor: string;
  duracao_unidade: 'dias' ;
  dosagem_valor: string;
  dosagem_unidade: 'mg' | 'g' | 'ml' | 'gotas' | 'comprimido(s)' | 'cápsula(s)'
  observacao: string;
  estoque_atual: string;
  aviso_estoque_minimo: string;
};


type CadastroScreenProps = NativeStackScreenProps<RootStackParamList, 'CadastroMedicamento'>;

const ESTOQUE_AJUDA_POR_UNIDADE: Record<string, string> = {
  mg: 'Informe a quantidade de comprimidos disponíveis.',
  g: 'Informe a quantidade de comprimidos ou cápsulas disponíveis.',
  'comprimido(s)': 'Informe a quantidade de comprimidos disponíveis.',
  'cápsula(s)': 'Informe a quantidade de cápsulas disponíveis.',
  ml: 'Informe a quantidade de mL disponíveis.',
  gotas: 'Informe a quantidade de gotas disponíveis.',
};

const obterAjudaEstoque = (unidade?: string | null): string | null => {
  if (!unidade) return null;
  return ESTOQUE_AJUDA_POR_UNIDADE[unidade] ?? null;
};


export default function CadastrarMedicamento({ navigation }: CadastroScreenProps) {
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false)
  const route = useRoute<any>()
  const isEditing = route.params?.isEditing || false
  const initialData = route.params?.medicamentoData || null

  const { colors, fontScale, highContrast } = useAccessibility();
  const styles = React.useMemo(() => makeStyles(colors, fontScale, highContrast), [colors, fontScale, highContrast]);
  
  const pickerSelectStyles = React.useMemo(() => StyleSheet.create({
    inputIOS: {
      ...styles.input
    },
    inputAndroid: {
      ...styles.input
    },
    placeholder: {
      color: colors.text,
    }
  }), [styles, colors.text]);

  const initialValues: MedicamentoFormData = {
    nome: initialData?.nome || '',
    
    horario_inicio: initialData?.horario_inicio 
      ? parse(initialData.horario_inicio, 'HH:mm:ss', new Date()) 
      : new Date(),
      
    horario_fim: initialData?.horario_fim 
      ? parse(initialData.horario_fim, 'HH:mm:ss', new Date()) 
      : null,
      
    intervalo: initialData?.intervalo ? String(initialData.intervalo) : '',
    duracao_valor: initialData?.duracao_valor ? String(initialData.duracao_valor) : '',
    duracao_unidade: 'dias',
    
    dosagem_valor: initialData?.dosagem_valor ? String(parseFloat(initialData.dosagem_valor)) : '',
    dosagem_unidade: initialData?.dosagem_unidade || 'mg',
    observacao: initialData?.observacao || '',
    estoque_atual: initialData?.estoque_atual ? String(parseFloat(initialData.estoque_atual)) : '',
    aviso_estoque_minimo: initialData?.aviso_estoque_minimo ? String(initialData.aviso_estoque_minimo) : '',
  };

  const [formData, setFormData] = useState<MedicamentoFormData>(initialValues);
  const [savedFormData, setSavedFormData] = useState<MedicamentoFormData>(initialValues);

  const hasChanges = useMemo(() => {
    if (!isEditing) return false;
    return (Object.keys(savedFormData) as (keyof MedicamentoFormData)[]).some(
      key => String(savedFormData[key]) !== String(formData[key]),
    );
  }, [isEditing, formData, savedFormData]);

  const handleInputChange = (field: keyof MedicamentoFormData, value: any) => {
    setFormData(prevState => ({ ...prevState, [field]: value }));
  };

  const onChangeStartTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      if (event.type === 'set' && selectedDate) {
        handleInputChange('horario_inicio', selectedDate);
      }
      return;
    }
    if (selectedDate) handleInputChange('horario_inicio', selectedDate);
  };

  const onChangeEndTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
      if (event.type === 'set' && selectedDate) {
        handleInputChange('horario_fim', selectedDate);
      }
      return;
    }
    if (selectedDate) handleInputChange('horario_fim', selectedDate);
  };

  const estimativaEstoque = () => {
    const intervaloNum = parseInt(formData.intervalo, 10);
    const dosesPorDia = intervaloNum ? Math.floor(24 / intervaloNum) : 0;
    
    const estoque = formData.estoque_atual ? parseInt(formData.estoque_atual, 10) : 0;
    const duracaoTratamentoDias = formData.duracao_valor ? parseInt(formData.duracao_valor, 10) : null;
    
    let qtdPorDose = formData.dosagem_valor ? parseFloat(formData.dosagem_valor) : 0;
    
    if (formData.dosagem_unidade === 'mg' || formData.dosagem_unidade === 'g') {
      if (qtdPorDose > 0) {
        qtdPorDose = 1; 
      }
    }

    if (
      isNaN(dosesPorDia) || dosesPorDia <= 0 || 
      isNaN(qtdPorDose) || qtdPorDose <= 0 || 
      isNaN(estoque) || estoque <= 0
    ) {
      return null;
    }

    const consumoDiario = dosesPorDia * qtdPorDose;
    const duracaoEstoqueDias = Math.floor(estoque / consumoDiario);

    let status = 'ok';
    let mensagem = `Seu estoque atual vai durar aproximadamente ${duracaoEstoqueDias} dias.`;

    if (duracaoTratamentoDias && duracaoEstoqueDias < duracaoTratamentoDias) {
      status = 'aviso';
      mensagem = `Seu estoque dura ${duracaoEstoqueDias} dias, mas o tratamento dura ${duracaoTratamentoDias} dias. Você precisará comprar mais!`;
    }

    return { duracaoEstoqueDias, message: mensagem, status };
  };

  const infoEstoque = estimativaEstoque();
  const estoqueAjuda = obterAjudaEstoque(formData.dosagem_unidade);

  const confirmIOSTime = () => {
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  }
  
  // Validações do Formulário
  const handleSave = async (onSuccess?: () => void) => {
    const intervaloNum = parseInt(formData.intervalo, 10);
    const duracaoNum = formData.duracao_valor ? parseInt(formData.duracao_valor, 10) : null;

    if (!formData.nome || !formData.dosagem_valor) {
      Alert.alert('Atenção', 'Nome e dosagem são obrigatórios.');
      return;
    }
    if (isNaN(intervaloNum) || intervaloNum <= 0) {
      Alert.alert('Atenção', 'Por favor, insira um intervalo de horas válido.');
      return;
    }
    if (formData.duracao_valor && (duracaoNum === null || isNaN(duracaoNum) || duracaoNum <= 0)) {
        Alert.alert('Atenção', 'Por favor, insira uma duração em dias válida.');
        return;
    }

    if (!formData.estoque_atual || !formData.aviso_estoque_minimo) {Alert.alert("Atenção","Por favor, informe o estoque atual e o estoque mínimo para notificação.");
    return;
  }

    if (!formData.dosagem_unidade) {Alert.alert('Atenção', 'Por favor, insira uma unidade de dosagem válida.');
    return;
  }

    setLoading(true);

    const horarios: string[] = [];
    const { horario_inicio, horario_fim, intervalo } = formData;
    
    let horarioAtual = horario_inicio;
    
    const limiteDoDia = horario_fim || set(new Date(), { hours: 23, minutes: 0 });

    let safetyCount = 0; 
    while (horarioAtual <= limiteDoDia && safetyCount < 24) {
      
      if (horarioAtual >= horario_inicio) {
        horarios.push(format(horarioAtual, 'HH:mm:ss'));
      }
  
      horarioAtual = addHours(horarioAtual, intervaloNum);
      safetyCount++;
    }

    if (horarios.length === 0) {
        Alert.alert('Atenção', 'Nenhum horário válido foi gerado. Verifique o horário de primeira e última dose do dia ou o intervalo.');
        setLoading(false);
        return;
    }

    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        Alert.alert('Erro', 'Você não está autenticado.');
        setLoading(false);
        
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      const payload = {
        nome: formData.nome,
        dosagem_valor: formData.dosagem_valor,
        dosagem_unidade: formData.dosagem_unidade,
        observacao: formData.observacao,
        horario_inicio: format(formData.horario_inicio, 'HH:mm:ss'),
        horario_fim: formData.horario_fim ? format(formData.horario_fim, 'HH:mm:ss') : null,
        intervalo: intervaloNum,
        duracao_valor: duracaoNum,
        aviso_estoque_minimo: formData.aviso_estoque_minimo,
        estoque_atual: formData.estoque_atual,
      };

      let response;
      if(isEditing){
        await limparAlarmesAntigos(initialData.nome);
        response = await axios.put(`${apiUrl}/api/medicamentos/${initialData.id}/`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }else{
        response = await axios.post(`${apiUrl}/api/medicamentos/`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      const novosAgendamentos: AgendamentoType[] = response.data.agendamentos;

      if (novosAgendamentos && novosAgendamentos.length > 0) {
        for (const agendamento of novosAgendamentos) {
          await scheduleReminder(agendamento);
        }
      }

      setSavedFormData({ ...formData });

      Alert.alert(
        'Sucesso!', 
        'Medicamento e agendamento cadastrados.',
        [{ text: 'OK', onPress: () => (onSuccess ? onSuccess() : navigation.goBack()) }] 
      );

    } catch (error) {
    if (axios.isAxiosError(error)) {
      const erros = error.response?.data;

      console.error("Erro no cadastro do medicamento:", JSON.stringify(erros));

      if (erros?.dosagem_unidade) {
        Alert.alert(
          'Atenção',
          'Por favor, insira uma unidade válida para a dosagem.'
        );
        return;
      }

      if (erros?.aviso_estoque_minimo) {
        Alert.alert(
          'Atenção',
          'Por favor, insira um valor válido para o estoque mínimo.'
        );
        return;
      }

      if (erros?.nome) {
        Alert.alert(
          'Atenção',
          'Por favor, informe um nome válido para o medicamento.'
        );
        return;
      }

    } else {
      console.error("Erro inesperado:", error);
    }

    Alert.alert(
      'Erro',
      'Não foi possível cadastrar o medicamento.'
    );

    } finally {
      setLoading(false);
    }
  };

  usePreventRemove(isEditing && hasChanges, ({ data }) => {
    Alert.alert(
      'Alterações não salvas',
      'Você possui alterações não salvas. Deseja salvar antes de sair?',
      [
        {
          text: 'Salvar alterações',
          onPress: () => handleSave(() => navigation.dispatch(data.action)),
        },
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair sem salvar',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  const handleDelete = () => {
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
              await limparAlarmesAntigos(initialData.nome);
              await api.delete(`/api/medicamentos/${initialData.id}/`);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o tratamento.");
            }
          }
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.wrapper} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled" 
      >
        <Header logoSource={LogoAmparo} />
        <Text style={styles.title}>{isEditing ? 'Editar Tratamento' : 'Cadastrar Medicamento'}</Text>

        <TextInput
          placeholder="Nome do medicamento"
          placeholderTextColor={colors.textSecondary}
          value={formData.nome}
          onChangeText={(value) => handleInputChange('nome', value)}
          style={styles.input}
        />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
            <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={[styles.input, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.timePickerText, { color: formData.horario_inicio ? colors.text : colors.textSecondary }]}> 
                  {formData.horario_inicio ? `Primeira dose do dia: ${format(formData.horario_inicio, 'HH:mm')}` : 'Primeira dose do dia'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={[styles.input, { flex: 1 }]}>
                <Text style={[styles.timePickerText, { color: formData.horario_fim ? colors.text : colors.textSecondary }]}>
                    {formData.horario_fim ? `Última dose do dia: ${format(formData.horario_fim, 'HH:mm')}` : 'Última dose do dia'}
                </Text>
            </TouchableOpacity>
        </View>

        {Platform.OS === 'android' && showStartTimePicker && (
          <DateTimePicker
            value={formData.horario_inicio}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeStartTime}
          />
        )}
        {Platform.OS === 'android' && showEndTimePicker && (
          <DateTimePicker
            value={formData.horario_fim || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeEndTime}
          />
        )}

        {Platform.OS === 'ios' && (showStartTimePicker || showEndTimePicker) && (
          <Modal transparent={true} animationType="slide" visible={true}>
            <TouchableWithoutFeedback onPress={() => { setShowStartTimePicker(false); setShowEndTimePicker(false); }}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <DateTimePicker
                      value={showStartTimePicker ? formData.horario_inicio : (formData.horario_fim || new Date())}
                      mode="time"
                      is24Hour={true}
                      textColor={colors.text}
                      display="spinner" 
                      onChange={showStartTimePicker ? onChangeStartTime : onChangeEndTime}
                    />
                    <TouchableOpacity 
                      style={styles.modalButton} 
                      onPress={() => { setShowStartTimePicker(false); setShowEndTimePicker(false); }}
                    >
                      <Text style={styles.modalButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        <RNPickerSelect
          placeholder={{ label: 'Selecione o intervalo...', value: null, color:'black' }}
          items={[
            { label: 'A cada 4 horas', value: '4', color:'black' },
            { label: 'A cada 6 horas', value: '6', color:'black' },
            { label: 'A cada 8 horas', value: '8', color:'black' },
            { label: 'A cada 12 horas', value: '12', color:'black' },
            { label: 'Uma vez ao dia (24 horas)', value: '24', color:'black' },
          ]}
          onValueChange={(value) => handleInputChange('intervalo', value)}
          value={formData.intervalo}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
          Icon={() => <AntDesign name="down" size={20} color="gray" style={{ paddingRight: 10, paddingTop: 15 }} />}
        />

        <TextInput
          placeholder="Duração do Tratamento (em dias)"
          placeholderTextColor={colors.textSecondary}
          value={formData.duracao_valor}
          onChangeText={(value) => handleInputChange('duracao_valor', value)}
          style={styles.input}
          keyboardType="number-pad"
        />

        <View style={styles.dosagemContainer}>
          <TextInput
            placeholder="Dosagem"
            placeholderTextColor={colors.textSecondary}
            value={formData.dosagem_valor}
            onChangeText={(value) => handleInputChange('dosagem_valor', value)}
            style={[styles.input, styles.dosagemInput]}
            keyboardType='numeric'
          />

          <View style={{ flex: 1 }}>
            <RNPickerSelect
              placeholder={{ label: 'Unidade', value: null, color:'black' }}
              items={[
                { label: 'mg', value: 'mg', color:'black' },
                { label: 'g', value: 'g', color:'black' },
                { label: 'ml', value: 'ml', color:'black' },
                { label: 'gotas', value: 'gotas', color:'black' },
                { label: 'comprimido(s)', value: 'comprimido(s)', color:'black' },
                { label: 'cápsula(s)', value: 'cápsula(s)', color:'black' },
              ]}
              onValueChange={(value) => handleInputChange('dosagem_unidade', value)}
              value={formData.dosagem_unidade}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              Icon={() => <AntDesign name="down" size={20} color="gray" style={{ paddingRight: 10, paddingTop: 15 }} />}
            />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TextInput
            placeholder="Qtd. atual no estoque"
            placeholderTextColor={colors.textSecondary}
            value={formData.estoque_atual}
            onChangeText={(value) => handleInputChange('estoque_atual', value)}
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            keyboardType="number-pad"
          />
          <TextInput
            placeholder="Notificar ao restar"
            placeholderTextColor={colors.textSecondary}
            value={formData.aviso_estoque_minimo}
            onChangeText={(value) => handleInputChange('aviso_estoque_minimo', value)}
            style={[styles.input, { flex: 1 }]}
            keyboardType="number-pad"
          />
        </View>

        {estoqueAjuda && (
          <View style={styles.estoqueAjudaContainer}>
            <AntDesign name="info" size={14} color={colors.textSecondary} />
            <Text style={styles.estoqueAjudaText}>{estoqueAjuda}</Text>
          </View>
        )}

        {infoEstoque && (
          <View style={[styles.estoqueInfoBox, infoEstoque.status === 'aviso' ? styles.estoqueAviso : styles.estoqueOk]}>
            <Text style={{ color: infoEstoque.status === 'aviso' ? '#856404' : '#155724', fontWeight: 'bold' }}>
              {infoEstoque.message}
            </Text>
          </View>
        )}

        <TextInput
          placeholder="Observação"
          placeholderTextColor={colors.textSecondary}
          value={formData.observacao}
          onChangeText={(value) => handleInputChange('observacao', value)}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={() => handleSave()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEditing ? 'ATUALIZAR' : 'SALVAR'}</Text>}
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete} disabled={loading}>
            <Text style={styles.buttonText}>EXCLUIR</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BottomNavigationBar activeTab="add" />
    </KeyboardAvoidingView>
  );
}
