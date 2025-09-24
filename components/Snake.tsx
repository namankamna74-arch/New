import React, { useState, useEffect, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import { Position, SnakeDirection } from '../types';
import GameModal from './GameModal';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const GRID_SIZE = 20;
const TILE_SIZE = 25;
const INITIAL_SPEED = 200;
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const getRandomCoord = () => ({
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
});

const Snake: React.FC = () => {
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Position>(getRandomCoord());
    const [direction, setDirection] = useState<SnakeDirection>('RIGHT');
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playScore, playLose } = useSound(isMuted);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(getRandomCoord());
        setDirection('RIGHT');
        setSpeed(INITIAL_SPEED);
        setScore(0);
        setIsGameOver(false);
    };

    const startGame = () => {
        resetGame();
        setHasStarted(true);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!hasStarted) return;
        setDirection(prev => {
            switch (e.key) {
                case 'ArrowUp': case 'w': return prev !== 'DOWN' ? 'UP' : prev;
                case 'ArrowDown': case 's': return prev !== 'UP' ? 'DOWN' : prev;
                case 'ArrowLeft': case 'a': return prev !== 'RIGHT' ? 'LEFT' : prev;
                case 'ArrowRight': case 'd': return prev !== 'LEFT' ? 'RIGHT' : prev;
                default: return prev;
            }
        });
    }, [hasStarted]);

    const gameTick = useCallback(() => {
        if (isGameOver || !hasStarted) return;
        
        setSnake(prevSnake => {
            let newSnake = [...prevSnake];
            const head = { ...newSnake[0] };
    
            switch (direction) {
                case 'UP': head.y -= 1; break;
                case 'DOWN': head.y += 1; break;
                case 'LEFT': head.x -= 1; break;
                case 'RIGHT': head.x += 1; break;
            }
    
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || newSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
                playLose(false);
                setIsGameOver(true);
                setHasStarted(false);
                return prevSnake;
            }
            
            newSnake.unshift(head);
    
            if (head.x === food.x && head.y === food.y) {
                playScore(false);
                setScore(s => s + 10);
                setSpeed(s => Math.max(50, s * 0.95));
                let newFoodPos;
                do {
                    newFoodPos = getRandomCoord();
                } while (newSnake.some(seg => seg.x === newFoodPos.x && seg.y === newFoodPos.y));
                setFood(newFoodPos);
            } else {
                newSnake.pop();
            }
            return newSnake;
        });

    }, [direction, food, isGameOver, hasStarted, playLose, playScore]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (!hasStarted || isGameOver) return;
        const interval = setInterval(gameTick, speed);
        return () => clearInterval(interval);
    }, [speed, gameTick, hasStarted, isGameOver]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full font-orbitron relative">
             <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Snake">
                        <p><strong>Objective:</strong> Guide the snake to eat the food and grow as long as possible!</p>
                        <p><strong>Controls:</strong> Use the Arrow Keys or WASD to change the snake's direction.</p>
                        <p className="mt-2">The game ends if the snake runs into the walls or into its own body. Good luck!</p>
                    </TutorialModal>
                )}
             </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <div className="flex justify-between items-center w-full max-w-lg mb-4 px-2">
                <h1 className="text-4xl font-bold text-primary" style={{textShadow: '0 0 5px var(--color-primary-shadow)'}}>Snake</h1>
                <div className="text-2xl">Score: {score}</div>
            </div>
            <div className="relative bg-black/40 border-2 border-primary/50 shadow-lg shadow-primary" style={{ width: GRID_SIZE * TILE_SIZE, height: GRID_SIZE * TILE_SIZE }}>
                <AnimatePresence>
                 {(!hasStarted || isGameOver) && (
                    <GameModal 
                        title={isGameOver ? "Game Over" : "Snake"}
                        status={isGameOver ? `Final Score: ${score}` : "Eat the food and grow!"}
                        buttonText={isGameOver ? "Play Again" : "Start Game"}
                        onButtonClick={startGame}
                    />
                )}
                </AnimatePresence>
                {/* Snake */}
                {hasStarted && snake.map((segment, index) => (
                    <div key={index} 
                         className={`absolute rounded-sm ${index === 0 ? 'bg-green-400' : 'bg-green-600'}`}
                         style={{ 
                            top: segment.y * TILE_SIZE, 
                            left: segment.x * TILE_SIZE, 
                            width: TILE_SIZE, 
                            height: TILE_SIZE 
                        }}
                    ></div>
                ))}
                {/* Food */}
                {hasStarted && (
                    <div 
                        className="absolute bg-red-500 rounded-full"
                        style={{
                            top: food.y * TILE_SIZE,
                            left: food.x * TILE_SIZE,
                            width: TILE_SIZE,
                            height: TILE_SIZE
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Snake;