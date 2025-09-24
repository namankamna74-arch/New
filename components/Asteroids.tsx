
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSound } from '../hooks/useSound';
import GameModal from './GameModal';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const WIDTH = 600;
const HEIGHT = 600;
const SHIP_SIZE = 20;
const BULLET_SPEED = 7;
const SHIP_ACCELERATION = 0.1;
const SHIP_TURN_SPEED = 5;
const FRICTION = 0.99;
const ASTEROID_SIZES = [40, 25, 15];

const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );
interface GameObject { x: number; y: number; vx: number; vy: number; angle: number; }
interface Ship extends GameObject {}
interface Bullet extends GameObject { id: number; lifetime: number; }
interface Asteroid extends GameObject { id: number; size: number; }

const Asteroids: React.FC = () => {
    const [ship, setShip] = useState<Ship>({ x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, angle: -90 });
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [isGameOver, setIsGameOver] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isInvincible, setIsInvincible] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const keysPressed = useRef<{ [key: string]: boolean }>({}).current;
    const gameLoopRef = useRef<number>();
    const isMuted = useAppStore(state => state.isMuted);
    // FIX: Pass boolean argument to sound functions.
    const { playSwoosh, playCapture, playLose } = useSound(isMuted);

    const resetShip = useCallback(() => {
        setShip({ x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, angle: -90 });
        setIsInvincible(true);
        setTimeout(() => setIsInvincible(false), 2000);
    }, []);
    
    const startLevel = useCallback((level: number) => {
        const initialAsteroids: Asteroid[] = [];
        for (let i = 0; i < 4 + level; i++) {
            let x, y;
            do {
                x = Math.random() * WIDTH;
                y = Math.random() * HEIGHT;
            } while (Math.hypot(x - WIDTH/2, y - HEIGHT/2) < 100); // Don't spawn on player
            initialAsteroids.push({
                id: Math.random(), x, y,
                vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1,
                angle: 0, size: 0,
            });
        }
        setAsteroids(initialAsteroids);
    }, []);

    const startGame = useCallback(() => {
        setScore(0);
        setLives(3);
        setIsGameOver(false);
        setHasStarted(true);
        resetShip();
        startLevel(1);
    }, [resetShip, startLevel]);

    const gameLoop = useCallback(() => {
        if (!hasStarted || isGameOver) return;

        // --- Ship Movement ---
        setShip(s => {
            let { x, y, vx, vy, angle } = s;
            if (keysPressed['ArrowUp'] || keysPressed['w']) {
                vx += Math.cos(angle * Math.PI / 180) * SHIP_ACCELERATION;
                vy += Math.sin(angle * Math.PI / 180) * SHIP_ACCELERATION;
            }
            if (keysPressed['ArrowLeft'] || keysPressed['a']) angle -= SHIP_TURN_SPEED;
            if (keysPressed['ArrowRight'] || keysPressed['d']) angle += SHIP_TURN_SPEED;

            vx *= FRICTION;
            vy *= FRICTION;
            x = (x + vx + WIDTH) % WIDTH;
            y = (y + vy + HEIGHT) % HEIGHT;
            
            return { x, y, vx, vy, angle };
        });

        // --- Bullet Movement & Collision ---
        setBullets(bs => {
            const stillAlive = [];
            for (const b of bs) {
                let alive = true;
                const nextB = {
                    ...b,
                    x: (b.x + b.vx + WIDTH) % WIDTH,
                    y: (b.y + b.vy + HEIGHT) % HEIGHT,
                    lifetime: b.lifetime - 1
                };
                if (nextB.lifetime <= 0) {
                    alive = false;
                }

                setAsteroids(as => {
                    const nextAsteroids: Asteroid[] = [];
                    let hit = false;
                    for (const a of as) {
                        const aSize = ASTEROID_SIZES[a.size];
                        if (!hit && alive && Math.hypot(a.x - nextB.x, a.y - nextB.y) < aSize) {
                            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                            playCapture(false);
                            setScore(s => s + (a.size + 1) * 10);
                            hit = true;
                            alive = false;
                            if (a.size < 2) { // not small
                                for (let k = 0; k < 2; k++) {
                                    nextAsteroids.push({
                                        id: Math.random(), x: a.x, y: a.y,
                                        vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1,
                                        angle: 0, size: a.size + 1
                                    });
                                }
                            }
                        } else {
                            nextAsteroids.push(a);
                        }
                    }
                    return nextAsteroids;
                });
                if (alive) {
                    stillAlive.push(nextB);
                }
            }
            return stillAlive;
        });

        // --- Asteroid Movement & Ship Collision ---
        setAsteroids(as => {
            let shipHit = false;
            const nextAsteroids = as.map(a => {
                const nextA = { ...a, x: (a.x + a.vx + WIDTH) % WIDTH, y: (a.y + a.vy + HEIGHT) % HEIGHT };
                if (!isInvincible && !shipHit) {
                    const aSize = ASTEROID_SIZES[nextA.size];
                    if (Math.hypot(nextA.x - ship.x, nextA.y - ship.y) < aSize + SHIP_SIZE / 2) {
                       shipHit = true;
                    }
                }
                return nextA;
            });
            if (shipHit) {
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playLose(false);
                setLives(l => {
                    const newLives = l - 1;
                    if (newLives <= 0) {
                        setIsGameOver(true);
                        setHasStarted(false);
                    } else {
                        resetShip();
                    }
                    return newLives;
                });
            }
            return nextAsteroids;
        });

        setAsteroids(as => {
            if (as.length === 0 && hasStarted && !isGameOver) {
                 startLevel(Math.floor(score / 500) + 1); // Next level
                 return [];
            }
            return as;
        });
        
        gameLoopRef.current = requestAnimationFrame(gameLoop);

    }, [hasStarted, isGameOver, keysPressed, ship, isInvincible, score, resetShip, startLevel, playCapture, playLose]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed[e.key] = true;
            if (hasStarted && (e.key === ' ' || e.key === 'Spacebar') && bullets.length < 5) {
                e.preventDefault();
                // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
                playSwoosh(false);
                setBullets(bs => [...bs, {
                    id: Math.random(), x: ship.x, y: ship.y,
                    vx: Math.cos(ship.angle * Math.PI / 180) * BULLET_SPEED + ship.vx,
                    vy: Math.sin(ship.angle * Math.PI / 180) * BULLET_SPEED + ship.vy,
                    angle: 0, lifetime: 60,
                }]);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed[e.key] = false; };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [hasStarted, ship, bullets.length, playSwoosh]);
    
    useEffect(() => {
        if (hasStarted) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(gameLoopRef.current as number);
    }, [hasStarted, gameLoop]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full font-orbitron bg-black relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Asteroids">
                        <p><strong>Objective:</strong> Survive! Destroy all the asteroids without getting hit.</p>
                        <p><strong>Controls:</strong></p>
                        <ul className="list-disc list-inside mt-2">
                            <li><strong>Arrow Keys / WASD:</strong> Rotate your ship and apply thrust.</li>
                            <li><strong>Spacebar:</strong> Fire your laser cannons.</li>
                        </ul>
                        <p className="mt-2">Your ship will wrap around the screen edges. Good luck, pilot!</p>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 z-30" aria-label="Help"><HelpIcon /></button>
            <div className="flex justify-between w-full max-w-[600px] text-lg mb-2 px-2">
                <span>Score: {score}</span>
                <span>Lives: {lives > 0 ? '🔺'.repeat(lives) : ''}</span>
            </div>
            <div className="relative border-2 border-primary" style={{ width: WIDTH, height: HEIGHT }}>
                <AnimatePresence>
                 {(!hasStarted || isGameOver) && (
                    <GameModal
                        title={isGameOver ? "Game Over" : "Asteroids"}
                        status={isGameOver ? `Final Score: ${score}` : "Use Arrows to move, Space to shoot."}
                        buttonText={isGameOver ? "Play Again" : "Start Game"}
                        onButtonClick={startGame}
                    />
                )}
                </AnimatePresence>
                <svg width={WIDTH} height={HEIGHT} className="bg-black">
                    {hasStarted && <>
                        <g transform={`translate(${ship.x}, ${ship.y}) rotate(${ship.angle})`} opacity={isInvincible ? 0.5 : 1}>
                            <polygon points={`${SHIP_SIZE},0 ${-SHIP_SIZE/2},${SHIP_SIZE/2} ${-SHIP_SIZE/2},${-SHIP_SIZE/2}`} fill="none" stroke="white" strokeWidth="2" />
                            {(keysPressed['ArrowUp'] || keysPressed['w']) && <polygon points={`${-SHIP_SIZE/2},-5 ${-SHIP_SIZE*0.8},0 ${-SHIP_SIZE/2},5`} fill="orange" />}
                        </g>
                        {bullets.map(b => <circle key={b.id} cx={b.x} cy={b.y} r="2" fill="white" />)}
                        {asteroids.map(a => (
                            <g key={a.id} transform={`translate(${a.x}, ${a.y})`}>
                                <polygon points="-20,20 20,20 20,-20 -20,-20" fill="none" stroke="white" strokeWidth="2" transform={`scale(${ASTEROID_SIZES[a.size]/40})`}/>
                            </g>
                        ))}
                    </>}
                </svg>
            </div>
        </div>
    );
};

export default Asteroids;
