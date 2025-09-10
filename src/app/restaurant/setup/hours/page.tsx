'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdAccessTime, MdAdd, MdDelete, MdArrowBack, MdArrowForward } from 'react-icons/md';
import { RestaurantConfigService } from '@/services/restaurant-config.service';
import { OperatingHours, DaySchedule } from '@/types/restaurant-config';
import { AnimatedContainer } from '@/components/ui/animated-container';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
] as const;

const TIME_SLOTS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

export default function RestaurantHoursPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    monday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
    tuesday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
    wednesday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
    thursday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
    friday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
    saturday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] },
    sunday: { isOpen: true, periods: [{ start: '08:00', end: '22:00' }] }
  });
  const [specialHours, setSpecialHours] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState({ min: 30, max: 45 });
  const [preparationTime, setPreparationTime] = useState({ min: 15, max: 25 });

  const restaurantService = new RestaurantConfigService();

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const config = await restaurantService.getConfig();
      if (config?.operatingHours) {
        setOperatingHours(config.operatingHours);
      }
      if (config?.specialHours) {
        setSpecialHours(config.specialHours);
      }
      if (config?.deliveryTime) {
        setDeliveryTime(config.deliveryTime);
      }
      if (config?.preparationTime) {
        setPreparationTime(config.preparationTime);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayToggle = (day: keyof OperatingHours) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen
      }
    }));
  };

  const handlePeriodChange = (day: keyof OperatingHours, periodIndex: number, field: 'start' | 'end', value: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        periods: prev[day].periods.map((period, index) => 
          index === periodIndex ? { ...period, [field]: value } : period
        )
      }
    }));
  };

  const addPeriod = (day: keyof OperatingHours) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        periods: [...prev[day].periods, { start: '08:00', end: '22:00' }]
      }
    }));
  };

  const removePeriod = (day: keyof OperatingHours, periodIndex: number) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        periods: prev[day].periods.filter((_, index) => index !== periodIndex)
      }
    }));
  };

  const copyToAllDays = (sourceDay: keyof OperatingHours) => {
    const sourceSchedule = operatingHours[sourceDay];
    const newHours = { ...operatingHours };
    
    DAYS_OF_WEEK.forEach(({ key }) => {
      if (key !== sourceDay) {
        newHours[key as keyof OperatingHours] = {
          isOpen: sourceSchedule.isOpen,
          periods: sourceSchedule.periods.map(period => ({ ...period }))
        };
      }
    });
    
    setOperatingHours(newHours);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await restaurantService.updateConfig({
        operatingHours,
        specialHours,
        deliveryTime,
        preparationTime
      });
      
      router.push('/restaurant/setup/payments');
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      alert('Erro ao salvar horários. Tente novamente.');
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
                  <MdAccessTime className="text-2xl text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Horários de Funcionamento</h1>
                  <p className="text-gray-600 mt-1">
                    Configure os horários de funcionamento do seu restaurante
                  </p>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Horários por Dia da Semana</h2>
              
              <div className="space-y-6">
                {DAYS_OF_WEEK.map(({ key, label }) => {
                  const daySchedule = operatingHours[key as keyof OperatingHours];
                  
                  return (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={daySchedule.isOpen}
                              onChange={() => handleDayToggle(key as keyof OperatingHours)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="font-medium text-gray-900">{label}</span>
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToAllDays(key as keyof OperatingHours)}
                            className="text-sm text-primary hover:text-primary/80 font-medium"
                          >
                            Copiar para todos
                          </button>
                        </div>
                      </div>
                      
                      {daySchedule.isOpen && (
                        <div className="space-y-3">
                          {daySchedule.periods.map((period, periodIndex) => (
                            <div key={periodIndex} className="flex items-center space-x-3">
                              <select
                                value={period.start}
                                onChange={(e) => handlePeriodChange(key as keyof OperatingHours, periodIndex, 'start', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                              >
                                {TIME_SLOTS.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                              
                              <span className="text-gray-500">às</span>
                              
                              <select
                                value={period.end}
                                onChange={(e) => handlePeriodChange(key as keyof OperatingHours, periodIndex, 'end', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                              >
                                {TIME_SLOTS.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                              
                              {daySchedule.periods.length > 1 && (
                                <button
                                  onClick={() => removePeriod(key as keyof OperatingHours, periodIndex)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <MdDelete className="text-lg" />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <button
                            onClick={() => addPeriod(key as keyof OperatingHours)}
                            className="flex items-center space-x-2 text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            <MdAdd className="text-lg" />
                            <span>Adicionar período</span>
                          </button>
                        </div>
                      )}
                      
                      {!daySchedule.isOpen && (
                        <p className="text-gray-500 text-sm">Fechado</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery and Preparation Times */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tempos de Operação</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Preparo (minutos)
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={preparationTime.min}
                        onChange={(e) => setPreparationTime(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={preparationTime.max}
                        onChange={(e) => setPreparationTime(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Entrega (minutos)
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                      <input
                        type="number"
                        min="10"
                        max="180"
                        value={deliveryTime.min}
                        onChange={(e) => setDeliveryTime(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                      <input
                        type="number"
                        min="10"
                        max="180"
                        value={deliveryTime.max}
                        onChange={(e) => setDeliveryTime(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Observações Especiais</h2>
              <textarea
                value={specialHours}
                onChange={(e) => setSpecialHours(e.target.value)}
                placeholder="Ex: Fechado em feriados nacionais, horário especial no Natal, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-black"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/restaurant/setup/basic-info')}
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
                  <MdArrowForward className="text-lg" />
                )}
                <span>{isSaving ? 'Salvando...' : 'Continuar'}</span>
              </button>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}