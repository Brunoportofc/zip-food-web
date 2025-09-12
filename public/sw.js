// Service Worker para Push Notifications - ZipFood

const CACHE_NAME = 'zipfood-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/notification-icon.png',
  '/icons/badge-icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna a resposta
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Receber push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification recebida:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'ZipFood',
        body: event.data.text() || 'Nova notificação',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png'
      };
    }
  }

  const options = {
    body: notificationData.body || 'Nova atualização disponível',
    icon: notificationData.icon || '/icons/notification-icon.png',
    badge: notificationData.badge || '/icons/badge-icon.png',
    tag: notificationData.tag || 'general',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [],
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'ZipFood',
      options
    )
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  let url = '/';
  
  // Determinar URL baseada na ação e dados
  if (action === 'view' && data.orderId) {
    url = `/customer/orders?highlight=${data.orderId}`;
  } else if (action === 'accept' && data.orderId) {
    url = `/delivery/orders/${data.orderId}/accept`;
  } else if (action === 'decline' && data.orderId) {
    url = `/delivery/orders/${data.orderId}/decline`;
  } else if (action === 'view_offer' && data.promotionId) {
    url = `/promotions/${data.promotionId}`;
  } else if (data.orderId) {
    url = `/customer/orders?highlight=${data.orderId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Abrir nova janela se não existir
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event);
  
  // Aqui você pode enviar analytics sobre notificações fechadas
  const data = event.notification.data;
  if (data && data.trackClose) {
    // Enviar evento de tracking
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: data.id,
        timestamp: Date.now()
      })
    }).catch(err => console.log('Erro ao enviar analytics:', err));
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'order-status-sync') {
    event.waitUntil(
      syncOrderStatus()
    );
  }
});

// Função para sincronizar status de pedidos
async function syncOrderStatus() {
  try {
    const response = await fetch('/api/orders/sync-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const updates = await response.json();
      
      // Processar atualizações e mostrar notificações se necessário
      updates.forEach(update => {
        if (update.shouldNotify) {
          self.registration.showNotification(
            `Pedido #${update.orderId.slice(-6)}`,
            {
              body: update.message,
              icon: '/icons/notification-icon.png',
              tag: update.orderId,
              data: { orderId: update.orderId }
            }
          );
        }
      });
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('Mensagem recebida no SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});