import * as Notifications from 'expo-notifications';
import { AgendamentoType } from '../pages/home/HomeScreen';
import { parse } from 'date-fns';
import { Platform } from 'react-native';

export const scheduleReminder = async (agendamento: AgendamentoType) => {
  try {
    const horarioDate = parse(agendamento.horario, 'HH:mm:ss', new Date());
    const hour = horarioDate.getHours();
    const minute = horarioDate.getMinutes();

    let trigger: Notifications.DailyTriggerInput | Notifications.WeeklyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    if (agendamento.frequencia === 'Semanal') {
      const horarioAlarmeHoje = new Date();
      horarioAlarmeHoje.setHours(hour);
      horarioAlarmeHoje.setMinutes(minute);
      
      const weekday = horarioAlarmeHoje.getDay() + 1; 
      
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday, 
        hour,
        minute,
      };
    }

    if (Platform.OS === 'android') {
      trigger.channelId = 'default';
    }

    const idNativo = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora do seu remédio!',
        body: `Não se esqueça de tomar seu ${agendamento.medicamento.nome} (${agendamento.medicamento.dosagem_valor} ${agendamento.medicamento.dosagem_unidade}).`,
        sound: Platform.OS === 'ios' ? true : 'alarm.mp3', 
        data: {
          screen: 'Alarm',
          agendamentoId: agendamento.id,
        },
        vibrate: [0, 250, 250, 500, 250, 250, 500],
      },
      trigger, 
    });

    console.log(`[Notificação] Alarme agendado com sucesso para às ${hour}:${minute}. ID Nativo: ${idNativo}`);

  } catch (error) {
    console.error(`Falha ao agendar notificação para agendamento ${agendamento.id}:`, error);
  }
};

export const limparAlarmesAntigos = async (nomeMedicamento: string) => {
  try {
    const agendadas = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notif of agendadas) {
      if (notif.content.body && notif.content.body.includes(nomeMedicamento)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        console.log(`[Limpeza] Alarme ${nomeMedicamento} apagado com sucesso.`);
      }
    }
  } catch (error) {
    console.error("Erro ao limpar alarmes antigos:", error);
  }
};

export const notificarEstoqueBaixo = async (nomeMedicamento: string, estoqueAtual: number) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Estoque Quase a Acabar!',
        body: `O seu estoque de ${nomeMedicamento} está baixo. Restam apenas ${parseInt(String(estoqueAtual), 10)} unidades. Lembre-se de comprar mais!`,
        sound: true,
        vibrate: [0, 250, 250, 250],
        data: { screen: 'Gerenciamento' }, 
      },
      trigger: null, 
    });
    console.log(`[Notificação] Alerta de estoque baixo disparado para o medicamento: ${nomeMedicamento}`);
  } catch (error) {
    console.error("Erro ao disparar notificação de estoque baixo:", error);
  }
};