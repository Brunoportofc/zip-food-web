'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/components/ui';
import { 
  getDimensions, 
  getDeviceInfo, 
  isMobile, 
  isTablet, 
  isDesktop,
  getOrientation,
  vibrate,
  copyToClipboard,
  share,
  isOnline
} from '@/lib/platform';

/**
 * Página de teste para funcionalidades da plataforma
 * Útil para desenvolvimento e debug
 */
const TestPage: React.FC = () => {
  const { t } = useTranslation();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testDimensions = () => {
    const dimensions = getDimensions();
    addResult(`Dimensões - Janela: ${dimensions.window.width}x${dimensions.window.height}, Tela: ${dimensions.screen.width}x${dimensions.screen.height}`);
  };

  const testDeviceInfo = () => {
    const info = getDeviceInfo();
    addResult(`Dispositivo - Plataforma: ${info.platform}, Idioma: ${info.language}, Online: ${info.onLine}`);
  };

  const testDeviceType = () => {
    const mobile = isMobile();
    const tablet = isTablet();
    const desktop = isDesktop();
    const orientation = getOrientation();
    addResult(`Tipo - Móvel: ${mobile}, Tablet: ${tablet}, Desktop: ${desktop}, Orientação: ${orientation}`);
  };

  const testVibration = () => {
    vibrate([200, 100, 200]);
    addResult('Vibração testada (se suportada)');
  };

  const testClipboard = async () => {
    const success = await copyToClipboard('Teste do Zip Food!');
    addResult(`Clipboard - ${success ? 'Sucesso' : 'Falhou'}`);
  };

  const testShare = async () => {
    const success = await share({
      title: 'Zip Food',
      text: 'Testando compartilhamento do Zip Food',
      url: window.location.href
    });
    addResult(`Compartilhamento - ${success ? 'Sucesso' : 'Falhou ou cancelado'}`);
  };

  const testConnectivity = () => {
    const online = isOnline();
    addResult(`Conectividade - ${online ? 'Online' : 'Offline'}`);
  };

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Página de Teste
          </h1>
          <p className="text-gray-600">
            Esta página está disponível apenas em desenvolvimento.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Página de Teste - Zip Food
          </h1>
          <p className="text-gray-600">
            Teste das funcionalidades da plataforma e componentes UI
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Testes de Plataforma */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔧 Testes de Plataforma
            </h2>
            <div className="space-y-3">
              <Button onClick={testDimensions} variant="outline" fullWidth>
                Testar Dimensões
              </Button>
              <Button onClick={testDeviceInfo} variant="outline" fullWidth>
                Testar Info do Dispositivo
              </Button>
              <Button onClick={testDeviceType} variant="outline" fullWidth>
                Testar Tipo de Dispositivo
              </Button>
              <Button onClick={testConnectivity} variant="outline" fullWidth>
                Testar Conectividade
              </Button>
            </div>
          </Card>

          {/* Testes de Funcionalidades */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ⚡ Testes de Funcionalidades
            </h2>
            <div className="space-y-3">
              <Button onClick={testVibration} variant="outline" fullWidth>
                Testar Vibração
              </Button>
              <Button onClick={testClipboard} variant="outline" fullWidth>
                Testar Clipboard
              </Button>
              <Button onClick={testShare} variant="outline" fullWidth>
                Testar Compartilhamento
              </Button>
            </div>
          </Card>
        </div>

        {/* Resultados dos Testes */}
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 Resultados dos Testes
            </h2>
            <Button onClick={clearResults} variant="secondary" size="sm">
              Limpar
            </Button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Nenhum teste executado ainda...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Informações do Sistema */}
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ℹ️ Informações do Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Ambiente:</strong> {process.env.NODE_ENV}
            </div>
            <div>
              <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </div>
            <div>
              <strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
            </div>
            <div>
              <strong>Idioma:</strong> {typeof window !== 'undefined' ? navigator.language : 'N/A'}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestPage;