'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaCommentDots, FaReceipt, FaTicketAlt, FaHeart, FaCreditCard, FaMedal, FaQuestionCircle, FaUserAlt, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';

export default function CustomerProfilePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8 flex gap-6">
      {/* Menu lateral */}
      <div className="w-64 bg-white rounded-lg shadow-md p-4 h-fit">
        <nav className="space-y-4">
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaCommentDots className="text-gray-700" />
            <span className="text-gray-800">Chats</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaReceipt className="text-gray-700" />
            <span className="text-gray-800">Pedidos</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer relative">
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">10</div>
            <FaTicketAlt className="text-red-500" />
            <span className="text-red-500 font-medium">Meus Cupons</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaHeart className="text-gray-700" />
            <span className="text-gray-800">Favoritos</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaCreditCard className="text-gray-700" />
            <span className="text-gray-800">Pagamento</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaMedal className="text-gray-700" />
            <span className="text-gray-800">Fidelidade</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaQuestionCircle className="text-gray-700" />
            <span className="text-gray-800">Ajuda</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaUserAlt className="text-gray-700" />
            <span className="text-gray-800">Meus dados</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaShieldAlt className="text-gray-700" />
            <span className="text-gray-800">Segurança</span>
          </div>
          
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
            <FaSignOutAlt className="text-gray-700" />
            <span className="text-gray-800">Sair</span>
          </div>
        </nav>
      </div>
      
      {/* Conteúdo principal */}
      <div className="bg-white rounded-lg shadow-md p-6 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-center">Meu Perfil</h1>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4">
            <span className="text-3xl text-gray-800">👤</span>
          </div>
          <h2 className="text-xl font-semibold">Nome do Usuário</h2>
          <p className="text-gray-700">usuario@email.com</p>
        </div>

        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-2">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">Nome</p>
                <p>Nome do Usuário</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Email</p>
                <p>usuario@email.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Telefone</p>
                <p>(11) 99999-9999</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Data de Nascimento</p>
                <p>01/01/1990</p>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-2">Endereços</h3>
            <div className="bg-gray-50 p-3 rounded mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Casa</p>
                  <p className="text-gray-700">Rua Exemplo, 123</p>
                  <p className="text-gray-700">Bairro, Cidade - Estado</p>
                  <p className="text-gray-700">CEP: 00000-000</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Editar</button>
                  <button className="text-red-600 hover:text-red-800">Remover</button>
                </div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 flex items-center">
              <span className="mr-1">+</span> Adicionar novo endereço
            </button>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-2">Métodos de Pagamento</h3>
            <div className="bg-gray-50 p-3 rounded mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Cartão de Crédito</p>
                  <p className="text-gray-700">**** **** **** 1234</p>
                  <p className="text-gray-700">Validade: 12/25</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">Editar</button>
                  <button className="text-red-600 hover:text-red-800">Remover</button>
                </div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-800 flex items-center">
              <span className="mr-1">+</span> Adicionar novo método de pagamento
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Histórico de Pedidos</h3>
            <p className="text-gray-700 italic">Você ainda não fez nenhum pedido.</p>
            <button 
              onClick={() => router.push('/customer')} 
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Explorar restaurantes
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}