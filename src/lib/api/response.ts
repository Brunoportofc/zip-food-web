import { NextResponse } from 'next/server';

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

// Função para resposta de sucesso
export function successResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  );
}

// Função para resposta de erro
export function errorResponse(
  error: string,
  status: number = 400,
  errors?: string[]
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      errors
    },
    { status }
  );
}

// Função para resposta de não autorizado
export function unauthorizedResponse(
  message: string = 'Não autorizado'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 401 }
  );
}

// Função para resposta de não encontrado
export function notFoundResponse(
  message: string = 'Recurso não encontrado'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 404 }
  );
}

// Função para resposta de erro interno do servidor
export function serverErrorResponse(
  message: string = 'Erro interno do servidor'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 500 }
  );
}

// Função para resposta de validação
export function validationErrorResponse(
  errors: string[],
  message: string = 'Dados inválidos'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors
    },
    { status: 422 }
  );
}

// Função para resposta de conflito
export function conflictResponse(
  message: string = 'Conflito de dados'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 409 }
  );
}

// Função para resposta de método não permitido
export function methodNotAllowedResponse(
  allowedMethods: string[] = []
): NextResponse<ApiResponse> {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Método não permitido'
    },
    { status: 405 }
  );

  if (allowedMethods.length > 0) {
    response.headers.set('Allow', allowedMethods.join(', '));
  }

  return response;
}
