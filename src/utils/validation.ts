/**
 * Utilitários de validação para formulários
 */

/**
 * Valida se um email é válido
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email inválido' };
  }
  
  return { isValid: true };
}

/**
 * Valida se uma senha atende aos critérios
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  return { isValid: true };
}

/**
 * Valida se as senhas coincidem
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } {
  if (!confirmPassword) {
    return { isValid: false, error: 'Confirmação de senha é obrigatória' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Senhas não coincidem' };
  }
  
  return { isValid: true };
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): { isValid: boolean; error?: string } {
  if (!cpf) {
    return { isValid: false, error: 'CPF é obrigatório' };
  }
  
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return { isValid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, error: 'CPF inválido' };
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, error: 'CPF inválido' };
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, error: 'CPF inválido' };
  }
  
  return { isValid: true };
}

/**
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }
  
  return { isValid: true };
}

/**
 * Valida CEP brasileiro
 */
export function validateCEP(cep: string): { isValid: boolean; error?: string } {
  if (!cep) {
    return { isValid: false, error: 'CEP é obrigatório' };
  }
  
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return { isValid: false, error: 'CEP deve ter 8 dígitos' };
  }
  
  return { isValid: true };
}

/**
 * Valida campo obrigatório
 */
export function validateRequired(value: string, fieldName: string): { isValid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  
  return { isValid: true };
}

/**
 * Valida valor mínimo
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): { isValid: boolean; error?: string } {
  if (value.length < minLength) {
    return { isValid: false, error: `${fieldName} deve ter pelo menos ${minLength} caracteres` };
  }
  
  return { isValid: true };
}

/**
 * Valida valor máximo
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string
): { isValid: boolean; error?: string } {
  if (value.length > maxLength) {
    return { isValid: false, error: `${fieldName} deve ter no máximo ${maxLength} caracteres` };
  }
  
  return { isValid: true };
}