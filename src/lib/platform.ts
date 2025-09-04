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