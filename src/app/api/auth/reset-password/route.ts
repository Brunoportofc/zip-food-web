import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [RESET-PASSWORD] Iniciando redefinição de senha');
    
    const body = await request.json();
    console.log('📝 [RESET-PASSWORD] Body recebido:', { 
      token: body.token ? '[TOKEN_PROVIDED]' : '[NO_TOKEN]', 
      newPassword: '[HIDDEN]' 
    });
    
    const { token, newPassword } = body;
    
    // Validação de entrada
    if (!token || !newPassword) {
      console.log('❌ [RESET-PASSWORD] Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar força da senha
    if (newPassword.length < 6) {
      console.log('❌ [RESET-PASSWORD] Senha muito fraca');
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [RESET-PASSWORD] Verificando token de redefinição');
    
    // Buscar usuário pelo token no banco primeiro
    let user = null;
    let tokenData = null;
    
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, reset_token_expires_at')
      .eq('reset_token', token)
      .single();
    
    if (!userError && dbUser) {
      user = dbUser;
      console.log('👤 [RESET-PASSWORD] Usuário encontrado no banco:', { id: user.id, email: user.email });
      
      // Verificar se o token não expirou
      const now = new Date();
      const expiresAt = new Date(user.reset_token_expires_at);
      
      if (now > expiresAt) {
        console.log('❌ [RESET-PASSWORD] Token expirado no banco:', { now: now.toISOString(), expiresAt: expiresAt.toISOString() });
        return NextResponse.json(
          { error: 'Token de redefinição expirado. Solicite um novo link' },
          { status: 400 }
        );
      }
    } else {
      console.log('🔍 [RESET-PASSWORD] Token não encontrado no banco, verificando memória...');
      
      // Verificar no armazenamento em memória
      if ((global as any).resetTokens && (global as any).resetTokens.has(token)) {
        tokenData = (global as any).resetTokens.get(token);
        const now = Date.now();
        
        if (now > tokenData.expiresAt) {
          console.log('❌ [RESET-PASSWORD] Token expirado na memória');
          (global as any).resetTokens.delete(token);
          return NextResponse.json(
            { error: 'Token de redefinição expirado. Solicite um novo link' },
            { status: 400 }
          );
        }
        
        // Buscar dados do usuário
        const { data: memUser, error: memUserError } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('id', tokenData.userId)
          .single();
        
        if (memUserError || !memUser) {
          console.log('❌ [RESET-PASSWORD] Usuário não encontrado para token da memória');
          return NextResponse.json(
            { error: 'Token de redefinição inválido' },
            { status: 400 }
          );
        }
        
        user = memUser;
        console.log('👤 [RESET-PASSWORD] Usuário encontrado via memória:', { id: user.id, email: user.email });
      } else {
        console.log('❌ [RESET-PASSWORD] Token não encontrado em lugar nenhum');
        return NextResponse.json(
          { error: 'Token de redefinição inválido ou expirado' },
          { status: 400 }
        );
      }
    }
    
    console.log('🔐 [RESET-PASSWORD] Gerando hash da nova senha');
    
    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('💾 [RESET-PASSWORD] Atualizando senha e limpando token para userId:', user.id);
    
    // Atualizar senha no banco
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', user.id);
    
    // Limpar token de redefinição
    if (tokenData) {
      // Token estava na memória
      console.log('🧹 [RESET-PASSWORD] Limpando token da memória');
      (global as any).resetTokens.delete(token);
    } else {
      // Token estava no banco
      console.log('🧹 [RESET-PASSWORD] Limpando token do banco');
      await supabase
        .from('users')
        .update({ 
          reset_token: null,
          reset_token_expires_at: null
        })
        .eq('id', user.id);
    }
    
    if (updateError) {
      console.error('❌ [RESET-PASSWORD] Erro ao atualizar senha:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }
    
    console.log('✅ [RESET-PASSWORD] Senha redefinida com sucesso');
    
    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.'
    });
    
  } catch (error) {
    console.error('💥 [RESET-PASSWORD] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}