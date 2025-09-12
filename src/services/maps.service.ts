'use client';

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

class MapsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key não encontrada');
    }
  }

  /**
   * Carrega a API do Google Maps dinamicamente
   */
  async loadGoogleMapsAPI(): Promise<typeof google> {
    if (typeof window !== 'undefined' && window.google) {
      return window.google;
    }

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Maps só pode ser carregado no cliente'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google) {
          resolve(window.google);
        } else {
          reject(new Error('Falha ao carregar Google Maps API'));
        }
      };

      script.onerror = () => {
        reject(new Error('Erro ao carregar Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Geocoding: Converte endereço em coordenadas
   */
  async geocodeAddress(address: string): Promise<LatLng | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );
      
      const data: GeocodeResult = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
      
      return null;
    } catch (error) {
      console.error('Erro no geocoding:', error);
      return null;
    }
  }

  /**
   * Reverse Geocoding: Converte coordenadas em endereço
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );
      
      const data: GeocodeResult = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return null;
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Calcula rota entre dois pontos
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

      const response = await fetch(
        `${this.baseUrl}/directions/json?origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destinationStr)}&mode=${travelMode.toLowerCase()}&key=${this.apiKey}`
      );
      
      const data: DirectionsResult = await response.json();
      
      return data;
    } catch (error) {
      console.error('Erro ao obter direções:', error);
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
   * Busca lugares próximos
   */
  async searchNearbyPlaces(
    location: LatLng,
    radius: number = 1000,
    type?: string
  ): Promise<PlaceResult[]> {
    try {
      let url = `${this.baseUrl}/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&key=${this.apiKey}`;
      
      if (type) {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      return data.results || [];
    } catch (error) {
      console.error('Erro na busca de lugares:', error);
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