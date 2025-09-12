'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MdMyLocation, MdError } from 'react-icons/md';
import { useGeolocation, GeolocationPosition } from '@/hooks/useGeolocation';
import { mapsService, LatLng } from '@/services/maps.service';

interface GoogleMapProps {
  center?: LatLng;
  zoom?: number;
  markers?: Array<{
    id: string;
    position: LatLng;
    title?: string;
    icon?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (position: LatLng) => void;
  showCurrentLocation?: boolean;
  deliveryRoute?: LatLng[];
  className?: string;
  onLocationUpdate?: (position: LatLng) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = { lat: -23.5505, lng: -46.6333 }, // São Paulo como padrão
  zoom = 13,
  markers = [],
  onMapClick,
  showCurrentLocation = true,
  deliveryRoute = [],
  className = 'w-full h-96',
  onLocationUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  
  const { position: currentLocation, getCurrentPosition, loading: locationLoading } = useGeolocation();

  // Carregar Google Maps API
  const loadGoogleMaps = useCallback(async () => {
    try {
      await mapsService.loadGoogleMapsAPI();
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar Google Maps');
    }
  }, []);

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  // Obter localização atual
  const handleGetCurrentLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      if (map && position) {
        map.setCenter(position);
        map.setZoom(15);
        onLocationUpdate?.(position);
      }
    } catch (err) {
      setError('Erro ao obter localização');
    }
  }, [map, getCurrentPosition, onLocationUpdate]);

  // Inicializar mapa
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      const mapOptions: google.maps.MapOptions = {
        center: currentLocation || center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      const newMap = new google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);

      // Adicionar listener de clique
      if (onMapClick) {
        newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            onMapClick({
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            });
          }
        });
      }

    } catch (err) {
      setError('Erro ao inicializar mapa');
    }
  }, [isLoaded, center, zoom, onMapClick, currentLocation]);

  // Atualizar marcador do usuário
  useEffect(() => {
    if (!map || !showCurrentLocation) return;

    if (userMarker) {
      userMarker.setMap(null);
    }

    if (currentLocation) {
      const newUserMarker = new google.maps.Marker({
        position: currentLocation,
        map: map,
        title: 'Sua localização',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });
      setUserMarker(newUserMarker);
    }
  }, [map, currentLocation, showCurrentLocation]);

  // Atualizar marcadores
  useEffect(() => {
    if (!map) return;

    // Limpar marcadores existentes (exceto o do usuário)
    // Aqui você pode implementar a lógica para gerenciar marcadores
    // Por simplicidade, vamos apenas criar novos marcadores
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: map,
        title: markerData.title,
        icon: markerData.icon ? {
          url: markerData.icon,
          scaledSize: new google.maps.Size(40, 40)
        } : undefined
      });

      if (markerData.onClick) {
        marker.addListener('click', markerData.onClick);
      }
    });
  }, [map, markers]);

  // Renderizar rota de entrega
  useEffect(() => {
    if (!map || deliveryRoute.length < 2) return;

    // Limpar rota anterior
    if (routePolyline) {
      routePolyline.setMap(null);
    }

    // Criar nova polyline para a rota
    const newPolyline = new google.maps.Polyline({
      path: deliveryRoute,
      geodesic: true,
      strokeColor: '#FF6B6B',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });

    newPolyline.setMap(map);
    setRoutePolyline(newPolyline);

    // Ajustar bounds para mostrar toda a rota
    const bounds = new google.maps.LatLngBounds();
    deliveryRoute.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);
  }, [map, deliveryRoute]);

  if (error) {
    return (
      <div className={`${className} bg-red-50 rounded-lg flex items-center justify-center border border-red-200`}>
        <div className="text-center">
          <MdError size={32} className="text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden border border-gray-200 relative`}>
      <div ref={mapRef} className="w-full h-full" />
      {showCurrentLocation && (
        <button
          onClick={handleGetCurrentLocation}
          disabled={locationLoading}
          className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors z-10 disabled:opacity-50"
          title="Minha localização"
        >
          <MdMyLocation size={20} className={`${locationLoading ? 'animate-spin text-blue-500' : 'text-gray-600'}`} />
        </button>
      )}
    </div>
  );
};

export default GoogleMap;