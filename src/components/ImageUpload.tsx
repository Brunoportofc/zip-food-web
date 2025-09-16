'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { ImageUploadOptions, processImage, ProcessedImage } from '@/lib/image-upload';

interface ImageUploadProps {
  label: string;
  description?: string;
  options: ImageUploadOptions;
  onImageProcessed: (processedImage: ProcessedImage) => void;
  onError: (error: string) => void;
  value?: string; // URL da imagem atual
  className?: string;
  required?: boolean;
}

export default function ImageUpload({
  label,
  description,
  options,
  onImageProcessed,
  onError,
  value,
  className = '',
  required = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadStatus('processing');

    try {
      const processedImage = await processImage(file, options);
      
      // Criar preview
      const previewUrl = URL.createObjectURL(processedImage.compressed);
      setPreview(previewUrl);
      
      setUploadStatus('success');
      onImageProcessed(processedImage);
    } catch (error) {
      setUploadStatus('error');
      onError(error instanceof Error ? error.message : 'Erro ao processar imagem');
    } finally {
      setIsProcessing(false);
    }
  }, [options, onImageProcessed, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(() => {
    setPreview(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'processing':
        return <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'processing':
        return 'Processando...';
      case 'success':
        return 'Imagem carregada com sucesso';
      case 'error':
        return 'Erro ao carregar imagem';
      default:
        return 'Clique ou arraste uma imagem aqui';
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
          isDragging
            ? 'border-orange-400 bg-orange-50'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          // Preview da imagem
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {getStatusText()}
            </div>
          </div>
        ) : (
          // Área de upload
          <div
            className="p-8 text-center cursor-pointer"
            onClick={handleClick}
          >
            <div className="flex flex-col items-center space-y-4">
              {getStatusIcon()}
              
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getStatusText()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: {options.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Tamanho máximo: {options.maxSize}MB
                </p>
                {options.dimensions && (
                  <p className="text-xs text-gray-500">
                    Dimensões recomendadas: {options.dimensions.width}x{options.dimensions.height}px
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={options.allowedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {/* Loading overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-600">Processando imagem...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}