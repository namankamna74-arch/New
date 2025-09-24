import React, { useState, useEffect, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import { GridType, TileData } from '../types';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const GRID_SIZE = 4;

const generateId = () => Math.random();

const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const getInitialGrid = (): GridType => {
    const grid: GridType = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    addRandomTile(grid);
    addRandomTile(grid);
    return grid;
};

const addRandomTile = (grid: GridType): GridType => {
    const emptyTiles: { r: number, c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === null) {
                emptyTiles.push({ r, c });
            }
        }
    }
    if (emptyTiles.length > 0) {
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        grid[r][c] = { id: generateId(), value: Math.random() < 0.9 ? 2 : 4, isNew: true };
    }
    return grid;
};

const slideAndMerge = (row: (TileData | null)[], playScore: (force?: boolean) => void): { newRow: (TileData | null)[], score: number } => {
    const filteredRow = row.filter(tile => tile !== null);
    const newRow: (TileData | null)[] = [];
    let score = 0;

    for (let i = 0; i < filteredRow.length; i++) {
        if (i + 1 < filteredRow.length && filteredRow[i]!.value === filteredRow[i + 1]!.value) {
            const newValue = filteredRow[i]!.value * 2;
            newRow.push({ id: generateId(), value: newValue, isMerged: true });
            score += newValue;
            i++; 
            playScore(false);
        } else {
            newRow.push(filteredRow[i]);
        }
    }

    while (newRow.length < GRID_SIZE) {
        newRow.push(null);
    }
    return { newRow, score };
};

const rotateGrid = (grid: GridType): GridType => {
    const newGrid: GridType = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            newGrid[c][GRID_SIZE - 1 - r] = grid[r][c];
        }
    }
    return newGrid;
};

const move = (grid: GridType, direction: 'left' | 'right' | 'up' | 'down', playScore: (force?: boolean) => void): { newGrid: GridType, score: number, moved: boolean } => {
    let currentGrid = JSON.parse(JSON.stringify(grid)).map((row: (TileData | null)[]) => row.map(tile => tile ? {id: tile.id, value: tile.value} : null));
    let totalScore = 0;
    let rotations = 0;

    if (direction === 'up') rotations = 1;
    if (direction === 'right') rotations = 2;
    if (direction === 'down') rotations = 3;
    
    for (let i = 0; i < rotations; i++) {
        currentGrid = rotateGrid(currentGrid);
    }

    const nextGrid: GridType = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        const { newRow, score } = slideAndMerge(currentGrid[r], playScore);
        totalScore += score;
        nextGrid.push(newRow);
    }
    
    currentGrid = nextGrid;
    
    for (let i = 0; i < (4 - rotations) % 4; i++) {
        currentGrid = rotateGrid(currentGrid);
    }

    const moved = JSON.stringify(grid.map(r => r.map(c => c ? c.value : null))) !== JSON.stringify(currentGrid.map(r => r.map(c => c ? c.value : null)));

    return { newGrid: currentGrid, score: totalScore, moved };
};

const isGameOver = (grid: GridType): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === null) return false; // empty cell
            if (c < GRID_SIZE - 1 && grid[r][c]?.value === grid[r][c + 1]?.value) return false; // can merge horizontally
            if (r < GRID_SIZE - 1 && grid[r][c]?.value === grid[r + 1][c]?.value) return false; // can merge vertically
        }
    }
    return true;
};

const TILE_COLORS: { [key: number]: string } = {
    2: 'bg-gray-700 text-gray-200', 4: 'bg-gray-600 text-gray-100',
    8: 'bg-orange-500 text-white', 16: 'bg-orange-600 text-white',
    32: 'bg-red-500 text-white', 64: 'bg-red-600 text-white',
    128: 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50', 256: 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/50',
    512: 'bg-green-500 text-white shadow-lg shadow-green-500/50', 1024: 'bg-green-600 text-white shadow-lg shadow-green-500/50',
    2048: 'bg-purple-500 text-white shadow-lg shadow-purple-500/50', 4096: 'bg-purple-600 text-white shadow-lg shadow-purple-500/50',
};

const TileComponent: React.FC<{ tile: TileData | null }> = ({ tile }) => {
    const value = tile?.value || 0;
    const colorClass = TILE_COLORS[value] || 'bg-gray-800';
    const textSize = value > 1000 ? 'text-3xl' : value > 100 ? 'text-4xl' : 'text-5xl';
    const animationClass = tile?.isNew ? 'animate-new-tile' : tile?.isMerged ? 'animate-merged-tile' : '';
    
    return (
        <div className={`w-24 h-24 rounded-lg flex items-center justify-center font-bold transition-colors duration-200 ${colorClass}`}>
            {value > 0 && <span className={`${textSize} ${animationClass}`}>{value}</span>}
        </div>
    );
};

const TwentyFortyEight: React.FC = () => {
    const [grid, setGrid] = useState<GridType>(getInitialGrid());
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playScore, playLose } = useSound(isMuted);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameOver) return;
        let direction: 'left' | 'right' | 'up' | 'down' | null = null;
        if (e.key === 'ArrowLeft') direction = 'left';
        if (e.key === 'ArrowRight') direction = 'right';
        if (e.key === 'ArrowUp') direction = 'up';
        if (e.key === 'ArrowDown') direction = 'down';

        if (direction) {
            e.preventDefault();
            const { newGrid, score: moveScore, moved } = move(grid, direction, playScore);
            if (moved) {
                setScore(s => s + moveScore);
                const gridWithNewTile = addRandomTile(newGrid);
                setGrid(gridWithNewTile);
                if (isGameOver(gridWithNewTile)) {
                    playLose(false);
                    setGameOver(true);
                }
            }
        }
    }, [grid, gameOver, playScore, playLose]);

    const resetGame = () => {
        setGrid(getInitialGrid());
        setScore(0);
        setGameOver(false);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full font-orbitron relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="2048">
                        <p><strong>Objective:</strong> Slide tiles to merge them and create a tile with the number 2048.</p>
                        <p><strong>Controls:</strong> Use the Arrow Keys to slide all tiles in a direction.</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>When two tiles with the same number touch, they merge into one!</li>
                            <li>A new tile (either a 2 or a 4) will appear on the board with every move.</li>
                            <li>The game ends when the board is full and no more moves can be made.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-0 right-0 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <style>{`
                @keyframes new-tile {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-new-tile { animation: new-tile 0.2s ease-out; }

                @keyframes merged-tile {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-merged-tile { animation: merged-tile 0.2s ease-out; }
            `}</style>
            <div className="flex justify-between items-center w-full max-w-md mb-4 px-2">
                <h1 className="text-4xl font-bold text-primary">2048</h1>
                <div className="text-center p-2 rounded-lg bg-black/20 w-28">
                    <div className="text-gray-400">Score</div>
                    <div className="text-2xl font-bold">{score}</div>
                </div>
            </div>
            <div className="relative p-4 bg-black/30 rounded-lg">
                 {gameOver && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
                        <h2 className="text-4xl text-red-400 mb-4">Game Over!</h2>
                        <button onClick={resetGame} className="px-4 py-2 bg-primary rounded-lg">Play Again</button>
                    </div>
                )}
                <div className="grid grid-cols-4 gap-4">
                    {grid.map((row, r) => row.map((tile, c) => <TileComponent key={`${r}-${c}-${tile?.id}`} tile={tile} />))}
                </div>
            </div>
            <button onClick={resetGame} className="mt-6 px-6 py-2 bg-primary-500/50 hover:bg-primary-500/70 rounded-lg font-semibold">New Game</button>
        </div>
    );
};

export default TwentyFortyEight;