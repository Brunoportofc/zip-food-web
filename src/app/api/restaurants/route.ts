// src/app/api/restaurants/route.ts
import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/api/supabase';
import { errorResponse, successResponse } from '@/lib/api/response';

// POST - Criar novo restaurante
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse('Acesso não autorizado.', 401);
    }

    const body = await request.json();
    
    // Lógica de geocodificação
    const { address, city, country } = body;
    const fullAddress = `${address}, ${city}, ${country}`;
    const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    let lat: number | null = null;
    let lon: number | null = null;

    if (GEOAPIFY_API_KEY) {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        fullAddress
      )}&apiKey=${GEOAPIFY_API_KEY}`;
      const geoResponse = await fetch(url);
      const geoData = await geoResponse.json();
      if (geoData.features && geoData.features.length > 0) {
        lat = geoData.features[0].properties.lat;
        lon = geoData.features[0].properties.lon;
      }
    }
    
    if (lat === null || lon === null) {
      return errorResponse('Coordenadas não encontradas para o endereço.', 400);
    }
    
    const restaurantData = {
      created_by: user.id,
      user_id: user.id,
      name: body.name.trim(),
      // ... (resto dos seus dados)
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      latitude: lat,
      longitude: lon,
      cuisine_type: body.cuisine_type.trim(),
    };
    
    const { data: restaurant, error } = await supabaseAdmin
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse('Restaurante já existe para esta conta.', 409);
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(restaurant, 201);

  } catch (error: any) {
    console.error('Erro no servidor ao criar restaurante:', error.message);
    return errorResponse('Ocorreu um erro inesperado no servidor.', 500);
  }
}