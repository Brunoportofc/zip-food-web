# Sistema de Redefinição de Senha via SMS

Este documento descreve o sistema de redefinição de senha implementado na plataforma Zip Food, que utiliza códigos de verificação enviados por SMS.

## Visão Geral

O sistema permite que usuários redefinam suas senhas de forma segura através de códigos de verificação enviados para seus números de telefone cadastrados. Este é um componente crítico para a experiência do usuário em uma plataforma de delivery, onde o acesso rápido e seguro é essencial.

## Arquitetura do Sistema

### Componentes Principais

1. **Banco de Dados**
   - Tabela `sms_verification_codes`: Armazena códigos temporários
   - Campo `phone` obrigatório na tabela `users`
   - Políticas RLS para segurança

2. **Backend Services**
   - `SMSService`: Gerencia envio e verificação de códigos
   - Rate limiting para prevenir abuso
   - Integração com Twilio (produção) e mock (desenvolvimento)

3. **API Endpoints**
   - `POST /api/auth/password-reset`: Solicita código de redefinição
   - `PUT /api/auth/password-reset`: Redefine senha com código
   - `POST /api/auth/verify-sms`: Verifica códigos SMS
   - `GET /api/auth/verify-sms`: Verifica rate limit

4. **Frontend**
   - Interface de redefinição de senha com 3 etapas
   - Validação em tempo real
   - Feedback visual e countdown

## Fluxo de Operação

### 1. Solicitação de Código
```
Usuário → Frontend → API → SMSService → Provedor SMS → Usuário
```

1. Usuário informa número de telefone
2. Sistema valida formato e existência do usuário
3. Gera código de 6 dígitos com expiração de 15 minutos
4. Envia SMS através do provedor configurado
5. Armazena código no banco com hash seguro

### 2. Verificação e Redefinição
```
Usuário → Frontend → API → Validação → Atualização de Senha
```

1. Usuário informa código recebido
2. Sistema verifica validade e expiração
3. Permite inserção de nova senha
4. Atualiza senha com hash bcrypt
5. Invalida código usado

## Segurança

### Rate Limiting
- **SMS por telefone**: 3 tentativas por hora
- **Verificações por IP**: 10 tentativas por hora
- **Códigos por usuário**: 5 códigos ativos simultâneos

### Validações
- Formato de telefone brasileiro: `(11) 98765-4321`
- Códigos numéricos de 6 dígitos
- Expiração automática em 15 minutos
- Hash seguro dos códigos no banco

### Políticas RLS (Row Level Security)
```sql
-- Usuários só podem acessar seus próprios códigos
CREATE POLICY "Users can only access their own verification codes"
ON sms_verification_codes FOR ALL
USING (phone = (SELECT phone FROM users WHERE id = auth.uid()));
```

## Configuração

### Variáveis de Ambiente
```env
# Twilio (Produção)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Configurações
SMS_RATE_LIMIT_PER_PHONE=3
SMS_RATE_LIMIT_WINDOW_HOURS=1
VERIFICATION_CODE_EXPIRY_MINUTES=15
```

### Desenvolvimento vs Produção
- **Desenvolvimento**: Mock SMS service (logs no console)
- **Produção**: Integração real com Twilio
- Detecção automática baseada em `NODE_ENV`

## Interface do Usuário

### Etapas do Fluxo

1. **Inserir Telefone**
   - Campo formatado automaticamente
   - Validação em tempo real
   - Verificação de rate limit

2. **Inserir Código**
   - Input numérico de 6 dígitos
   - Countdown de expiração
   - Opção de reenvio

3. **Nova Senha**
   - Validação de força da senha
   - Confirmação de senha
   - Feedback de sucesso

### Componentes Reutilizáveis
- Formatação automática de telefone
- Validação de telefone brasileiro
- Rate limit checker
- Countdown timer

## Monitoramento e Logs

### Métricas Importantes
- Taxa de entrega de SMS
- Taxa de conversão (código → senha alterada)
- Tentativas de abuso (rate limit atingido)
- Tempo médio de conclusão do fluxo

### Logs de Auditoria
```typescript
// Exemplo de log estruturado
console.log({
  event: 'sms_code_sent',
  phone: phone.slice(-4), // Apenas últimos 4 dígitos
  purpose: 'password_reset',
  timestamp: new Date().toISOString()
});
```

## Troubleshooting

### Problemas Comuns

1. **SMS não recebido**
   - Verificar configuração do Twilio
   - Validar formato do número
   - Checar logs de erro do provedor

2. **Rate limit atingido**
   - Aguardar janela de tempo
   - Verificar se não há abuso
   - Considerar ajustar limites

3. **Código expirado**
   - Solicitar novo código
   - Verificar configuração de expiração
   - Limpeza automática de códigos antigos

### Comandos Úteis

```sql
-- Verificar códigos ativos
SELECT phone, purpose, created_at, expires_at 
FROM sms_verification_codes 
WHERE expires_at > NOW();

-- Limpar códigos expirados manualmente
SELECT cleanup_expired_sms_codes();

-- Verificar rate limit de um telefone
SELECT COUNT(*) 
FROM sms_verification_codes 
WHERE phone = '+5511987654321' 
AND created_at > NOW() - INTERVAL '1 hour';
```

## Próximos Passos

### Melhorias Futuras
1. **Múltiplos Provedores**: Fallback entre Twilio, AWS SNS, etc.
2. **Templates Personalizados**: Mensagens específicas por contexto
3. **Analytics Avançados**: Dashboard de métricas em tempo real
4. **Internacionalização**: Suporte a outros países
5. **Autenticação 2FA**: Expansão para autenticação de dois fatores

### Testes Recomendados
1. Testes unitários para validações
2. Testes de integração com mock do Twilio
3. Testes de carga para rate limiting
4. Testes E2E do fluxo completo

## Considerações de Negócio

### Custos
- SMS: ~R$ 0,10 por mensagem
- Estimativa: 1000 redefinições/mês = R$ 100
- ROI: Redução de tickets de suporte

### Experiência do Usuário
- Tempo médio: 2-3 minutos
- Taxa de abandono esperada: <15%
- Satisfação: Acesso rápido sem contato com suporte

### Compliance
- LGPD: Dados de telefone com consentimento
- Retenção: Códigos deletados após uso/expiração
- Auditoria: Logs para rastreabilidade