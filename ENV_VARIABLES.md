# 🔐 Variáveis de Ambiente - Zip Food

Este arquivo documenta todas as variáveis de ambiente necessárias para o projeto.

## 📝 Template .env.local

Copie este template para criar seu arquivo `.env.local`:

```bash
# ============================================
# FIREBASE CLIENT (Public - Frontend)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# FIREBASE ADMIN (Private - Backend/Server)
# ============================================
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAo...\n-----END PRIVATE KEY-----\n"

# ============================================
# STRIPE PAYMENT GATEWAY
# ============================================
STRIPE_SECRET_KEY=sua_stripe_secret_key_aqui
STRIPE_WEBHOOK_SECRET=seu_stripe_webhook_secret_aqui

# ============================================
# GEOAPIFY MAPS API
# ============================================
NEXT_PUBLIC_GEOAPIFY_API_KEY=sua_api_key_aqui

# ============================================
# APPLICATION URL
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# WEB PUSH NOTIFICATIONS (VAPID)
# ============================================
VAPID_PRIVATE_KEY=sua_chave_privada_vapid
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica_vapid
VAPID_SUBJECT=mailto:seu-email@exemplo.com

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=development
```

## 📖 Descrição das Variáveis

### Firebase Client (Públicas)

Estas variáveis são usadas no frontend e são **públicas**. Obtenha-as no Firebase Console.

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key do projeto Firebase | Firebase Console > Project Settings > General |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação | Firebase Console > Project Settings > General |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID do projeto Firebase | Firebase Console > Project Settings > General |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket do Firebase Storage | Firebase Console > Project Settings > General |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID do remetente de mensagens | Firebase Console > Project Settings > General |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID da aplicação Firebase | Firebase Console > Project Settings > General |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ID do Google Analytics | Firebase Console > Project Settings > General (opcional) |

**Como obter:**
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Project Settings** (ícone de engrenagem)
4. Role até **Your apps** e selecione a aplicação web
5. Copie os valores da configuração

### Firebase Admin (Privadas)

Estas variáveis são usadas no backend e são **privadas**. Nunca exponha-as no frontend.

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `FIREBASE_PROJECT_ID` | ID do projeto (mesmo do client) | Firebase Console > Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Email da conta de serviço | Service Account JSON |
| `FIREBASE_PRIVATE_KEY` | Chave privada da conta de serviço | Service Account JSON |

**Como obter:**
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá para **Project Settings > Service Accounts**
3. Clique em **Generate new private key**
4. Baixe o arquivo JSON
5. Use os valores:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (mantenha as `\n`)

**⚠️ IMPORTANTE:** Nunca commite o arquivo JSON do Firebase Admin no Git!

### Stripe

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe | Dashboard Stripe > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Secret dos webhooks | Dashboard Stripe > Developers > Webhooks |

**Como obter:**

**API Keys:**
1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/)
2. Vá para **Developers > API keys**
3. Copie a **Secret key** (começa com "sk_" seguido de "test" ou "live")

**Webhook Secret:**
1. Vá para **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.vercel.app/api/stripe/webhooks`
4. Selecione os eventos necessários
5. Copie o **Signing secret** (começa com `whsec_`)

### Geoapify

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `NEXT_PUBLIC_GEOAPIFY_API_KEY` | API Key do Geoapify para mapas | Geoapify Dashboard |

**Como obter:**
1. Acesse [Geoapify](https://www.geoapify.com/)
2. Crie uma conta gratuita
3. Vá para **My Projects**
4. Copie a **API Key**

### URL da Aplicação

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | `https://zipfood.vercel.app` |

**Desenvolvimento:** `http://localhost:3000`
**Produção:** URL da Vercel (ex: `https://seu-projeto.vercel.app`)

### VAPID (Web Push Notifications)

| Variável | Descrição | Como Gerar |
|----------|-----------|------------|
| `VAPID_PRIVATE_KEY` | Chave privada VAPID | Usar web-push library |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave pública VAPID | Usar web-push library |
| `VAPID_SUBJECT` | Email ou URL de contato | `mailto:admin@zipfood.com` |

**Como gerar:**
```bash
npx web-push generate-vapid-keys
```

Isso gerará um par de chaves pública/privada. Use-as nas variáveis correspondentes.

## 🚨 Segurança

### ✅ DO (Faça):
- ✅ Use `.env.local` para desenvolvimento
- ✅ Adicione `.env*.local` no `.gitignore`
- ✅ Use variáveis de ambiente na Vercel para produção
- ✅ Rotacione chaves periodicamente
- ✅ Use chaves de teste do Stripe para desenvolvimento
- ✅ Use chaves de produção do Stripe apenas em produção

### ❌ DON'T (Não faça):
- ❌ Nunca commite arquivos `.env` no Git
- ❌ Nunca exponha `FIREBASE_PRIVATE_KEY` no frontend
- ❌ Nunca use `STRIPE_SECRET_KEY` no frontend
- ❌ Nunca compartilhe credenciais publicamente
- ❌ Nunca use chaves de produção em desenvolvimento

## 🔄 Rotação de Chaves

Recomenda-se rotacionar chaves sensíveis periodicamente:

1. **Firebase Admin:**
   - Gere uma nova Service Account Key
   - Atualize as variáveis de ambiente
   - Delete a chave antiga no Firebase Console

2. **Stripe:**
   - Gere uma nova Secret Key no Dashboard
   - Atualize a variável de ambiente
   - Monitore logs para garantir que a nova chave funciona
   - Delete a chave antiga

3. **VAPID:**
   - Gere novas chaves VAPID
   - Atualize as variáveis
   - Usuários precisarão aceitar notificações novamente

## 📝 Checklist de Configuração

- [ ] Criar projeto no Firebase
- [ ] Configurar Authentication no Firebase
- [ ] Gerar Service Account Key
- [ ] Criar conta no Stripe
- [ ] Configurar webhooks do Stripe
- [ ] Obter API Key do Geoapify
- [ ] Gerar chaves VAPID
- [ ] Criar arquivo `.env.local`
- [ ] Configurar variáveis na Vercel
- [ ] Testar todas as funcionalidades

---

💡 **Dica:** Use um gerenciador de senhas para armazenar suas chaves de forma segura!

