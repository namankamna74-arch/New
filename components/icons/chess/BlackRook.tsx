import React from 'react';
const BlackRook: React.FC = () => (
    <svg viewBox="0 0 45 45" className="w-full h-full">
        <g fill="#000" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" strokeLinecap="butt" />
            <path d="M14 29.5v-13h17v13H14z" strokeLinecap="butt" strokeLinejoin="miter" />
            <path d="M14 16.5L11 14h23l-3 2.5H14z" strokeLinecap="butt" />
            <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5H11z" strokeLinecap="butt" />
            <path d="M12 32v-2.5" fill="none" stroke="#FFF" />
            <path d="M14 29.5v-13h17v13" fill="none" stroke="#FFF" />
            <path d="M33 32v-2.5" fill="none" stroke="#FFF" />
        </g>
    </svg>
);
export default BlackRook;
