import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/services/sms.service';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/auth/password-reset - Solicitar código de redefinição
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [PASSWORD-RESET] Iniciando solicitação de redefinição de senha');
    
    const body = await request.json();
    console.log('📝 [PASSWORD-RESET] Body recebido:', JSON.stringify(body));
    
    const { phone } = body;

    if (!phone) {
      console.log('❌ [PASSWORD-RESET] Telefone não fornecido');
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      );
    }

    console.log('📞 [PASSWORD-RESET] Enviando código para:', phone);
    const result = await smsService.sendPasswordResetCode(phone);
    console.log('📋 [PASSWORD-RESET] Resultado do SMS service:', JSON.stringify(result));

    if (!result.success) {
      console.log('❌ [PASSWORD-RESET] Falha no envio:', result.message);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    console.log('✅ [PASSWORD-RESET] Código enviado com sucesso');
    return NextResponse.json({
      message: result.message,
      // Incluir código apenas em desenvolvimento
      ...(process.env.NODE_ENV !== 'production' && result.code && { 
        developmentCode: result.code 
      })
    });

  } catch (error) {
    console.error('💥 [PASSWORD-RESET] Erro na solicitação de redefinição de senha:', error);
    console.error('💥 [PASSWORD-RESET] Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/password-reset - Redefinir senha com código
export async function PUT(request: NextRequest) {
  try {
    const { phone, code, newPassword } = await request.json();

    // Validações básicas
    if (!phone || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Telefone, código e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar código
    const verificationResult = await smsService.verifyCode(phone, code, 'password_reset');

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: verificationResult.message },
        { status: 400 }
      );
    }

    if (!verificationResult.userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha no banco
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationResult.userId);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Senha redefinida com sucesso!'
    });

  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}