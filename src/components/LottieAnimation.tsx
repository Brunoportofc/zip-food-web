'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

// Importar as animações JSON
import foodBeverageAnimation from '@/animations/Food & Beverage.json';
import storeAnimation from '@/animations/Store.json';
import mainSceneAnimation from '@/animations/Main Scene.json';

type UserType = 'customer' | 'restaurant' | 'delivery';

interface LottieAnimationProps {
  userType?: UserType;
  width?: number;
  height?: number;
  className?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({
  userType,
  width = 128,
  height = 128,
  className = ''
}) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    switch (userType) {
      case 'customer':
        setAnimationData(foodBeverageAnimation);
        break;
      case 'restaurant':
        setAnimationData(storeAnimation);
        break;
      case 'delivery':
        setAnimationData(mainSceneAnimation);
        break;
      default:
        setAnimationData(mainSceneAnimation);
        break;
    }
  }, [userType]);

  if (!animationData) {
    return (
      <div className={`flex justify-center items-center ${className}`}>
        <div 
          style={{
            width: `${width}px`,
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Lottie
        animationData={animationData}
        style={{
          width: `${width}px`,
          height: `${height}px`
        }}
        loop
        autoplay
      />
    </div>
  );
};

export default LottieAnimation;