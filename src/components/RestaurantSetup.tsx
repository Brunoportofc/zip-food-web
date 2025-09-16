'use client';

import React, { useState, useRef } from 'react';
import { FaUpload, FaImage, FaCheck, FaArrowRight, FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';
import { sanitizeXSS, validateSecureText } from '@/lib/security';
import SuccessMessage from './SuccessMessage';

interface RestaurantSetupProps {
  restaurantName: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const RestaurantSetup: React.FC<RestaurantSetupProps> = ({ 
  restaurantName, 
  onComplete, 
  onSkip 
}) => {
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    isVisible: boolean;
  }>({
    title: '',
    message: '',
    isVisible: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Validação de arquivo com segurança
  const validateFile = (file: File, type: 'banner' | 'logo'): string | null => {
    // Sanitizar nome do arquivo
    const sanitizedFileName = sanitizeXSS(file.name);
    
    // Validar nome do arquivo
    const nameValidation = validateSecureText(sanitizedFileName, 'Nome do arquivo', 255);
    if (!nameValidation.isValid) {
      return nameValidation.error || 'Nome do arquivo inválido';
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Apenas arquivos JPG, PNG ou WebP são permitidos';
    }

    // Validar tamanho
    const maxSize = type === 'banner' ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB para banner, 2MB para logo
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'banner' | 'logo'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar arquivo com segurança
    const validationError = validateFile(file, type);
    if (validationError) {
      setErrors({ ...errors, [type]: validationError });
      alert(validationError);
      return;
    }

    // Limpar erros anteriores
    const newErrors = { ...errors };
    delete newErrors[type];
    setErrors(newErrors);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'banner') {
        setBannerFile(file);
        setBannerPreview(result);
      } else {
        setLogoFile(file);
        setLogoPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (type: 'banner' | 'logo') => {
    if (type === 'banner') {
      setBannerFile(null);
      setBannerPreview(null);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    } else {
      setLogoFile(null);
      setLogoPreview(null);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
    
    // Limpar erros relacionados
    const newErrors = { ...errors };
    delete newErrors[type];
    setErrors(newErrors);
  };

  const handleSaveAndContinue = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Mostrar mensagem de sucesso
      setSuccessMessage({
        title: 'Configuração Salva!',
        message: 'Suas imagens foram enviadas com sucesso. Seu restaurante está pronto para começar!',
        isVisible: true
      });

      // Aguardar um pouco antes de continuar
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload das imagens. Tente novamente.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Função para fechar mensagem de sucesso
  const handleCloseSuccessMessage = () => {
    setSuccessMessage(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Personalize seu Restaurante</h2>
          <p className="text-red-100">
            Adicione imagens para tornar seu <span className="font-semibold">{restaurantName}</span> mais atrativo
          </p>
        </div>

        <div className="p-8">
          {/* Banner Upload Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaImage className="mr-2 text-red-600" />
              Banner do Restaurante
            </h3>
            <p className="text-gray-600 mb-4">
              Adicione uma imagem de banner que represente seu restaurante (recomendado: 1200x400px)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
              {bannerPreview ? (
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <button
                    onClick={() => handleRemoveImage('banner')}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                    aria-label="Remover banner"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    <FaCamera className="mr-2" />
                    Alterar Banner
                  </button>
                </div>
              ) : (
                <div>
                  <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Clique para fazer upload do banner</p>
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
                  >
                    <FaUpload className="mr-2" />
                    Selecionar Banner
                  </button>
                </div>
              )}
              
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'banner')}
                className="hidden"
                aria-label="Upload de banner"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaCamera className="mr-2 text-red-600" />
              Logo do Restaurante
            </h3>
            <p className="text-gray-600 mb-4">
              Adicione o logo do seu restaurante (recomendado: formato quadrado, 300x300px)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
                  />
                  <button
                    onClick={() => handleRemoveImage('logo')}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                    aria-label="Remover logo"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                  <div className="mt-4">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                    >
                      <FaCamera className="mr-2" />
                      Alterar Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FaCamera className="text-4xl text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">Clique para fazer upload do logo</p>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto"
                  >
                    <FaUpload className="mr-2" />
                    Selecionar Logo
                  </button>
                </div>
              )}
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'logo')}
                className="hidden"
                aria-label="Upload de logo"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FaUpload className="text-blue-600 mr-2" />
                  <span className="text-blue-800 font-medium">Fazendo upload das imagens...</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-blue-700 text-sm mt-1">{uploadProgress}% concluído</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {onSkip && (
              <button
                onClick={onSkip}
                disabled={isUploading}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pular esta etapa
              </button>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={handleSaveAndContinue}
                disabled={isUploading}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Salvar e Continuar
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Dicas para melhores resultados:</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Use imagens de alta qualidade e bem iluminadas</li>
              <li>• O banner deve mostrar pratos ou o ambiente do restaurante</li>
              <li>• O logo deve ser simples e legível em tamanhos pequenos</li>
              <li>• Evite textos muito pequenos nas imagens</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      <SuccessMessage
        title={successMessage.title}
        message={successMessage.message}
        isVisible={successMessage.isVisible}
        onClose={handleCloseSuccessMessage}
      />
    </div>
  );
};

export default RestaurantSetup;