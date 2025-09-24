
import React, { useState, useEffect, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import { GameGrid, Tetromino, TetrominoShape } from '../types';
import GameModal from './GameModal';
import { useAppStore } from '../store';

const COLS = 10;
const ROWS = 20;

const TETROMINOS: { [key: string]: Tetromino } = {
    I: { shape: [[1, 1, 1, 1]], color: '#00F0F0' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000F0' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#F0A000' },
    O: { shape: [[1, 1], [1, 1]], color: '#F0F000' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00F000' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#A000F0' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#F00000' },
};

const randomTetromino = (): Tetromino => {
    const keys = Object.keys(TETROMINOS);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return TETROMINOS[key];
};

const createEmptyGrid = (): GameGrid => Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

const Tetris: React.FC = () => {
    const [grid, setGrid] = useState<GameGrid>(createEmptyGrid());
    const [currentPiece, setCurrentPiece] = useState(randomTetromino());
    const [nextPiece, setNextPiece] = useState(randomTetromino());
    const [position, setPosition] = useState({ x: 3, y: 0 });
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [linesCleared, setLinesCleared] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playBlock, playLineClear, playLose } = useSound(isMuted);

    const isValidMove = (piece: Tetromino, pos: { x: number; y: number }, testGrid: GameGrid): boolean => {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newY = pos.y + y;
                    const newX = pos.x + x;
                    if (newY >= ROWS || newX < 0 || newX >= COLS || (newY >= 0 && testGrid[newY][newX] !== 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
    
    const resetGame = useCallback(() => {
        setGrid(createEmptyGrid());
        setCurrentPiece(randomTetromino());
        setNextPiece(randomTetromino());
        setPosition({ x: 3, y: 0 });
        setScore(0);
        setLevel(1);
        setLinesCleared(0);
        setIsGameOver(false);
    }, []);

    const drop = useCallback(() => {
        if (!isValidMove(currentPiece, { x: position.x, y: position.y + 1 }, grid)) {
            // Lock piece
            const newGrid = grid.map(row => [...row]);
            let gameOver = false;
            currentPiece.shape.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        const gridY = position.y + y;
                        const gridX = position.x + x;
                        if (gridY < 0) {
                           gameOver = true;
                        } else {
                           newGrid[gridY][gridX] = currentPiece.color;
                        }
                    }
                });
            });

            if (gameOver) {
                playLose(false);
                setIsGameOver(true);
                return;
            }

            playBlock(false);
            
            // Clear lines
            let linesToClear = 0;
            const gridWithoutFullLines = newGrid.filter(row => !row.every(cell => cell !== 0));
            linesToClear = ROWS - gridWithoutFullLines.length;
            
            // FIX: Use linesToClear instead of lines
            const newClearedGrid = Array(linesToClear).fill(null).map(() => Array(COLS).fill(0));
            const finalGrid = [...newClearedGrid, ...gridWithoutFullLines];

            if (linesToClear > 0) {
                playLineClear(false);
                setLinesCleared(prev => prev + linesToClear);
                setScore(prev => prev + (linesToClear * 100 * level));
            }
            
            setGrid(finalGrid);
            setCurrentPiece(nextPiece);
            setNextPiece(randomTetromino());
            setPosition({ x: 3, y: 0 });
        } else {
            setPosition(prev => ({ ...prev, y: prev.y + 1 }));
        }
    }, [currentPiece, grid, position, level, nextPiece, playBlock, playLineClear, playLose]);

    const move = useCallback((dx: number) => {
        if (!isGameOver && isValidMove(currentPiece, { x: position.x + dx, y: position.y }, grid)) {
            setPosition(prev => ({ ...prev, x: prev.x + dx }));
        }
    }, [currentPiece, grid, isGameOver, position.x, position.y]);

    const rotate = useCallback(() => {
        if (isGameOver) return;
        const rotatedShape: TetrominoShape = currentPiece.shape[0].map((_, colIndex) =>
            currentPiece.shape.map(row => row[colIndex]).reverse()
        );
        const rotatedPiece = { ...currentPiece, shape: rotatedShape };
        if (isValidMove(rotatedPiece, position, grid)) {
            setCurrentPiece(rotatedPiece);
        }
    }, [currentPiece, grid, isGameOver, position]);

    const hardDrop = useCallback(() => {
        if (isGameOver) return;
        let newY = position.y;
        while (isValidMove(currentPiece, { x: position.x, y: newY + 1 }, grid)) {
            newY++;
        }
        setPosition({ ...position, y: newY });
    }, [currentPiece, grid, isGameOver, position]);

    useEffect(() => {
        if (isGameOver) return;
        const dropInterval = setInterval(drop, 1000 / level);
        return () => clearInterval(dropInterval);
    }, [drop, level, isGameOver]);
    
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (isGameOver) return;
        if (e.key === 'ArrowLeft' || e.key === 'a') move(-1);
        else if (e.key === 'ArrowRight' || e.key === 'd') move(1);
        else if (e.key === 'ArrowDown' || e.key === 's') drop();
        else if (e.key === 'ArrowUp' || e.key === 'w') rotate();
        else if (e.key === ' ') { e.preventDefault(); hardDrop(); }
    }, [isGameOver, move, drop, rotate, hardDrop]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    useEffect(() => {
        if (linesCleared > 0 && linesCleared % 10 === 0) {
            setLevel(prev => prev + 1);
        }
    }, [linesCleared]);

    return (
        <div className="flex items-center justify-center font-orbitron w-full h-full gap-8">
            <div className="relative border-2 border-purple-400" style={{ width: COLS * 30, height: ROWS * 30, backgroundColor: '#111827' }}>
                {isGameOver && <GameModal title="Game Over" status={`Score: ${score}`} buttonText="Play Again" onButtonClick={resetGame} />}
                {/* Render grid */}
                {grid.map((row, y) => row.map((cell, x) => (
                    <div key={`${y}-${x}`} className="absolute" style={{ width: 30, height: 30, top: y * 30, left: x * 30, backgroundColor: cell === 0 ? 'transparent' : cell, border: cell !== 0 ? '1px solid #333' : 'none' }}></div>
                )))}
                {/* Render current piece */}
                {!isGameOver && currentPiece.shape.map((row, y) => row.map((cell, x) => (
                    cell ? <div key={`${y}-${x}`} className="absolute" style={{ width: 30, height: 30, top: (position.y + y) * 30, left: (position.x + x) * 30, backgroundColor: currentPiece.color, border: '1px solid #333' }}></div> : null
                )))}
            </div>
            <div className="w-48 flex flex-col items-center">
                <h2 className="text-2xl mb-2">Next</h2>
                <div className="p-2 bg-black/30 rounded-lg">
                    {nextPiece.shape.map((row, y) => (
                        <div key={y} className="flex">
                            {row.map((cell, x) => <div key={x} className="w-6 h-6" style={{ backgroundColor: cell ? nextPiece.color : 'transparent' }}></div>)}
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-xl">Score: {score}</div>
                <div className="mt-2 text-xl">Level: {level}</div>
                <div className="mt-2 text-xl">Lines: {linesCleared}</div>
                 <button onClick={resetGame} className="mt-6 px-6 py-2 bg-purple-500/50 hover:bg-purple-500/70 rounded-lg font-semibold">New Game</button>
            </div>
        </div>
    );
};

export default Tetris;
