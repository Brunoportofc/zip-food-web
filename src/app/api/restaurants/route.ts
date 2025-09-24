// src/app/api/restaurants/route.ts
import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { errorResponse, successResponse } from '@/lib/api/response';

// POST - Criar novo restaurante
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Token de autenticação necessário.', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    let user;
    
    try {
      user = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      return errorResponse('Token inválido.', 401);
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
      created_by: user.uid,
      user_id: user.uid,
      name: body.name.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      latitude: lat,
      longitude: lon,
      cuisine_type: body.cuisine_type.trim(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    try {
      // Verificar se já existe um restaurante para este usuário
      const existingRestaurant = await adminDb.collection('restaurants')
        .where('user_id', '==', user.uid)
        .limit(1)
        .get();

      if (!existingRestaurant.empty) {
        return errorResponse('Restaurante já existe para esta conta.', 409);
      }

      // Criar novo restaurante
      const docRef = await adminDb.collection('restaurants').add(restaurantData);
      const newRestaurant = await docRef.get();
      const restaurant = { id: newRestaurant.id, ...newRestaurant.data() };

      return successResponse(restaurant, 'Restaurante criado com sucesso', 201);
    } catch (firestoreError) {
      console.error('Erro ao criar restaurante no Firestore:', firestoreError);
      return errorResponse('Erro ao criar restaurante.', 500);
    }

  } catch (error: any) {
    console.error('Erro no servidor ao criar restaurante:', error.message);
    return errorResponse('Ocorreu um erro inesperado no servidor.', 500);
  }
}