
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChessBoardState, ChessColor, Piece, PieceType, ChessSquare, GameOpponent, ChessDifficulty } from '../types';
import { getInitialBoard } from './icons/chess/chess/initialBoard';
import { getValidMoves, isKingInCheck } from './icons/chess/chess/moveValidation';
import { findBestMove } from './icons/chess/chess/ai';
import { PieceIcon } from './icons/chess/chess/PieceIcon';
import { useSound } from '../hooks/useSound';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

// --- Helper Functions ---
const indexToAlgebraic = (index: number): string => {
    const col = 'abcdefgh'[index % 8];
    const row = 8 - Math.floor(index / 8);
    return col + row;
}

const boardToFENlike = (board: ChessBoardState): string => {
    return board.map(p => {
        if (!p) return '1';
        return `${p.color}${p.type}`;
    }).join('');
};

// --- Helper Components ---
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const CapturedPieces: React.FC<{ pieces: Piece[] }> = ({ pieces }) => (
    <div className="flex flex-wrap gap-1 p-2 bg-black/10 rounded-lg min-h-[32px]">
        {pieces.map(p => <div key={p.id} className="w-6 h-6"><PieceIcon piece={p} /></div>)}
    </div>
);

const PromotionModal: React.FC<{ color: ChessColor; onSelect: (type: PieceType) => void }> = ({ color, onSelect }) => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
        <div className="bg-gray-800 p-6 rounded-lg flex gap-4">
            {(['q', 'r', 'b', 'n'] as PieceType[]).map(type => (
                <button key={type} onClick={() => onSelect(type)} className="w-16 h-16 hover:bg-primary-500/50 rounded-md">
                    <PieceIcon piece={{ id: -1, type, color }} />
                </button>
            ))}
        </div>
    </div>
);

const GameOverModal: React.FC<{ status: string; onReset: () => void }> = ({ status, onReset }) => (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 font-orbitron">
        <h2 className="text-4xl font-bold text-primary mb-4 text-center">{status}</h2>
        <button onClick={onReset} className="px-6 py-2 bg-primary-500/50 hover:bg-primary-500/70 rounded-lg font-semibold transition-all duration-300">
            Play Again
        </button>
    </div>
);

const GameSetupModal: React.FC<{ onStart: (opponent: GameOpponent, difficulty: ChessDifficulty) => void }> = ({ onStart }) => {
    const [opponent, setOpponent] = useState<GameOpponent>('human');
    const [difficulty, setDifficulty] = useState<ChessDifficulty>('medium');

    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 font-orbitron">
            <h2 className="text-4xl font-bold text-primary mb-8">New Game</h2>
            <div className="space-y-6 text-lg w-72">
                <div>
                    <h3 className="mb-2">Opponent</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setOpponent('human')} className={`flex-1 p-2 rounded transition-colors ${opponent === 'human' ? 'bg-primary' : 'bg-gray-700'}`}>Human</button>
                        <button onClick={() => setOpponent('ai')} className={`flex-1 p-2 rounded transition-colors ${opponent === 'ai' ? 'bg-primary' : 'bg-gray-700'}`}>AI</button>
                    </div>
                </div>
                {opponent === 'ai' && (
                    <div>
                        <h3 className="mb-2">AI Difficulty</h3>
                         <div className="flex gap-2">
                            <button onClick={() => setDifficulty('easy')} className={`flex-1 p-2 rounded transition-colors ${difficulty === 'easy' ? 'bg-green-600' : 'bg-gray-700'}`}>Easy</button>
                            <button onClick={() => setDifficulty('medium')} className={`flex-1 p-2 rounded transition-colors ${difficulty === 'medium' ? 'bg-yellow-600' : 'bg-gray-700'}`}>Medium</button>
                            <button onClick={() => setDifficulty('hard')} className={`flex-1 p-2 rounded transition-colors ${difficulty === 'hard' ? 'bg-red-600' : 'bg-gray-700'}`}>Hard</button>
                        </div>
                    </div>
                )}
            </div>
             <button onClick={() => onStart(opponent, difficulty)} className="mt-10 px-8 py-3 bg-green-500/50 hover:bg-green-500/70 rounded-lg font-semibold transition-all duration-300">
                Start Game
            </button>
        </div>
    )
}

const Chess: React.FC = () => {
    const [board, setBoard] = useState<ChessBoardState>(getInitialBoard());
    const [turn, setTurn] = useState<ChessColor>('w');
    const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
    const [validMoves, setValidMoves] = useState<number[]>([]);
    const [status, setStatus] = useState<string>("Setup new game");
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [gameOverStatus, setGameOverStatus] = useState('');
    const [capturedPieces, setCapturedPieces] = useState<{ w: Piece[], b: Piece[] }>({ w: [], b: [] });
    const [enPassantTarget, setEnPassantTarget] = useState<number | null>(null);
    const [promotionSquare, setPromotionSquare] = useState<number | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [opponent, setOpponent] = useState<GameOpponent>('human');
    const [difficulty, setDifficulty] = useState<ChessDifficulty>('medium');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [premove, setPremove] = useState<{from: number, to: number} | null>(null);
    const [hint, setHint] = useState<{from: number, to: number} | null>(null);
    const [boardHistory, setBoardHistory] = useState<string[]>([]);
    const [halfMoveClock, setHalfMoveClock] = useState(0);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playMove, playCapture, playCheck, playWin, playLose } = useSound(isMuted);

    const isAITurn = useMemo(() => gameStarted && !isGameOver && opponent === 'ai' && turn === 'b', [gameStarted, isGameOver, opponent, turn]);
    const playerTurn = opponent === 'ai' ? 'w' : turn;

    const updateGameStatus = useCallback((currentBoard: ChessBoardState, currentTurn: ChessColor, currentHalfMoveClock: number, currentBoardHistory: string[]) => {
        // 50-move rule
        if (currentHalfMoveClock >= 100) {
            setIsGameOver(true);
            setGameOverStatus("Draw by 50-move rule.");
            setStatus("Draw by 50-move rule.");
            playLose();
            return;
        }

        // Threefold repetition
        const currentFEN = boardToFENlike(currentBoard);
        const repetitions = currentBoardHistory.filter(fen => fen === currentFEN).length;
        if (repetitions >= 3) {
            setIsGameOver(true);
            setGameOverStatus("Draw by threefold repetition.");
            setStatus("Draw by threefold repetition.");
            playLose();
            return;
        }

        const opponentColor = currentTurn === 'w' ? 'b' : 'w';
        let hasValidMoves = false;
        for (let i = 0; i < 64; i++) {
            const piece = currentBoard[i];
            if (piece && piece.color === currentTurn) {
                if (getValidMoves(i, currentBoard, enPassantTarget).length > 0) {
                    hasValidMoves = true;
                    break;
                }
            }
        }
        
        const inCheck = isKingInCheck(currentTurn, currentBoard);

        if (!hasValidMoves) {
            setIsGameOver(true);
            const endStatus = inCheck ? `Checkmate! ${opponentColor === 'w' ? 'White' : 'Black'} wins.` : "Stalemate! It's a draw.";
            setGameOverStatus(endStatus);
            setStatus(endStatus);
            if(inCheck) playWin(); else playLose();
        } else {
            const turnText = `${currentTurn === 'w' ? 'White' : 'Black'}'s Turn`;
            setStatus(turnText + (inCheck ? ' - Check!' : ''));
            if(inCheck) playCheck();
        }
    }, [enPassantTarget, playCheck, playWin, playLose]);

    const executeMove = useCallback((from: number, to: number) => {
        const newBoard = [...board];
        const piece = newBoard[from]!;
        const captured = newBoard[to];
        
        let resetHalfMoveClock = piece.type === 'p' || !!captured;
        
        if (captured) {
            playCapture();
            setCapturedPieces(prev => ({...prev, [captured.color]: [...prev[captured.color], captured]}));
        } else {
            playMove();
        }

        // En Passant capture
        if (piece.type === 'p' && to === enPassantTarget) {
            playCapture();
            const capturedPawnIndex = turn === 'w' ? to + 8 : to - 8;
            const capturedPawn = newBoard[capturedPawnIndex]!;
            setCapturedPieces(prev => ({...prev, [capturedPawn.color]: [...prev[capturedPawn.color], capturedPawn]}));
            newBoard[capturedPawnIndex] = null;
        }

        // Set en passant target for next turn
        const newEnPassantTarget = piece.type === 'p' && Math.abs(from - to) === 16 ? (turn === 'w' ? to + 8 : to - 8) : null;

        // Castling
        if (piece.type === 'k' && Math.abs(from - to) === 2) {
            const rookFrom = to > from ? to + 1 : to - 2;
            const rookTo = to > from ? to - 1 : to + 1;
            newBoard[rookTo] = { ...newBoard[rookFrom]!, hasMoved: true };
            newBoard[rookFrom] = null;
        }

        newBoard[to] = { ...piece, hasMoved: true };
        newBoard[from] = null;

        setMoveHistory(prev => [...prev, `${indexToAlgebraic(from)}-${indexToAlgebraic(to)}`]);
        
        // Check for promotion
        const toRow = Math.floor(to / 8);
        if (piece.type === 'p' && (toRow === 0 || toRow === 7)) {
            setPromotionSquare(to);
            setBoard(newBoard); // Set intermediate board state for promotion UI
        } else {
            setBoard(newBoard);
        }

        const nextTurn = turn === 'w' ? 'b' : 'w';
        setTurn(nextTurn);
        setEnPassantTarget(newEnPassantTarget);
        setSelectedSquare(null);
        setValidMoves([]);
        setHint(null);
        
        const newHalfMoveClock = resetHalfMoveClock ? 0 : halfMoveClock + 1;
        const newBoardHistory = [...boardHistory, boardToFENlike(newBoard)];
        setHalfMoveClock(newHalfMoveClock);
        setBoardHistory(newBoardHistory);
        
        if (!(piece.type === 'p' && (toRow === 0 || toRow === 7))) {
             updateGameStatus(newBoard, nextTurn, newHalfMoveClock, newBoardHistory);
        }
    }, [board, turn, enPassantTarget, halfMoveClock, boardHistory, playCapture, playMove, updateGameStatus]);

    useEffect(() => {
        if (isAITurn) {
            setIsAiThinking(true);
            const timer = setTimeout(() => {
                const { from, to } = findBestMove(board, difficulty, enPassantTarget);
                if (from !== null && to !== null) {
                    executeMove(from, to);
                }
                setIsAiThinking(false);
            }, 500);
            return () => clearTimeout(timer);
        } else if (premove && turn === playerTurn) {
            const validPlayerMoves = getValidMoves(premove.from, board, enPassantTarget);
            if (validPlayerMoves.includes(premove.to)) {
                executeMove(premove.from, premove.to);
            }
            setPremove(null);
        }
    }, [isAITurn, turn, playerTurn, board, difficulty, enPassantTarget, premove, executeMove]);

    useEffect(() => {
        // Handle AI promotion automatically
        if (promotionSquare !== null && turn === 'w' && opponent === 'ai') {
            handlePromotion('q');
        }
    }, [promotionSquare, turn, opponent]);

    const handleSquareClick = (index: number) => {
        if (!gameStarted || isGameOver || promotionSquare !== null) return;
        
        const isPlayerTurn = turn === playerTurn;

        if (!isPlayerTurn && opponent === 'ai') {
            if(selectedSquare !== null) {
                const moves = getValidMoves(selectedSquare, board, enPassantTarget);
                if(moves.includes(index)) {
                    setPremove({ from: selectedSquare, to: index });
                    setSelectedSquare(null);
                    setValidMoves([]);
                }
            } else {
                const piece = board[index];
                if (piece && piece.color === playerTurn) {
                    setSelectedSquare(index);
                }
            }
            return;
        }

        if (selectedSquare !== null && validMoves.includes(index)) {
            executeMove(selectedSquare, index);
        } else {
            const piece = board[index];
            if (piece && piece.color === turn) {
                setSelectedSquare(index);
                setValidMoves(getValidMoves(index, board, enPassantTarget));
                setHint(null);
                setPremove(null);
            } else {
                setSelectedSquare(null);
                setValidMoves([]);
            }
        }
    };

    const handlePromotion = (type: PieceType) => {
        if (promotionSquare === null) return;
        const newBoard = [...board];
        const piece = newBoard[promotionSquare]!;
        newBoard[promotionSquare] = { ...piece, type };
        setBoard(newBoard);
        setPromotionSquare(null);
        
        const newHalfMoveClock = 0; // Pawn move resets clock
        const newBoardHistory = [...boardHistory, boardToFENlike(newBoard)];
        setHalfMoveClock(newHalfMoveClock);
        setBoardHistory(newBoardHistory);
        updateGameStatus(newBoard, turn, newHalfMoveClock, newBoardHistory);
    };

    const getHint = () => {
        const { from, to } = findBestMove(board, 'hard', enPassantTarget);
        if (from !== null && to !== null) {
            setHint({ from, to });
        }
    };

    const resetGame = () => {
        setGameStarted(false);
        setBoard(getInitialBoard());
        setTurn('w');
        setSelectedSquare(null);
        setValidMoves([]);
        setStatus("Setup new game");
        setIsGameOver(false);
        setGameOverStatus('');
        setCapturedPieces({ w: [], b: [] });
        setEnPassantTarget(null);
        setPromotionSquare(null);
        setMoveHistory([]);
        setPremove(null);
        setHint(null);
        setBoardHistory([]);
        setHalfMoveClock(0);
    };

    const startGame = (opp: GameOpponent, diff: ChessDifficulty) => {
        setOpponent(opp);
        setDifficulty(diff);
        setGameStarted(true);
        setStatus("White's Turn");
    }
    
    return (
        <div className="w-full h-full flex items-center justify-center p-4 relative transition-colors bg-background-primary text-text-primary">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Chess">
                        <p><strong>Objective:</strong> Checkmate your opponent's king!</p>
                        <p><strong>Features:</strong></p>
                        <ul className="list-disc list-inside">
                            <li><strong>Premove:</strong> Make your move during the AI's turn. It will execute instantly if legal.</li>
                            <li><strong>Hint:</strong> Click the lightbulb icon to get a suggested move from the AI.</li>
                            <li><strong>Full Rules:</strong> All standard rules including castling, en passant, pawn promotion, and draws by 50-move rule or threefold repetition are implemented.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-4 left-4 z-30 p-2 rounded-full bg-background-secondary hover:bg-white/20 transition-colors" aria-label="Help"><HelpIcon /></button>

            <div className="flex items-start justify-center gap-6">
                <div className="w-64 flex-shrink-0">
                    <h3 className="font-orbitron text-xl mb-2 text-center">History</h3>
                    <div className="h-[60vh] max-h-[500px] bg-black/20 rounded-lg p-2 overflow-y-auto">
                        <ol className="grid grid-cols-2 gap-x-4">
                            {moveHistory.map((move, i) => (
                                i % 2 === 0 && <li key={i} className="text-gray-400">
                                    <span className="font-bold text-gray-200">{i/2 + 1}.</span> {move} {moveHistory[i+1] || ''}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <CapturedPieces pieces={capturedPieces.b} />
                    <div className="w-[70vh] h-[70vh] max-w-[600px] max-h-[600px] grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-2xl border-4 border-theme-primary relative bg-gray-800">
                        {!gameStarted && <GameSetupModal onStart={startGame} />}

                        {Array.from({ length: 64 }).map((_, i) => {
                            const row = Math.floor(i / 8);
                            const col = i % 8;
                            const isLight = (row + col) % 2 !== 0;
                            return <div key={i} onClick={() => handleSquareClick(i)} className={`${isLight ? 'bg-gray-400' : 'bg-gray-700'}`}></div>;
                        })}
                        
                        {hint && <div className="absolute w-[12.5%] h-[12.5%] bg-yellow-500/50" style={{ transform: `translate(${ (hint.from % 8) * 100 }%, ${ Math.floor(hint.from / 8) * 100 }%)` }} />}
                        {hint && <div className="absolute w-[12.5%] h-[12.5%] bg-yellow-500/50" style={{ transform: `translate(${ (hint.to % 8) * 100 }%, ${ Math.floor(hint.to / 8) * 100 }%)` }} />}

                        {board.map((piece, i) => piece && (
                            <div
                                key={piece.id}
                                className="w-[12.5%] h-[12.5%] absolute flex items-center justify-center transition-transform duration-300 ease-in-out cursor-pointer"
                                style={{ transform: `translate(${ (i % 8) * 100 }%, ${ Math.floor(i / 8) * 100 }%)` }}
                                onClick={() => handleSquareClick(i)}
                            >
                                <div className={`w-full h-full transition-colors ${selectedSquare === i ? 'bg-green-500/50 rounded-full' : ''}`}>
                                    <PieceIcon piece={piece} />
                                </div>
                            </div>
                        ))}
                        
                        {premove && <div className="absolute pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: '100%' }}>
                            <svg width="100%" height="100%" viewBox="0 0 8 8">
                                <line x1={(premove.from % 8) + 0.5} y1={Math.floor(premove.from / 8) + 0.5} 
                                      x2={(premove.to % 8) + 0.5} y2={Math.floor(premove.to / 8) + 0.5} 
                                      stroke="rgba(239, 68, 68, 0.7)" strokeWidth="0.1" strokeDasharray="0.2,0.1" />
                            </svg>
                        </div>}

                        {validMoves.map(i => (
                            <div key={`move-${i}`} onClick={() => handleSquareClick(i)}
                                className="w-[12.5%] h-[12.5%] absolute flex items-center justify-center"
                                style={{ transform: `translate(${ (i % 8) * 100 }%, ${ Math.floor(i / 8) * 100 }%)` }}>
                                <div className="w-1/3 h-1/3 rounded-full bg-green-500/50 cursor-pointer"></div>
                            </div>
                        ))}

                         {isGameOver && <GameOverModal status={gameOverStatus} onReset={resetGame} />}
                         {promotionSquare !== null && (opponent === 'human' || turn === 'b') && <PromotionModal color={turn === 'w' ? 'b' : 'w'} onSelect={handlePromotion} />}
                    </div>
                    <CapturedPieces pieces={capturedPieces.w} />
                </div>
                
                 <div className="w-64 flex-shrink-0 flex flex-col items-center">
                    <h2 className="font-orbitron text-xl mb-2 text-center h-8 flex items-center">
                        {isAiThinking && <span className="animate-pulse mr-2">🤖...</span>} {status}
                    </h2>
                     <button 
                        onClick={getHint} 
                        disabled={isAITurn || isGameOver || !gameStarted}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600/50 hover:bg-yellow-600/70 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        💡 Hint
                     </button>
                 </div>
            </div>
        </div>
    );
};

export default Chess;
