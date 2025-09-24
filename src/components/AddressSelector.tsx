'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdLocationOn, MdMyLocation, MdSearch, MdClose } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { getCurrentPosition } from '@/lib/platform';
import GeoapifyMap from './GeoapifyMap';
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

  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const { position: currentLocation, getCurrentPosition: getGeoPosition, loading: locationLoading } = useGeolocation();

  // Refs para serviços do Geoapify
  const [geoapifyLoaded, setGeoapifyLoaded] = useState(false);

  // Verificar se Geoapify está carregado
  const checkGeoapify = useCallback(() => {
    if (window.geoapify) {
      setGeoapifyLoaded(true);
    } else {
      setTimeout(checkGeoapify, 100);
    }
  }, []);

  useEffect(() => {
    checkGeoapify();
  }, [checkGeoapify]);

  // Buscar sugestões de endereços usando Geoapify
  const searchAddresses = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Usar Geoapify Autocomplete API
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === 'SUA_CHAVE_GEOAPIFY_AQUI') {
        console.warn('Geoapify API key não configurada');
        setSuggestions([]);
        return;
      }

      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&format=json&limit=5&filter=countrycode:br`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        const addressSuggestions: Address[] = data.results.map((result: any) => ({
          id: result.place_id || Math.random().toString(),
          street: result.street || '',
          number: result.housenumber || '',
          neighborhood: result.suburb || result.district || '',
          city: result.city || result.town || '',
          state: result.state || '',
          zipCode: result.postcode || '',
          coordinates: {
            lat: result.lat,
            lng: result.lon
          },
          formattedAddress: result.formatted
        }));
        
        setSuggestions(addressSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setError('Erro ao buscar endereços');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função removida - não é mais necessária com Geoapify
  // A API do Geoapify já retorna todos os detalhes necessários

  // Obter localização atual
  const getCurrentLocationAddress = useCallback(async () => {
    if (!allowCurrentLocation || !geoapifyLoaded) {
      toast.error('Localização não disponível');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Usar Geoapify Reverse Geocoding
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === 'SUA_CHAVE_GEOAPIFY_AQUI') {
        console.warn('Geoapify API key não configurada');
        toast.error('Serviço de localização não configurado');
        setIsLoading(false);
        return;
      }

      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${apiKey}&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const address: Address = {
          id: result.place_id || Math.random().toString(),
          street: result.street || '',
          number: result.housenumber || '',
          neighborhood: result.suburb || result.district || '',
          city: result.city || result.town || '',
          state: result.state || '',
          zipCode: result.postcode || '',
          coordinates: { lat, lng },
          formattedAddress: result.formatted || `${result.street || ''} ${result.housenumber || ''}, ${result.city || ''}`
        };
        
        selectAddress(address);
        toast.success('Localização obtida com sucesso!');
      } else {
        setError('Não foi possível obter o endereço da localização atual');
        toast.error('Não foi possível obter o endereço da localização atual');
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setError('Erro ao obter localização atual');
      toast.error('Erro ao obter localização atual');
    } finally {
      setIsLoading(false);
    }
  }, [allowCurrentLocation, geoapifyLoaded]);

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
    if (!geoapifyLoaded) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Usar Geoapify Reverse Geocoding
      const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === 'SUA_CHAVE_GEOAPIFY_AQUI') {
        console.warn('Geoapify API key não configurada');
        setIsLoading(false);
        return;
      }

      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${position.lat}&lon=${position.lng}&apiKey=${apiKey}&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const address: Address = {
          id: result.place_id || Math.random().toString(),
          street: result.street || '',
          number: result.housenumber || '',
          neighborhood: result.suburb || result.district || '',
          city: result.city || result.town || '',
          state: result.state || '',
          zipCode: result.postcode || '',
          coordinates: position,
          formattedAddress: result.formatted || `${result.street || ''} ${result.housenumber || ''}, ${result.city || ''}`
        };
        
        selectAddress(address);
      } else {
        setError('Não foi possível obter o endereço desta localização');
        toast.error('Não foi possível obter o endereço desta localização');
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      setError('Não foi possível obter o endereço desta localização');
      toast.error('Não foi possível obter o endereço desta localização');
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading || !geoapifyLoaded || locationLoading}
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
          <GeoapifyMap
            center={selectedAddress.coordinates}
            zoom={16}
            markers={[
              {
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