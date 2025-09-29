import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface GeoapifyFeature {
  properties: {
    formatted: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    county?: string;
    state: string;
    postcode: string;
    country: string;
    street?: string;
    housenumber?: string;
    suburb?: string;
    district?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface GeoapifyResponse {
  features: GeoapifyFeature[];
}

interface ParsedAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  zipCode: string;
}

export const useGeoapifyAddress = () => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<GeoapifyFeature[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  // Obter localização atual do usuário
  const getCurrentLocation = useCallback(async (): Promise<ParsedAddress | null> => {
    if (!apiKey) {
      toast.error('Chave da API Geoapify não configurada');
      return null;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada pelo seu navegador');
      return null;
    }

    setIsLoadingLocation(true);

    try {
      // Obter coordenadas do usuário
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        });
      });

      const { latitude, longitude } = position.coords;

      // Fazer reverse geocoding com Geoapify
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${apiKey}&format=json`
      );

      if (!response.ok) {
        throw new Error('Erro ao obter endereço da localização');
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error('Nenhum endereço encontrado para sua localização');
      }

      const result = data.results[0];
      
      // Parsear dados do Geoapify para o formato do app
      const parsedAddress: ParsedAddress = {
        street: result.street || result.road || '',
        number: result.housenumber || '',
        complement: '',
        neighborhood: result.suburb || result.district || result.neighbourhood || '',
        city: result.city || result.town || result.village || '',
        zipCode: result.postcode || ''
      };

      toast.success('Localização detectada com sucesso!');
      return parsedAddress;

    } catch (error) {
      console.error('Erro ao obter localização:', error);
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permissão de localização negada. Permita o acesso à localização e tente novamente.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Localização indisponível. Verifique se o GPS está ativado.');
            break;
          case error.TIMEOUT:
            toast.error('Tempo limite para obter localização. Tente novamente.');
            break;
          default:
            toast.error('Erro ao obter localização.');
            break;
        }
      } else {
        toast.error('Erro ao buscar endereço da sua localização');
      }
      
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [apiKey]);

  // Buscar sugestões de endereço
  const searchAddresses = useCallback(async (query: string): Promise<void> => {
    if (!apiKey) {
      toast.error('Chave da API Geoapify não configurada');
      return;
    }

    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&limit=5&filter=countrycode:il&format=geojson`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar sugestões de endereço');
      }

      const data: GeoapifyResponse = await response.json();
      setAddressSuggestions(data.features || []);

    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      toast.error('Erro ao buscar sugestões de endereço');
      setAddressSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [apiKey]);

  // Parsear feature selecionada para o formato do app
  const parseSelectedAddress = useCallback((feature: GeoapifyFeature): ParsedAddress => {
    const props = feature.properties;
    
    return {
      street: props.street || props.address_line1?.split(',')[0] || '',
      number: props.housenumber || '',
      complement: '',
      neighborhood: props.suburb || props.district || props.county || '',
      city: props.city || '',
      zipCode: props.postcode || ''
    };
  }, []);

  return {
    getCurrentLocation,
    searchAddresses,
    parseSelectedAddress,
    addressSuggestions,
    isLoadingLocation,
    isLoadingSuggestions,
    clearSuggestions: () => setAddressSuggestions([])
  };
};
