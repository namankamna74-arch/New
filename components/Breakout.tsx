
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import GameModal from './GameModal';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const WIDTH = 600;
const HEIGHT = 500;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_WIDTH = WIDTH / BRICK_COLS;
const BRICK_HEIGHT = 20;

const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );
interface Brick { x: number; y: number; active: boolean; color: string; }

const createLevel = (): Brick[] => {
    const bricks: Brick[] = [];
    const colors = ['#A855F7', '#EC4899', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks.push({
                x: c * BRICK_WIDTH,
                y: r * BRICK_HEIGHT + 50,
                active: true,
                color: colors[r % colors.length]
            });
        }
    }
    return bricks;
}

const Breakout: React.FC = () => {
    const [paddleX, setPaddleX] = useState(WIDTH / 2 - PADDLE_WIDTH / 2);
    const [ball, setBall] = useState({ x: WIDTH / 2, y: HEIGHT - 50, dx: 3, dy: -3 });
    const [bricks, setBricks] = useState<Brick[]>(createLevel());
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [hasStarted, setHasStarted] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameWon, setIsGameWon] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const gameLoopRef = useRef<number>();
    const isMuted = useAppStore(state => state.isMuted);
    const { playBlock, playScore, playLose, playWin } = useSound(isMuted);

    const resetBallAndPaddle = useCallback(() => {
        setPaddleX(WIDTH / 2 - PADDLE_WIDTH / 2);
        setBall({ x: WIDTH / 2, y: HEIGHT - 50, dx: 3, dy: -3 });
    }, []);

    const startGame = useCallback(() => {
        resetBallAndPaddle();
        setScore(0);
        setLives(3);
        setBricks(createLevel());
        setIsGameOver(false);
        setIsGameWon(false);
        setHasStarted(true);
    }, [resetBallAndPaddle]);

    const gameLoop = useCallback(() => {
        if (!hasStarted) return;

        setBall(prevBall => {
            let { x, y, dx, dy } = prevBall;
            x += dx;
            y += dy;

            // Wall collision
            if (x + BALL_RADIUS > WIDTH || x - BALL_RADIUS < 0) { dx = -dx; playBlock(false); }
            if (y - BALL_RADIUS < 0) { dy = -dy; playBlock(false); }

            // Paddle collision
            if (y + BALL_RADIUS > HEIGHT - PADDLE_HEIGHT && x > paddleX && x < paddleX + PADDLE_WIDTH) {
                dy = -dy;
                let collidePoint = x - (paddleX + PADDLE_WIDTH / 2);
                dx = Math.max(-4, Math.min(4, collidePoint * 0.1));
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playBlock(false);
            }

            // Bottom wall (lose life)
            if (y + BALL_RADIUS > HEIGHT) {
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playLose(false);
                setLives(l => {
                    const newLives = l - 1;
                    if (newLives <= 0) {
                        setIsGameOver(true);
                        setHasStarted(false);
                    } else {
                        resetBallAndPaddle();
                    }
                    return newLives;
                });
                return { x: WIDTH / 2, y: HEIGHT - 50, dx: 3, dy: -3 }; // Reset ball position immediately
            }

            // Brick collision
            setBricks(prevBricks => {
                const newBricks = [...prevBricks];
                let hitBrick = false;
                for (let brick of newBricks) {
                    if (brick.active) {
                        if (x > brick.x && x < brick.x + BRICK_WIDTH && y > brick.y && y < brick.y + BRICK_HEIGHT) {
                            dy = -dy;
                            brick.active = false;
                            hitBrick = true;
                            setScore(s => s + 10);
                            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                            playScore(false);
                            break;
                        }
                    }
                }
                if (hitBrick && newBricks.every(b => !b.active)) {
                    // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                    playWin(false);
                    setIsGameWon(true);
                    setHasStarted(false);
                }
                return newBricks;
            });
            return { x, y, dx, dy };
        });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [hasStarted, paddleX, playBlock, playLose, playScore, playWin, resetBallAndPaddle]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const gameArea = (e.currentTarget as HTMLElement);
            if (gameArea) {
                const rect = gameArea.getBoundingClientRect();
                const relativeX = e.clientX - rect.left;
                setPaddleX(Math.max(0, Math.min(relativeX - PADDLE_WIDTH / 2, WIDTH - PADDLE_WIDTH)));
            }
        };

        const gameArea = document.getElementById('breakout-area');
        if (gameArea) {
            gameArea.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            if (gameArea) gameArea.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        if (hasStarted) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
    }, [hasStarted, gameLoop]);


    return (
        <div className="flex flex-col items-center justify-center w-full h-full font-orbitron bg-black relative">
             <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Breakout">
                        <p><strong>Objective:</strong> Clear all the bricks at the top of the screen by hitting them with the ball.</p>
                        <p><strong>Controls:</strong> Move your mouse left and right to control the paddle at the bottom.</p>
                        <p className="mt-2">Don't let the ball fall past your paddle, or you'll lose a life! You have 3 lives. Clear all the bricks to win.</p>
                    </TutorialModal>
                )}
             </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 z-30" aria-label="Help"><HelpIcon /></button>
            <div className="flex justify-between w-full max-w-[600px] text-lg mb-2 px-2">
                <span>Score: {score}</span>
                <span>Lives: {lives > 0 ? '❤️'.repeat(lives) : ''}</span>
            </div>
            <div id="breakout-area" className="relative cursor-none" style={{ width: WIDTH, height: HEIGHT, backgroundColor: '#111827' }}>
                <AnimatePresence>
                    {(!hasStarted || isGameOver || isGameWon) && (
                         <GameModal 
                            title={isGameOver ? "Game Over" : isGameWon ? "You Win!" : "Breakout"}
                            status={isGameOver || isGameWon ? `Final Score: ${score}` : "Clear all the bricks!"}
                            buttonText="Start Game"
                            onButtonClick={startGame}
                        />
                    )}
                </AnimatePresence>
                
                {hasStarted && <>
                    {bricks.map((brick, i) => brick.active && (
                        <div key={i} className="absolute border border-black" style={{ left: brick.x, top: brick.y, width: BRICK_WIDTH, height: BRICK_HEIGHT, backgroundColor: brick.color }}></div>
                    ))}
                    <div className="absolute rounded-md bg-primary" style={{ left: paddleX, bottom: 0, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }}></div>
                    <div className="absolute rounded-full bg-white" style={{ left: ball.x - BALL_RADIUS, top: ball.y - BALL_RADIUS, width: BALL_RADIUS*2, height: BALL_RADIUS*2 }}></div>
                </>}
            </div>
        </div>
    );
};

export default Breakout;
