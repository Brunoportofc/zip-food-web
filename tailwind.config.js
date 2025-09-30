/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais do sistema - Verde neon
        primary: {
          DEFAULT: '#00FF88', // Verde neon principal
          50: '#E6FFEF',
          100: '#B3FFD6',
          200: '#80FFBD',
          300: '#4DFFA4',
          400: '#1AFF8B',
          500: '#00FF88', // cor padrão
          600: '#00E676',
          700: '#00CC66',
          800: '#00B355',
          900: '#009944',
          dark: '#00E676',
          light: '#B3FFD6',
        },
        
        // Cores secundárias
        secondary: {
          DEFAULT: '#4ECDC4',
          50: '#E0F7F6',
          100: '#B3EDEA',
          200: '#80E3DE',
          300: '#4DD9D2',
          400: '#26D0C8',
          500: '#4ECDC4', // cor padrão
          600: '#45B7B8',
          700: '#3A9B9C',
          800: '#2F7F80',
          900: '#246364',
          dark: '#45B7B8',
        },
        
        // Cor de destaque
        accent: {
          DEFAULT: '#FFE66D',
          50: '#FFFAEB',
          100: '#FFF3C7',
          200: '#FFED94',
          300: '#FFE66D', // cor padrão
          400: '#FFDF50',
          500: '#FFD93D',
          600: '#FFC107',
          700: '#FF9800',
          800: '#FF6F00',
          900: '#E65100',
          dark: '#FFD93D',
        },
        
        // Estados do sistema
        success: {
          DEFAULT: '#6BCF7F',
          50: '#E8F5E8',
          100: '#C3E6C3',
          200: '#9DD69E',
          300: '#77C678',
          400: '#6BCF7F', // cor padrão
          500: '#52B368',
          600: '#419748',
          700: '#2F7B35',
          800: '#1E5F22',
          900: '#0D430F',
        },
        
        warning: {
          DEFAULT: '#FFB74D',
          50: '#FFF8E6',
          100: '#FFECB8',
          200: '#FFE08A',
          300: '#FFD45C',
          400: '#FFB74D', // cor padrão
          500: '#FF9800',
          600: '#F57C00',
          700: '#E65100',
          800: '#BF360C',
          900: '#8D2600',
        },
        
        error: {
          DEFAULT: '#FF5252',
          50: '#FFE5E5',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF5252', // cor padrão
          500: '#F44336',
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
        
        // Cores informativas
        info: {
          DEFAULT: '#2196F3',
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3', // cor padrão
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        
        // Cores específicas do delivery
        delivery: {
          pending: '#FFB74D',    // warning
          confirmed: '#2196F3',  // info
          preparing: '#FFE66D',  // accent
          ready: '#FF9800',      // orange
          delivering: '#9C27B0', // purple
          delivered: '#6BCF7F',  // success
          cancelled: '#FF5252',  // error
        },
        
        // Cores do status do restaurante
        restaurant: {
          active: '#6BCF7F',     // success
          pending: '#FFB74D',    // warning
          suspended: '#FF5252',  // error
          verified: '#2196F3',   // info
        },
        
        // Sistema de cores atualizado
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        
        // Cores de fundo e texto - Tema Dark
        background: '#101828', // Fundo escuro personalizado
        foreground: '#FFFFFF', // Texto branco
        black: '#000000',
        white: '#FFFFFF',
        'dark-bg': '#101828', // Cor de fundo principal do sistema
        
        // Cores específicas para elementos
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        
        yellow: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7C3AED',
          800: '#6B21A8',
          900: '#581C87',
        },
        
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        
        pink: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
      },
      fontFamily: {
        'quicksand-regular': ['var(--font-geist-sans)', 'sans-serif'],
        'quicksand-medium': ['var(--font-geist-sans)', 'sans-serif'],
        'quicksand-semibold': ['var(--font-geist-sans)', 'sans-serif'],
        'quicksand-bold': ['var(--font-geist-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};