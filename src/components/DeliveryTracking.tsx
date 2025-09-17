'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { MdLocationOn, MdDirectionsBike, MdAccessTime, MdPhone, MdRefresh } from 'react-icons/md';
import GeoapifyMap from './GeoapifyMap';
import { getCurrentPosition } from '@/lib/platform';
import { mapsService, LatLng } from '@/services/maps.service';
import { useGeolocation } from '@/hooks/useGeolocation';

interface DeliveryTrackingProps {
  orderId: string;
  deliveryPersonId?: string;
  restaurantLocation: { lat: number; lng: number; address: string };
  customerLocation: { lat: number; lng: number; address: string };
  onStatusUpdate?: (status: DeliveryStatus) => void;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface DeliveryStatus {
  status: 'preparing' | 'ready' | 'picked_up' | 'on_route' | 'delivered' | 'cancelled';
  estimatedTime: number; // em minutos
  actualETA?: string;
  distance?: string;
  currentLocation?: LatLng;
  deliveryPerson?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    vehicle: 'bike' | 'motorcycle' | 'car';
  };
  route?: LatLng[];
  lastUpdate?: Date;
}

const statusMessages = {
  preparing: 'Preparando seu pedido',
  ready: 'Pedido pronto para retirada',
  picked_up: 'Pedido coletado',
  on_route: 'A caminho da entrega',
  delivered: 'Pedido entregue',
  cancelled: 'Pedido cancelado'
};

const statusColors = {
  preparing: 'bg-yellow-500',
  ready: 'bg-blue-500',
  picked_up: 'bg-purple-500',
  on_route: 'bg-green-500',
  delivered: 'bg-gray-500',
  cancelled: 'bg-red-500'
};

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({
  orderId,
  deliveryPersonId,
  restaurantLocation,
  customerLocation,
  onStatusUpdate,
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 segundos
}) => {
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>({
    status: 'preparing',
    estimatedTime: 30
  });
  const [isTracking, setIsTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { position: userLocation } = useGeolocation();

  // Buscar informações de entrega
  const fetchDeliveryInfo = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      
      // Simulação de API - em produção, fazer chamada real
      await new Promise(resolve => setTimeout(resolve, showRefreshIndicator ? 500 : 1000));
      
      const statuses: DeliveryStatus['status'][] = ['preparing', 'ready', 'picked_up', 'on_route', 'delivered'];
      const currentIndex = Math.min(statuses.indexOf(deliveryStatus.status) + (Math.random() > 0.7 ? 1 : 0), statuses.length - 1);
      
      const newStatus: DeliveryStatus = {
        status: statuses[currentIndex],
        estimatedTime: Math.max(5, 30 - (currentIndex * 7)),
        currentLocation: currentIndex >= 2 ? {
          lat: restaurantLocation.lat + (Math.random() - 0.5) * 0.01,
          lng: restaurantLocation.lng + (Math.random() - 0.5) * 0.01
        } : undefined,
        deliveryPerson: currentIndex >= 2 ? {
          id: deliveryPersonId || 'delivery-001',
          name: 'João Silva',
          phone: '(11) 99999-9999',
          rating: 4.8,
          vehicle: 'motorcycle'
        } : undefined,
        lastUpdate: new Date()
      };

      // Calcular ETA e distância usando o serviço de mapas
      if (newStatus.currentLocation && customerLocation) {
        try {
          const directions = await mapsService.getDirections(
            newStatus.currentLocation,
            customerLocation
          );
          
          if (directions && directions.routes.length > 0) {
            const route = directions.routes[0];
            newStatus.actualETA = route.legs[0].duration.text;
            newStatus.distance = route.legs[0].distance.text;
            // Decodificar polyline usando função personalizada (Geoapify não usa o mesmo formato)
            // Para uma implementação completa, seria necessário usar uma biblioteca de decodificação
            newStatus.route = route.overview_polyline?.points ? 
              this.decodePolyline(route.overview_polyline.points) : 
              [];
          }
        } catch (error) {
          console.error('Erro ao calcular rota:', error);
        }
      }
      
      setDeliveryStatus(newStatus);
      onStatusUpdate?.(newStatus);

      if (newStatus.status === 'delivered') {
        setIsTracking(false);
        toast.success('Pedido entregue com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [deliveryStatus.status, deliveryPersonId, restaurantLocation, customerLocation, onStatusUpdate]);

  // Simular atualizações de status (em produção, isso viria via WebSocket ou polling)
  useEffect(() => {
    if (!isTracking) return;

    const simulateDeliveryProgress = () => {
      trackingInterval.current = setInterval(() => {
        fetchDeliveryInfo(true);
      }, 10000); // Atualizar a cada 10 segundos para demonstração
    };

    simulateDeliveryProgress();

    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, [isTracking, fetchDeliveryInfo]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && deliveryStatus && deliveryStatus.status !== 'delivered' && deliveryStatus.status !== 'cancelled') {
      refreshIntervalRef.current = setInterval(() => {
        fetchDeliveryInfo(true);
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, deliveryStatus, refreshInterval, fetchDeliveryInfo]);

  const startTracking = () => {
    setIsTracking(true);
    toast.success('Acompanhamento iniciado!');
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
    }
  };

  const getMapMarkers = () => {
    const markers = [
      {
        id: 'restaurant',
        position: restaurantLocation,
        title: 'Restaurante',
        icon: '/icons/restaurant-marker.png'
      },
      {
        id: 'customer',
        position: customerLocation,
        title: 'Destino',
        icon: '/icons/home-marker.png'
      }
    ];

    // Adicionar marcador do entregador se disponível
    if (deliveryStatus.currentLocation && deliveryStatus.status !== 'preparing' && deliveryStatus.status !== 'ready') {
      markers.push({
        id: 'delivery',
        position: { ...deliveryStatus.currentLocation, address: 'Localização do entregador' },
        title: 'Entregador',
        icon: '/icons/delivery-marker.png'
      });
    }

    return markers;
  };

  const getDeliveryRoute = () => {
    if (deliveryStatus.status === 'on_route' && deliveryStatus.currentLocation) {
      return [restaurantLocation, deliveryStatus.currentLocation, customerLocation];
    }
    return [];
  };

  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case 'bike': return '🚲';
      case 'motorcycle': return '🏍️';
      case 'car': return '🚗';
      default: return '🛵';
    }
  };

  // Cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'text-yellow-600';
      case 'ready': return 'text-blue-600';
      case 'picked_up': return 'text-purple-600';
      case 'on_route': return 'text-green-600';
      case 'delivered': return 'text-green-700';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header com status */}
      <div className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-semibold">Pedido #{orderId.slice(-6)}</h3>
              <p className="text-primary-light">{statusMessages[deliveryStatus.status]}</p>
            </div>
            <button
              onClick={() => fetchDeliveryInfo(true)}
              disabled={isRefreshing}
              className="text-primary-light hover:text-white disabled:opacity-50"
              title="Atualizar"
            >
              <MdRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {deliveryStatus.actualETA ? deliveryStatus.actualETA : `${deliveryStatus.estimatedTime}min`}
            </div>
            <div className="text-sm text-primary-light">tempo estimado</div>
            {deliveryStatus.distance && (
              <div className="text-xs text-primary-light">{deliveryStatus.distance}</div>
            )}
          </div>
        </div>
        {deliveryStatus.lastUpdate && (
          <div className="mt-2 text-xs text-primary-light">
            Última atualização: {deliveryStatus.lastUpdate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          {Object.keys(statusMessages).map((status, index) => {
            const isActive = Object.keys(statusMessages).indexOf(deliveryStatus.status) >= index;
            const isCurrent = deliveryStatus.status === status;
            
            return (
              <div key={status} className="flex flex-col items-center flex-1">
                <div className={`w-3 h-3 rounded-full mb-1 ${
                  isActive ? statusColors[status as keyof typeof statusColors] : 'bg-gray-300'
                } ${isCurrent ? 'ring-2 ring-offset-2 ring-primary' : ''}`} />
                <span className={`text-xs text-center ${
                  isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {status === 'preparing' ? 'Preparando' :
                   status === 'ready' ? 'Pronto' :
                   status === 'picked_up' ? 'Coletado' :
                   status === 'on_route' ? 'A caminho' : 'Entregue'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-500"
            style={{ 
              width: `${(Object.keys(statusMessages).indexOf(deliveryStatus.status) + 1) / Object.keys(statusMessages).length * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Informações do entregador */}
      {deliveryStatus.deliveryPerson && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {deliveryStatus.deliveryPerson.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{deliveryStatus.deliveryPerson.name}</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{getVehicleIcon(deliveryStatus.deliveryPerson.vehicle)}</span>
                  <span>⭐ {deliveryStatus.deliveryPerson.rating}</span>
                </div>
              </div>
            </div>
            <button 
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              onClick={() => window.open(`tel:${deliveryStatus.deliveryPerson?.phone}`)}
            >
              <MdPhone size={16} />
              <span>Ligar</span>
            </button>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="p-4">
        <GeoapifyMap
          center={deliveryStatus.currentLocation || restaurantLocation}
          zoom={14}
          markers={getMapMarkers()}
          deliveryRoute={getDeliveryRoute()}
          className="w-full h-64"
          showCurrentLocation={false}
          onLocationUpdate={(position) => {
            // Atualizar localização do usuário se necessário
          }}
        />
      </div>

      {/* Endereços */}
      <div className="p-4 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MdLocationOn className="text-red-500 mt-1" size={20} />
            <div>
              <p className="font-medium text-gray-900">Restaurante</p>
              <p className="text-sm text-gray-600">{restaurantLocation.address}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MdLocationOn className="text-green-500 mt-1" size={20} />
            <div>
              <p className="font-medium text-gray-900">Destino</p>
              <p className="text-sm text-gray-600">{customerLocation.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              Iniciar Acompanhamento
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Parar Acompanhamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;