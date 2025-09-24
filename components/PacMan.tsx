
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tile, PacManBoard, Position, Direction, Ghost } from '../types';
import { useSound } from '../hooks/useSound';
import { initialBoardLayout, TILE_SIZE } from './pacman/board';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const useGameLoop = (callback: (deltaTime: number) => void, isActive: boolean) => {
    useEffect(() => {
        if (!isActive) return;
        let lastTime = 0;
        let animationFrameId: number;

        const loop = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) || 0;
            lastTime = currentTime;
            callback(deltaTime);
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [callback, isActive]);
};

const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const PacMan: React.FC = () => {
    const [board, setBoard] = useState<PacManBoard>(initialBoardLayout);
    // FIX: Explicitly type the pacman state to avoid inferring Direction as string.
    const [pacman, setPacman] = useState<{ pos: Position; speed: number; direction: Direction; nextDirection: Direction; }>({ pos: { x: 13, y: 23 }, speed: 0.12, direction: 'STOP', nextDirection: 'STOP' });
    const [ghosts, setGhosts] = useState<Ghost[]>([
        { id: 1, name: 'Blinky', position: { x: 13, y: 11 }, direction: 'LEFT', color: 'bg-red-500', isFrightened: false, isEaten: false, spawnPoint: {x: 13, y: 11} },
        { id: 2, name: 'Pinky', position: { x: 11, y: 14 }, direction: 'UP', color: 'bg-pink-400', isFrightened: false, isEaten: false, spawnPoint: {x: 11, y: 14} },
        { id: 3, name: 'Inky', position: { x: 13, y: 14 }, direction: 'UP', color: 'bg-cyan-400', isFrightened: false, isEaten: false, spawnPoint: {x: 13, y: 14} },
        { id: 4, name: 'Clyde', position: { x: 15, y: 14 }, direction: 'UP', color: 'bg-orange-400', isFrightened: false, isEaten: false, spawnPoint: {x: 15, y: 14} },
    ]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameMessage, setGameMessage] = useState('');
    const [frightenedTimer, setFrightenedTimer] = useState(0);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playChomp, playEatGhost, playDeath } = useSound(isMuted);

    const totalPellets = useMemo(() => initialBoardLayout.flat().filter(tile => tile === Tile.PELLET || tile === Tile.POWER_PELLET).length, []);
    const pelletsEaten = useMemo(() => totalPellets - board.flat().filter(tile => tile === Tile.PELLET || tile === Tile.POWER_PELLET).length, [board, totalPellets]);

    const isWall = (pos: Position) => {
        const boardY = Math.floor(pos.y);
        const boardX = Math.floor(pos.x);
        return board[boardY]?.[boardX] === Tile.WALL;
    };
    
    const getNextPosition = (pos: Position, dir: Direction): Position => {
        const {x, y} = pos;
        if (y === 14 && x <= 0 && dir === 'LEFT') return { x: 27, y: 14 };
        if (y === 14 && x >= 27 && dir === 'RIGHT') return { x: 0, y: 14 };
        
        switch (dir) {
            case 'UP': return { x, y: y - 1 };
            case 'DOWN': return { x, y: y + 1 };
            case 'LEFT': return { x: x - 1, y };
            case 'RIGHT': return { x: x + 1, y };
            default: return pos;
        }
    };
    
    const getOppositeDirection = (dir: Direction): Direction => {
        if(dir === 'UP') return 'DOWN';
        if(dir === 'DOWN') return 'UP';
        if(dir === 'LEFT') return 'RIGHT';
        if(dir === 'RIGHT') return 'LEFT';
        return 'STOP';
    };


    const resetLevel = () => {
        setPacman({ pos: { x: 13, y: 23 }, speed: 0.12, direction: 'STOP', nextDirection: 'STOP' });
        setGhosts(ghosts.map(g => ({ ...g, position: g.spawnPoint, isEaten: false, isFrightened: false })));
    };
    
    const resetGame = () => {
        setBoard(initialBoardLayout);
        setScore(0);
        setLives(3);
        setIsGameOver(false);
        setGameMessage('');
        resetLevel();
    }

    const gameTick = useCallback(() => {
        // --- Pacman Movement ---
        setPacman(p => {
            let { pos, direction, nextDirection, speed } = p;
            
            // Check if next direction is valid
            if (nextDirection !== direction) {
                const nextGridPos = {x: Math.round(pos.x), y: Math.round(pos.y)};
                const nextTilePos = getNextPosition(nextGridPos, nextDirection);
                 if (!isWall(nextTilePos)) {
                    direction = nextDirection;
                }
            }
            
            let newPos = { ...pos };
            switch (direction) {
                case 'UP': newPos.y -= speed; break;
                case 'DOWN': newPos.y += speed; break;
                case 'LEFT': newPos.x -= speed; break;
                case 'RIGHT': newPos.x += speed; break;
            }

            // Tunnel logic
            if (newPos.y > 13.5 && newPos.y < 14.5) {
                if (newPos.x < -1) newPos.x = 28;
                if (newPos.x > 28) newPos.x = -1;
            }

            const currentGridPos = {x: Math.round(newPos.x), y: Math.round(newPos.y)};
            const nextMovePos = getNextPosition(currentGridPos, direction);
            if (isWall(nextMovePos)) {
                // Snap to grid and stop
                newPos = currentGridPos;
                direction = 'STOP';
            }

            return { ...p, pos: newPos, direction };
        });

        const pacmanGridPos = { x: Math.round(pacman.pos.x), y: Math.round(pacman.pos.y) };

        // --- Pellet Collision ---
        const tile = board[pacmanGridPos.y]?.[pacmanGridPos.x];
        if (tile === Tile.PELLET || tile === Tile.POWER_PELLET) {
            playChomp(false);
            const newBoard = board.map(row => [...row]);
            newBoard[pacmanGridPos.y][pacmanGridPos.x] = Tile.EMPTY;
            setBoard(newBoard);
            setScore(prev => prev + (tile === Tile.PELLET ? 10 : 50));
            
            if (tile === Tile.POWER_PELLET) {
                setFrightenedTimer(8000);
                setGhosts(ghosts.map(g => ({...g, isFrightened: !g.isEaten })));
            }
        }
        
        // --- Ghost Movement & Collision ---
        setGhosts(prevGhosts => prevGhosts.map(ghost => {
            if (ghost.isEaten) {
                 if(ghost.position.x === ghost.spawnPoint.x && ghost.position.y === ghost.spawnPoint.y) {
                    return {...ghost, isEaten: false, isFrightened: false};
                }
                // Pathfind back to spawn (simple greedy)
                // FIX: Use a typed array for directions to prevent type errors.
                 const validDirections: Direction[] = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).filter(dir => !isWall(getNextPosition(ghost.position, dir)))
                 validDirections.sort((a,b) => {
                    const posA = getNextPosition(ghost.position, a);
                    const posB = getNextPosition(ghost.position, b);
                    const distA = Math.hypot(posA.x - ghost.spawnPoint.x, posA.y - ghost.spawnPoint.y);
                    const distB = Math.hypot(posB.x - ghost.spawnPoint.x, posB.y - ghost.spawnPoint.y);
                    return distA - distB;
                });
                const newDirection = validDirections[0]!;
                const newGhostPos = getNextPosition(ghost.position, newDirection);
                return {...ghost, position: newGhostPos, direction: newDirection};
            }
            
            // Ghost AI
            // FIX: Use a typed array for directions to prevent type errors.
            const possibleDirections: Direction[] = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).filter(d => d !== getOppositeDirection(ghost.direction));
            const validDirections: Direction[] = possibleDirections.filter(dir => !isWall(getNextPosition(ghost.position, dir)));
            if (validDirections.length === 0) validDirections.push(getOppositeDirection(ghost.direction));

            let targetPos = { ...pacmanGridPos };
            if (ghost.isFrightened) { 
                 validDirections.sort(() => Math.random() - 0.5); // Random move when frightened
            } else {
                switch(ghost.name) {
                    case 'Pinky': // Ambusher
                         for (let i=4; i>0; i--) {
                            const tempTarget = getNextPosition(targetPos, pacman.direction);
                            if (!isWall(tempTarget)) targetPos = tempTarget;
                         }
                         break;
                    case 'Inky': // Flanker
                         const blinky = prevGhosts.find(g => g.name === 'Blinky')!;
                         const twoAhead = getNextPosition(getNextPosition(pacmanGridPos, pacman.direction), pacman.direction);
                         targetPos.x = twoAhead.x + (twoAhead.x - blinky.position.x);
                         targetPos.y = twoAhead.y + (twoAhead.y - blinky.position.y);
                         break;
                    case 'Clyde': // Cowardly
                        if (Math.hypot(ghost.position.x - pacmanGridPos.x, ghost.position.y - pacmanGridPos.y) < 8) {
                            targetPos = {x: 0, y: 30}; // Flee to corner
                        }
                        break;
                    case 'Blinky': // Chaser
                    default:
                        // Default target is pacman
                        break;
                }
                 validDirections.sort((a,b) => {
                    const posA = getNextPosition(ghost.position, a);
                    const posB = getNextPosition(ghost.position, b);
                    const distA = Math.hypot(posA.x - targetPos.x, posA.y - targetPos.y);
                    const distB = Math.hypot(posB.x - targetPos.x, posB.y - targetPos.y);
                    return distA - distB;
                });
            }

            const newDirection = validDirections[0]!;
            const newGhostPos = getNextPosition(ghost.position, newDirection);
            
            // Collision with Pacman
            if (newGhostPos.x === pacmanGridPos.x && newGhostPos.y === pacmanGridPos.y) {
                if (ghost.isFrightened) {
                    playEatGhost(false);
                    setScore(s => s + 200);
                    return { ...ghost, isEaten: true, isFrightened: false, position: newGhostPos };
                } else {
                    playDeath(false);
                    setLives(l => {
                        if (l - 1 <= 0) {
                            setIsGameOver(true);
                            setGameMessage('Game Over');
                        } else {
                           resetLevel();
                        }
                        return l - 1;
                    });
                }
            }

            return { ...ghost, position: newGhostPos, direction: newDirection };
        }));
        
        setFrightenedTimer(t => {
            const newTime = t - (1000 / 60);
            if (newTime <= 0 && t > 0) {
                 setGhosts(gs => gs.map(g => ({...g, isFrightened: false})));
                 return 0;
            }
            return newTime;
        });


    }, [board, pacman, playChomp, playEatGhost, playDeath]);

    useGameLoop(gameTick, !isGameOver && lives > 0);

    useEffect(() => {
        if (pelletsEaten === totalPellets && totalPellets > 0) {
             setIsGameOver(true);
             setGameMessage('You Win!');
        }
    }, [pelletsEaten, totalPellets]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGameOver) {
                if(e.key === 'Enter') resetGame();
                return;
            }
            let dir: Direction = 'STOP';
            if (e.key === 'ArrowUp' || e.key === 'w') dir = 'UP';
            else if (e.key === 'ArrowDown' || e.key === 's') dir = 'DOWN';
            else if (e.key === 'ArrowLeft' || e.key === 'a') dir = 'LEFT';
            else if (e.key === 'ArrowRight' || e.key === 'd') dir = 'RIGHT';
            if(dir !== 'STOP') setPacman(p => ({ ...p, nextDirection: dir }));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameOver]);

    const getRotation = (dir: Direction) => {
        if (dir === 'RIGHT') return 'rotate(0deg)';
        if (dir === 'DOWN') return 'rotate(90deg)';
        if (dir === 'LEFT') return 'rotate(180deg)';
        if (dir === 'UP') return 'rotate(270deg)';
        return 'rotate(0deg)';
    }

    return (
        <div className="flex flex-col items-center justify-center bg-black text-white w-full h-full font-orbitron relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Pac-Man">
                        <p><strong>Objective:</strong> Eat all the pellets in the maze while avoiding the ghosts!</p>
                        <p><strong>Controls:</strong> Use the Arrow Keys or WASD to move.</p>
                        <ul className="list-disc list-inside mt-2">
                            <li><strong>Pellets:</strong> Eating these small dots increases your score.</li>
                            <li><strong>Power Pellets:</strong> The large flashing dots will turn the ghosts blue. While they are blue, you can eat them for extra points!</li>
                            <li><strong>Ghosts:</strong> Each ghost has a unique personality. Don't let them catch you!</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <style>{`
                @keyframes chomp {
                    0%, 100% { clip-path: inset(0 0 0 0); }
                    50% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0% 80%, 50% 50%, 0 20%); }
                }
                .pacman-chomp {
                    animation: chomp 0.4s infinite;
                }
            `}</style>
             <div className="flex justify-between w-[560px] text-lg mb-2">
                <span>Score: {score}</span>
                <span>Lives: {lives > 0 ? '💛'.repeat(lives) : ''}</span>
            </div>
            <div className="relative bg-black border-2 border-blue-500 rounded" style={{ width: TILE_SIZE * 28, height: TILE_SIZE * 31 }}>
                {isGameOver && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                        <h2 className="text-5xl text-yellow-400 mb-4">{gameMessage}</h2>
                        <button onClick={resetGame} className="px-4 py-2 bg-primary rounded-lg animate-pulse">Play Again</button>
                    </div>
                )}
                {/* Board */}
                {board.map((row, y) => (
                    <div key={y} className="flex">
                        {row.map((tile, x) => (
                            <div key={x} className="flex items-center justify-center" style={{ width: TILE_SIZE, height: TILE_SIZE }}>
                                {tile === Tile.WALL && <div className="w-full h-full bg-blue-700"></div>}
                                {tile === Tile.PELLET && <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full"></div>}
                                {tile === Tile.POWER_PELLET && <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>}
                            </div>
                        ))}
                    </div>
                ))}
                {/* Pacman */}
                <div className="absolute transition-transform duration-75" style={{ top: pacman.pos.y * TILE_SIZE, left: pacman.pos.x * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                     <div className="w-full h-full bg-yellow-400 rounded-full pacman-chomp" style={{ transform: getRotation(pacman.direction) }}></div>
                </div>
                {/* Ghosts */}
                {ghosts.map(ghost => (
                    <div key={ghost.id} className="absolute transition-transform duration-100" style={{ top: ghost.position.y * TILE_SIZE, left: ghost.position.x * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                        <div className={`w-full h-full rounded-t-full ${ghost.isEaten ? 'opacity-50' : ghost.isFrightened ? 'bg-blue-800 animate-pulse' : ghost.color}`}>
                           <div className="absolute bottom-1/4 w-full flex justify-center gap-1">
                                <div className={`w-1/3 h-1/3 ${ghost.isEaten ? 'bg-transparent' : 'bg-white'} rounded-full flex items-center justify-center`}> <div className="w-1/2 h-1/2 bg-black rounded-full"></div></div>
                                <div className={`w-1/3 h-1/3 ${ghost.isEaten ? 'bg-transparent' : 'bg-white'} rounded-full flex items-center justify-center`}> <div className="w-1/2 h-1/2 bg-black rounded-full"></div></div>
                           </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PacMan;
