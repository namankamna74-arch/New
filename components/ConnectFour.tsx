import React, { useState } from 'react';
import { useSound } from '../hooks/useSound';
import { ConnectFourGrid, ConnectFourPlayer } from '../types';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const ROWS = 6;
const COLS = 7;
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const checkWinner = (grid: ConnectFourGrid): ConnectFourPlayer | null => {
    // Horizontal, Vertical, and Diagonal checks
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const player = grid[r][c];
            if (player === 0) continue;

            if (c + 3 < COLS && player === grid[r][c+1] && player === grid[r][c+2] && player === grid[r][c+3]) return player;
            if (r + 3 < ROWS && player === grid[r+1][c] && player === grid[r+2][c] && player === grid[r+3][c]) return player;
            if (r + 3 < ROWS && c + 3 < COLS && player === grid[r+1][c+1] && player === grid[r+2][c+2] && player === grid[r+3][c+3]) return player;
            if (r + 3 < ROWS && c - 3 >= 0 && player === grid[r+1][c-1] && player === grid[r+2][c-2] && player === grid[r+3][c-3]) return player;
        }
    }
    return null;
}

const ConnectFour: React.FC = () => {
    const [grid, setGrid] = useState<ConnectFourGrid>(() => Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
    const [currentPlayer, setCurrentPlayer] = useState<ConnectFourPlayer>(1);
    const [winner, setWinner] = useState<ConnectFourPlayer | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playBlock, playWin } = useSound(isMuted);

    const handleColumnClick = (c: number) => {
        if (winner) return;

        // Find the first empty row in the column
        let r = ROWS - 1;
        while (r >= 0 && grid[r][c] !== 0) {
            r--;
        }

        if (r < 0) return; // Column is full

        playBlock(false);
        const newGrid = grid.map(row => [...row]);
        newGrid[r][c] = currentPlayer;
        setGrid(newGrid);

        const newWinner = checkWinner(newGrid);
        if (newWinner) {
            playWin(false);
            setWinner(newWinner);
        } else if (newGrid.flat().every(cell => cell !== 0)) {
            setIsDraw(true);
        } else {
            setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
        }
    };

    const resetGame = () => {
        setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
        setCurrentPlayer(1);
        setWinner(null);
        setIsDraw(false);
    };

    const getStatusMessage = () => {
        if (winner) return `Player ${winner} Wins!`;
        if (isDraw) return "It's a Draw!";
        return `Player ${currentPlayer}'s Turn`;
    };

    return (
        <div className="flex flex-col items-center justify-center font-orbitron w-full h-full relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Connect Four">
                        <p><strong>Objective:</strong> Be the first player to get four of your colored discs in a row—either horizontally, vertically, or diagonally.</p>
                        <p><strong>How to Play:</strong> On your turn, click on a column to drop your disc into it. The disc will fall to the lowest available space in that column.</p>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <h2 className="text-3xl mb-4">{getStatusMessage()}</h2>
            <div className="p-4 bg-accent rounded-lg shadow-lg">
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: COLS }).map((_, c) => (
                        <div key={c} onClick={() => handleColumnClick(c)} className="w-16 h-16 rounded-full bg-background-primary cursor-pointer hover:bg-opacity-80 transition-colors"></div>
                    ))}
                    {grid.map((row, r) => row.map((cell, c) => (
                         cell !== 0 && (
                            <div key={`${r}-${c}`} className={`absolute w-16 h-16 rounded-full pointer-events-none drop-in
                                ${cell === 1 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                style={{ top: `${(r * 4.5) + 1}rem`, left: `${(c * 4.5) + 1}rem` }}>
                            </div>
                         )
                    )))}
                </div>
            </div>
             <button onClick={resetGame} className="mt-6 px-6 py-2 bg-primary-500/50 hover:bg-primary-500/70 rounded-lg font-semibold">New Game</button>
             <style>{`
                @keyframes drop-in { 
                    0% { transform: translateY(-300px); opacity: 0; } 
                    100% { transform: translateY(0); opacity: 1; } 
                }
                .drop-in { animation: drop-in 0.5s ease-out; }
             `}</style>
        </div>
    );
};

export default ConnectFour;