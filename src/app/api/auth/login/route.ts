import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api/response';
import { createClient } from '@supabase/supabase-js';
import { sign } from 'jsonwebtoken';

// Interface para dados de login
interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validação básica
    const errors: string[] = [];
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Email válido é obrigatório');
    }
    if (!body.password || body.password.length === 0) {
      errors.push('Senha é obrigatória');
    }

    if (errors.length > 0) {
      return validationErrorResponse(errors);
    }

    // Criar cliente Supabase para autenticação
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fazer login no Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });

    if (authError) {
      console.error('Erro na autenticação Supabase:', authError);
      if (authError.message.includes('Invalid login credentials')) {
        return errorResponse('Email ou senha incorretos', 401);
      }
      return serverErrorResponse('Erro ao fazer login');
    }

    if (!authData.user) {
      return errorResponse('Credenciais inválidas', 401);
    }

    const userId = authData.user.id;

    // Buscar dados do usuário na tabela users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return serverErrorResponse('Erro ao carregar dados do usuário');
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

      if (userData.user_type === 'customer') {
        const { data: customer, error: customerError } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!customerError && customer) {
          additionalData = {
            customer: {
              id: customer.id,
              address: customer.address
            }
          };
        }
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
        userType: userData.user_type,
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