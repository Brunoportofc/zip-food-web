'use client';

import { useState, useEffect } from 'react';
import { MdStore, MdStorefront } from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import useRealTimeNotifications from '@/hooks/useRealTimeNotifications';

export default function RestaurantToggle() {
  const { user } = useAuth();
  const { notifyRestaurantStatusChange } = useRealTimeNotifications();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Carregar status atual do restaurante
  useEffect(() => {
    loadRestaurantStatus();
  }, [user?.uid]);

  const loadRestaurantStatus = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch('/api/restaurant/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.restaurantData) {
          setRestaurantId(data.restaurantData.id);
          setIsOpen(data.restaurantData.is_active);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status do restaurante:', error);
    }
  };

  const toggleRestaurantStatus = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/restaurant/toggle-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          is_active: !isOpen
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsOpen(data.is_active);
        toast.success(data.message);
        
        // Notificar mudança de status
        notifyRestaurantStatusChange(data.is_active);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status do restaurante:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status do restaurante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-3 border border-green-500">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">Status da Loja</span>
        <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      
      <button
        onClick={toggleRestaurantStatus}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all duration-200 ${
          isOpen
            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <>
            {isOpen ? (
              <>
                <MdStorefront size={18} />
                <span className="text-sm">Aberto</span>
              </>
            ) : (
              <>
                <MdStore size={18} />
                <span className="text-sm">Fechado</span>
              </>
            )}
          </>
        )}
      </button>
      
      <p className="text-xs text-gray-300 mt-2 text-center">
        {isOpen 
          ? 'Clientes podem fazer pedidos' 
          : 'Loja invisível para clientes'
        }
      </p>
    </div>
  );
}
