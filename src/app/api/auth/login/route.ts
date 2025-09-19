import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api/response';
import { sign } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Interface para dados de login
interface LoginRequest {
  email: string;
  password: string;
  userType?: 'customer' | 'restaurant' | 'delivery';
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    console.log('🔍 DEBUG LOGIN - Dados recebidos:', { email: body.email, hasPassword: !!body.password, userType: body.userType });

    // Validação básica
    const errors: string[] = [];
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Email válido é obrigatório');
    }
    if (!body.password || body.password.length === 0) {
      errors.push('Senha é obrigatória');
    }

    if (errors.length > 0) {
      console.log('❌ DEBUG LOGIN - Erros de validação:', errors);
      return validationErrorResponse(errors);
    }

    // Buscar usuário pelo email na tabela users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', body.email)
      .single();

    console.log('🔍 DEBUG LOGIN - Resultado da busca:', { 
      found: !!userData, 
      error: userError?.message,
      userId: userData?.id 
    });

    if (userError || !userData) {
      console.error('❌ DEBUG LOGIN - Usuário não encontrado:', userError);
      return errorResponse('Email ou senha incorretos', 401);
    }

    // Verificar senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(body.password, userData.password_hash);
    console.log('🔍 DEBUG LOGIN - Verificação de senha:', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      console.log('❌ DEBUG LOGIN - Senha inválida');
      return errorResponse('Email ou senha incorretos', 401);
    }

    const userId = userData.id;

    // Verificar se o tipo de conta solicitado corresponde ao tipo cadastrado
    if (body.userType && body.userType !== userData.user_type) {
      let requestedTypeLabel = '';
      let actualTypeLabel = '';
      
      // Mapear tipos para labels em português
      const typeLabels = {
        'customer': 'cliente',
        'restaurant': 'restaurante', 
        'delivery': 'entregador'
      };
      
      requestedTypeLabel = typeLabels[body.userType] || body.userType;
      actualTypeLabel = typeLabels[userData.user_type as keyof typeof typeLabels] || userData.user_type;
      
      return errorResponse(
        `Esta conta não foi criada para acesso como ${requestedTypeLabel}. Esta conta está registrada como ${actualTypeLabel}.`,
        403
      );
    }

    // Buscar dados específicos baseado no tipo de usuário
    let additionalData = null;
    
    try {
      if (userData.user_type === 'restaurant') {
        const { data: restaurant, error: restaurantError } = await supabaseAdmin
          .from('restaurants')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!restaurantError && restaurant) {
          additionalData = {
            restaurant: {
              id: restaurant.id,
              name: restaurant.name,
              category: restaurant.category,
              isActive: restaurant.is_active,
              deliveryFee: restaurant.delivery_fee,
              minimumOrder: restaurant.minimum_order
            }
          };
        }
      }

      if (userData.user_type === 'delivery') {
        const { data: driver, error: driverError } = await supabaseAdmin
          .from('delivery_drivers')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!driverError && driver) {
          additionalData = {
            driver: {
              id: driver.id,
              vehicleType: driver.vehicle_type,
              vehiclePlate: driver.vehicle_plate,
              isAvailable: driver.is_available,
              rating: driver.rating
            }
          };
        }
      }

      // Para customers, os dados já estão na tabela users
      if (userData.user_type === 'customer') {
        additionalData = {
          customer: {
            id: userData.id,
            address: userData.address
          }
        };
      }
    } catch (additionalDataError) {
      console.error('Erro ao buscar dados adicionais:', additionalDataError);
      // Não falha o login por causa disso, apenas não retorna os dados adicionais
    }

    // Gerar JWT próprio
    const jwtPayload = {
      userId: userData.id,
      email: userData.email,
      userType: userData.user_type,
      name: userData.name
    };

    const token = sign(jwtPayload, process.env.JWT_SECRET!, {
      expiresIn: '7d'
    });

    const responseData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        type: userData.user_type, // Mudança: 'userType' -> 'type' para consistência com auth.store
        phone: userData.phone,
        address: userData.address
      },
      token,
      ...additionalData
    };

    return successResponse(responseData, 'Login realizado com sucesso');

  } catch (error) {
    console.error('Erro interno no login:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}