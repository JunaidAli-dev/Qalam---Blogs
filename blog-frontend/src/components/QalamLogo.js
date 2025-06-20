// src/components/QalamLogo.js
import React from 'react';

const QalamLogo = ({ width = 64, height = 64, className = "" }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle with Gradient */}
    <defs>
      <linearGradient id="qalamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="50%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
      </filter>
    </defs>
    
    <circle cx="32" cy="32" r="30" fill="url(#qalamGradient)" filter="url(#shadow)" />
    
    {/* Qalam (Pen) Design */}
    <g transform="translate(32, 32)">
      {/* Pen Body */}
      <path
        d="M-8 -15 L8 15 L6 17 L-10 -13 Z"
        fill="white"
        opacity="0.9"
      />
      
      {/* Pen Tip */}
      <path
        d="M6 17 L8 15 L10 18 L8 20 Z"
        fill="white"
        opacity="0.7"
      />
      
      {/* Ink Flow */}
      <circle cx="9" cy="18" r="1.5" fill="white" opacity="0.6" />
      <circle cx="11" cy="20" r="1" fill="white" opacity="0.4" />
      
      {/* Arabic Calligraphy Accent */}
      <path
        d="M-12 8 Q-8 6 -4 8 Q0 10 4 8"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

export default QalamLogo;
