
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import GameModal from './GameModal';
import { useAppStore } from '../store';

const WIDTH = 500;
const HEIGHT = 500;
const PLAYER_WIDTH = 40;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 10;

interface GameObject { x: number; y: number; }
interface Alien extends GameObject { id: number; }

const SpaceInvaders: React.FC = () => {
    const [player, setPlayer] = useState<GameObject>({ x: WIDTH / 2 - PLAYER_WIDTH / 2, y: HEIGHT - 40 });
    const [bullets, setBullets] = useState<GameObject[]>([]);
    const [aliens, setAliens] = useState<Alien[]>([]);
    const [alienDirection, setAlienDirection] = useState<'right' | 'left'>('right');
    const [score, setScore] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameMessage, setGameMessage] = useState("");
    const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
    const gameLoopRef = useRef<number>();
    const isMuted = useAppStore(state => state.isMuted);
    const { playSwoosh, playCapture, playLose, playWin } = useSound(isMuted);

    const startGame = useCallback(() => {
        setPlayer({ x: WIDTH / 2 - PLAYER_WIDTH / 2, y: HEIGHT - 40 });
        setBullets([]);
        const initialAliens: Alien[] = [];
        for (let r = 0; r < ALIEN_ROWS; r++) {
            for (let c = 0; c < ALIEN_COLS; c++) {
                initialAliens.push({ id: r * ALIEN_COLS + c, x: c * 40 + 30, y: r * 30 + 30 });
            }
        }
        setAliens(initialAliens);
        setAlienDirection('right');
        setScore(0);
        setIsGameOver(false);
        setGameMessage("");
        setHasStarted(true);
    }, []);

    const gameLoop = useCallback(() => {
        if (!hasStarted) return;

        // Player movement
        setPlayer(p => {
            let newX = p.x;
            if (keysPressed['ArrowLeft'] && p.x > 0) newX -= 5;
            if (keysPressed['ArrowRight'] && p.x < WIDTH - PLAYER_WIDTH) newX += 5;
            return { ...p, x: newX };
        });

        // Bullet movement and collision
        setBullets(prevBullets => {
            const newBullets = prevBullets.map(b => ({ ...b, y: b.y - 7 })).filter(b => b.y > 0);
            const remainingBullets = [];
            
            for(let bullet of newBullets) {
                let hit = false;
                setAliens(prevAliens => {
                    const remainingAliens = [];
                    for(let alien of prevAliens) {
                        if(!hit && bullet.x > alien.x && bullet.x < alien.x + 30 && bullet.y > alien.y && bullet.y < alien.y + 20) {
                            hit = true;
                            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                            playCapture(false);
                            setScore(s => s + 10);
                        } else {
                            remainingAliens.push(alien);
                        }
                    }
                    return remainingAliens;
                })
                if(!hit) {
                    remainingBullets.push(bullet);
                }
            }
            return remainingBullets;
        });


        // Alien movement
        setAliens(as => {
            let changeDirection = false;
            let gameOver = false;
            const newAliens = as.map(a => {
                let newX = a.x + (alienDirection === 'right' ? 0.5 : -0.5);
                if (newX <= 0 || newX >= WIDTH - 30) changeDirection = true;
                if (a.y > HEIGHT - 50) gameOver = true;
                return { ...a, x: newX };
            });

            if (gameOver) {
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playLose(false);
                setGameMessage("The invaders reached your territory!");
                setIsGameOver(true);
                setHasStarted(false);
                return as;
            }
            if (newAliens.length === 0 && as.length > 0) {
                 // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playWin(false);
                setGameMessage("You saved the day!");
                setIsGameOver(true);
                setHasStarted(false);
                return [];
            }


            if (changeDirection) {
                setAlienDirection(d => d === 'right' ? 'left' : 'right');
                return newAliens.map(a => ({...a, y: a.y + 10}));
            }
            return newAliens;
        });


        gameLoopRef.current = requestAnimationFrame(gameLoop);

    }, [hasStarted, alienDirection, playCapture, playLose, playWin]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed[e.key] = true;
            if (hasStarted && (e.key === ' ' || e.key === 'Spacebar')) {
                e.preventDefault();
                setBullets(bs => {
                    if (bs.length < 3) {
                        // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                        playSwoosh(false);
                        return [...bs, { x: player.x + PLAYER_WIDTH / 2 - 2, y: player.y }];
                    }
                    return bs;
                });
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed[e.key] = false; };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [hasStarted, player, playSwoosh]);
    
    useEffect(() => {
        if (hasStarted && !isGameOver) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(gameLoopRef.current as number);
    }, [hasStarted, isGameOver, gameLoop]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full font-orbitron bg-black">
            <div className="flex justify-between w-full max-w-[500px] text-lg mb-2 px-2">
                <span>Score: {score}</span>
            </div>
            <div className="relative border-2 border-purple-400" style={{ width: WIDTH, height: HEIGHT }}>
                 {(!hasStarted || isGameOver) && (
                    <GameModal 
                        title={isGameOver ? "Game Over" : "Space Invaders"}
                        status={isGameOver ? gameMessage : "Defend the planet!"}
                        buttonText="Start Game"
                        onButtonClick={startGame}
                    />
                )}
                {hasStarted && <>
                    <div className="text-3xl absolute" style={{ left: player.x, top: player.y }}>🛸</div>
                    {bullets.map((b, i) => <div key={i} className="absolute w-1 h-3 bg-yellow-300" style={{ left: b.x, top: b.y }}></div>)}
                    {aliens.map(a => <div key={a.id} className="text-2xl absolute" style={{ left: a.x, top: a.y }}>👾</div>)}
                </>}
            </div>
        </div>
    );
};

export default SpaceInvaders;
