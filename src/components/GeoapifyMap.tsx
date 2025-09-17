'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { mapsService } from '@/services/maps.service';

interface GeoapifyMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
  }>;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onMarkerClick?: (marker: any) => void;
  showUserLocation?: boolean;
  userLocation?: { lat: number; lng: number };
  route?: Array<{ lat: number; lng: number }>;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    geoapify: any;
  }
}

const GeoapifyMap: React.FC<GeoapifyMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  onMapClick,
  onMarkerClick,
  showUserLocation = false,
  userLocation,
  route = [],
  className = '',
  style = {}
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [routeLayer, setRouteLayer] = useState<any>(null);

  // Carregar Geoapify Maps API
  const loadGeoapifyMaps = useCallback(async () => {
    try {
      await mapsService.loadGeoapifyAPI();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar Geoapify Maps');
    }
  }, []);

  useEffect(() => {
    loadGeoapifyMaps();
  }, [loadGeoapifyMaps]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || !window.geoapify || map) return;

    try {
      setIsLoading(true);

      // Configurações do mapa
      const mapOptions = {
        center: [center.lng, center.lat], // Geoapify usa [lng, lat]
        zoom: zoom,
        style: 'https://maps.geoapify.com/v1/styles/osm-bright/style.json',
        apiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
      };

      // Criar mapa
      const newMap = new window.geoapify.Map(mapRef.current, mapOptions);

      // Adicionar evento de clique
      if (onMapClick) {
        newMap.on('click', (event: any) => {
          const { lng, lat } = event.lngLat;
          onMapClick({ lat, lng });
        });
      }

      setMap(newMap);
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao inicializar mapa:', err);
      setError('Erro ao inicializar mapa');
      setIsLoading(false);
    }
  }, [center, zoom, onMapClick, map]);

  // Atualizar localização do usuário
  useEffect(() => {
    if (!map || !showUserLocation || !userLocation) return;

    // Remover marcador anterior
    if (userMarker) {
      userMarker.remove();
    }

    // Criar novo marcador do usuário
    const marker = new window.geoapify.Marker({
      color: '#3b82f6',
      size: 'medium'
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    setUserMarker(marker);

    // Centralizar mapa na localização do usuário
    map.setCenter([userLocation.lng, userLocation.lat]);
  }, [map, showUserLocation, userLocation, userMarker]);

  // Adicionar marcadores
  useEffect(() => {
    if (!map || markers.length === 0) return;

    markers.forEach((markerData, index) => {
      const marker = new window.geoapify.Marker({
        color: '#ef4444',
        size: 'medium'
      })
        .setLngLat([markerData.position.lng, markerData.position.lat])
        .addTo(map);

      // Adicionar popup se houver título
      if (markerData.title) {
        const popup = new window.geoapify.Popup({ offset: 25 })
          .setText(markerData.title);
        
        marker.setPopup(popup);
      }

      // Adicionar evento de clique
      if (onMarkerClick) {
        marker.getElement().addEventListener('click', () => {
          onMarkerClick(markerData);
        });
      }
    });
  }, [map, markers, onMarkerClick]);

  // Desenhar rota
  useEffect(() => {
    if (!map || route.length === 0) return;

    // Remover rota anterior
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    // Converter coordenadas para formato Geoapify
    const coordinates = route.map(point => [point.lng, point.lat]);

    // Criar linha da rota
    const routeGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      },
      properties: {}
    };

    // Adicionar rota ao mapa
    const newRouteLayer = map.addSource('route', {
      type: 'geojson',
      data: routeGeoJSON
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4
      }
    });

    setRouteLayer(newRouteLayer);

    // Ajustar zoom para mostrar toda a rota
    if (route.length > 1) {
      const bounds = new window.geoapify.LngLatBounds();
      route.forEach(point => {
        bounds.extend([point.lng, point.lat]);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, route, routeLayer]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">❌ {error}</p>
          <button 
            onClick={loadGeoapifyMaps}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={style}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`} 
      style={style}
    />
  );
};

export default GeoapifyMap;