
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import GameModal from './GameModal';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 15;
const WINNING_SCORE = 5;
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const Pong: React.FC = () => {
    const [ball, setBall] = useState({ x: WIDTH / 2, y: HEIGHT / 2, dx: 4, dy: 4 });
    const [playerY, setPlayerY] = useState(HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [aiY, setAiY] = useState(HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const [scores, setScores] = useState({ player: 0, ai: 0 });
    const [isGameActive, setIsGameActive] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const gameLoopRef = useRef<number>();
    const isMuted = useAppStore(state => state.isMuted);
    // FIX: Pass boolean argument to sound functions.
    const { playBlock, playScore, playWin, playLose } = useSound(isMuted);

    const resetBall = useCallback((direction: number = 1) => {
        setBall({
            x: WIDTH / 2 - BALL_SIZE / 2,
            y: HEIGHT / 2 - BALL_SIZE / 2,
            dx: 4 * direction,
            dy: Math.random() > 0.5 ? 4 : -4
        });
    }, []);
    
    const startGame = () => {
        setScores({ player: 0, ai: 0 });
        setWinner(null);
        setIsGameActive(true);
        resetBall();
    };

    const gameLoop = useCallback(() => {
        if (!isGameActive) return;

        // Ball movement
        setBall(b => {
            let newX = b.x + b.dx;
            let newY = b.y + b.dy;
            let newDx = b.dx;
            let newDy = b.dy;

            // Wall collision (top/bottom)
            if (newY <= 0 || newY >= HEIGHT - BALL_SIZE) {
                newDy = -newDy;
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playBlock(false);
            }

            // Paddle collision
            if ((newDx < 0 && newX <= PADDLE_WIDTH && newY + BALL_SIZE > playerY && newY < playerY + PADDLE_HEIGHT) ||
                (newDx > 0 && newX >= WIDTH - PADDLE_WIDTH - BALL_SIZE && newY + BALL_SIZE > aiY && newY < aiY + PADDLE_HEIGHT)) {
                newDx = -newDx * 1.05; // Increase speed slightly on hit
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playBlock(false);
            }

            return { x: newX, y: newY, dx: newDx, dy: newDy };
        });

        // AI movement
        setAiY(y => {
            const paddleCenter = y + PADDLE_HEIGHT / 2;
            const ballCenter = ball.y + BALL_SIZE / 2;
            // Add a slight delay/error margin to AI
            if (ball.dx > 0) {
                const idealY = y + (ballCenter - paddleCenter) * 0.1;
                return Math.max(0, Math.min(idealY, HEIGHT - PADDLE_HEIGHT));
            }
            return y;
        });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [isGameActive, playerY, aiY, ball.y, ball.dx, playBlock]);
    
    useEffect(() => {
        if (!isGameActive) return;

        const { x } = ball;
        let scored = false;
        let direction = 1;
        if (x < 0) {
            setScores(s => ({ ...s, ai: s.ai + 1 }));
            scored = true;
            direction = 1;
        } else if (x > WIDTH) {
            setScores(s => ({ ...s, player: s.player + 1 }));
            scored = true;
            direction = -1;
        }

        if (scored) {
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playScore(false);
            resetBall(direction);
        }
    }, [ball, isGameActive, playScore, resetBall]);

    useEffect(() => {
        if (!isGameActive) return;
        if (scores.player >= WINNING_SCORE) {
            setWinner('Player');
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playWin(false);
            setIsGameActive(false);
        } else if (scores.ai >= WINNING_SCORE) {
            setWinner('AI');
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playLose(false);
            setIsGameActive(false);
        }
    }, [scores, isGameActive, playWin, playLose]);

    useEffect(() => {
        if (isGameActive) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [isGameActive, gameLoop]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const newY = e.clientY - rect.top - PADDLE_HEIGHT / 2;
            setPlayerY(Math.max(0, Math.min(newY, HEIGHT - PADDLE_HEIGHT)));
        };
        const gameArea = document.getElementById('pong-area');
        if (gameArea) {
            gameArea.addEventListener('mousemove', handleMouseMove);
        }
        return () => {
            if (gameArea) gameArea.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full font-orbitron relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Pong">
                        <p><strong>Objective:</strong> Score points by hitting the ball past your opponent's paddle.</p>
                        <p><strong>Controls:</strong> Move your mouse up and down within the game area to control your paddle on the left.</p>
                        <p className="mt-2">The first player to score 5 points wins the game!</p>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <div className="flex justify-around w-full max-w-sm mb-2 text-2xl">
                <span>Player: {scores.player}</span>
                <span>AI: {scores.ai}</span>
            </div>
            <div id="pong-area" className="relative cursor-none bg-black border-2 border-primary" style={{ width: WIDTH, height: HEIGHT }}>
                <AnimatePresence>
                 {!isGameActive && (
                    <GameModal 
                        title={winner ? `${winner} Wins!` : "Pong"}
                        status={winner ? "Game Over" : "First to 5 points wins."}
                        buttonText={winner ? "Play Again" : "Start Game"}
                        onButtonClick={startGame}
                    />
                )}
                </AnimatePresence>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-transparent border-l-4 border-dashed border-gray-600"></div>

                <div className="absolute bg-white" style={{ left: 5, top: playerY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }}></div>
                <div className="absolute bg-white" style={{ right: 5, top: aiY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }}></div>
                
                {isGameActive && <div className="absolute bg-white" style={{ left: ball.x, top: ball.y, width: BALL_SIZE, height: BALL_SIZE }}></div>}
            </div>
        </div>
    );
};

export default Pong;
