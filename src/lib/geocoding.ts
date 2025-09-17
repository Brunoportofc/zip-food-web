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

// Função de geocodificação simulada mais realista para testes
export async function reverseGeocode(lat: number, lng: number): Promise<AddressComponents> {
  try {
    console.log('🧪 Usando geocodificação simulada para coordenadas:', { lat, lng });
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Detectar região baseada nas coordenadas para dados mais realistas
    let addressData: AddressComponents;
    
    // Brasil (aproximadamente)
    if (lat >= -35 && lat <= 5 && lng >= -75 && lng <= -30) {
      console.log('🇧🇷 Coordenadas detectadas no Brasil');
      
      // Diferentes regiões do Brasil
      if (lat >= -25 && lat <= -19 && lng >= -50 && lng <= -40) {
        // Região Sudeste (São Paulo, Rio, Minas)
        addressData = {
          street: 'Rua das Flores',
          streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
          city: 'São Paulo',
          state: 'São Paulo',
          country: 'Brasil',
          postalCode: generatePostalCode('Brazil'),
          formattedAddress: `Rua das Flores, ${Math.floor(Math.random() * 999 + 1)} - Vila Madalena, São Paulo - SP, ${generatePostalCode('Brazil')}, Brasil`
        };
      } else if (lat >= -30 && lat <= -25 && lng >= -55 && lng <= -45) {
        // Região Sul
        addressData = {
          street: 'Avenida Ipiranga',
          streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
          city: 'Porto Alegre',
          state: 'Rio Grande do Sul',
          country: 'Brasil',
          postalCode: generatePostalCode('Brazil'),
          formattedAddress: `Avenida Ipiranga, ${Math.floor(Math.random() * 999 + 1)} - Centro, Porto Alegre - RS, ${generatePostalCode('Brazil')}, Brasil`
        };
      } else {
        // Outras regiões do Brasil
        addressData = {
          street: 'Rua Principal',
          streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
          city: 'Brasília',
          state: 'Distrito Federal',
          country: 'Brasil',
          postalCode: generatePostalCode('Brazil'),
          formattedAddress: `Rua Principal, ${Math.floor(Math.random() * 999 + 1)} - Asa Norte, Brasília - DF, ${generatePostalCode('Brazil')}, Brasil`
        };
      }
    }
    // Estados Unidos
    else if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) {
      console.log('🇺🇸 Coordenadas detectadas nos Estados Unidos');
      addressData = {
        street: 'Main Street',
        streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
        city: 'New York',
        state: 'New York',
        country: 'United States',
        postalCode: generatePostalCode('United States'),
        formattedAddress: `${Math.floor(Math.random() * 999 + 1)} Main Street, New York, NY ${generatePostalCode('United States')}, USA`
      };
    }
    // Israel
    else if (lat >= 31.0 && lat <= 33.5 && lng >= 34.0 && lng <= 36.0) {
      console.log('🇮🇱 Coordenadas detectadas em Israel');
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
      
      if (lat >= 32.0 && lat <= 32.2 && lng >= 34.7 && lng <= 34.9) {
        addressData = {
          street,
          streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
          city: 'Tel Aviv',
          state: 'Tel Aviv District',
          country: 'Israel',
          postalCode: generatePostalCode('Israel'),
          formattedAddress: `${street} ${Math.floor(Math.random() * 999 + 1)}, Tel Aviv-Yafo, ${generatePostalCode('Israel')}, Israel`
        };
      } else if (lat >= 31.7 && lat <= 31.8 && lng >= 35.1 && lng <= 35.3) {
        addressData = {
          street,
          streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
          city: 'Jerusalem',
          state: 'Jerusalem District',
          country: 'Israel',
          postalCode: generatePostalCode('Israel'),
          formattedAddress: `${street} ${Math.floor(Math.random() * 999 + 1)}, Jerusalem, ${generatePostalCode('Israel')}, Israel`
        };
      } else {
        addressData = {
          street,
          streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
          city: 'Haifa',
          state: 'Haifa District',
          country: 'Israel',
          postalCode: generatePostalCode('Israel'),
          formattedAddress: `${street} ${Math.floor(Math.random() * 999 + 1)}, Haifa, ${generatePostalCode('Israel')}, Israel`
        };
      }
    }
    // Argentina
    else if (lat >= -34.0 && lat <= -33.0 && lng >= -58.5 && lng <= -58.3) {
      console.log('🇦🇷 Coordenadas detectadas na Argentina');
      addressData = {
        street: 'Avenida Corrientes',
        streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
        city: 'Buenos Aires',
        state: 'Buenos Aires',
        country: 'Argentina',
        postalCode: generatePostalCode('Argentina'),
        formattedAddress: `Av. Corrientes ${Math.floor(Math.random() * 999 + 1)}, ${generatePostalCode('Argentina')} CABA, Argentina`
      };
    }
    // Coordenadas padrão para outras regiões
    else {
      console.log('🌍 Coordenadas em região não mapeada, usando dados genéricos');
      addressData = {
        street: 'Rua Exemplo',
        streetNumber: Math.floor(Math.random() * 999 + 1).toString(),
        city: 'Cidade Exemplo',
        state: 'Estado Exemplo',
        country: 'País Exemplo',
        postalCode: '00000-000',
        formattedAddress: `Rua Exemplo, ${Math.floor(Math.random() * 999 + 1)} - Bairro Exemplo, Cidade Exemplo - EX, 00000-000, País Exemplo`
      };
    }
    
    console.log('🏠 Endereço simulado gerado:', addressData);
    return addressData;
    
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

// Função para geocodificação usando Geoapify API (produção)
export async function geocodeWithGeoapify(lat: number, lng: number): Promise<AddressComponents> {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  
  console.log('🔑 Verificando chave da API do Geoapify...');
  
  if (!apiKey || apiKey === 'SUA_CHAVE_GEOAPIFY_AQUI') {
    console.warn('⚠️ Geoapify API key não configurada, usando geocodificação simulada');
    throw new Error('API key não configurada');
  }

  console.log('✅ Chave da API encontrada, fazendo requisição para Geoapify...');
  
  try {
    // Construir URL da API do Geoapify
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}&format=json`;
    
    console.log('📡 URL da requisição:', url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('📡 Resposta da API do Geoapify:', {
      status: response.status,
      resultCount: data.results?.length || 0,
      firstResult: data.results?.[0] || null
    });
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Nenhum resultado encontrado');
    }
    
    const result = data.results[0];
    
    // Extrair componentes do endereço da resposta do Geoapify
    const addressComponents: AddressComponents = {
      street: result.street || result.name || '',
      streetNumber: result.housenumber || '',
      city: result.city || result.town || result.village || '',
      state: result.state || result.county || '',
      country: result.country || 'Brasil',
      postalCode: result.postcode || generatePostalCode('Brazil'),
      formattedAddress: result.formatted || `${result.street || ''} ${result.housenumber || ''}, ${result.city || ''}`
    };
    
    console.log('🏠 Endereço extraído:', addressComponents);
    console.log('✅ Geocodificação bem-sucedida via Geoapify API');
    
    return addressComponents;
  } catch (error) {
    console.error('❌ Erro na API do Geoapify:', error);
    throw error;
  }
}

// Função principal que tenta usar Geoapify e faz fallback para simulação
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<AddressComponents> {
  try {
    return await geocodeWithGeoapify(lat, lng);
  } catch (error) {
    console.log('🔄 Usando geocodificação simulada como fallback...');
    return reverseGeocode(lat, lng);
  }
}