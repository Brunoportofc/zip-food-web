import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/services/sms.service';

// POST /api/auth/verify-sms - Verificar código SMS
export async function POST(request: NextRequest) {
  try {
    const { phone, code, purpose = 'password_reset' } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Telefone e código são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['password_reset', 'phone_verification'].includes(purpose)) {
      return NextResponse.json(
        { error: 'Propósito inválido' },
        { status: 400 }
      );
    }

    const result = await smsService.verifyCode(phone, code, purpose);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      userId: result.userId,
      verified: true
    });

  } catch (error) {
    console.error('Erro na verificação do código SMS:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/auth/verify-sms/rate-limit - Verificar rate limit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      );
    }

    const stats = smsService.getRateLimitStats(phone);

    if (!stats) {
      return NextResponse.json(
        { error: 'Telefone inválido' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      remaining: stats.remaining,
      resetTime: stats.resetTime,
      canSend: stats.remaining > 0
    });

  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}