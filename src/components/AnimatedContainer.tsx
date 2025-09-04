'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedContainerProps {
  children: ReactNode;
  animationType?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'scale' | 'slideIn';
  delay?: number;
  duration?: number;
  className?: string;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animationType = 'fadeIn',
  delay = 0,
  duration = 0.5,
  className = '',
}) => {
  const getAnimationVariants = () => {
    switch (animationType) {
      case 'fadeIn':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
      case 'fadeInUp':
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        };
      case 'fadeInDown':
        return {
          hidden: { opacity: 0, y: -50 },
          visible: { opacity: 1, y: 0 },
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        };
      case 'slideIn':
        return {
          hidden: { opacity: 0, x: -50 },
          visible: { opacity: 1, x: 0 },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={getAnimationVariants()}
      transition={{ duration, delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContainer;