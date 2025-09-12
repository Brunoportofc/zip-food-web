'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdLocationOn, MdMyLocation, MdSearch, MdClose } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getCurrentPosition } from '@/lib/platform';
import GoogleMap from './GoogleMap';
import { useGeolocation } from '@/hooks/useGeolocation';
import { mapsService, LatLng } from '@/services/maps.service';

interface Address {
  id?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: { lat: number; lng: number };
  formattedAddress: string;
}

interface AddressSelectorProps {
  onAddressSelect: (address: Address, coordinates?: LatLng) => void;
  initialAddress?: Address;
  placeholder?: string;
  className?: string;
  showMap?: boolean;
  allowCurrentLocation?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressSelect,
  initialAddress,
  placeholder = 'Digite seu endereço...',
  className = '',
  showMap = true,
  allowCurrentLocation = true
}) => {
  const [searchQuery, setSearchQuery] = useState(initialAddress?.formattedAddress || '');
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialAddress || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const { position: currentLocation, getCurrentPosition: getGeoPosition, loading: locationLoading } = useGeolocation();

  // Verificar se Google Maps está carregado
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleLoaded(true);
        autocompleteService.current = new google.maps.places.AutocompleteService();
        geocoder.current = new google.maps.Geocoder();
        
        // Criar um div temporário para o PlacesService
        const tempDiv = document.createElement('div');
        const tempMap = new google.maps.Map(tempDiv);
        placesService.current = new google.maps.places.PlacesService(tempMap);
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };
    
    checkGoogleMaps();
  }, []);

  // Buscar sugestões de endereços
  const searchAddresses = useCallback(async (query: string) => {
    if (!isGoogleLoaded || !autocompleteService.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'br' },
        types: ['address']
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const addressPromises = predictions.slice(0, 5).map(prediction => 
            getAddressDetails(prediction.place_id!)
          );
          
          Promise.all(addressPromises)
            .then(addresses => {
              setSuggestions(addresses.filter(addr => addr !== null) as Address[]);
              setShowSuggestions(true);
            })
            .catch(error => {
              console.error('Erro ao buscar detalhes dos endereços:', error);
              setError('Erro ao buscar endereços');
              setSuggestions([]);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          setSuggestions([]);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Erro na busca de endereços:', error);
      setError('Erro ao buscar endereços');
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [isGoogleLoaded]);

  // Obter detalhes do endereço pelo place_id
  const getAddressDetails = (placeId: string): Promise<Address | null> => {
    return new Promise((resolve) => {
      if (!placesService.current) {
        resolve(null);
        return;
      }

      placesService.current.getDetails(
        {
          placeId,
          fields: ['address_components', 'formatted_address', 'geometry']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const address = parseGoogleAddress(place);
            resolve(address);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // Converter resposta do Google em formato de endereço
  const parseGoogleAddress = (place: google.maps.places.PlaceResult): Address | null => {
    if (!place.address_components || !place.geometry?.location) {
      return null;
    }

    const components = place.address_components;
    let street = '';
    let number = '';
    let neighborhood = '';
    let city = '';
    let state = '';
    let zipCode = '';

    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('route')) {
        street = component.long_name;
      } else if (types.includes('street_number')) {
        number = component.long_name;
      } else if (types.includes('sublocality') || types.includes('neighborhood')) {
        neighborhood = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    });

    return {
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      formattedAddress: place.formatted_address || ''
    };
  };

  // Obter localização atual
  const getCurrentLocationAddress = useCallback(async () => {
    if (!allowCurrentLocation || !isGoogleLoaded || !geocoder.current) {
      toast.error('Localização não disponível');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentPosition();
      const latLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      geocoder.current.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const address = parseGoogleAddress(results[0]);
          if (address) {
            setSelectedAddress(address);
            setSearchQuery(address.formattedAddress);
            onAddressSelect(address, address.coordinates);
            toast.success('Localização obtida com sucesso!');
          }
        } else {
          setError('Não foi possível obter o endereço da localização atual');
          toast.error('Não foi possível obter o endereço da localização atual');
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setError('Erro ao obter localização atual');
      toast.error('Erro ao obter localização atual');
      setIsLoading(false);
    }
  }, [allowCurrentLocation, isGoogleLoaded, onAddressSelect]);

  // Selecionar endereço
  const selectAddress = (address: Address) => {
    setSelectedAddress(address);
    setSearchQuery(address.formattedAddress);
    setShowSuggestions(false);
    setError(null);
    onAddressSelect(address, address.coordinates);
  };

  // Selecionar posição no mapa
  const handleMapClick = async (position: { lat: number; lng: number }) => {
    if (!isGoogleLoaded || !geocoder.current) return;

    setIsLoading(true);
    setError(null);
    
    geocoder.current.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = parseGoogleAddress(results[0]);
        if (address) {
          selectAddress(address);
        }
      } else {
        setError('Não foi possível obter o endereço desta localização');
        toast.error('Não foi possível obter o endereço desta localização');
      }
      setIsLoading(false);
    });
  };

  // Debounce para busca
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (searchQuery && searchQuery !== selectedAddress?.formattedAddress) {
        searchAddresses(searchQuery);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, selectedAddress, searchAddresses]);

  return (
    <div className={`relative ${className}`}>
      {/* Campo de busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MdSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        
        {/* Botão de localização atual */}
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={getCurrentLocationAddress}
            disabled={isLoading || !isGoogleLoaded || locationLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary disabled:opacity-50"
          >
            <MdMyLocation className={`h-5 w-5 ${locationLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            <span className="text-sm text-gray-600">Buscando...</span>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 z-50">
          <MdClose className="text-red-500 flex-shrink-0" size={16} />
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <MdClose size={16} />
          </button>
        </div>
      )}

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((address, index) => (
            <button
              key={index}
              onClick={() => selectAddress(address)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-start space-x-3">
                <MdLocationOn className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {address.street} {address.number}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mapa */}
      {showMap && selectedAddress && (
        <div className="mt-4">
          <GoogleMap
            center={selectedAddress.coordinates}
            zoom={16}
            markers={[
              {
                id: 'selected',
                position: selectedAddress.coordinates,
                title: 'Endereço selecionado'
              }
            ]}
            onMapClick={handleMapClick}
            className="w-full h-48"
          />
        </div>
      )}

      {/* Endereço selecionado */}
      {selectedAddress && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <MdLocationOn className="text-primary mt-1 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {selectedAddress.street} {selectedAddress.number}
              </p>
              <p className="text-sm text-gray-600">
                {selectedAddress.neighborhood}, {selectedAddress.city} - {selectedAddress.state}
              </p>
              {selectedAddress.zipCode && (
                <p className="text-sm text-gray-500">CEP: {selectedAddress.zipCode}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clique fora para fechar sugestões */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default AddressSelector;
export type { Address };