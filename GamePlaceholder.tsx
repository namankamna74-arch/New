
import React from 'react';

interface GamePlaceholderProps {
    gameName: string;
}

const GamePlaceholder: React.FC<GamePlaceholderProps> = ({ gameName }) => {
    return (
        <div className="text-center">
            <h2 className="font-orbitron text-5xl font-bold text-primary">{gameName}</h2>
            <p className="mt-4 text-xl text-gray-300">is coming soon!</p>
            <div className="mt-8 text-6xl animate-bounce">🕹️</div>
        </div>
    );
};

export default GamePlaceholder;