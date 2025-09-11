import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, address, userType, restaurantData } = await request.json();

    // Validação básica
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, password, name, userType' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 409 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        phone,
        address,
        user_type: userType
      })
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar usuário:', userError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    // Se for restaurante, criar dados do restaurante
    if (userType === 'restaurant' && restaurantData) {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          user_id: user.id,
          name: restaurantData.name,
          description: restaurantData.description,
          category: restaurantData.category,
          address: restaurantData.address,
          phone: restaurantData.phone,
          opening_hours: restaurantData.openingHours,
          delivery_fee: restaurantData.deliveryFee || 0,
          minimum_order: restaurantData.minimumOrder || 0
        })
        .select()
        .single();

      if (restaurantError) {
        console.error('Erro ao criar restaurante:', restaurantError);
        // Rollback: deletar usuário criado
        await supabase.from('users').delete().eq('id', user.id);
        return NextResponse.json(
          { error: 'Erro ao criar dados do restaurante' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Cadastro concluído',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.user_type
        },
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          category: restaurant.category
        }
      }, { status: 201 });
    }

    // Se for entregador, criar dados do entregador
    if (userType === 'delivery' && restaurantData) {
      const { data: driver, error: driverError } = await supabase
        .from('delivery_drivers')
        .insert({
          user_id: user.id,
          vehicle_type: restaurantData.vehicleType,
          license_plate: restaurantData.licensePlate
        })
        .select()
        .single();

      if (driverError) {
        console.error('Erro ao criar entregador:', driverError);
        // Rollback: deletar usuário criado
        await supabase.from('users').delete().eq('id', user.id);
        return NextResponse.json(
          { error: 'Erro ao criar dados do entregador' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Cadastro concluído',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.user_type
        },
        driver: {
          id: driver.id,
          vehicleType: driver.vehicle_type
        }
      }, { status: 201 });
    }

    // Para clientes
    return NextResponse.json({
      message: 'Cadastro concluído',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}