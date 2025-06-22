// src/components/QalamLogo.js
import React from 'react';
import logoImage from '../assets/images/qalam-logo.png';

const QalamLogo = ({ width = 64, height = 64, className = "" }) => (
  <img 
    src={logoImage}
    alt="Qalam Logo"
    width={width}
    height={height}
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

export default QalamLogo;
