'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { MdPerson, MdShoppingCart, MdFavorite, MdLocationOn } from 'react-icons/md';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { t } = useTranslation();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-red-500">Zip Food</h1>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    href="/customer"
                    className="text-black hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('customer.layout.home')}
                  </Link>
                  <Link
                    href="/customer/orders"
                    className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <MdShoppingCart className="mr-1" size={18} />
                    {t('customer.layout.orders')}
                  </Link>
                  <Link
                    href="/customer/favorites"
                    className="text-gray-600 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <MdFavorite className="mr-1" size={18} />
                    {t('customer.layout.favorites')}
                  </Link>
                </div>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <MdPerson size={24} />
                  <span className="hidden md:block text-sm font-medium">{t('customer.layout.my_account')}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      href="/customer/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <MdPerson className="inline mr-2" size={16} />
                      {t('customer.layout.my_profile')}
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-4 py-2">
                      <LogoutButton />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}