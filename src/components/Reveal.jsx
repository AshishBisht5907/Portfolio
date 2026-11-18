import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export default function Reveal({ as: Element = 'div', className = '', children, ...props }) {
  const reduceMotion = useReducedMotion();
  const MotionElement = motion[Element] || motion.div;

  return (
    <MotionElement
      className={`reveal ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </MotionElement>
  );
}
