# Configuração do Firebase Admin - Solução do Problema de Autenticação

## Problema Identificado

O sistema estava usando **mocks** em vez da configuração real do Firebase Admin, causando:
- Todos os usuários serem identificados como `customer`
- Usuários restaurante sendo redirecionados para área do cliente
- Falha na verificação de permissões

## Solução Implementada

### 1. Configuração Real do Firebase Admin

Arquivo `src/lib/firebase-admin.ts` foi atualizado para usar a configuração real:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};
```

### 2. Variáveis de Ambiente Necessárias

Adicione estas variáveis ao seu arquivo `.env.local`:

```bash
# Firebase Admin Configuration (Server-side)
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
```

### 3. Como Obter as Credenciais

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em "Configurações do projeto" (ícone de engrenagem)
4. Na aba "Contas de serviço"
5. Clique em "Gerar nova chave privada"
6. Baixe o arquivo JSON
7. Use os valores do arquivo JSON para as variáveis de ambiente

### 4. Fallback para Desenvolvimento

Se o Firebase Admin não estiver configurado, o sistema usará mocks que falham explicitamente, evitando dados incorretos.

## Teste da Solução

Após configurar as variáveis de ambiente:

1. Reinicie o servidor de desenvolvimento
2. Faça login como usuário restaurante
3. Verifique se é redirecionado para `/restaurant` em vez de `/customer`
4. Verifique os logs do console para confirmar que o Firebase Admin está funcionando

## Logs Esperados

```
✅ Firebase Admin inicializado com sucesso
✅ [Session API] Token verificado para usuário: [uid]
✅ [API_VERIFY] Token verificado com sucesso: { uid: '[uid]', role: 'restaurant' }
```

## Troubleshooting

Se ainda houver problemas:

1. Verifique se as variáveis de ambiente estão corretas
2. Verifique se o arquivo de credenciais do Firebase está válido
3. Verifique os logs do console para erros específicos
4. Teste com um usuário cliente para comparar o comportamento
