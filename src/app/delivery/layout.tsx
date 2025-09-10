'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import AnimatedContainer from '@/components/AnimatedContainer';
import useRealTimeNotifications from '@/hooks/useRealTimeNotifications';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  MdDashboard, 
  MdDeliveryDining, 
  MdAttachMoney, 
  MdPerson, 
  MdNotifications,
  MdMenu,
  MdClose,
  MdLogout
} from 'react-icons/md';
import dynamic from 'next/dynamic';

// Importação dinâmica do componente OfflineToggle (client-side only)
const OfflineToggle = dynamic(() => import('@/components/OfflineToggle'), {
  ssr: false,
});

export default function DeliveryLayout({
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
      href: '/delivery',
      icon: MdDashboard,
      label: 'Dashboard',
      active: pathname === '/delivery'
    },
    {
      href: '/delivery/orders',
      icon: MdDeliveryDining,
      label: 'Pedidos',
      active: pathname === '/delivery/orders',
      badge: unreadCount
    },
    {
      href: '/delivery/earnings',
      icon: MdAttachMoney,
      label: 'Ganhos',
      active: pathname === '/delivery/earnings'
    },
    {
      href: '/delivery/profile',
      icon: MdPerson,
      label: 'Perfil',
      active: pathname === '/delivery/profile'
    }
  ];

  return (
    <ProtectedRoute requiredUserType="delivery">
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
            <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Zip Food</h2>
              <p className="text-blue-100 text-xs lg:text-sm">Área de Entrega</p>
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
                      <AnimatedContainer animationType="fadeIn" delay={300 + index * 100}>
                        <Link
                          href={item.href}
                          className={`group flex items-center justify-between p-3 lg:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                            item.active
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon 
                              size={20} 
                              className={`mr-3 lg:mr-4 transition-transform duration-300 group-hover:scale-110 ${
                                item.active ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                              }`} 
                            />
                            <span className={`font-medium text-sm lg:text-base ${
                              item.active ? 'text-white' : 'text-gray-700 group-hover:text-blue-600'
                            }`}>
                              {item.label}
                            </span>
                          </div>
                          {item.badge && item.badge > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </AnimatedContainer>
                    </li>
                  );
                })}
              </ul>
            </AnimatedContainer>

            {/* Status Toggle */}
            <AnimatedContainer animationType="fadeInUp" delay={600}>
              <div className="mt-6 lg:mt-8 p-3 lg:p-4 bg-gray-50 rounded-xl">
                <h3 className="text-xs lg:text-sm font-semibold text-gray-600 mb-2 lg:mb-3">Status</h3>
                <OfflineToggle />
              </div>
            </AnimatedContainer>

            {/* Logout Button */}
            <AnimatedContainer animationType="fadeInUp" delay={700}>
              <div className="mt-6 lg:mt-8">
                <LogoutButton />
              </div>
            </AnimatedContainer>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
            <div className="flex items-center justify-between">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {showMobileMenu ? <MdClose size={24} /> : <MdMenu size={24} />}
              </button>

              <div className="flex-1 md:flex md:items-center md:justify-between">
                <div className="ml-4 md:ml-0">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Painel de Entregas</h1>
                  <p className="text-gray-600 text-xs lg:text-sm hidden sm:block">Gerencie suas entregas</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  {/* Botão de notificações */}
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 lg:p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                  >
                    <MdNotifications size={18} className="text-gray-600 lg:w-5 lg:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full min-w-[16px] lg:min-w-[20px] text-center text-[10px] lg:text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}