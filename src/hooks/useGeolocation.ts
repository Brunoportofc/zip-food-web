'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  getCurrentPosition: () => Promise<GeolocationPosition>;
  watchPosition: () => number | null;
  clearWatch: (watchId: number) => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const errorMessages = {
      1: 'Permissão de localização negada',
      2: 'Posição indisponível',
      3: 'Timeout na obtenção da localização'
    };

    setError({
      code: err.code,
      message: errorMessages[err.code as keyof typeof errorMessages] || 'Erro desconhecido'
    });
    setPosition(null);
    setLoading(false);
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = {
          code: 0,
          message: 'Geolocalização não suportada pelo navegador'
        };
        setError(error);
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);

      // Configurações otimizadas para maior precisão
      const options: PositionOptions = {
        enableHighAccuracy: true, // Usar GPS quando disponível
        timeout: 15000, // Aumentar timeout para 15 segundos
        maximumAge: 60000 // Cache por 1 minuto para evitar múltiplas solicitações
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          handleSuccess(pos);
          resolve(position);
        },
        (err) => {
          handleError(err);
          reject({
            code: err.code,
            message: err.message
          });
        },
        options
      );
    });
  }, [handleSuccess, handleError]);

  const watchPosition = useCallback((): number | null => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocalização não suportada pelo navegador'
      });
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minuto
      }
    );

    return watchId;
  }, [handleSuccess, handleError]);

  const clearWatch = useCallback((watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    clearWatch
  };
};

export default useGeolocation;
