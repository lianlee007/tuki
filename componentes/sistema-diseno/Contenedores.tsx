
import React from 'react';

export const Tarjeta: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`neumorphic p-6 text-text-main ${className}`}>
    {children}
  </div>
);
