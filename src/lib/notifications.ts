import webpush from 'web-push';

// Configurar VAPID keys (em produção, use variáveis de ambiente)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@zipfood.com'
};

// Só configurar VAPID se as chaves estiverem definidas
let vapidConfigured = false;
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    vapidConfigured = true;
  } catch (error) {
    console.warn('Erro ao configurar VAPID:', error);
  }
}

// Simulação de banco de dados para subscriptions
// Em produção, use um banco de dados real
const subscriptions = new Map<string, any>();

export async function sendPushNotification(
  userId: string, 
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }
) {
  if (!vapidConfigured) {
    console.warn('VAPID não configurado, notificação não enviada');
    return;
  }

  const subscription = subscriptions.get(userId);
  
  if (!subscription) {
    console.warn(`Subscription não encontrada para o usuário: ${userId}`);
    return;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log(`Notificação enviada para o usuário: ${userId}`);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    // Se a subscription expirou, remover da lista
    if (error instanceof Error && error.message.includes('410')) {
      subscriptions.delete(userId);
    }
  }
}

export { sendPushNotification as sendNotification, subscriptions };