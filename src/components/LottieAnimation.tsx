'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

// Importar as animações JSON
import foodBeverageAnimation from '@/app/Food & Beverage (1).json';
import storeAnimation from '@/app/Store.json';
import mainSceneAnimation from '@/app/Main Scene (1).json';

// Tipagem para animações Lottie
type LottieAnimationData = any;

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
  const [animationData, setAnimationData] = useState<LottieAnimationData>(mainSceneAnimation as LottieAnimationData);

  useEffect(() => {
    switch (userType) {
      case 'customer':
        setAnimationData(foodBeverageAnimation as LottieAnimationData);
        break;
      case 'restaurant':
        setAnimationData(storeAnimation as LottieAnimationData);
        break;
      case 'delivery':
        setAnimationData(mainSceneAnimation as LottieAnimationData);
        break;
      default:
        setAnimationData(mainSceneAnimation as LottieAnimationData);
        break;
    }
  }, [userType]);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{
          width: `${width}px`,
          height: `${height}px`
        }}
      />
    </div>
  );
};

export default LottieAnimation;