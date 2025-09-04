'use client';

import '@/i18n';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import dynamic from 'next/dynamic';

// Importação dinâmica do componente OfflineToggle (client-side only)
const OfflineToggle = dynamic(() => import('@/components/OfflineToggle'), {
  ssr: false,
});

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProtectedRoute requiredUserType="restaurant">
      <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-primary">Zip Food</h2>
          <p className="text-sm text-gray-600">Área do Restaurante</p>
        </div>
        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <a href="/restaurant" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <span className="mr-2">📊</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="/restaurant/menu" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <span className="mr-2">🍔</span>
                <span>Cardápio</span>
              </a>
            </li>
            <li>
              <a href="/restaurant/orders" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <span className="mr-2">📋</span>
                <span>Pedidos</span>
              </a>
            </li>
            <li>
              <a href="/restaurant/settings" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                <span className="mr-2">⚙️</span>
                <span>Configurações</span>
              </a>
            </li>
            <li>
              <div className="p-2">
                <OfflineToggle />
              </div>
            </li>
            <li className="mt-8">
              <LogoutButton />
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}