'use client';

import React from 'react';
import { MdShoppingCart } from 'react-icons/md';
import { useCartStore } from '@/store/cart.store';

interface CartIconProps {
  className?: string;
  size?: number;
  showBadge?: boolean;
}

export default function CartIcon({ className = '', size = 24, showBadge = true }: CartIconProps) {
  const { getTotalItems, openCart, hasItems } = useCartStore();
  const totalItems = getTotalItems();

  const handleClick = () => {
    openCart();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
      aria-label={`Carrinho com ${totalItems} itens`}
    >
      <MdShoppingCart size={size} className="text-gray-700 transition-transform duration-200" />
      
      {showBadge && hasItems() && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] animate-pulse">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
