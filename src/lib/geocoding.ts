// Biblioteca para geocodificação reversa
export interface AddressComponents {
  street?: string;
  streetNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface GeocodeResult {
  address: AddressComponents;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Função para geocodificação reversa usando Google Maps API
export async function reverseGeocode(lat: number, lng: number): Promise<AddressComponents> {
  try {
    // Em produção, usar a API do Google Maps
    // Por enquanto, simular com dados baseados nas coordenadas
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determinar país baseado nas coordenadas (simplificado)
    let country = 'Israel';
    let city = 'Tel Aviv';
    let state = 'Tel Aviv District';
    
    // Coordenadas aproximadas para diferentes regiões
    if (lat >= 31.0 && lat <= 33.5 && lng >= 34.0 && lng <= 36.0) {
      // Israel
      country = 'Israel';
      if (lat >= 32.0 && lat <= 32.2 && lng >= 34.7 && lng <= 34.9) {
        city = 'Tel Aviv';
        state = 'Tel Aviv District';
      } else if (lat >= 31.7 && lat <= 31.8 && lng >= 35.1 && lng <= 35.3) {
        city = 'Jerusalem';
        state = 'Jerusalem District';
      } else if (lat >= 32.7 && lat <= 32.9 && lng >= 35.0 && lng <= 35.3) {
        city = 'Haifa';
        state = 'Haifa District';
      }
    } else if (lat >= -34.0 && lat <= -33.0 && lng >= -58.5 && lng <= -58.3) {
      // Buenos Aires, Argentina
      country = 'Argentina';
      city = 'Buenos Aires';
      state = 'Buenos Aires';
    } else if (lat >= 40.0 && lat <= 41.0 && lng >= -74.5 && lng <= -73.5) {
      // New York, USA
      country = 'United States';
      city = 'New York';
      state = 'New York';
    } else if (lat >= -23.8 && lat <= -23.3 && lng >= -46.8 && lng <= -46.3) {
      // São Paulo, Brasil
      country = 'Brazil';
      city = 'São Paulo';
      state = 'São Paulo';
    }
    
    // Gerar endereço simulado
    const streetNumber = Math.floor(Math.random() * 999) + 1;
    const streets = [
      'Rothschild Boulevard',
      'Dizengoff Street',
      'Ben Yehuda Street',
      'Allenby Street',
      'King George Street',
      'Jaffa Road',
      'Emek Refaim Street'
    ];
    const street = streets[Math.floor(Math.random() * streets.length)];
    
    return {
      street,
      streetNumber: streetNumber.toString(),
      city,
      state,
      country,
      postalCode: generatePostalCode(country),
      formattedAddress: `${streetNumber} ${street}, ${city}, ${country}`
    };
    
  } catch (error) {
    console.error('Erro na geocodificação reversa:', error);
    throw new Error('Não foi possível obter o endereço da localização');
  }
}

// Função para gerar código postal baseado no país
function generatePostalCode(country: string): string {
  switch (country) {
    case 'Israel':
      return Math.floor(Math.random() * 90000) + 10000 + '';
    case 'United States':
      return Math.floor(Math.random() * 90000) + 10000 + '';
    case 'Brazil':
      return Math.floor(Math.random() * 90000000) + 10000000 + '';
    case 'Argentina':
      return 'C' + Math.floor(Math.random() * 9000) + 1000 + 'AAA';
    default:
      return Math.floor(Math.random() * 90000) + 10000 + '';
  }
}

// Função para geocodificação usando Google Maps API (produção)
export async function geocodeWithGoogleMaps(lat: number, lng: number): Promise<AddressComponents> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key não encontrada, usando geocodificação simulada');
    return reverseGeocode(lat, lng);
  }
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=pt-BR`
    );
    
    if (!response.ok) {
      throw new Error('Erro na API do Google Maps');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      throw new Error('Nenhum resultado encontrado');
    }
    
    const result = data.results[0];
    const components = result.address_components;
    
    const address: AddressComponents = {
      formattedAddress: result.formatted_address
    };
    
    // Extrair componentes do endereço
    components.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        address.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        address.street = component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        address.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        address.state = component.long_name;
      } else if (types.includes('country')) {
        address.country = component.long_name;
      } else if (types.includes('postal_code')) {
        address.postalCode = component.long_name;
      }
    });
    
    return address;
    
  } catch (error) {
    console.error('Erro na API do Google Maps:', error);
    // Fallback para geocodificação simulada
    return reverseGeocode(lat, lng);
  }
}

// Função principal que tenta usar Google Maps e faz fallback para simulação
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<AddressComponents> {
  try {
    return await geocodeWithGoogleMaps(lat, lng);
  } catch (error) {
    console.warn('Usando geocodificação simulada devido a erro:', error);
    return reverseGeocode(lat, lng);
  }
}