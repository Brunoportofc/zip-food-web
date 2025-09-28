import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' ou 'cover'
    
    if (!file) {
      return errorResponse('Nenhum arquivo foi enviado');
    }

    if (!type || !['logo', 'cover'].includes(type)) {
      return errorResponse('Tipo de arquivo inválido. Use "logo" ou "cover"');
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Tipo de arquivo não suportado. Use JPG, PNG ou WebP');
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return errorResponse('Arquivo muito grande. Máximo 5MB');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${type}_${timestamp}.${extension}`;
    
    // Definir diretório de upload
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'restaurants');
    
    // Criar diretório se não existir
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Caminho completo do arquivo
    const filePath = path.join(uploadDir, fileName);
    
    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Salvar arquivo
    await writeFile(filePath, buffer);
    
    // URL pública do arquivo
    const fileUrl = `/uploads/restaurants/${fileName}`;
    
    return successResponse(
      { 
        url: fileUrl,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      }, 
      'Arquivo enviado com sucesso'
    );
    
  } catch (error) {
    console.error('Erro no upload:', error);
    return serverErrorResponse('Erro interno do servidor durante o upload');
  }
}
