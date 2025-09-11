'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Clock, MapPin } from 'lucide-react';
import { Restaurant, RestaurantCategory, categoryDisplayNames, slugToCategory, formatPrice } from '@/types/restaurant';
import restaurantService from '@/services/restaurant.service';



export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const categorySlug = params.type as string;
  const category = slugToCategory[categorySlug];
  const categoryName = category ? categoryDisplayNames[category] : categorySlug;

  useEffect(() => {
    const loadRestaurants = async () => {
      if (!category) {
        setError('Categoria não encontrada');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await restaurantService.getRestaurantsByCategory(category);
        setRestaurants(data);
      } catch (err) {
        console.error('Erro ao carregar restaurantes:', err);
        setError('Erro ao carregar restaurantes');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [category]);

  const handleRestaurantClick = (restaurantId: string) => {
    router.push(`/customer/restaurant/${restaurantId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 mb-4">
                <div className="h-32 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {categoryName}
              </h1>
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <MapPin className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro ao carregar
            </h3>
            <p className="text-gray-500 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {categoryName}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MapPin className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum restaurante encontrado
            </h3>
            <p className="text-gray-500">
              Não encontramos restaurantes de {categoryName} na sua região.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              {restaurants.length} restaurante{restaurants.length !== 1 ? 's' : ''} de {categoryName} encontrado{restaurants.length !== 1 ? 's' : ''}
            </p>
            
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant.id)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-200 relative">
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {restaurant.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{restaurant.rating}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{restaurant.estimatedDeliveryTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{restaurant.address}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {categoryDisplayNames[restaurant.category]}
                    </span>
                    {restaurant.deliveryFee > 0 && (
                      <span className="text-xs text-gray-500">
                        Entrega: {formatPrice(restaurant.deliveryFee)}
                      </span>
                    )}
                    {restaurant.deliveryFee === 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        Entrega grátis
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}