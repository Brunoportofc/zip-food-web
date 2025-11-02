# ⚡ Deploy Rápido na Vercel

## 🚀 Comandos Rápidos

### 1. Commit e Push das mudanças
```bash
git add .
git commit -m "chore: preparar para deploy na Vercel"
git push origin main
```

### 2. Deploy via CLI da Vercel (Opcional)

Se preferir usar a CLI:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## 🌐 Deploy via Dashboard (Recomendado)

1. Acesse: https://vercel.com/new
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente (veja abaixo)
4. Clique em Deploy

## 🔑 Variáveis de Ambiente Essenciais

Copie estas do seu `.env.local` e cole na Vercel:

### Firebase (obrigatório)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Stripe (obrigatório)
```
STRIPE_SECRET_KEY=sua_stripe_secret_key
STRIPE_WEBHOOK_SECRET=seu_webhook_secret
```

### Geoapify (obrigatório)
```
NEXT_PUBLIC_GEOAPIFY_API_KEY=
```

### App URL (atualizar após deploy)
```
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

### VAPID (opcional - notificações)
```
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_SUBJECT=
```

## ✅ Checklist Pós-Deploy

- [ ] Deploy concluído com sucesso
- [ ] Atualizar `NEXT_PUBLIC_APP_URL` com a URL real
- [ ] Adicionar domínio Vercel no Firebase (Authorized domains)
- [ ] Configurar webhook do Stripe com a nova URL
- [ ] Testar login e autenticação
- [ ] Testar pagamentos (modo test)
- [ ] Verificar mapas e geolocalização

## 🐛 Problemas Comuns

**Build falhou?**
- Verifique se todas as variáveis de ambiente estão configuradas
- Limpe o cache: Settings > General > Clear Cache and Redeploy

**Firebase não funciona?**
- Adicione o domínio Vercel nos Authorized domains do Firebase
- Verifique se a FIREBASE_PRIVATE_KEY está correta

**Stripe webhook error?**
- Atualize o webhook endpoint no Dashboard do Stripe
- Verifique o STRIPE_WEBHOOK_SECRET

## 📚 Documentação Completa

Para instruções detalhadas, veja:
- **DEPLOY_VERCEL.md** - Guia completo passo a passo
- **ENV_VARIABLES.md** - Documentação de todas as variáveis

---

✨ **Pronto para fazer deploy!**

