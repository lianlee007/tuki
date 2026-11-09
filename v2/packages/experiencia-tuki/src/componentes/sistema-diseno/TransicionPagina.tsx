import React from 'react';
import { motion } from 'framer-motion';

interface TransicionPaginaProps {
  children: React.ReactNode;
}

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const TransicionPagina: React.FC<TransicionPaginaProps> = ({ children }) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full h-full page-af"
    >
      {children}
    </motion.div>
  );
};
