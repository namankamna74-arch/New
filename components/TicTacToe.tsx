import React, { useState, useEffect } from 'react';
import { BoardState, SquareValue, Player, GameOpponent } from '../types';
import { useSound } from '../hooks/useSound';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
];

const calculateWinner = (squares: BoardState): { winner: Player | null; line: number[] | null } => {
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { winner: squares[a] as Player, line: lines[i] };
        }
    }
    return { winner: null, line: null };
};

const minimax = (newBoard: BoardState, player: Player): { score: number; index?: number } => {
    const availableSpots = newBoard.map((s, i) => s === null ? i : null).filter(i => i !== null) as number[];

    const { winner } = calculateWinner(newBoard);
    if (winner === 'O') return { score: 10 };
    if (winner === 'X') return { score: -10 };
    if (availableSpots.length === 0) return { score: 0 };

    const moves: { score: number; index: number }[] = [];
    for (let i = 0; i < availableSpots.length; i++) {
        const index = availableSpots[i];
        const currentMove = { score: 0, index: index };
        newBoard[index] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            currentMove.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            currentMove.score = result.score;
        }
        newBoard[index] = null;
        moves.push(currentMove);
    }

    let bestMove = 0;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    return moves[bestMove];
};

const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );
const XIcon: React.FC = () => (
    <svg viewBox="0 0 52 52" className="w-full h-full">
        <path d="M10 10 L42 42 M42 10 L10 42" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" style={{filter: 'drop-shadow(0 0 8px #67e8f9)'}} />
    </svg>
);

const OIcon: React.FC = () => (
    <svg viewBox="0 0 52 52" className="w-full h-full">
        <circle cx="26" cy="26" r="16" stroke="#f472b6" strokeWidth="8" fill="none" style={{filter: 'drop-shadow(0 0 8px #f472b6)'}} />
    </svg>
);


const Square: React.FC<{ value: SquareValue; onClick: () => void; isWinning: boolean }> = ({ value, onClick, isWinning }) => (
    <button
        onClick={onClick}
        className={`w-28 h-28 flex items-center justify-center text-5xl font-bold rounded-lg transition-all duration-300 relative group active:scale-95
        bg-black/20 hover:bg-black/40
        ${isWinning ? 'bg-primary-500/50' : ''}`}
    >
        {value && <div className="scale-in w-3/4 h-3/4">{value === 'X' ? <XIcon /> : <OIcon />}</div>}
    </button>
);

const WinningLine: React.FC<{ line: number[] | null }> = ({ line }) => {
    if (!line) return null;
    
    const lineKey = line.sort().join('');
    const glowStyle = { filter: 'drop-shadow(0 0 10px #ffffffc0) drop-shadow(0 0 20px var(--color-primary))', backgroundColor: 'var(--color-primary)' };

    if(lineKey === "012") return <div className="absolute top-[16.67%] left-[-5%] w-[110%] h-3 rounded-full draw-line" style={glowStyle}></div>
    if(lineKey === "345") return <div className="absolute top-1/2 left-[-5%] w-[110%] h-3 rounded-full draw-line" style={{...glowStyle, transform: 'translateY(-50%)'}}></div>
    if(lineKey === "678") return <div className="absolute top-[83.33%] left-[-5%] w-[110%] h-3 rounded-full draw-line" style={glowStyle}></div>
    if(lineKey === "036") return <div className="absolute left-[16.67%] top-[-5%] h-[110%] w-3 rounded-full draw-line-y" style={{...glowStyle, transform: 'translateX(-50%)'}}></div>
    if(lineKey === "147") return <div className="absolute left-1/2 top-[-5%] h-[110%] w-3 rounded-full draw-line-y" style={{...glowStyle, transform: 'translateX(-50%)'}}></div>
    if(lineKey === "258") return <div className="absolute left-[83.33%] top-[-5%] h-[110%] w-3 rounded-full draw-line-y" style={{...glowStyle, transform: 'translateX(-50%)'}}></div>
    if(lineKey === "048") return <div className="absolute top-1/2 left-1/2 w-[120%] h-3 rounded-full draw-line" style={{...glowStyle, transform: 'translate(-50%, -50%) rotate(45deg)'}}></div>
    if(lineKey === "246") return <div className="absolute top-1/2 left-1/2 w-[120%] h-3 rounded-full draw-line" style={{...glowStyle, transform: 'translate(-50%, -50%) rotate(-45deg)'}}></div>

    return null;
}

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState<boolean>(true);
    const [gameMode, setGameMode] = useState<GameOpponent>('human');
    const [scores, setScores] =useState({ X: 0, O: 0});
    const [isThinking, setIsThinking] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playMove, playWin, playLose } = useSound(isMuted);

    const { winner, line } = calculateWinner(board);
    const isDraw = !winner && board.every(Boolean);

    // AI Turn Logic
    useEffect(() => {
        if (gameMode === 'ai' && !xIsNext && !winner && !isDraw) {
            setIsThinking(true);
            const timer = setTimeout(() => {
                const newBoard = [...board];
                const aiMove = minimax(newBoard, 'O').index;
                if (aiMove !== undefined) {
                    playMove();
                    newBoard[aiMove] = 'O';
                    setBoard(newBoard);
                    setXIsNext(true);
                }
                setIsThinking(false);
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [xIsNext, gameMode, board, winner, isDraw, playMove]);

    // Check for winner/draw after board updates
    useEffect(() => {
        const { winner: currentWinner } = calculateWinner(board);
        const isBoardFull = board.every(Boolean);

        if (currentWinner) {
            playWin();
            setScores(s => ({ ...s, [currentWinner]: s[currentWinner] + 1 }));
        } else if (isBoardFull) {
            playLose();
        }
    }, [board, playWin, playLose]);

    const handleClick = (i: number) => {
        const currentWinner = calculateWinner(board).winner;
        const currentIsDraw = !currentWinner && board.every(Boolean);
        if (currentWinner || currentIsDraw || board[i] || isThinking) {
            return;
        }
        
        playMove();
        const newBoard = [...board];
        newBoard[i] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);
    };

    const resetRound = () => {
        playMove();
        setBoard(Array(9).fill(null));
        setXIsNext(true);
    };
    
    const changeGameMode = (mode: GameOpponent) => {
        playMove();
        setGameMode(mode);
        setScores({X: 0, O: 0});
        setBoard(Array(9).fill(null));
        setXIsNext(true);
    }

    let status;
    if (winner) {
        status = `Player ${winner} wins the round!`;
    } else if (isDraw) {
        status = "It's a Draw!";
    } else {
        status = isThinking
            ? 'AI is thinking...' 
            : `Player ${xIsNext ? 'X' : 'O'}'s Turn`;
    }

    return (
        <div className="flex flex-col items-center justify-center w-full relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Tic-Tac-Toe">
                        <p><strong>Objective:</strong> Be the first to get three of your marks in a row (up, down, across, or diagonally).</p>
                        <p><strong>Game Modes:</strong></p>
                        <ul className="list-disc list-inside">
                            <li><strong>Player vs Player:</strong> Play against a friend on the same device.</li>
                            <li><strong>Player vs AI:</strong> Challenge our unbeatable AI opponent.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-0 right-0 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>

            <style>{`
                @keyframes scale-in { 0% { transform: scale(0.2) rotate(-90deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
                .scale-in { animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes draw { 0% { width: 0; } 100% { width: 110%; } }
                .draw-line { animation: draw 0.5s ease-out forwards; animation-delay: 0.2s; }
                @keyframes draw-y { 0% { height: 0; } 100% { height: 110%; } }
                .draw-line-y { animation: draw-y 0.5s ease-out forwards; animation-delay: 0.2s; }
                .grid-glow {
                    box-shadow: 
                        0 0 5px var(--color-primary), 0 0 10px var(--color-primary), 0 0 20px var(--color-primary),
                        inset 0 0 5px var(--color-primary), inset 0 0 10px var(--color-primary);
                }
            `}</style>
            
            <div className="mb-4 flex gap-4 p-2 bg-black/30 rounded-lg border border-theme-primary">
                <button onClick={() => changeGameMode('human')} className={`px-4 py-1 rounded-md transition-all ${gameMode === 'human' ? 'bg-primary shadow-lg shadow-primary' : 'bg-white/10 hover:bg-white/20'}`}>Player vs Player</button>
                <button onClick={() => changeGameMode('ai')} className={`px-4 py-1 rounded-md transition-all ${gameMode === 'ai' ? 'bg-primary shadow-lg shadow-primary' : 'bg-white/10 hover:bg-white/20'}`}>Player vs AI</button>
            </div>

            <div className="flex justify-around w-full max-w-sm mb-4 font-orbitron">
                <div className={`text-center p-3 rounded-lg bg-black/30 w-32 transition-all duration-300 border-2 ${!winner && !isDraw && xIsNext ? 'border-cyan-400 shadow-lg shadow-cyan-400/50' : 'border-transparent'}`}>
                    <div className="text-cyan-300">Player X</div>
                    <div className="text-3xl font-bold">{scores.X}</div>
                </div>
                <div className={`text-center p-3 rounded-lg bg-black/30 w-32 transition-all duration-300 border-2 ${!winner && !isDraw && !xIsNext ? 'border-pink-400 shadow-lg shadow-pink-400/50' : 'border-transparent'}`}>
                    <div className="text-pink-300">Player O</div>
                    <div className="text-3xl font-bold">{scores.O}</div>
                </div>
            </div>

            <h2 className="font-orbitron text-2xl mb-4 text-gray-300 h-8 flex items-center">
                {isThinking && <div className="animate-pulse mr-2">🤖</div>}
                {status}
            </h2>
            
            <div className="relative grid grid-cols-3 gap-3 p-3 bg-black/30 rounded-xl shadow-2xl grid-glow">
                 <WinningLine line={line} />
                {board.map((square, i) => (
                    <Square
                        key={i}
                        value={square}
                        onClick={() => handleClick(i)}
                        isWinning={line ? line.includes(i) : false}
                    />
                ))}
            </div>
            <button
                onClick={resetRound}
                className="mt-6 px-6 py-2 bg-primary-500/50 hover:bg-primary-500/70 rounded-lg font-semibold transition-all duration-300 active:scale-95 shadow-lg hover:shadow-primary"
            >
                {winner || isDraw ? 'Next Round' : 'Reset Round'}
            </button>
        </div>
    );
};

export default TicTacToe;