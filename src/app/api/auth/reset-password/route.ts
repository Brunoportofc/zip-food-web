import { NextRequest, NextResponse } from 'next/server';
import { SMSService } from '@/services/sms.service';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const smsService = new SMSService();

export async function POST(request: NextRequest) {
  console.log('🔍 [RESET-PASSWORD] Iniciando redefinição de senha');
  
  try {
    const body = await request.json();
    console.log('📝 [RESET-PASSWORD] Body recebido:', { ...body, newPassword: '[HIDDEN]' });
    
    const { phone, code, newPassword } = body;
    
    if (!phone || !code || !newPassword) {
      console.log('❌ [RESET-PASSWORD] Dados obrigatórios ausentes');
      return NextResponse.json(
        { message: 'Telefone, código e nova senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 6) {
      console.log('❌ [RESET-PASSWORD] Senha muito curta');
      return NextResponse.json(
        { message: 'A nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [RESET-PASSWORD] Verificando código para:', phone);
    const verificationResult = await smsService.verifyCode(phone, code);
    console.log('📋 [RESET-PASSWORD] Resultado da verificação:', verificationResult);
    
    if (!verificationResult.success) {
      console.log('❌ [RESET-PASSWORD] Código inválido ou expirado');
      return NextResponse.json(
        { message: verificationResult.message },
        { status: 400 }
      );
    }
    
    // Hash da nova senha
    console.log('🔐 [RESET-PASSWORD] Gerando hash da nova senha');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Atualizar senha no banco
    console.log('💾 [RESET-PASSWORD] Atualizando senha no banco para userId:', verificationResult.userId);
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationResult.userId);
    
    if (updateError) {
      console.error('💥 [RESET-PASSWORD] Erro ao atualizar senha:', updateError);
      return NextResponse.json(
        { message: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }
    
    // Limpar código de verificação usado
    console.log('🧹 [RESET-PASSWORD] Limpando código de verificação usado');
    await smsService.clearVerificationCode(phone);
    
    console.log('✅ [RESET-PASSWORD] Senha redefinida com sucesso');
    return NextResponse.json({
      message: 'Senha redefinida com sucesso!'
    });
    
  } catch (error) {
    console.error('💥 [RESET-PASSWORD] Erro interno:', error);
    console.error('📊 [RESET-PASSWORD] Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}