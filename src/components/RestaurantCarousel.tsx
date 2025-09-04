'use client';

import { useState, useRef, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdStar, MdAccessTime } from 'react-icons/md';

interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  category: string;
  isPromoted?: boolean;
}

interface RestaurantCarouselProps {
  restaurants: Restaurant[];
  title: string;
}

export default function RestaurantCarousel({ restaurants, title }: RestaurantCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 768) {
        setItemsPerView(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, restaurants.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-black">{title}</h2>
        <button className="text-sm text-red-500 font-medium">Ver mais</button>
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-300 ease-in-out -mx-2"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <div className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
                <div className="relative">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  {restaurant.isPromoted && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-sm text-xs font-medium">
                      Promoção
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white rounded-sm px-1 py-0.5 shadow-sm">
                    <div className="flex items-center">
                      <MdStar className="text-yellow-400" size={12} />
                      <span className="text-xs font-medium text-gray-800 ml-0.5">
                        {restaurant.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="font-medium text-base text-black truncate">
                    {restaurant.name}
                  </h3>
                  <p className="text-gray-500 text-xs mb-1.5">{restaurant.category}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-500">
                      <MdAccessTime size={14} className="mr-0.5" />
                      <span>{restaurant.deliveryTime}</span>
                    </div>
                    <div className="text-red-500 font-medium">
                      {restaurant.deliveryFee === 0 ? 'Grátis' : `R$ ${restaurant.deliveryFee.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md z-10"
          >
            <MdChevronLeft size={20} className="text-gray-600" />
          </button>
        )}
        
        {currentIndex < maxIndex && (
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md z-10"
          >
            <MdChevronRight size={20} className="text-gray-600" />
          </button>
        )}
      </div>

      {/* Dots indicator */}
      {restaurants.length > itemsPerView && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-red-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}