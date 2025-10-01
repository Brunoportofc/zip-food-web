/**
 * Função que retorna as dimensões da tela atual
 * Adaptada do React Native para web
 */
export const getDimensions = () => {
  // No ambiente web, usamos window.innerWidth e window.innerHeight
  if (typeof window !== 'undefined') {
    return {
      window: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      }
    };
  }
  
  // Valores padrão para SSR
  return {
    window: {
      width: 0,
      height: 0,
    },
    screen: {
      width: 0,
      height: 0,
    }
  };
};

/**
 * Função para obter informações do dispositivo
 */
export const getDeviceInfo = () => {
  if (typeof window !== 'undefined') {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      deviceMemory: (navigator as any).deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
    };
  }
  
  return {
    userAgent: '',
    platform: '',
    language: 'pt-BR',
    cookieEnabled: false,
    onLine: false,
    deviceMemory: null,
    hardwareConcurrency: null,
  };
};

/**
 * Função para detectar se é dispositivo móvel
 */
export const isMobile = () => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  return false;
};

/**
 * Função para detectar se é tablet
 */
export const isTablet = () => {
  if (typeof window !== 'undefined') {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  }
  return false;
};

/**
 * Função para detectar se é desktop
 */
export const isDesktop = () => {
  return !isMobile() && !isTablet();
};

/**
 * Função para obter orientação da tela
 */
export const getOrientation = () => {
  if (typeof window !== 'undefined') {
    const { width, height } = getDimensions().window;
    return width > height ? 'landscape' : 'portrait';
  }
  return 'portrait';
};

/**
 * Função para vibrar o dispositivo (se suportado)
 */
export const vibrate = (pattern: number | number[] = 200) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

/**
 * Função para copiar texto para a área de transferência
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        textArea.remove();
        return result;
      }
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      return false;
    }
  }
  return false;
};

/**
 * Função para compartilhar conteúdo (se suportado)
 */
export const share = async (data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (typeof window !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      return false;
    }
  }
  return false;
};

/**
 * Função para obter localização (se permitido)
 */
export const getCurrentPosition = (): Promise<globalThis.GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      reject(new Error('Geolocalização não suportada'));
    }
  });
};

/**
 * Função para detectar se está online
 */
export const isOnline = () => {
  if (typeof window !== 'undefined') {
    return navigator.onLine;
  }
  return true;
};

/**
 * Função para adicionar listener de mudança de conectividade
 */
export const addConnectivityListener = (
  onOnline: () => void,
  onOffline: () => void
) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    // Retorna função para remover os listeners
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
  
  return () => {};
};

/**
 * Função para exibir alertas
 * Adaptada do React Native Alert para web
 */
export const showAlert = (title: string, message: string, buttons?: Array<{
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}>) => {
  // No ambiente web, usamos o alert nativo ou uma biblioteca de modal
  if (typeof window !== 'undefined') {
    // Se não houver botões personalizados, usamos o alert padrão
    if (!buttons || buttons.length === 0) {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    // Se houver botões personalizados, podemos usar uma biblioteca de modal
    // ou implementar uma lógica mais complexa
    // Por enquanto, vamos usar o confirm para casos simples
    if (buttons.length === 2) {
      const confirmResult = window.confirm(`${title}\n\n${message}`);
      if (confirmResult && buttons[0].onPress) {
        buttons[0].onPress();
      } else if (!confirmResult && buttons[1].onPress) {
        buttons[1].onPress();
      }
      return;
    }

    // Para outros casos, voltamos ao alert padrão
    window.alert(`${title}\n\n${message}`);
  }
};
