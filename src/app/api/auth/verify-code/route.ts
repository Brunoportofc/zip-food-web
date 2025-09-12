import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/services/sms.service';

const smsService = new SMSService();

export async function POST(request: NextRequest) {
  console.log('🔍 [VERIFY-CODE] Iniciando verificação de código');
  
  try {
    const body = await request.json();
    console.log('📝 [VERIFY-CODE] Body recebido:', body);
    
    const { phone, code } = body;
    
    if (!phone || !code) {
      console.log('❌ [VERIFY-CODE] Dados obrigatórios ausentes');
      return NextResponse.json(
        { message: 'Telefone e código são obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [VERIFY-CODE] Verificando código para:', phone);
    const result = await smsService.verifyCode(phone, code);
    console.log('📋 [VERIFY-CODE] Resultado da verificação:', result);
    
    if (result.success) {
      console.log('✅ [VERIFY-CODE] Código verificado com sucesso');
      return NextResponse.json({
        message: 'Código verificado com sucesso!',
        userId: result.userId
      });
    } else {
      console.log('❌ [VERIFY-CODE] Falha na verificação:', result.message);
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('💥 [VERIFY-CODE] Erro interno:', error);
    console.error('📊 [VERIFY-CODE] Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}