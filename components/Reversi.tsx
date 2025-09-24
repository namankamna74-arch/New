import React, { useState, useMemo } from 'react';
import { useSound } from '../hooks/useSound';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

type Player = 'black' | 'white';
type Board = (Player | null)[][];
const BOARD_SIZE = 8;
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const getInitialBoard = (): Board => {
    const board: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
};

const DIRS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

const getValidMoves = (board: Board, player: Player): { [key: string]: { r: number, c: number }[] } => {
    const validMoves: { [key: string]: { r: number, c: number }[] } = {};
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== null) continue;
            const opponent = player === 'black' ? 'white' : 'black';
            const tilesToFlip: { r: number, c: number }[] = [];

            for (const [dr, dc] of DIRS) {
                let r2 = r + dr;
                let c2 = c + dc;
                const potentialFlips: { r: number, c: number }[] = [];
                while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && board[r2][c2] === opponent) {
                    potentialFlips.push({ r: r2, c: c2 });
                    r2 += dr;
                    c2 += dc;
                }
                if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && board[r2][c2] === player && potentialFlips.length > 0) {
                    tilesToFlip.push(...potentialFlips);
                }
            }
            if (tilesToFlip.length > 0) {
                validMoves[`${r},${c}`] = tilesToFlip;
            }
        }
    }
    return validMoves;
};


const Reversi: React.FC = () => {
    const [board, setBoard] = useState<Board>(getInitialBoard());
    const [turn, setTurn] = useState<Player>('black');
    const [gameOver, setGameOver] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playFlip } = useSound(isMuted);

    const validMoves = useMemo(() => getValidMoves(board, turn), [board, turn]);

    const handleSquareClick = (r: number, c: number) => {
        const moveKey = `${r},${c}`;
        if (!validMoves[moveKey]) return;

        playFlip(false);
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = turn;
        validMoves[moveKey].forEach(tile => {
            newBoard[tile.r][tile.c] = turn;
        });

        setBoard(newBoard);
        
        const nextTurn = turn === 'black' ? 'white' : 'black';
        const nextValidMoves = getValidMoves(newBoard, nextTurn);
        
        if (Object.keys(nextValidMoves).length > 0) {
            setTurn(nextTurn);
        } else {
             const currentValidMoves = getValidMoves(newBoard, turn);
             if (Object.keys(currentValidMoves).length === 0) {
                 setGameOver(true);
             }
        }
    };
    
    const resetGame = () => {
        setBoard(getInitialBoard());
        setTurn('black');
        setGameOver(false);
    };

    const scores = board.flat().reduce((acc, cell) => {
        if (cell) acc[cell]++;
        return acc;
    }, { black: 0, white: 0 });

    const getWinner = () => {
        if (scores.black > scores.white) return 'Black Wins!';
        if (scores.white > scores.black) return 'White Wins!';
        return "It's a Draw!";
    }

    return (
         <div className="flex flex-col items-center justify-center font-orbitron relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Reversi">
                        <p><strong>Objective:</strong> Have the majority of your colored discs on the board at the end of the game.</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>You must place a disc in a position that "outflanks" one or more of your opponent's discs.</li>
                            <li>An outflanked row is a straight line of one or more of the opponent's discs with one of your discs at each end.</li>
                            <li>When you outflank discs, they are flipped to your color.</li>
                            <li>If you cannot make a valid move, your turn is skipped.</li>
                            <li>The game ends when neither player can make a move.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-0 right-0 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
             <style>{`
                .disc {
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                .disc-inner {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    border-radius: 9999px;
                }
                .disc-front {
                    background: black;
                }
                .disc-back {
                    background: white;
                    transform: rotateY(180deg);
                }
                .disc.white {
                    transform: rotateY(180deg);
                }
             `}</style>
             <h2 className="text-3xl mb-2">Reversi</h2>
             <div className="flex justify-around w-full max-w-md mb-4 text-xl">
                 <div className={`p-2 rounded transition-colors ${turn === 'black' && !gameOver ? 'bg-primary shadow-lg shadow-primary' : 'bg-black/20'}`}>Black: {scores.black}</div>
                 <div className={`p-2 rounded transition-colors ${turn === 'white' && !gameOver ? 'bg-primary shadow-lg shadow-primary' : 'bg-black/20'}`}>White: {scores.white}</div>
             </div>
              {gameOver && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 p-8 rounded-lg z-10 text-center">
                    <h2 className="text-4xl mb-4">{getWinner()}</h2>
                    <button onClick={resetGame} className="px-4 py-2 bg-primary rounded-lg">Play Again</button>
                </div>
            )}
            <div className="grid grid-cols-8 bg-green-800 border-4 border-green-900 p-2 gap-1">
                {board.map((row, r) => row.map((piece, c) => (
                    <div key={`${r}-${c}`} onClick={() => handleSquareClick(r,c)}
                        className="w-12 h-12 bg-green-700 flex items-center justify-center cursor-pointer p-1">
                        {piece ? (
                            <div className={`relative w-full h-full disc ${piece}`}>
                                <div className="disc-inner disc-front"></div>
                                <div className="disc-inner disc-back"></div>
                            </div>
                        ) : (
                           Object.keys(validMoves).includes(`${r},${c}`) && (
                                <div className="w-4 h-4 rounded-full bg-green-500/50"></div>
                           )
                        )}
                    </div>
                )))}
            </div>
            <button onClick={resetGame} className="mt-6 px-6 py-2 bg-primary-500/50 hover:bg-primary-500/70 rounded-lg font-semibold">New Game</button>
        </div>
    );
};

export default Reversi;