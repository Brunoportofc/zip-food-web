// Biblioteca para upload e processamento de imagens
export interface ImageUploadOptions {
  maxSize: number; // em MB
  allowedFormats: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  quality?: number; // 0-1
}

export interface ProcessedImage {
  original: File;
  thumbnail: Blob;
  compressed: Blob;
  dimensions: {
    width: number;
    height: number;
  };
}

// Configurações padrão para diferentes tipos de imagem
export const IMAGE_CONFIGS = {
  RESTAURANT_COVER: {
    maxSize: 5, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 1200, height: 800 },
    quality: 0.85
  },
  RESTAURANT_LOGO: {
    maxSize: 3, // 3MB
    allowedFormats: ['image/png', 'image/svg+xml'],
    dimensions: { width: 400, height: 400 },
    quality: 0.9
  },
  MENU_ITEM: {
    maxSize: 2, // 2MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { width: 800, height: 600 },
    quality: 0.8
  }
};

// Validar arquivo de imagem
export function validateImageFile(file: File, options: ImageUploadOptions): string[] {
  const errors: string[] = [];

  // Verificar tamanho
  const maxSizeBytes = options.maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`Arquivo muito grande. Máximo permitido: ${options.maxSize}MB`);
  }

  // Verificar formato
  if (!options.allowedFormats.includes(file.type)) {
    const formats = options.allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ');
    errors.push(`Formato não suportado. Formatos aceitos: ${formats}`);
  }

  return errors;
}

// Redimensionar imagem
export function resizeImage(file: File, targetWidth: number, targetHeight: number, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcular dimensões mantendo proporção
      const aspectRatio = img.width / img.height;
      let { width, height } = { width: targetWidth, height: targetHeight };

      if (aspectRatio > targetWidth / targetHeight) {
        height = targetWidth / aspectRatio;
      } else {
        width = targetHeight * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;

      // Desenhar imagem redimensionada
      ctx?.drawImage(img, 0, 0, width, height);

      // Converter para blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Erro ao processar imagem'));
        }
      }, file.type, quality);
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

// Criar thumbnail
export function createThumbnail(file: File, size: number = 200): Promise<Blob> {
  return resizeImage(file, size, size, 0.7);
}

// Processar imagem completa
export async function processImage(file: File, options: ImageUploadOptions): Promise<ProcessedImage> {
  // Validar arquivo
  const errors = validateImageFile(file, options);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  // Obter dimensões originais
  const dimensions = await getImageDimensions(file);

  // Criar versões processadas
  const [thumbnail, compressed] = await Promise.all([
    createThumbnail(file),
    options.dimensions 
      ? resizeImage(file, options.dimensions.width, options.dimensions.height, options.quality || 0.8)
      : Promise.resolve(new Blob([file], { type: file.type }))
  ]);

  return {
    original: file,
    thumbnail,
    compressed,
    dimensions
  };
}

// Obter dimensões da imagem
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

// Converter blob para base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Upload para Supabase Storage (simulado)
export async function uploadToStorage(blob: Blob, path: string): Promise<string> {
  // Em produção, implementar upload real para Supabase Storage
  // Por enquanto, retorna uma URL simulada
  const base64 = await blobToBase64(blob);
  
  // Simular delay de upload
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return `https://storage.supabase.co/v1/object/public/restaurant-images/${path}`;
}

// Gerar nome único para arquivo
export function generateFileName(originalName: string, prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${prefix}${timestamp}_${random}.${extension}`;
}