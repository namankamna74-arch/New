
import React, { useState, useMemo } from 'react';
import { useSound } from '../hooks/useSound';
import { CheckersBoard, CheckersPiece, CheckersPlayer } from '../types';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const BOARD_SIZE = 8;
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

let pieceIdCounter = 0;
const getInitialBoard = (): CheckersBoard => {
    const board: CheckersBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 !== 0) { // Dark squares
                if (row < 3) board[row][col] = { id: pieceIdCounter++, player: 'black', isKing: false };
                else if (row > 4) board[row][col] = { id: pieceIdCounter++, player: 'red', isKing: false };
            }
        }
    }
    return board;
};

const Checkers: React.FC = () => {
    const [board, setBoard] = useState<CheckersBoard>(getInitialBoard());
    const [turn, setTurn] = useState<CheckersPlayer>('red');
    const [selected, setSelected] = useState<{ row: number, col: number } | null>(null);
    const [winner, setWinner] = useState<CheckersPlayer | null>(null);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playMove, playCapture } = useSound(isMuted);

    const getValidMoves = (row: number, col: number, piece: CheckersPiece, currentBoard: CheckersBoard) => {
        const moves: { to: { row: number, col: number }, captured?: { row: number, col: number } }[] = [];
        const dir = piece.player === 'red' ? -1 : 1;
        const opponent = piece.player === 'red' ? 'black' : 'red';
        const dirs = piece.isKing ? [dir, -dir] : [dir];

        for (const d of dirs) {
            for (const dc of [-1, 1]) {
                const r = row + d;
                const c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    // Normal move
                    if (!currentBoard[r][c]) moves.push({ to: { row: r, col: c } });
                    // Jump move
                    else if (currentBoard[r][c]?.player === opponent) {
                        const jr = r + d;
                        const jc = c + dc;
                        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !currentBoard[jr][jc]) {
                            moves.push({ to: { row: jr, col: jc }, captured: { row: r, col: c } });
                        }
                    }
                }
            }
        }
        return moves;
    };

    const handleSquareClick = (row: number, col: number) => {
        if (winner) return;

        if (selected) {
            const piece = board[selected.row][selected.col];
            if (!piece) return;

            const validMoves = getValidMoves(selected.row, selected.col, piece, board);
            const move = validMoves.find(m => m.to.row === row && m.to.col === col);
            if (move) {
                const newBoard = board.map(r => r.map(c => c ? { ...c } : null));
                newBoard[row][col] = piece;
                newBoard[selected.row][selected.col] = null;
                
                if (move.captured) {
                    newBoard[move.captured.row][move.captured.col] = null;
                    playCapture();
                } else {
                    playMove();
                }

                if ((piece.player === 'red' && row === 0) || (piece.player === 'black' && row === 7)) {
                    (newBoard[row][col] as CheckersPiece).isKing = true;
                }
                
                let redPieces = 0;
                let blackPieces = 0;
                newBoard.forEach(r => r.forEach(p => {
                    if (p?.player === 'red') redPieces++;
                    if (p?.player === 'black') blackPieces++;
                }));
                if(redPieces === 0) setWinner('black');
                if(blackPieces === 0) setWinner('red');

                setBoard(newBoard);
                setTurn(turn === 'red' ? 'black' : 'red');
                setSelected(null);
            } else {
                setSelected(null);
            }
        } else {
            const piece = board[row][col];
            if (piece && piece.player === turn) {
                setSelected({ row, col });
            }
        }
    };
    
    const resetGame = () => {
        pieceIdCounter = 0;
        setBoard(getInitialBoard());
        setTurn('red');
        setSelected(null);
        setWinner(null);
    }
    
    const validMovesForSelected = useMemo(() => (
        selected ? getValidMoves(selected.row, selected.col, board[selected.row][selected.col]!, board) : []
    ), [selected, board]);
        
    const flatPieces = useMemo(() => 
        board.flatMap((row, r) => row.map((piece, c) => piece ? { ...piece, r, c } : null)).filter(p => p !== null)
    , [board]);

    return (
        <div className="flex flex-col items-center justify-center font-orbitron relative">
            <AnimatePresence>
                {isTutorialOpen && (
                     <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Checkers">
                        <p><strong>Objective:</strong> Capture all of your opponent's pieces.</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Pieces move diagonally forward on the dark squares.</li>
                            <li>Capture an opponent's piece by jumping over it into an empty square. Multiple jumps can be chained in one turn.</li>
                            <li>If a piece reaches the farthest row from its starting position, it becomes a "King".</li>
                            <li>Kings can move and capture both forwards and backwards.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-0 right-0 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
             <h2 className="text-3xl text-primary mb-4 h-8 font-bold" style={{textShadow: '0 0 5px var(--color-primary-shadow)'}}>
                {winner ? `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!` : `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s Turn`}
            </h2>
            <div className="relative border-4 border-theme-primary rounded-lg w-[512px] h-[512px] shadow-lg shadow-primary">
                {/* Board squares */}
                {Array.from({ length: 64 }).map((_, i) => {
                    const r = Math.floor(i / 8);
                    const c = i % 8;
                    const isMovable = validMovesForSelected.find(m => m.to.row === r && m.to.col === c);
                    return (
                        <div key={`square-${r}-${c}`}
                            onClick={() => handleSquareClick(r, c)}
                            className={`w-16 h-16 absolute transition-colors ${(r + c) % 2 === 0 ? 'bg-gray-400/50' : 'bg-gray-800/80'}`}
                            style={{ top: r * 64, left: c * 64 }}
                        >
                            {isMovable && <div className="w-full h-full flex items-center justify-center cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-primary opacity-50"></div>
                            </div>}
                        </div>
                    );
                })}
                {/* Pieces */}
                {flatPieces.map(piece => piece && (
                     <div key={piece.id}
                        onClick={() => handleSquareClick(piece.r, piece.c)}
                        className={`w-16 h-16 absolute flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer z-10`}
                        style={{ 
                            top: piece.r * 64, 
                            left: piece.c * 64,
                            filter: selected && selected.row === piece.r && selected.col === piece.c ? `drop-shadow(0 0 10px var(--color-primary))` : ''
                        }}
                     >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center
                            ${piece.player === 'red' ? 'bg-accent border-blue-800' : 'bg-gray-900 border-gray-700'}
                            border-4 shadow-lg`}>
                           {piece.isKing && <span className="text-yellow-400 text-2xl" style={{filter: 'drop-shadow(0 0 5px #facc15)'}}>👑</span>}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={resetGame} className="mt-6 px-6 py-2 bg-primary-500/50 hover:bg-primary-500/70 rounded-lg font-semibold">New Game</button>
        </div>
    );
};

export default Checkers;
