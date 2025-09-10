'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MdLocationOn, 
  MdAdd, 
  MdDelete, 
  MdArrowBack, 
  MdCheck,
  MdMap,
  MdInfo,
  MdEdit
} from 'react-icons/md';
import { RestaurantConfigService } from '@/services/restaurant-config.service';
import { DeliveryArea } from '@/types/restaurant-config';
import { AnimatedContainer } from '@/components/ui/animated-container';

interface DeliveryZone {
  id: string;
  name: string;
  neighborhoods: string[];
  deliveryFee: number;
  estimatedTime: { min: number; max: number };
  isActive: boolean;
}

const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: '1',
    name: 'Zona Central',
    neighborhoods: ['Centro', 'Copacabana', 'Ipanema'],
    deliveryFee: 3.50,
    estimatedTime: { min: 20, max: 35 },
    isActive: true
  },
  {
    id: '2',
    name: 'Zona Norte',
    neighborhoods: ['Tijuca', 'Vila Isabel', 'Grajaú'],
    deliveryFee: 5.00,
    estimatedTime: { min: 30, max: 45 },
    isActive: true
  },
  {
    id: '3',
    name: 'Zona Sul',
    neighborhoods: ['Botafogo', 'Flamengo', 'Laranjeiras'],
    deliveryFee: 4.00,
    estimatedTime: { min: 25, max: 40 },
    isActive: true
  }
];

export default function RestaurantDeliveryAreasPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_ZONES);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [maxDeliveryRadius, setMaxDeliveryRadius] = useState<number>(10);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);

  const restaurantService = new RestaurantConfigService();

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const config = await restaurantService.getConfig();
      if (config?.deliveryAreas && config.deliveryAreas.length > 0) {
        setDeliveryAreas(config.deliveryAreas);
        // Convert delivery areas to zones format for easier editing
        const zones = config.deliveryAreas.map((area, index) => ({
          id: (index + 1).toString(),
          name: area.name,
          neighborhoods: area.neighborhoods,
          deliveryFee: area.deliveryFee,
          estimatedTime: area.estimatedTime,
          isActive: area.isActive
        }));
        setDeliveryZones(zones);
      }
      if (config?.maxDeliveryRadius !== undefined) {
        setMaxDeliveryRadius(config.maxDeliveryRadius);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddZone = () => {
    const newZone: DeliveryZone = {
      id: Date.now().toString(),
      name: '',
      neighborhoods: [''],
      deliveryFee: 5.00,
      estimatedTime: { min: 30, max: 45 },
      isActive: true
    };
    setEditingZone(newZone);
    setShowAddForm(true);
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone({ ...zone });
    setShowAddForm(true);
  };

  const handleSaveZone = () => {
    if (!editingZone || !editingZone.name.trim()) {
      alert('Nome da zona é obrigatório.');
      return;
    }

    const validNeighborhoods = editingZone.neighborhoods.filter(n => n.trim());
    if (validNeighborhoods.length === 0) {
      alert('Adicione pelo menos um bairro.');
      return;
    }

    const updatedZone = {
      ...editingZone,
      neighborhoods: validNeighborhoods
    };

    setDeliveryZones(prev => {
      const existingIndex = prev.findIndex(z => z.id === editingZone.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedZone;
        return updated;
      } else {
        return [...prev, updatedZone];
      }
    });

    setEditingZone(null);
    setShowAddForm(false);
  };

  const handleDeleteZone = (zoneId: string) => {
    if (confirm('Tem certeza que deseja excluir esta zona de entrega?')) {
      setDeliveryZones(prev => prev.filter(z => z.id !== zoneId));
    }
  };

  const handleToggleZone = (zoneId: string) => {
    setDeliveryZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, isActive: !zone.isActive } : zone
    ));
  };

  const addNeighborhood = () => {
    if (editingZone) {
      setEditingZone({
        ...editingZone,
        neighborhoods: [...editingZone.neighborhoods, '']
      });
    }
  };

  const updateNeighborhood = (index: number, value: string) => {
    if (editingZone) {
      const updated = [...editingZone.neighborhoods];
      updated[index] = value;
      setEditingZone({
        ...editingZone,
        neighborhoods: updated
      });
    }
  };

  const removeNeighborhood = (index: number) => {
    if (editingZone && editingZone.neighborhoods.length > 1) {
      setEditingZone({
        ...editingZone,
        neighborhoods: editingZone.neighborhoods.filter((_, i) => i !== index)
      });
    }
  };

  const handleSave = async () => {
    if (deliveryZones.length === 0) {
      alert('Configure pelo menos uma zona de entrega.');
      return;
    }

    const activeZones = deliveryZones.filter(zone => zone.isActive);
    if (activeZones.length === 0) {
      alert('Pelo menos uma zona de entrega deve estar ativa.');
      return;
    }

    setIsSaving(true);
    try {
      // Convert zones back to delivery areas format
      const areas: DeliveryArea[] = deliveryZones.map(zone => ({
        name: zone.name,
        neighborhoods: zone.neighborhoods,
        deliveryFee: zone.deliveryFee,
        estimatedTime: zone.estimatedTime,
        isActive: zone.isActive
      }));

      await restaurantService.updateConfig({
        deliveryAreas: areas,
        maxDeliveryRadius
      });
      
      router.push('/restaurant/setup');
    } catch (error) {
      console.error('Erro ao salvar áreas de entrega:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <AnimatedContainer>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <MdLocationOn className="text-2xl text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Áreas de Entrega</h1>
                  <p className="text-gray-600 mt-1">
                    Configure as zonas de entrega e taxas do seu restaurante
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Radius */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Raio de Entrega</h2>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raio máximo de entrega (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxDeliveryRadius}
                    onChange={(e) => setMaxDeliveryRadius(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                  />
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MdMap className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>

            {/* Delivery Zones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Zonas de Entrega</h2>
                <button
                  onClick={handleAddZone}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors"
                >
                  <MdAdd className="text-lg" />
                  <span>Adicionar Zona</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {deliveryZones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`border rounded-lg p-4 transition-all ${
                      zone.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={zone.isActive}
                              onChange={() => handleToggleZone(zone.id)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="font-semibold text-gray-900">{zone.name}</span>
                          </label>
                          {zone.isActive && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Ativa
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Bairros:</span>
                            <p className="text-gray-900 mt-1">
                              {zone.neighborhoods.join(', ')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Taxa:</span>
                            <p className="text-gray-900 mt-1 font-medium">
                              R$ {zone.deliveryFee.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tempo estimado:</span>
                            <p className="text-gray-900 mt-1">
                              {zone.estimatedTime.min}-{zone.estimatedTime.max} min
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditZone(zone)}
                          className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {deliveryZones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MdLocationOn className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>Nenhuma zona de entrega configurada</p>
                    <p className="text-sm">Clique em "Adicionar Zona" para começar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add/Edit Zone Modal */}
            {showAddForm && editingZone && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      {deliveryZones.find(z => z.id === editingZone.id) ? 'Editar' : 'Adicionar'} Zona de Entrega
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da zona *
                        </label>
                        <input
                          type="text"
                          value={editingZone.name}
                          onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                          placeholder="Ex: Zona Central, Zona Norte"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bairros atendidos *
                        </label>
                        <div className="space-y-2">
                          {editingZone.neighborhoods.map((neighborhood, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={neighborhood}
                                onChange={(e) => updateNeighborhood(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                                placeholder="Nome do bairro"
                              />
                              {editingZone.neighborhoods.length > 1 && (
                                <button
                                  onClick={() => removeNeighborhood(index)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <MdDelete className="text-lg" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addNeighborhood}
                            className="flex items-center space-x-2 text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            <MdAdd className="text-lg" />
                            <span>Adicionar bairro</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taxa de entrega (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingZone.deliveryFee}
                            onChange={(e) => setEditingZone({ 
                              ...editingZone, 
                              deliveryFee: parseFloat(e.target.value) || 0 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tempo estimado (minutos)
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="5"
                              max="180"
                              value={editingZone.estimatedTime.min}
                              onChange={(e) => setEditingZone({ 
                                ...editingZone, 
                                estimatedTime: { 
                                  ...editingZone.estimatedTime, 
                                  min: parseInt(e.target.value) || 5 
                                }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                              placeholder="Min"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                              type="number"
                              min="5"
                              max="180"
                              value={editingZone.estimatedTime.max}
                              onChange={(e) => setEditingZone({ 
                                ...editingZone, 
                                estimatedTime: { 
                                  ...editingZone.estimatedTime, 
                                  max: parseInt(e.target.value) || 5 
                                }
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                              placeholder="Max"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setEditingZone(null);
                          setShowAddForm(false);
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveZone}
                        className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors"
                      >
                        <MdCheck className="text-lg" />
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <MdInfo className="text-blue-600 text-xl mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Dica importante:</p>
                  <p>
                    Configure zonas de entrega estratégicas para otimizar seus custos e tempo de entrega. 
                    Considere a distância do seu restaurante e o trânsito da região.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/restaurant/setup/payments')}
                className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <MdArrowBack className="text-lg" />
                <span>Voltar</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <MdCheck className="text-lg" />
                )}
                <span>{isSaving ? 'Salvando...' : 'Finalizar Configuração'}</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}