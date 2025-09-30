'use client';

import Link from 'next/link';
import { RestaurantCategory, categoryDisplayNames } from '@/types/restaurant';
import { getCategoryIcon } from '@/constants';

interface CategoryShowcaseProps {
  categories: RestaurantCategory[];
  restaurantsByCategory: Record<RestaurantCategory, any[]>;
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'horizontal';
  showCount?: boolean;
  maxItems?: number;
  className?: string;
}

export default function CategoryShowcase({
  categories,
  restaurantsByCategory,
  title = 'Categorias',
  subtitle,
  layout = 'grid',
  showCount = true,
  maxItems,
  className = ''
}: CategoryShowcaseProps) {
  const displayCategories = maxItems ? categories.slice(0, maxItems) : categories;

  // Cores específicas para cada categoria
  const getCategoryColors = (category: RestaurantCategory) => {
    const colorMap = {
      italian: 'from-red-50 to-red-100 border-red-200 hover:border-red-300 text-red-600 hover:shadow-red-100',
      chinese: 'from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-300 text-yellow-600 hover:shadow-yellow-100',
      japanese: 'from-pink-50 to-pink-100 border-pink-200 hover:border-pink-300 text-pink-600 hover:shadow-pink-100',
      indian: 'from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300 text-orange-600 hover:shadow-orange-100',
      mexican: 'from-green-50 to-green-100 border-green-200 hover:border-green-300 text-green-600 hover:shadow-green-100',
      american: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300 text-blue-600 hover:shadow-blue-100',
      mediterranean: 'from-teal-50 to-teal-100 border-teal-200 hover:border-teal-300 text-teal-600 hover:shadow-teal-100',
      thai: 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300 text-purple-600 hover:shadow-purple-100',
      french: 'from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:shadow-indigo-100',
      middle_eastern: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-300 text-amber-600 hover:shadow-amber-100',
      fast_food: 'from-red-50 to-red-100 border-red-200 hover:border-red-300 text-red-600 hover:shadow-red-100',
      other: 'from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-gray-100'
    };
    return colorMap[category] || colorMap.other;
  };

  const CategoryCard = ({ category }: { category: RestaurantCategory }) => {
    const restaurantCount = restaurantsByCategory[category]?.length || 0;
    const colors = getCategoryColors(category);

    return (
      <Link 
        href={`/customer/category/${category}`}
        className="group block transform transition-all duration-300 hover:scale-105"
      >
        <div className={`bg-gradient-to-br ${colors} rounded-2xl p-4 md:p-6 border-2 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 ${
          layout === 'horizontal' ? 'min-w-[140px] flex-shrink-0' : 'min-h-[140px]'
        } flex flex-col justify-center`}>
          <div className="text-center">
            <div className="text-3xl md:text-4xl mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">
              {getCategoryIcon(category)}
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base group-hover:text-primary-700 transition-colors duration-300 leading-tight">
              {categoryDisplayNames[category]}
            </h3>
            {showCount && (
              <p className="text-xs md:text-sm text-gray-600 font-medium">
                {restaurantCount} {restaurantCount === 1 ? 'opção' : 'opções'}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>

      {/* Categories */}
      {layout === 'horizontal' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {displayCategories.map((category) => (
            <CategoryCard key={category} category={category} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {displayCategories.map((category) => (
            <CategoryCard key={category} category={category} />
          ))}
        </div>
      )}

      {/* Show more indicator */}
      {maxItems && categories.length > maxItems && (
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            E mais {categories.length - maxItems} categoria{categories.length - maxItems !== 1 ? 's' : ''} disponível{categories.length - maxItems !== 1 ? 'is' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
