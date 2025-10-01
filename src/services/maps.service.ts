'use client';

/**
 * Serviço de Mapas usando Geoapify
 * Substitui completamente o Google Maps por Geoapify
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: LatLng;
  };
  name?: string;
  types: string[];
}

export interface DirectionsResult {
  routes: {
    legs: {
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      start_address: string;
      end_address: string;
      steps: {
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        end_location: LatLng;
        start_location: LatLng;
        html_instructions: string;
        polyline: { points: string };
      }[];
    }[];
    overview_polyline: {
      points: string;
    };
  }[];
}

export interface GeocodeResult {
  results: {
    formatted_address: string;
    geometry: {
      location: LatLng;
    };
    place_id: string;
    types: string[];
  }[];
  status: string;
}

interface GeoapifyRoute {
  geometry: {
    coordinates: number[][];
  };
  properties: {
    distance: number;
    time: number;
  };
}

interface GeoapifyDirectionsResponse {
  features: GeoapifyRoute[];
}

class MapsService {
  private apiKey: string;
  private baseUrl = 'https://api.geoapify.com/v1';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || '';
    if (!this.apiKey || this.apiKey === 'SUA_CHAVE_GEOAPIFY_AQUI') {
      console.warn('Geoapify API key não encontrada');
    }
  }

  /**
   * Carrega a API do Geoapify dinamicamente
   */
  async loadGeoapifyAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se está no cliente
      if (typeof window === 'undefined') {
        reject(new Error('Geoapify só pode ser carregado no cliente'));
        return;
      }

      // Verificar se já foi carregado
      if (window.geoapify) {
        resolve();
        return;
      }

      // Carregar script do Geoapify
      const script = document.createElement('script');
      script.src = `https://maps.geoapify.com/v1/sdk/maps.js?apiKey=${this.apiKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('✅ Geoapify API carregada com sucesso');
        resolve();
      };

      script.onerror = () => {
        console.error('❌ Falha ao carregar Geoapify API');
        reject(new Error('Falha ao carregar Geoapify API'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Geocodificação usando Geoapify
   */
  async geocodeAddress(address: string): Promise<LatLng | null> {
    try {
      const url = `${this.baseUrl}/geocode/search?text=${encodeURIComponent(address)}&apiKey=${this.apiKey}&format=json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }
      
      const result = data.results[0];
      
      return {
        lat: result.lat,
        lng: result.lon
      };
    } catch (error) {
      console.error('❌ Erro na geocodificação:', error);
      return null;
    }
  }

  /**
   * Geocodificação reversa usando Geoapify
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${this.apiKey}&format=json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return null;
      }
      
      return data.results[0].formatted;
    } catch (error) {
      console.error('❌ Erro na geocodificação reversa:', error);
      return null;
    }
  }

  /**
   * Calcula rota entre dois pontos usando Geoapify
   */
  async getDirections(
    origin: LatLng | string,
    destination: LatLng | string,
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' = 'DRIVING'
  ): Promise<DirectionsResult | null> {
    try {
      const originStr = typeof origin === 'string' 
        ? origin 
        : `${origin.lat},${origin.lng}`;
      
      const destinationStr = typeof destination === 'string' 
        ? destination 
        : `${destination.lat},${destination.lng}`;

      const mode = travelMode === 'DRIVING' ? 'drive' : 
                   travelMode === 'WALKING' ? 'walk' :
                   travelMode === 'BICYCLING' ? 'bicycle' : 'drive';

      const url = `${this.baseUrl}/routing?waypoints=${originStr}|${destinationStr}&mode=${mode}&apiKey=${this.apiKey}`;
      
      console.log('🗺️ Calculando rota via Geoapify...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data: GeoapifyDirectionsResponse = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return null;
      }
      
      const route = data.features[0];
      
      // Converter para formato compatível
      const directionsResult: DirectionsResult = {
        routes: [{
          legs: [{
            distance: {
              text: `${(route.properties.distance / 1000).toFixed(1)} km`,
              value: route.properties.distance
            },
            duration: {
              text: `${Math.round(route.properties.time / 60)} min`,
              value: route.properties.time
            },
            start_address: originStr,
            end_address: destinationStr,
            steps: []
          }],
          overview_polyline: {
            points: this.encodePolyline(route.geometry.coordinates)
          }
        }]
      };
      
      return directionsResult;
    } catch (error) {
      console.error('❌ Erro ao obter direções:', error);
      return null;
    }
  }

  /**
   * Calcula distância e tempo entre dois pontos
   */
  async getDistanceMatrix(
    origins: (LatLng | string)[],
    destinations: (LatLng | string)[],
    travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT' = 'DRIVING'
  ): Promise<any> {
    try {
      const originsStr = origins.map(origin => 
        typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`
      ).join('|');
      
      const destinationsStr = destinations.map(destination => 
        typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`
      ).join('|');

      const response = await fetch(
        `${this.baseUrl}/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&mode=${travelMode.toLowerCase()}&key=${this.apiKey}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Erro na distance matrix:', error);
      return null;
    }
  }

  /**
   * Busca lugares próximos usando Geoapify
   */
  async searchNearbyPlaces(
    location: LatLng,
    radius: number = 1000,
    type?: string
  ): Promise<PlaceResult[]> {
    try {
      const categories = type || 'commercial';
      const url = `${this.baseUrl}/places?categories=${categories}&filter=circle:${location.lng},${location.lat},${radius}&bias=proximity:${location.lng},${location.lat}&limit=20&apiKey=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Converter para formato compatível
      const places: PlaceResult[] = (data.features || []).map((feature: any) => ({
        place_id: feature.properties.place_id || '',
        formatted_address: feature.properties.formatted || '',
        geometry: {
          location: {
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0]
          }
        },
        name: feature.properties.name,
        types: feature.properties.categories || []
      }));
      
      return places;
    } catch (error) {
      console.error('❌ Erro na busca de lugares:', error);
      return [];
    }
  }

  /**
   * Autocomplete de endereços
   */
  async getPlaceAutocomplete(input: string, location?: LatLng): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      return data.predictions || [];
    } catch (error) {
      console.error('Erro no autocomplete:', error);
      return [];
    }
  }

  /**
   * Detalhes de um lugar específico
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/place/details/json?place_id=${placeId}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Erro ao obter detalhes do lugar:', error);
      return null;
    }
  }

  /**
   * Calcula ETA (Estimated Time of Arrival) considerando trânsito
   */
  async calculateETA(
    origin: LatLng,
    destination: LatLng,
    departureTime?: Date
  ): Promise<{ duration: number; durationInTraffic?: number } | null> {
    try {
      const directions = await this.getDirections(origin, destination);
      
      if (!directions || !directions.routes.length) {
        return null;
      }

      const route = directions.routes[0];
      const leg = route.legs[0];
      
      return {
        duration: leg.duration.value,
        // Em uma implementação real, você usaria a API com traffic model
        durationInTraffic: leg.duration.value * 1.2 // Estimativa simples
      };
    } catch (error) {
      console.error('Erro ao calcular ETA:', error);
      return null;
    }
  }

  /**
   * Verifica se um ponto está dentro de um polígono (área de entrega)
   */
  isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;
      
      if (((yi > point.lng) !== (yj > point.lng)) &&
          (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Codifica coordenadas em polyline (formato simplificado)
   */
  private encodePolyline(coordinates: number[][]): string {
    // Implementação simplificada de encoding de polyline
    // Para uma implementação completa, use uma biblioteca específica
    return coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
  }

  /**
   * Calcula distância entre dois pontos (Haversine formula)
   */
  calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const mapsService = new MapsService();
export default mapsService;
