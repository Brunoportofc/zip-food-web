# Configuração do Firebase no Zip Food

Para que a autenticação com Firebase funcione corretamente, é necessário instalar as dependências do Firebase. Execute o seguinte comando no terminal:

```bash
npm install firebase
```

## Configuração Implementada

A configuração do Firebase foi implementada com os seguintes arquivos:

1. **src/lib/firebase.ts** - Configuração básica do Firebase com as credenciais fornecidas
2. **src/services/auth.service.ts** - Serviço de autenticação que integra Firebase Auth com o store da aplicação
3. **src/store/auth.store.ts** - Store atualizado para usar o serviço de autenticação
4. **src/components/AuthCheck.tsx** - Componente para verificar o estado de autenticação

## Funcionalidades Implementadas

- Login com email e senha
- Cadastro de novos usuários
- Persistência do estado de autenticação
- Redirecionamento baseado no tipo de usuário
- Verificação automática do estado de autenticação

## Próximos Passos

1. Implementar recuperação de senha
2. Adicionar autenticação com provedores sociais (Google, Facebook, etc.)
3. Implementar verificação de email
4. Adicionar gerenciamento de perfil do usuário