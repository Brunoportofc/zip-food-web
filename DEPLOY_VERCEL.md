# 🚀 Guia de Deploy na Vercel - Zip Food

Este guia contém todas as instruções necessárias para fazer o deploy do Zip Food na Vercel.

## 📋 Pré-requisitos

- [ ] Conta na Vercel (https://vercel.com)
- [ ] Projeto configurado no Firebase
- [ ] Conta Stripe configurada
- [ ] API Key do Geoapify
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)

## 🔧 Passo 1: Preparação do Repositório

### 1.1. Certifique-se de que o arquivo .gitignore está correto

O arquivo `.gitignore` foi atualizado para **NÃO** incluir:
- `.env*.local` (arquivos locais)
- Credenciais do Firebase Admin SDK (arquivos JSON)

### 1.2. Faça o commit das mudanças

```bash
git add .
git commit -m "chore: preparar projeto para deploy na Vercel"
git push origin main
```

## 🌐 Passo 2: Deploy na Vercel

### 2.1. Acesse o Dashboard da Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New Project"**
3. Selecione o repositório `zip-food-web`

### 2.2. Configure o Framework

- **Framework Preset:** Next.js (detectado automaticamente)
- **Root Directory:** `./` (raiz do projeto)
- **Build Command:** `npm run build` (já configurado)
- **Output Directory:** `.next` (padrão do Next.js)

### 2.3. Configure a Região

- Escolha **São Paulo (gru1)** para melhor performance no Brasil

## 🔐 Passo 3: Variáveis de Ambiente

### 3.1. Adicionar Variáveis de Ambiente na Vercel

No painel de configuração do projeto, vá para **Settings > Environment Variables** e adicione:

#### Firebase Client (Públicas)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Firebase Admin (Privadas - Server Side)
```
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

**⚠️ IMPORTANTE:** Para o `FIREBASE_PRIVATE_KEY`:
1. Cole a chave completa incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
2. A Vercel aceita quebras de linha normalmente
3. Se tiver problemas, use `\n` para quebras de linha

#### Stripe
```
STRIPE_SECRET_KEY=sua_stripe_secret_key
STRIPE_WEBHOOK_SECRET=seu_webhook_secret
```

#### Geoapify (Mapas)
```
NEXT_PUBLIC_GEOAPIFY_API_KEY=sua-api-key-do-geoapify
```

#### URL da Aplicação
```
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

**⚠️ Nota:** Após o primeiro deploy, atualize esta variável com a URL real da Vercel.

#### Web Push Notifications (VAPID)
```
VAPID_PRIVATE_KEY=sua-chave-privada
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-chave-publica
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

#### Node Environment
```
NODE_ENV=production
```

### 3.2. Aplicar Variáveis aos Ambientes

Para cada variável, selecione os ambientes:
- ✅ **Production**
- ✅ **Preview** (opcional, para branches de preview)
- ⬜ **Development** (use seu .env.local local)

## 🎯 Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (3-5 minutos)
3. Acesse a URL fornecida pela Vercel

## 🔄 Passo 5: Configurações Pós-Deploy

### 5.1. Atualizar Firebase Authentication

No Firebase Console:
1. Vá para **Authentication > Settings > Authorized domains**
2. Adicione seu domínio Vercel: `seu-projeto.vercel.app`

### 5.2. Atualizar Stripe Webhooks

Se estiver usando webhooks do Stripe:
1. Acesse o Dashboard do Stripe
2. Vá para **Developers > Webhooks**
3. Adicione o endpoint: `https://seu-dominio.vercel.app/api/stripe/webhooks`
4. Selecione os eventos necessários
5. Copie o **Webhook Secret** e atualize a variável `STRIPE_WEBHOOK_SECRET` na Vercel

### 5.3. Atualizar URL da Aplicação

1. Volte para **Settings > Environment Variables** na Vercel
2. Atualize `NEXT_PUBLIC_APP_URL` com a URL real
3. Faça um **Redeploy** para aplicar a mudança

### 5.4. Configurar Domínio Customizado (Opcional)

1. Vá para **Settings > Domains**
2. Adicione seu domínio customizado
3. Configure os DNS conforme instruções da Vercel
4. Atualize as variáveis de ambiente e configurações do Firebase/Stripe

## 🐛 Troubleshooting

### Erro: "Firebase Admin não configurado"

**Solução:** Verifique se as variáveis `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` estão corretas.

### Erro de Build: "Module not found"

**Solução:** 
1. Verifique se todas as dependências estão no `package.json`
2. Limpe o cache: Settings > General > Clear Cache and Redeploy

### Erro: "CORS Policy"

**Solução:** Adicione o domínio Vercel nos **Authorized domains** do Firebase.

### Erro de Stripe Webhook

**Solução:** 
1. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
2. Confirme que o endpoint está acessível
3. Verifique os logs no Dashboard do Stripe

### Erro: "Private Key não reconhecida"

**Solução:** 
1. Copie a chave do arquivo JSON do Firebase Admin SDK
2. Mantenha o formato original com `-----BEGIN` e `-----END`
3. Se necessário, substitua quebras de linha por `\n`

## 📊 Monitoramento

### Logs da Vercel
- Acesse **Deployments** > selecione um deploy > **View Function Logs**
- Monitore erros e performance das API routes

### Analytics
- Ative o **Vercel Analytics** em Settings > Analytics
- Monitore tempo de carregamento e Core Web Vitals

## 🔄 Atualizações Futuras

Sempre que fizer push para a branch `main`:
1. A Vercel fará deploy automático
2. Aguarde o build completar
3. A aplicação será atualizada automaticamente

Para ambientes de preview:
- Cada PR cria uma URL de preview única
- Teste antes de fazer merge para main

## 📞 Suporte

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Firebase Docs:** https://firebase.google.com/docs

---

✅ **Pronto!** Seu aplicativo Zip Food está rodando na Vercel!

Acesse: https://seu-dominio.vercel.app

