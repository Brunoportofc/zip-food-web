import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, serverErrorResponse, validationErrorResponse } from '@/lib/api/response';

// Interface para atualização de perfil
interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  // Campos específicos por tipo de usuário
  restaurantData?: {
    businessName?: string;
    description?: string;
    category?: string;
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedDeliveryTime?: string;
  };
  deliveryData?: {
    vehicleType?: string;
    vehiclePlate?: string;
    driverLicense?: string;
  };
}

// GET - Obter dados do perfil
export async function GET(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');
    const userEmail = request.headers.get('x-user-email');
    const userName = request.headers.get('x-user-name');

    if (!userId || !userType) {
      return unauthorizedResponse('Informações de usuário não encontradas');
    }

    let profileData: any = {
      id: userId,
      email: userEmail,
      name: userName,
      userType
    };

    // Buscar dados específicos baseado no tipo de usuário
    switch (userType) {
      case 'customer':
        const { data: customerData, error: customerError } = await supabaseAdmin
          .from('customers')
          .select('*')
          .eq('id', userId)
          .single();

        if (customerError && customerError.code !== 'PGRST116') {
          console.error('Erro ao buscar dados do cliente:', customerError);
          return serverErrorResponse('Erro ao buscar dados do perfil');
        }

        profileData = { ...profileData, ...customerData };
        break;

      case 'restaurant':
        const { data: restaurantData, error: restaurantError } = await supabaseAdmin
          .from('restaurants')
          .select('*')
          .eq('id', userId)
          .single();

        if (restaurantError && restaurantError.code !== 'PGRST116') {
          console.error('Erro ao buscar dados do restaurante:', restaurantError);
          return serverErrorResponse('Erro ao buscar dados do perfil');
        }

        profileData = { ...profileData, ...restaurantData };
        break;

      case 'delivery':
        const { data: deliveryData, error: deliveryError } = await supabaseAdmin
          .from('delivery_drivers')
          .select('*')
          .eq('id', userId)
          .single();

        if (deliveryError && deliveryError.code !== 'PGRST116') {
          console.error('Erro ao buscar dados do entregador:', deliveryError);
          return serverErrorResponse('Erro ao buscar dados do perfil');
        }

        profileData = { ...profileData, ...deliveryData };
        break;

      default:
        return errorResponse('Tipo de usuário inválido');
    }

    return successResponse(profileData, 'Dados do perfil obtidos com sucesso');
  } catch (error) {
    console.error('Erro interno ao obter perfil:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}

// PUT - Atualizar dados do perfil
export async function PUT(request: NextRequest) {
  try {
    // Obter informações do usuário do middleware
    const userId = request.headers.get('x-user-id');
    const userType = request.headers.get('x-user-type');

    if (!userId || !userType) {
      return unauthorizedResponse('Informações de usuário não encontradas');
    }

    const body: UpdateProfileRequest = await request.json();

    // Validar dados básicos
    const errors: string[] = [];
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push('Email inválido');
    }
    if (body.phone && !/^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/.test(body.phone)) {
      errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX');
    }

    if (errors.length > 0) {
      return validationErrorResponse(errors);
    }

    // Preparar dados para atualização baseado no tipo de usuário
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Campos comuns
    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.trim();
    if (body.phone) updateData.phone = body.phone.trim();
    if (body.address) updateData.address = body.address;

    let tableName: string;
    let updatedProfile: any;

    // Atualizar tabela específica baseada no tipo de usuário
    switch (userType) {
      case 'customer':
        tableName = 'customers';
        break;

      case 'restaurant':
        tableName = 'restaurants';
        // Campos específicos do restaurante
        if (body.restaurantData) {
          if (body.restaurantData.businessName) updateData.business_name = body.restaurantData.businessName;
          if (body.restaurantData.description) updateData.description = body.restaurantData.description;
          if (body.restaurantData.category) updateData.category = body.restaurantData.category;
          if (body.restaurantData.deliveryFee !== undefined) updateData.delivery_fee = body.restaurantData.deliveryFee;
          if (body.restaurantData.minimumOrder !== undefined) updateData.minimum_order = body.restaurantData.minimumOrder;
          if (body.restaurantData.estimatedDeliveryTime) updateData.estimated_delivery_time = body.restaurantData.estimatedDeliveryTime;
        }
        break;

      case 'delivery':
        tableName = 'delivery_drivers';
        // Campos específicos do entregador
        if (body.deliveryData) {
          if (body.deliveryData.vehicleType) updateData.vehicle_type = body.deliveryData.vehicleType;
          if (body.deliveryData.vehiclePlate) updateData.vehicle_plate = body.deliveryData.vehiclePlate;
          if (body.deliveryData.driverLicense) updateData.driver_license = body.deliveryData.driverLicense;
        }
        break;

      default:
        return errorResponse('Tipo de usuário inválido');
    }

    // Executar atualização
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return serverErrorResponse('Erro ao atualizar perfil');
    }

    updatedProfile = data;

    return successResponse(updatedProfile, 'Perfil atualizado com sucesso');
  } catch (error) {
    console.error('Erro interno ao atualizar perfil:', error);
    return serverErrorResponse('Erro interno do servidor');
  }
}