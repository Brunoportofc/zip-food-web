'use client';

import React, { useState, useRef } from 'react';
import { MdCloudUpload, MdImage, MdDelete } from 'react-icons/md';

interface ImageUploadProps {
  type: 'logo' | 'cover';
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  type,
  currentImage,
  onImageChange,
  label,
  className = '',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file || uploading || disabled) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use JPG, PNG ou WebP');
      return;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 5MB');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no upload');
      }

      const result = await response.json();
      onImageChange(result.data.url);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const getPlaceholderDimensions = () => {
    return type === 'cover' 
      ? 'h-32 md:h-40' 
      : 'h-24 w-24 rounded-full';
  };

  const getImageDimensions = () => {
    return type === 'cover' 
      ? 'h-32 md:h-40 w-full object-cover rounded-lg' 
      : 'h-24 w-24 object-cover rounded-full';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
          ${dragOver ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-red-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploading ? 'pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={currentImage ? undefined : openFileDialog}
      >
        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {currentImage ? (
          /* Imagem atual */
          <div className="relative group">
            <img
              src={currentImage}
              alt={label}
              className={getImageDimensions()}
            />
            
            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="hidden group-hover:flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  disabled={disabled || uploading}
                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  title="Alterar imagem"
                >
                  <MdCloudUpload className="text-lg" />
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  disabled={disabled || uploading}
                  className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors"
                  title="Remover imagem"
                >
                  <MdDelete className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Área de upload */
          <div className={`flex flex-col items-center justify-center ${getPlaceholderDimensions()}`}>
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-2"></div>
                <p className="text-sm text-gray-600">Enviando...</p>
              </div>
            ) : (
              <>
                <MdCloudUpload className="text-4xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Clique ou arraste uma imagem
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG ou WebP (máx. 5MB)
                </p>
                {type === 'cover' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: 1200x400px
                  </p>
                )}
                {type === 'logo' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: 200x200px
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      {type === 'cover' && (
        <p className="text-xs text-gray-500">
          A imagem de capa será exibida no topo da página do seu restaurante
        </p>
      )}
      
      {type === 'logo' && (
        <p className="text-xs text-gray-500">
          O logo será exibido em vários locais do aplicativo
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
