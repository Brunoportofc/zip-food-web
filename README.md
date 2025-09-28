# 🍕 Zip Food - Plataforma de Delivery

## 📋 Visão Geral

**Zip Food** é uma plataforma completa de delivery de comida desenvolvida com **Next.js 15**, **React 19**, **TypeScript**, **Firebase** e **Tailwind CSS**. O sistema oferece uma solução integrada para clientes, restaurantes e entregadores, com funcionalidades modernas como notificações push, rastreamento em tempo real e sistema de autenticação robusto.

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

- **Frontend**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes + Firebase
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Notificações**: Web Push API + Service Workers
- **Animações**: Framer Motion + Lottie React
- **Estado**: Zustand
- **Build**: Turbopack

### Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação
│   │   ├── orders/        # Pedidos
│   │   ├── notifications/ # Notificações
│   │   └── restaurant/    # Restaurantes
│   ├── auth/              # Páginas de autenticação
│   ├── customer/          # Área do cliente
│   ├── restaurant/        # Área do restaurante
│   └── delivery/          # Área do entregador
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticação
│   ├── restaurant/       # Componentes específicos do restaurante
│   └── ui/               # Componentes base de UI
├── hooks/                # React Hooks customizados
├── lib/                  # Bibliotecas e configurações
│   └── firebase/         # Configuração Firebase
├── services/             # Serviços de negócio
├── store/                # Estado global (Zustand)
├── types/                # Definições TypeScript
└── utils/                # Utilitários
```

## 🔐 Sistema de Autenticação e Autorização

### Fluxo de Autenticação

1. **Firebase Authentication**: Gerenciamento de contas de usuário
2. **Session Cookies**: Cookies HTTPOnly para segurança
3. **Custom Claims**: Metadados de usuário no Firebase Auth
4. **Middleware Protection**: Proteção de rotas baseada em papel

### Tipos de Usuário

```typescript
type UserRole = 'customer' | 'restaurant' | 'delivery';
```

### Middleware de Proteção

O sistema possui um middleware robusto (`src/middleware.ts`) que:

- **Rotas Públicas**: Permite acesso sem autenticação
- **Rotas Protegidas**: Requer autenticação básica
- **Rotas por Papel**: Restringe acesso baseado no tipo de usuário
- **Redirecionamento Inteligente**: Direciona usuários para suas áreas específicas

#### Estrutura de Rotas

```
📁 Públicas
├── / (Landing page)
├── /auth/sign-in
└── /auth/sign-up

📁 Clientes (/customer)
├── / (Dashboard)
├── /restaurant/[id] (Página do restaurante)
├── /orders (Pedidos)
└── /profile (Perfil)

📁 Restaurantes (/restaurant)
├── / (Dashboard)
├── /cadastro (Configuração inicial)
└── /dashboard (Painel completo)

📁 Entregadores (/delivery)
├── / (Dashboard)
├── /orders (Pedidos disponíveis)
├── /earnings (Ganhos)
└── /profile (Perfil)
```

## 🛒 Sistema de Pedidos

### Fluxo do Pedido

1. **Seleção de Restaurante**: Cliente navega pelos restaurantes
2. **Carrinho de Compras**: Adiciona itens ao carrinho
3. **Endereço de Entrega**: Seleciona ou cadastra endereço
4. **Finalização**: Cria pedido no sistema
5. **Processamento**: Restaurante recebe e processa
6. **Entrega**: Entregador aceita e realiza entrega

### Estados do Pedido

```typescript
type OrderStatus = 
  | 'pending'           // Aguardando confirmação
  | 'confirmed'         // Confirmado pelo restaurante
  | 'preparing'         // Em preparo
  | 'ready'            // Pronto para entrega
  | 'dispatched'       // Saiu para entrega
  | 'delivered'        // Entregue
  | 'cancelled';       // Cancelado
```

### Estrutura de Dados

```typescript
interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  deliveryDriverId?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  subtotal: number;
  createdAt: Date;
  estimatedDeliveryTime?: Date;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  confirmationCode: string;
  statusHistory: StatusUpdate[];
}
```

## 🔔 Sistema de Notificações

### Tipos de Notificação

- **Push Notifications**: Via Service Worker
- **Real-time Updates**: Via Firebase Realtime
- **In-app Notifications**: Sistema interno

### Implementação

```typescript
// Service Worker para notificações push
public/sw.js

// Gerenciamento de notificações
src/services/notification.service.ts

// API para envio
src/app/api/notifications/
```

### Eventos de Notificação

- Novo pedido (para restaurante)
- Status do pedido atualizado (para cliente)
- Pedido disponível (para entregador)
- Pagamento processado
- Entrega confirmada

## 🏪 Área do Restaurante

### Funcionalidades Principais

1. **Dashboard**: Visão geral de vendas e pedidos
2. **Gestão de Cardápio**: CRUD de itens do menu
3. **Gestão de Pedidos**: Acompanhamento e atualização de status
4. **Configurações**: Horários, formas de pagamento, etc.

### Componentes Principais

```typescript
// Dashboard principal
src/components/restaurant/DashboardTab.tsx

// Gestão de cardápio
src/components/restaurant/MenuTab.tsx

// Gestão de pedidos
src/components/restaurant/OrdersTab.tsx
```

## 👥 Área do Cliente

### Funcionalidades

1. **Browse de Restaurantes**: Navegação por categorias
2. **Busca e Filtros**: Encontrar restaurantes e pratos
3. **Carrinho de Compras**: Gestão de itens
4. **Histórico de Pedidos**: Acompanhamento
5. **Avaliações**: Sistema de feedback

### Navegação por Categorias

```typescript
type RestaurantCategory = 
  | 'fast_food'
  | 'italian' 
  | 'brazilian'
  | 'japanese'
  | 'mexican'
  | 'chinese'
  | 'vegetarian'
  | 'desserts'
  | 'beverages';
```

## 🚚 Área do Entregador

### Funcionalidades

1. **Dashboard**: Status e estatísticas
2. **Pedidos Disponíveis**: Lista de entregas
3. **Rastreamento**: GPS e atualizações de status
4. **Ganhos**: Histórico financeiro

### Estados do Entregador

```typescript
type DeliveryStatus = 'available' | 'busy' | 'offline';
```

## 🗄️ Estrutura do Banco de Dados (Firebase Firestore)

### Coleções Principais

```
📁 users/
├── {userId}/
│   ├── uid: string
│   ├── email: string
│   ├── displayName: string
│   ├── role: UserRole
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

📁 restaurants/
├── {restaurantId}/
│   ├── owner_id: string
│   ├── name: string
│   ├── category: RestaurantCategory
│   ├── address: Address
│   ├── rating: number
│   ├── isPromoted: boolean
│   └── deliveryFee: number

📁 orders/
├── {orderId}/
│   ├── customer_id: string
│   ├── restaurant_id: string
│   ├── delivery_driver_id?: string
│   ├── status: OrderStatus
│   ├── total: number
│   ├── items: OrderItem[]
│   ├── delivery_address: Address
│   ├── created_at: timestamp
│   └── updated_at: timestamp

📁 menu_items/
├── {itemId}/
│   ├── restaurant_id: string
│   ├── name: string
│   ├── description: string
│   ├── price: number
│   ├── category: string
│   ├── image: string
│   └── available: boolean

📁 notifications/
├── {notificationId}/
│   ├── user_id: string
│   ├── type: string
│   ├── title: string
│   ├── message: string
│   ├── is_read: boolean
│   ├── created_at: timestamp
│   └── data: object
```

### Regras de Segurança

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Restaurantes: leitura pública, escrita apenas pelo dono
    match /restaurants/{restaurantId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.owner_id;
    }
    
    // Pedidos: acesso baseado em papel
    match /orders/{orderId} {
      allow read, write: if request.auth.uid == resource.data.customer_id
        || request.auth.uid == resource.data.restaurant_owner_id
        || request.auth.uid == resource.data.delivery_driver_id;
    }
  }
}
```

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- Firebase Project
- PNPM (recomendado)

### Variáveis de Ambiente

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd zip-food-web

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute em desenvolvimento
pnpm dev

# Build para produção
pnpm build
pnpm start
```

## 🚀 Scripts Disponíveis

```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack", 
  "start": "next start"
}
```

## 🔮 Funcionalidades Futuras

### Roadmap

- [ ] **Pagamentos**: Integração com Stripe/PagSeguro
- [ ] **Chat**: Sistema de mensagens em tempo real
- [ ] **Rastreamento GPS**: Localização em tempo real
- [ ] **Analytics**: Dashboard de métricas
- [ ] **Multi-tenant**: Suporte a múltiplas cidades
- [ ] **API Mobile**: REST API para apps móveis
- [ ] **Machine Learning**: Recomendações inteligentes

---

**Desenvolvido com ❤️ pela equipe Zip Food**
