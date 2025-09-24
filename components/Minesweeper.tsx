import React, { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';
import { Cell, MinesweeperGrid, MinesweeperDifficulty } from '../types';
import GameModal from './GameModal';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
};
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const createGrid = (rows: number, cols: number, mines: number): MinesweeperGrid => {
    let grid: MinesweeperGrid = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({
        isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0,
    })));

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!grid[r][c].isMine) {
            grid[r][c].isMine = true;
            minesPlaced++;
        }
    }

    // Calculate adjacent mines
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
                        count++;
                    }
                }
            }
            grid[r][c].adjacentMines = count;
        }
    }
    return grid;
};

const Minesweeper: React.FC = () => {
    const [difficulty, setDifficulty] = useState<MinesweeperDifficulty>('easy');
    const [grid, setGrid] = useState<MinesweeperGrid>(() => createGrid(9, 9, 10));
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playReveal, playLose, playWin } = useSound(isMuted);

    const { rows, cols, mines } = DIFFICULTIES[difficulty];

    const revealCell = (r: number, c: number, currentGrid: MinesweeperGrid) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || currentGrid[r][c].isRevealed || currentGrid[r][c].isFlagged) {
            return;
        }
        currentGrid[r][c].isRevealed = true;

        if (currentGrid[r][c].adjacentMines === 0 && !currentGrid[r][c].isMine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    revealCell(r + dr, c + dc, currentGrid);
                }
            }
        }
    };
    
    const handleCellClick = (r: number, c: number) => {
        if (isGameOver || grid[r][c].isRevealed || grid[r][c].isFlagged) return;
        
        const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
        
        if (newGrid[r][c].isMine) {
            playLose();
            setIsGameOver(true);
            newGrid.forEach(row => row.forEach(cell => { if(cell.isMine) cell.isRevealed = true; }));
        } else {
            playReveal();
            revealCell(r, c, newGrid);
        }
        setGrid(newGrid);
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (isGameOver || grid[r][c].isRevealed) return;
        playReveal();
        const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
        newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
        setGrid(newGrid);
    };
    
    const startNewGame = (diff: MinesweeperDifficulty) => {
        const { rows, cols, mines } = DIFFICULTIES[diff];
        setDifficulty(diff);
        setGrid(createGrid(rows, cols, mines));
        setIsGameOver(false);
        setIsWinner(false);
    };

    useEffect(() => {
        if (isGameOver) return;
        const nonMineCells = (rows * cols) - mines;
        const revealedCount = grid.flat().filter(c => c.isRevealed && !c.isMine).length;
        
        if (revealedCount === nonMineCells) {
            setIsWinner(true);
            setIsGameOver(true);
            playWin();
        }
    }, [grid, rows, cols, mines, playWin, isGameOver]);

    const numColors = ['text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-yellow-400', 'text-cyan-400', 'text-white', 'text-gray-400'];

    return (
        <div className="flex flex-col items-center justify-center font-orbitron w-full h-full relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Minesweeper">
                        <p><strong>Objective:</strong> Clear a rectangular board containing hidden "mines" without detonating any of them.</p>
                         <ul className="list-disc list-inside mt-2">
                            <li><strong>Left-click</strong> a square to reveal it. If it's a mine, you lose.</li>
                            <li>If the revealed square is not a mine, a number will be displayed indicating how many mines are in the eight neighboring squares.</li>
                            <li><strong>Right-click</strong> a square to place a flag where you suspect a mine is. This prevents you from accidentally clicking it.</li>
                            <li>Win by revealing all the squares that do not contain a mine.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <style>{`
                @keyframes reveal { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .cell-revealed { animation: reveal 0.3s ease-out; }
            `}</style>
            <h2 className="text-4xl mb-4 text-primary">Minesweeper</h2>
            <div className="flex gap-4 mb-4 p-2 bg-black/20 rounded-lg">
                {Object.keys(DIFFICULTIES).map(d => (
                    <button key={d} onClick={() => startNewGame(d as MinesweeperDifficulty)} className={`px-3 py-1 rounded transition-colors ${difficulty === d ? 'bg-primary shadow-md shadow-primary' : 'bg-white/10'}`}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
            </div>
            <div className="relative bg-black/30 p-2 rounded-lg shadow-lg">
                <AnimatePresence>
                 {isGameOver && (
                    <GameModal 
                        title={isWinner ? "You Win!" : "Game Over"}
                        status={`You ${isWinner ? "cleared the board" : "hit a mine"}.`}
                        buttonText="Play Again"
                        onButtonClick={() => startNewGame(difficulty)}
                    />
                )}
                </AnimatePresence>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 25px)`}} className="gap-px bg-gray-700">
                    {grid.map((row, r) => row.map((cell, c) => (
                        <div key={`${r}-${c}`} 
                             onClick={() => handleCellClick(r, c)}
                             onContextMenu={(e) => handleRightClick(e, r, c)}
                             className={`w-[25px] h-[25px] flex items-center justify-center text-lg font-bold cursor-pointer transition-colors
                                ${cell.isRevealed ? 'bg-gray-800' : 'bg-gray-600 hover:bg-gray-500'}
                             `}>
                            {cell.isRevealed ? 
                                (cell.isMine ? <span className="text-xl">💣</span> : (cell.adjacentMines > 0 ? <span className={`${numColors[cell.adjacentMines-1]} cell-revealed`}>{cell.adjacentMines}</span> : '')) : 
                                (cell.isFlagged ? <span className="text-xl">🚩</span> : '')
                            }
                        </div>
                    )))}
                </div>
            </div>
        </div>
    );
};

export default Minesweeper;