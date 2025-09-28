'use client';

import { RestaurantProtectedRoute } from '@/components/auth/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import AnimatedContainer from '@/components/AnimatedContainer';
import { usePathname } from 'next/navigation';
import { MdDashboard, MdSettings, MdNotifications, MdMenu, MdClose, MdStore, MdRestaurantMenu, MdListAlt } from 'react-icons/md';
import Link from 'next/link';
import { useState } from 'react';
import useRealTimeNotifications from '@/hooks/useRealTimeNotifications';
import dynamic from 'next/dynamic';
import RestaurantToggle from '@/components/RestaurantToggle';


// Importação dinâmica dos componentes client-side only
const OfflineToggle = dynamic(() => import('@/components/OfflineToggle'), {
  ssr: false,
});

const NotificationSystem = dynamic(() => import('@/components/NotificationSystem'), {
  ssr: false,
});

const NotificationCenter = dynamic(() => import('@/components/NotificationCenter'), {
  ssr: false
});

const AlertSystem = dynamic(() => import('@/components/AlertSystem'), {
  ssr: false
});



export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { notifications, unreadCount } = useRealTimeNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);


  const menuItems = [
    {
      href: '/restaurant',
      icon: MdDashboard,
      label: 'Dashboard',
      active: pathname === '/restaurant'
    },
    {
      href: '/restaurant/menu',
      icon: MdRestaurantMenu,
      label: 'Menu',
      active: pathname === '/restaurant/menu'
    },
    {
      href: '/restaurant/pedidos',
      icon: MdListAlt,
      label: 'Pedidos',
      active: pathname === '/restaurant/pedidos'
    },
    {
      href: '/restaurant/minha-loja',
      icon: MdStore,
      label: 'Minha Loja',
      active: pathname === '/restaurant/minha-loja'
    },
    {
      href: '/restaurant/settings',
      icon: MdSettings,
      label: 'Configurações',
      active: pathname === '/restaurant/settings'
    }
  ];

  return (
    <RestaurantProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`w-72 lg:w-72 md:w-64 sm:w-60 bg-white shadow-xl border-r border-gray-200 transition-transform duration-300 ease-in-out z-50 ${
          showMobileMenu ? 'fixed inset-y-0 left-0 translate-x-0' : 'hidden md:block'
        } md:relative md:translate-x-0`}>
          {/* Header */}
          <AnimatedContainer animationType="fadeInDown" delay={100}>
            <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Zip Food</h2>
              <p className="text-red-100 text-xs lg:text-sm">Área do Restaurante</p>
            </div>
          </AnimatedContainer>

          {/* Navigation */}
          <nav className="p-2 lg:p-4">
            <AnimatedContainer animationType="fadeInUp" delay={200}>
              <ul className="space-y-1 lg:space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between p-2 lg:p-3 rounded-xl transition-all duration-200 group ${
                          item.active
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon 
                            size={18} 
                            className={`mr-2 lg:mr-3 lg:w-5 lg:h-5 ${
                              item.active ? 'text-white' : 'text-gray-500 group-hover:text-red-600'
                            }`} 
                          />
                          <span className="font-medium text-sm lg:text-base">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full min-w-[16px] lg:min-w-[20px] text-center text-[10px] lg:text-xs">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </AnimatedContainer>

            {/* Restaurant Status Toggle */}
            <AnimatedContainer animationType="fadeInUp" delay={300}>
              <div className="mt-4 lg:mt-6">
                <RestaurantToggle />
              </div>
            </AnimatedContainer>

            {/* Logout Button */}
            <AnimatedContainer animationType="fadeInUp" delay={400}>
              <div className="mt-6 lg:mt-8">
                <LogoutButton />
              </div>
            </AnimatedContainer>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Header com notificações */}
          <AnimatedContainer animationType="fadeInDown" delay={0}>
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-8 py-3 lg:py-4">
              <div className="flex items-center justify-between">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  {showMobileMenu ? <MdClose size={24} /> : <MdMenu size={24} />}
                </button>

                <div className="flex-1 md:flex md:items-center md:justify-between">
                  <div className="ml-4 md:ml-0">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Painel do Restaurante</h1>
            <p className="text-gray-600 text-xs lg:text-sm hidden sm:block">Gerencie seu estabelecimento</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-4">

                    
                    {/* Botão de notificações */}
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`relative p-2 lg:p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105 ${
                        unreadCount > 0 ? 'animate-pulse' : ''
                      }`}
                    >
                      <MdNotifications 
                        size={18} 
                        className={`text-gray-600 lg:w-5 lg:h-5 transition-colors ${
                          unreadCount > 0 ? 'text-red-500' : ''
                        }`} 
                      />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full min-w-[16px] lg:min-w-[20px] text-center text-[10px] lg:text-xs animate-bounce shadow-lg">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          <div className="p-4 lg:p-8">
            {children}
          </div>

          {/* Sistema de Notificações */}
          <NotificationSystem />
          
          {/* Notification Center */}
        <NotificationCenter 
          isOpen={showNotifications} 
          onClose={() => setShowNotifications(false)} 
        />
        
        {/* Alert System */}
        <AlertSystem />
        </main>
      </div>
    </RestaurantProtectedRoute>
  );
}