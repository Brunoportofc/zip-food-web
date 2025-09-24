import { db } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Interface para configuração do provedor de SMS
interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<boolean>;
}

// Implementação para Twilio (pode ser substituído por outros provedores)
class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: phone,
          Body: message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar SMS via Twilio:', error);
      return false;
    }
  }
}

// Implementação simulada para desenvolvimento
class MockSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<boolean> {
    console.log(`[MOCK SMS] Para: ${phone}`);
    console.log(`[MOCK SMS] Mensagem: ${message}`);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
}

export class SMSService {
  private provider: SMSProvider;
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly MAX_SMS_PER_HOUR = 5;
  private readonly RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora em ms

  constructor() {
    // Usar mock em desenvolvimento, Twilio em produção
    this.provider = process.env.NODE_ENV === 'production' 
      ? new TwilioSMSProvider() 
      : new MockSMSProvider();
  }

  /**
   * Valida e formata número de telefone brasileiro
   */
  validateAndFormatPhone(phone: string): string | null {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Lista de DDDs válidos no Brasil
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];
    
    // Verifica se é um número brasileiro válido
    // Formatos aceitos: XXYXXXXXXXX, 55XXYXXXXXXXX, +55XXYXXXXXXXX
    let formattedPhone = cleanPhone;
    
    // Adiciona código do país se não tiver
    if (formattedPhone.length === 11) {
      // Verifica se o DDD é válido
      const ddd = formattedPhone.substring(0, 2);
      if (!validDDDs.includes(ddd)) {
        return null; // DDD inválido
      }
      formattedPhone = '55' + formattedPhone;
    } else if (formattedPhone.length === 13 && formattedPhone.startsWith('55')) {
      // Já tem código do país - verifica DDD
      const ddd = formattedPhone.substring(2, 4);
      if (!validDDDs.includes(ddd)) {
        return null; // DDD inválido
      }
    } else if (formattedPhone.length === 10) {
      // Número sem 9 inicial - adiciona DDD padrão 11 e código do país
      formattedPhone = '5511' + formattedPhone;
    } else {
      return null; // Formato inválido
    }
    
    // Adiciona + no início
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    // Valida formato final: +55XXYXXXXXXXX
    const phoneRegex = /^\+55[1-9][0-9]{1}9?[0-9]{8}$/;
    if (!phoneRegex.test(formattedPhone)) {
      return null;
    }
    
    return formattedPhone;
  }

  /**
   * Verifica rate limiting por telefone
   */
  private checkRateLimit(phone: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimitMap.get(phone);
    
    if (!rateLimit || now > rateLimit.resetTime) {
      // Primeiro SMS ou janela expirou
      this.rateLimitMap.set(phone, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }
    
    if (rateLimit.count >= this.MAX_SMS_PER_HOUR) {
      return false; // Limite excedido
    }
    
    // Incrementa contador
    rateLimit.count++;
    return true;
  }

  /**
   * Gera código de verificação de 6 dígitos
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se começar com 55 (código do Brasil), remove
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return '+' + cleaned;
    }
    
    // Se não tiver código do país, adiciona +55
    if (cleaned.length === 11) {
      return '+55' + cleaned;
    }
    
    // Se já tiver + no início, retorna como está
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return '+55' + cleaned;
  }

  /**
   * Envia código de verificação para redefinição de senha
   */
  async sendPasswordResetCode(phone: string): Promise<{
    success: boolean;
    message: string;
    code?: string; // Apenas para desenvolvimento
  }> {
    try {
      console.log('🔍 [SMS-SERVICE] Telefone recebido:', phone);
      
      // Validar formato do telefone
      const formattedPhone = this.validateAndFormatPhone(phone);
      console.log('📱 [SMS-SERVICE] Telefone formatado:', formattedPhone);
      
      if (!formattedPhone) {
        return {
          success: false,
          message: 'Número de telefone inválido. Use o formato: (11) 98765-4321'
        };
      }

      // Verificar rate limiting
      if (!this.checkRateLimit(formattedPhone)) {
        return {
          success: false,
          message: 'Muitas tentativas. Tente novamente em 1 hora.'
        };
      }

      try {
        // Buscar usuário com o telefone original
        let userQuery = query(
          collection(db, 'users'),
          where('phone', '==', phone)
        );
        let userSnapshot = await getDocs(userQuery);
        
        let user = null;
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          user = { id: userDoc.id, ...userDoc.data() };
        }
        
        // Se não encontrar, tenta com o telefone formatado
        if (!user) {
          userQuery = query(
            collection(db, 'users'),
            where('phone', '==', formattedPhone)
          );
          userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            user = { id: userDoc.id, ...userDoc.data() };
          }
        }

        if (!user) {
          return {
            success: false,
            message: 'Nenhuma conta encontrada com este número de telefone.'
          };
        }

        // Gerar código de verificação
        const verificationCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        // Salvar código de verificação no Firestore
        try {
          await setDoc(doc(db, 'users', user.id), {
            verification_code: verificationCode,
            verification_expires: expiresAt.toISOString()
          }, { merge: true });
        } catch (updateError) {
          console.error('Erro ao salvar código de verificação no Firestore:', updateError);
          // Se não conseguir salvar no Firestore, vamos usar memória temporariamente
          console.log('Usando armazenamento em memória como fallback');
          
          // Armazenar em memória (não recomendado para produção)
          if (!(global as any).verificationCodes) {
            (global as any).verificationCodes = new Map();
          }
          
          (global as any).verificationCodes.set(formattedPhone, {
            code: verificationCode,
            userId: user.id,
            expiresAt: expiresAt.getTime()
          });
        }

        // Preparar mensagem
        const message = `ZipFood: Seu código de redefinição de senha é ${verificationCode}. Válido por 15 minutos. Não compartilhe este código.`;

        // Enviar SMS
        const smsSuccess = await this.provider.sendSMS(formattedPhone, message);

        if (!smsSuccess) {
          return {
            success: false,
            message: 'Erro ao enviar SMS. Tente novamente.'
          };
        }

        return {
          success: true,
          message: 'Código enviado com sucesso!',
          // Incluir código apenas em desenvolvimento para facilitar testes
          ...(process.env.NODE_ENV !== 'production' && { code: verificationCode })
        };
      } catch (dbError) {
        console.error('Erro ao buscar usuário no banco de dados:', dbError);
        return {
          success: false,
          message: 'Erro interno. Tente novamente.'
        };
      }

    } catch (error) {
      console.error('Erro no serviço de SMS:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  /**
   * Verifica código de verificação
   */
  async verifyCode(phone: string, code: string, purpose: 'password_reset' | 'phone_verification' = 'password_reset'): Promise<{
    success: boolean;
    message: string;
    userId?: string;
  }> {
    try {
      // Validar formato do telefone
      const formattedPhone = this.validateAndFormatPhone(phone);
      if (!formattedPhone) {
        return {
          success: false,
          message: 'Número de telefone inválido.'
        };
      }

      // Validar formato do código
      if (!/^\d{6}$/.test(code)) {
        return {
          success: false,
          message: 'Código deve conter 6 dígitos.'
        };
      }

      try {
        // Buscar usuário no Firestore
        const userQuery = query(
          collection(db, 'users'),
          where('phone', '==', formattedPhone)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const user = userDoc.data();
          
          if (user.verification_code === code) {
            // Verificar se não expirou
            if (user.verification_expires && new Date() > new Date(user.verification_expires)) {
              // Limpar código expirado
              await setDoc(doc(db, 'users', userDoc.id), {
                verification_code: null,
                verification_expires: null
              }, { merge: true });
              
              return {
                success: false,
                message: 'Código expirado'
              };
            }
            
            // Limpar código usado
            await setDoc(doc(db, 'users', userDoc.id), {
              verification_code: null,
              verification_expires: null
            }, { merge: true });
            
            return {
              success: true,
              message: 'Código verificado com sucesso!',
              userId: userDoc.id
            };
          }
        }
      } catch (firestoreError) {
        console.error('Erro ao verificar código no Firestore:', firestoreError);
      }
      
      // Se não encontrou na tabela users, tentar na memória (fallback)
      if ((global as any).verificationCodes && (global as any).verificationCodes.has(formattedPhone)) {
        const stored = (global as any).verificationCodes.get(formattedPhone);
        
        if (stored.code === code) {
          // Verificar se não expirou
          if (Date.now() > stored.expiresAt) {
            (global as any).verificationCodes.delete(formattedPhone);
            return {
              success: false,
              message: 'Código expirado'
            };
          }
          
          // Remover código usado
          (global as any).verificationCodes.delete(formattedPhone);
          
          return {
            success: true,
            message: 'Código verificado com sucesso!',
            userId: stored.userId
          };
        }
      }

      return {
        success: false,
        message: 'Código inválido, expirado ou já utilizado.'
      };

    } catch (error) {
      console.error('Erro na verificação do código:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.'
      };
    }
  }

  /**
   * Limpa código de verificação para um telefone
   */
  async clearVerificationCode(phone: string): Promise<void> {
    try {
      const formattedPhone = this.validateAndFormatPhone(phone);
      if (!formattedPhone) return;
      
      // Limpar do Firestore se existir
      const userQuery = query(
        collection(db, 'users'),
        where('phone', '==', formattedPhone)
      );
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await setDoc(doc(db, 'users', userDoc.id), {
          verification_code: null,
          verification_expires: null
        }, { merge: true });
      }
      
      // Limpar da memória também
      if ((global as any).verificationCodes && (global as any).verificationCodes.has(formattedPhone)) {
        (global as any).verificationCodes.delete(formattedPhone);
      }
    } catch (error) {
      console.error('Erro ao limpar código de verificação:', error);
    }
  }

  /**
   * Limpa rate limits (para uso administrativo)
   */
  clearRateLimit(phone: string): void {
    const formattedPhone = this.validateAndFormatPhone(phone);
    if (formattedPhone) {
      this.rateLimitMap.delete(formattedPhone);
    }
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  getRateLimitStats(phone: string): { remaining: number; resetTime: number } | null {
    const formattedPhone = this.validateAndFormatPhone(phone);
    if (!formattedPhone) return null;
    
    const rateLimit = this.rateLimitMap.get(formattedPhone);
    if (!rateLimit || Date.now() > rateLimit.resetTime) {
      return { remaining: this.MAX_SMS_PER_HOUR, resetTime: 0 };
    }
    
    return {
      remaining: Math.max(0, this.MAX_SMS_PER_HOUR - rateLimit.count),
      resetTime: rateLimit.resetTime
    };
  }
}

// Instância singleton
export const smsService = new SMSService();