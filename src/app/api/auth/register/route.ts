import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api/response';
import { createClient } from '@supabase/supabase-js';
import { sign } from 'jsonwebtoken';

// Interface para dados de registro
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  userType: 'customer' | 'restaurant' | 'delivery';
  restaurantData?: {
    businessName: string;
    description?: string;
    category: string;
    deliveryFee?: number;
    minimumOrder?: number;
  };
  deliveryData?: {
    vehicleType: string;
    vehiclePlate?: string;
    driverLicense?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();

    // Validação básica
    const errors: string[] = [];
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Email válido é obrigatório');
    }
    if (!body.password || body.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }
    if (!body.name || body.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }
    if (!body.userType || !['customer', 'restaurant', 'delivery'].includes(body.userType)) {
      errors.push('Tipo de usuário inválido');
    }

    // Validações específicas por tipo
    if (body.userType === 'restaurant' && body.restaurantData) {
      if (!body.restaurantData.businessName || body.restaurantData.businessName.trim().length === 0) {
        errors.push('Nome do estabelecimento é obrigatório para restaurantes');
      }
      if (!body.restaurantData.category || body.restaurantData.category.trim().length === 0) {
        errors.push('Categoria é obrigatória para restaurantes');
      }
    }

    if (body.userType === 'delivery' && body.deliveryData) {
      if (!body.deliveryData.vehicleType || body.deliveryData.vehicleType.trim().length === 0) {
        errors.push('Tipo de veículo é obrigatório para entregadores');
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(errors);
    }

    // Criar cliente Supabase para autenticação
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Registrar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
          user_type: body.userType
        }
      }
    });

    if (authError) {
      console.error('Erro na autenticação Supabase:', authError);
      if (authError.message.includes('already registered')) {
        return errorResponse('Usuário já existe com este email', 409);
      }
      return serverErrorResponse('Erro ao criar conta de usuário');
    }

    if (!authData.user) {
      return serverErrorResponse('Erro ao criar usuário');
    }

    const userId = authData.user.id;

    try {
      // Inserir dados do usuário na tabela users
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: body.email,
          password_hash: 'managed_by_supabase_auth', // Placeholder
          name: body.name,
          phone: body.phone,
          address: body.address,
          user_type: body.userType
        });

      if (userError) {
        console.error('Erro ao inserir usuário:', userError);
        // Tentar limpar o usuário do Auth se falhou na inserção
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return serverErrorResponse('Erro ao salvar dados do usuário');
      }

      // Inserir dados específicos por tipo de usuário
      if (body.userType === 'customer') {
        const { error: customerError } = await supabaseAdmin
          .from('customers')
          .insert({
            id: userId,
            user_id: userId,
            name: body.name,
            email: body.email,
            phone: body.phone,
            address: body.address ? { full_address: body.address } : null
          });

        if (customerError) {
          console.error('Erro ao criar perfil de cliente:', customerError);
        }
      }

      if (body.userType === 'restaurant' && body.restaurantData) {
        const { error: restaurantError } = await supabaseAdmin
          .from('restaurants')
          .insert({
            id: userId,
            user_id: userId,
            name: body.restaurantData.businessName,
            description: body.restaurantData.description || '',
            category: body.restaurantData.category,
            address: body.address || '',
            phone: body.phone,
            delivery_fee: body.restaurantData.deliveryFee || 5.00,
            minimum_order: body.restaurantData.minimumOrder || 20.00,
            is_active: true,
            status: 'active'
          });

        if (restaurantError) {
          console.error('Erro ao criar perfil de restaurante:', restaurantError);
        }
      }

      if (body.userType === 'delivery' && body.deliveryData) {
        const { error: deliveryError } = await supabaseAdmin
          .from('delivery_drivers')
          .insert({
            id: userId,
            user_id: userId,
            vehicle_type: body.deliveryData.vehicleType,
            vehicle_plate: body.deliveryData.vehiclePlate,
            driver_license: body.deliveryData.driverLicense,
            is_available: true
          });

        if (deliveryError) {
          console.error('Erro ao criar perfil de entregador:', deliveryError);
        }
      }

      // Gerar JWT próprio
      const jwtPayload = {
        userId: userId,
        email: body.email,
        userType: body.userType,
        name: body.name
      };

      const token = sign(jwtPayload, process.env.JWT_SECRET!, {
        expiresIn: '7d'
      });

      const userData = {
        id: userId,
        email: body.email,
        name: body.name,
        userType: body.userType,
        phone: body.phone,
        address: body.address
      };

      return successResponse({
        user: userData,
        token,
        message: 'Usuário registrado com sucesso'
      }, 'Registro realizado com sucesso', 201);

    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      // Limpar usuário do Auth em caso de erro
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error('Erro ao limpar usuário:', cleanupError);
      }
      return serverErrorResponse('Erro ao processar registro');
    }

  } catch (error) {
    console.error('Erro interno no registro:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}