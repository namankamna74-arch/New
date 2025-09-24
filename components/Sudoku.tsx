
import React, { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';
import GameModal from './GameModal';
import { useAppStore } from '../store';

// Basic Sudoku generator and solver (backtracking)
const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill(0));

const solve = (grid: number[][]): boolean => {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                for (const num of nums) {
                    if (isValid(grid, r, c, num)) {
                        grid[r][c] = num;
                        if (solve(grid)) return true;
                        grid[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

const isValid = (grid: number[][], r: number, c: number, num: number): boolean => {
    for (let i = 0; i < 9; i++) {
        if (grid[r][i] === num || grid[i][c] === num) return false;
    }
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[boxR + i][boxC + j] === num) return false;
        }
    }
    return true;
};

const generatePuzzle = (difficulty = 0.5): { puzzle: (number|null)[][], solution: number[][] } => {
    const solution = createEmptyGrid();
    solve(solution);
    const puzzle = solution.map(row => row.map(cell => Math.random() < difficulty ? null : cell));
    return { puzzle, solution };
};


const Sudoku: React.FC = () => {
    const [puzzle, setPuzzle] = useState<(number | null)[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [grid, setGrid] = useState<(number | null)[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playClick, playWin } = useSound(isMuted);

    const startNewGame = () => {
        const { puzzle, solution } = generatePuzzle();
        setPuzzle(puzzle);
        setSolution(solution);
        setGrid(puzzle.map(row => [...row]));
        setSelectedCell(null);
        setIsComplete(false);
    };

    useEffect(startNewGame, []);

    const handleInput = (num: number) => {
        if (!selectedCell || puzzle[selectedCell.r][selectedCell.c] !== null || isComplete) return;
        playClick();
        const newGrid = grid.map(row => [...row]);
        newGrid[selectedCell.r][selectedCell.c] = newGrid[selectedCell.r][selectedCell.c] === num ? null : num;
        setGrid(newGrid);
    };

    useEffect(() => {
        if (grid.length === 0 || isComplete) return;
        let isSolved = true;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] !== solution[r][c]) {
                    isSolved = false;
                    break;
                }
            }
            if(!isSolved) break;
        }
        if(isSolved) {
            playWin();
            setIsComplete(true);
            setSelectedCell(null);
        }
    }, [grid, solution, isComplete, playWin]);

    const isCellInvalid = (r: number, c: number) => {
        const val = grid[r][c];
        if (!val) return false;
        // Check row and column
        for (let i = 0; i < 9; i++) {
            if ((i !== c && grid[r][i] === val) || (i !== r && grid[i][c] === val)) return true;
        }
        // Check 3x3 box
        const boxR = Math.floor(r / 3) * 3;
        const boxC = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if ((boxR + i !== r || boxC + j !== c) && grid[boxR + i][boxC + j] === val) return true;
            }
        }
        return false;
    };
    
    const getCellClass = (r: number, c: number) => {
        const classes = [];
        const isOriginal = puzzle[r][c] !== null;

        // Border classes for 3x3 boxes
        if (r % 3 === 2 && r !== 8) classes.push('border-b-4'); else classes.push('border-b');
        if (c % 3 === 2 && c !== 8) classes.push('border-r-4'); else classes.push('border-r');
        if (r === 0) classes.push('border-t-4');
        if (c === 0) classes.push('border-l-4');

        if (selectedCell) {
            const inRow = selectedCell.r === r;
            const inCol = selectedCell.c === c;
            const inBox = Math.floor(selectedCell.r / 3) === Math.floor(r / 3) && Math.floor(selectedCell.c / 3) === Math.floor(c / 3);
            if(inRow || inCol || inBox) classes.push('bg-purple-900/40');
        }
        if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
            classes.push('bg-purple-700');
        } else {
            classes.push(isOriginal ? 'bg-gray-700' : 'bg-gray-800');
        }

        const selectedValue = selectedCell ? grid[selectedCell.r][selectedCell.c] : null;
        if(selectedValue && grid[r][c] === selectedValue) {
            classes.push('bg-indigo-600');
        }

        if (isCellInvalid(r, c)) classes.push('text-red-400');
        else if(isOriginal) classes.push('text-cyan-300');


        return classes.join(' ');
    }

    return (
        <div className="flex flex-col items-center justify-center font-orbitron w-full h-full">
            <h2 className="text-4xl mb-4">Sudoku</h2>
            <div className="relative">
                {isComplete && <GameModal title="You Solved It!" status="Congratulations!" buttonText="Play Again" onButtonClick={startNewGame} />}
                <div className="grid grid-cols-9 border-collapse">
                    {grid.map((row, r) => row.map((cell, c) => (
                         <div key={`${r}-${c}`}
                              onClick={() => setSelectedCell({r, c})}
                              className={`w-12 h-12 flex items-center justify-center text-2xl border-purple-400 cursor-pointer transition-colors duration-200
                                ${getCellClass(r,c)}
                              `}>
                             {cell}
                        </div>
                    )))}
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                {Array.from({length: 9}, (_, i) => i + 1).map(num => (
                    <button key={num} onClick={() => handleInput(num)}
                            className="w-12 h-12 text-2xl bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        {num}
                    </button>
                ))}
            </div>
            <button onClick={startNewGame} className="mt-6 px-6 py-2 bg-purple-500/50 hover:bg-purple-500/70 rounded-lg font-semibold">New Puzzle</button>
        </div>
    );
};

export default Sudoku;
