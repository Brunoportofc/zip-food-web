/**
 * Utilitários de segurança para sanitização de dados e prevenção de ataques
 */

// Lista de caracteres perigosos para XSS
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
];

// Lista de caracteres perigosos para SQL injection
const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;)|(\\;)|(--)|(\s*;\s*)|(\/\*)|(\*\/))/gi,
  /(union\s+select)/gi,
  /(drop\s+table)/gi,
  /(delete\s+from)/gi,
  /(insert\s+into)/gi,
  /(update\s+set)/gi,
  /(exec\s*\()/gi,
  /(execute\s*\()/gi,
  /(sp_executesql)/gi,
  /(xp_cmdshell)/gi,
];

/**
 * Sanitiza uma string removendo caracteres perigosos para XSS
 */
export function sanitizeXSS(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;

  // Remove padrões XSS conhecidos
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Escapa apenas caracteres HTML realmente perigosos, preservando espaços
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Não faz trim automático para preservar espaços intencionais
  return sanitized;
}

/**
 * Sanitiza uma string removendo caracteres perigosos para SQL injection
 */
export function sanitizeSQL(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;

  // Remove padrões SQL injection conhecidos
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove caracteres especiais perigosos
  sanitized = sanitized
    .replace(/['"`;\\]/g, '') // Remove aspas e ponto e vírgula
    .replace(/--/g, '') // Remove comentários SQL
    .replace(/\/\*/g, '') // Remove início de comentário de bloco
    .replace(/\*\//g, ''); // Remove fim de comentário de bloco

  return sanitized.trim();
}

/**
 * Sanitiza um objeto recursivamente aplicando sanitização XSS em todas as strings
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeXSS(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Valida se um email é válido e seguro
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'E-mail é obrigatório' };
  }

  // Sanitiza primeiro
  const sanitizedEmail = sanitizeXSS(email);

  // Verifica formato básico
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return { isValid: false, error: 'Formato de e-mail inválido' };
  }

  // Verifica comprimento
  if (sanitizedEmail.length > 254) {
    return { isValid: false, error: 'E-mail muito longo' };
  }

  // Verifica se não contém caracteres perigosos
  if (sanitizedEmail !== email) {
    return { isValid: false, error: 'E-mail contém caracteres inválidos' };
  }

  return { isValid: true };
}

/**
 * Valida se um CNPJ é válido e seguro
 */
export function validateCNPJ(cnpj: string): { isValid: boolean; error?: string } {
  if (!cnpj || typeof cnpj !== 'string') {
    return { isValid: false, error: 'CNPJ é obrigatório' };
  }

  // Para CNPJ, não aplicamos sanitização XSS pois precisamos preservar a formatação original
  // Remove apenas formatação (pontos, barras, espaços) mantendo apenas números
  const numbers = cnpj.replace(/[^\d]/g, '');

  // Verifica se tem 14 dígitos
  if (numbers.length !== 14) {
    return { isValid: false, error: 'CNPJ deve ter 14 dígitos' };
  }

  // Verifica se não são todos iguais
  if (/^(\d)\1+$/.test(numbers)) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  let weight = 2;

  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(numbers[12]) !== firstDigit) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  // Segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(numbers[13]) !== secondDigit) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  return { isValid: true };
}

/**
 * Valida se um telefone é válido e seguro
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }

  // Para telefone, não aplicamos sanitização XSS pois precisamos preservar a formatação original
  // Remove apenas formatação (parênteses, espaços, hífens) mantendo apenas números
  const numbers = phone.replace(/[^\d]/g, '');

  // Verifica se tem 10 ou 11 dígitos
  if (numbers.length < 10 || numbers.length > 11) {
    return { isValid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }

  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(numbers.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, error: 'DDD inválido' };
  }

  return { isValid: true };
}

/**
 * Valida se um CEP é válido e seguro
 */
export function validateCEP(cep: string): { isValid: boolean; error?: string } {
  if (!cep || typeof cep !== 'string') {
    return { isValid: false, error: 'CEP é obrigatório' };
  }

  // Para CEP, não aplicamos sanitização XSS pois precisamos preservar a formatação original
  // Remove apenas formatação (hífens, espaços) mantendo apenas números
  const numbers = cep.replace(/[^\d]/g, '');

  // Verifica se tem 8 dígitos
  if (numbers.length !== 8) {
    return { isValid: false, error: 'CEP deve ter 8 dígitos' };
  }

  // Verifica se não são todos zeros
  if (numbers === '00000000') {
    return { isValid: false, error: 'CEP inválido' };
  }

  return { isValid: true };
}

/**
 * Valida se um texto é seguro (sem XSS ou SQL injection)
 */
export function validateSecureText(
  text: string, 
  fieldName: string, 
  maxLength: number = 255
): { isValid: boolean; error?: string; sanitized: string } {
  if (!text || typeof text !== 'string') {
    return { 
      isValid: false, 
      error: `${fieldName} é obrigatório`,
      sanitized: ''
    };
  }

  // Sanitiza o texto
  const sanitized = sanitizeXSS(text);

  // Verifica comprimento
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} deve ter no máximo ${maxLength} caracteres`,
      sanitized
    };
  }

  // Verifica se não está vazio após sanitização (usando trim apenas para validação)
  if (sanitized.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName} não pode estar vazio`,
      sanitized
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Gera um token CSRF seguro
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida um token CSRF
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || typeof token !== 'string' || typeof expectedToken !== 'string') {
    return false;
  }

  // Comparação segura contra timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
}