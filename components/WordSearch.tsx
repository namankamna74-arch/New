
import React, { useState, useEffect, useRef } from 'react';
import { useSound } from '../hooks/useSound';
import { useAppStore } from '../store';

const WORDS = ["GEMINI", "REACT", "FUSION", "SNAKE", "PONG", "TETRIS", "CHESS", "SUDOKU"];
const GRID_SIZE = 12;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Path = { r: number; c: number }[];

const generateGrid = (): { grid: string[][], wordLocations: { [key: string]: Path } } => {
    const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const wordLocations: { [key: string]: Path } = {};

    const placeWord = (word: string): boolean => {
        const dirs = [[0, 1], [1, 0], [1, 1]]; // H, V, Diag
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const reversed = Math.random() > 0.5;
        const letters = reversed ? word.split('').reverse() : word.split('');
        
        let r = Math.floor(Math.random() * GRID_SIZE);
        let c = Math.floor(Math.random() * GRID_SIZE);

        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const startR = (r + i) % GRID_SIZE;
            const startC = Math.floor((c + i) / GRID_SIZE) % GRID_SIZE;
            
            const endR = startR + (letters.length - 1) * dir[0];
            const endC = startC + (letters.length - 1) * dir[1];
            
            if (endR < GRID_SIZE && endC < GRID_SIZE) {
                let canPlace = true;
                const path: Path = [];
                for (let j = 0; j < letters.length; j++) {
                    const curR = startR + j * dir[0];
                    const curC = startC + j * dir[1];
                    path.push({r: curR, c: curC});
                    if (grid[curR][curC] !== '' && grid[curR][curC] !== letters[j]) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    path.forEach((pos, idx) => grid[pos.r][pos.c] = letters[idx]);
                    wordLocations[word] = path;
                    return true;
                }
            }
        }
        return false;
    };
    
    WORDS.forEach(word => placeWord(word));

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            }
        }
    }
    return { grid, wordLocations };
};

const WordSearch: React.FC = () => {
    const [grid, setGrid] = useState<string[][]>([]);
    const [wordLocations, setWordLocations] = useState<{ [key: string]: Path }>({});
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [selection, setSelection] = useState<Path>([]);
    const isMouseDown = useRef(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playScore, playWin } = useSound(isMuted);

    const startNewGame = () => {
        const { grid, wordLocations } = generateGrid();
        setGrid(grid);
        setWordLocations(wordLocations);
        setFoundWords([]);
        setSelection([]);
    };
    
    useEffect(startNewGame, []);
    
    const handleMouseDown = (r: number, c: number) => {
        isMouseDown.current = true;
        setSelection([{ r, c }]);
    };
    
    const handleMouseEnter = (r: number, c: number) => {
        if (!isMouseDown.current || selection.length === 0) return;
        
        const start = selection[0];
        const end = { r, c };
        
        const dr = Math.sign(end.r - start.r);
        const dc = Math.sign(end.c - start.c);

        // Check for valid line (horizontal, vertical, or diagonal)
        if (!((dr === 0 && dc !== 0) || (dr !== 0 && dc === 0) || (Math.abs(end.r - start.r) === Math.abs(end.c - start.c)))) {
            return;
        }

        const newSelection: Path = [];
        let currR = start.r;
        let currC = start.c;
        
        while (true) {
            newSelection.push({ r: currR, c: currC });
            if (currR === end.r && currC === end.c) break;
            currR += dr;
            currC += dc;
        }
        setSelection(newSelection);
    };
    
    const handleMouseUp = () => {
        isMouseDown.current = false;
        if (selection.length < 2) {
            setSelection([]);
            return;
        }
        const selectedWord = selection.map(pos => grid[pos.r][pos.c]).join('');
        const reversedSelectedWord = selectedWord.split('').reverse().join('');

        for (const word of WORDS) {
            if ((word === selectedWord || word === reversedSelectedWord) && !foundWords.includes(word)) {
                playScore(false);
                setFoundWords(prev => {
                    const newFound = [...prev, word];
                    if (newFound.length === WORDS.length) {
                        playWin(false);
                    }
                    return newFound;
                });
                break;
            }
        }
        setSelection([]);
    };

    const isCellSelected = (r: number, c: number) => selection.some(p => p.r === r && p.c === c);
    const isCellFound = (r: number, c: number) => {
        for (const word of foundWords) {
            if (wordLocations[word]?.some(p => p.r === r && p.c === c)) return true;
        }
        return false;
    }

    return (
        <div className="flex items-center justify-center gap-8 font-orbitron">
            <div className="flex flex-col items-center">
                <h2 className="text-4xl mb-4">Word Search</h2>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 35px)`}} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    {grid.map((row, r) => row.map((letter, c) => (
                        <div key={`${r}-${c}`}
                            onMouseDown={() => handleMouseDown(r, c)}
                            onMouseEnter={() => handleMouseEnter(r, c)}
                            className={`w-[35px] h-[35px] flex items-center justify-center text-xl cursor-pointer select-none transition-colors
                            ${isCellFound(r,c) ? 'bg-purple-600 rounded-lg' : isCellSelected(r,c) ? 'bg-yellow-500' : 'bg-white/10'}`}>
                            {letter}
                        </div>
                    )))}
                </div>
                 <button onClick={startNewGame} className="mt-6 px-6 py-2 bg-purple-500/50 hover:bg-purple-500/70 rounded-lg font-semibold">New Game</button>
            </div>
            <div className="p-4 bg-black/20 rounded-lg w-56">
                <h3 className="text-2xl mb-2 text-center">Find Words</h3>
                <ul>
                    {WORDS.map(word => (
                        <li key={word} className={`text-lg transition-colors ${foundWords.includes(word) ? 'line-through text-gray-500' : ''}`}>
                            {word}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WordSearch;
