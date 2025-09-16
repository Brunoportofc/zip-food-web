import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [FORGOT-PASSWORD] Iniciando solicitação de redefinição de senha');
    
    const body = await request.json();
    console.log('📝 [FORGOT-PASSWORD] Body recebido:', { email: body.email });
    
    const { email } = body;
    
    // Validação de entrada
    if (!email) {
      console.log('❌ [FORGOT-PASSWORD] Email não fornecido');
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ [FORGOT-PASSWORD] Formato de email inválido:', email);
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [FORGOT-PASSWORD] Buscando usuário com email:', email);
    
    // Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      console.log('❌ [FORGOT-PASSWORD] Usuário não encontrado:', { userError, email });
      // Por segurança, sempre retornamos sucesso mesmo se o usuário não existir
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá as instruções de redefinição'
      });
    }
    
    console.log('👤 [FORGOT-PASSWORD] Usuário encontrado:', { id: user.id, name: user.name });
    
    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    
    console.log('🔑 [FORGOT-PASSWORD] Token gerado, expira em:', expiresAt.toISOString());
    
    // Tentar salvar token no banco de dados
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt.toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.log('⚠️ [FORGOT-PASSWORD] Erro ao salvar token no banco:', updateError);
      console.log('💾 [FORGOT-PASSWORD] Usando armazenamento em memória como fallback');
      
      // Usar armazenamento em memória como fallback
      if (!(global as any).resetTokens) {
        (global as any).resetTokens = new Map();
      }
      
      (global as any).resetTokens.set(resetToken, {
        userId: user.id,
        email: user.email,
        expiresAt: expiresAt.getTime()
      });
      
      console.log('💾 [FORGOT-PASSWORD] Token salvo em memória');
    } else {
      console.log('💾 [FORGOT-PASSWORD] Token salvo no banco com sucesso');
    }
    
    // Simular envio de email (em produção, integrar com serviço de email)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    console.log('📧 [FORGOT-PASSWORD] Link de redefinição gerado:', resetLink);
    console.log('📧 [MOCK EMAIL] Para:', email);
    console.log('📧 [MOCK EMAIL] Assunto: Redefinição de Senha - ZipFood');
    console.log('📧 [MOCK EMAIL] Conteúdo:');
    console.log(`Olá ${user.name},\n\nVocê solicitou a redefinição de sua senha no ZipFood.\n\nClique no link abaixo para redefinir sua senha:\n${resetLink}\n\nEste link expira em 15 minutos.\n\nSe você não solicitou esta redefinição, ignore este email.\n\nEquipe ZipFood`);
    
    // Em desenvolvimento, retornar o token para facilitar testes
    const response: any = {
      success: true,
      message: 'Se o email estiver cadastrado, você receberá as instruções de redefinição'
    };
    
    // Adicionar token apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      response.resetToken = resetToken;
      response.resetLink = resetLink;
    }
    
    console.log('✅ [FORGOT-PASSWORD] Solicitação processada com sucesso');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 [FORGOT-PASSWORD] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}