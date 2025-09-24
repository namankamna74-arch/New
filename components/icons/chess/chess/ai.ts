
import { ChessBoardState, Piece, ChessColor, ChessDifficulty } from '../../../types';
import { getValidMoves, isKingInCheck } from './moveValidation';

const pieceValues: { [key in Piece['type']]: number } = {
    'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900
};

// Piece-Square Tables for positional advantage
// (from white's perspective, black's perspective is mirrored)
const pawnTable = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
];
const knightTable = [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50];
const bishopTable = [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20];
const kingTable = [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20];


const evaluateBoard = (board: ChessBoardState, turn: ChessColor): number => {
    let score = 0;
    for (let i = 0; i < 64; i++) {
        const piece = board[i];
        if (piece) {
            const value = pieceValues[piece.type];
            let positionalValue = 0;
            const tableIndex = piece.color === 'w' ? i : 63 - i;

            if (piece.type === 'p') positionalValue = pawnTable[tableIndex];
            else if (piece.type === 'n') positionalValue = knightTable[tableIndex];
            else if (piece.type === 'b') positionalValue = bishopTable[tableIndex];
            else if (piece.type === 'k') positionalValue = kingTable[tableIndex];
            
            score += (piece.color === 'b' ? 1 : -1) * (value + positionalValue);
        }
    }
    // "Checkmate is near" bonus
    const checkmateBonus = isKingInCheck(turn === 'w' ? 'b' : 'w', board) ? (turn === 'b' ? 10 : -10) : 0;
    return score + checkmateBonus;
};


const minimax = (board: ChessBoardState, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean, color: ChessColor, enPassantTarget: number | null): number => {
    if (depth === 0) {
        return evaluateBoard(board, isMaximizingPlayer ? color : (color === 'w' ? 'b' : 'w'));
    }
    
    const playerColor = isMaximizingPlayer ? color : (color === 'w' ? 'b' : 'w');
    const moves: { from: number, to: number }[] = [];
    for (let i = 0; i < 64; i++) {
        const piece = board[i];
        if (piece && piece.color === playerColor) {
            getValidMoves(i, board, enPassantTarget).forEach(to => moves.push({ from: i, to }));
        }
    }

    if (moves.length === 0) {
        if (isKingInCheck(playerColor, board)) {
            return isMaximizingPlayer ? -10000 - depth : 10000 + depth; // Checkmate
        }
        return 0; // Stalemate
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const { from, to } of moves) {
            const tempBoard = [...board];
            const piece = tempBoard[from]!;
            
            // Handle move and potential en passant capture
            const nextEnPassantTarget = piece.type === 'p' && Math.abs(from - to) === 16 ? (playerColor === 'w' ? to + 8 : to - 8) : null;
            if (piece.type === 'p' && to === enPassantTarget) {
                 const capturedPawnIndex = playerColor === 'w' ? to + 8 : to - 8;
                 tempBoard[capturedPawnIndex] = null;
            }
            tempBoard[to] = piece;
            tempBoard[from] = null;

            const evaluation = minimax(tempBoard, depth - 1, alpha, beta, false, color, nextEnPassantTarget);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const { from, to } of moves) {
            const tempBoard = [...board];
            const piece = tempBoard[from]!;

            const nextEnPassantTarget = piece.type === 'p' && Math.abs(from - to) === 16 ? (playerColor === 'w' ? to + 8 : to - 8) : null;
            if (piece.type === 'p' && to === enPassantTarget) {
                 const capturedPawnIndex = playerColor === 'w' ? to + 8 : to - 8;
                 tempBoard[capturedPawnIndex] = null;
            }
            tempBoard[to] = piece;
            tempBoard[from] = null;
            
            const evaluation = minimax(tempBoard, depth - 1, alpha, beta, true, color, nextEnPassantTarget);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

export const findBestMove = (board: ChessBoardState, difficulty: ChessDifficulty, enPassantTarget: number | null, turn: ChessColor = 'b'): { from: number | null, to: number | null } => {
    let bestMove: { from: number, to: number } | null = null;
    let bestValue = -Infinity;
    const aiColor = turn;
    const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

    const moves: { from: number, to: number }[] = [];
    for (let i = 0; i < 64; i++) {
        const piece = board[i];
        if (piece && piece.color === aiColor) {
            getValidMoves(i, board, enPassantTarget).forEach(to => moves.push({ from: i, to }));
        }
    }
    
    // Randomize moves to prevent predictability
    moves.sort(() => Math.random() - 0.5);

    for (const { from, to } of moves) {
        const tempBoard = [...board];
        const piece = tempBoard[from]!;
        
        const nextEnPassantTarget = piece.type === 'p' && Math.abs(from - to) === 16 ? to - 8 : null;
        if (piece.type === 'p' && to === enPassantTarget) {
             const capturedPawnIndex = to - 8;
             tempBoard[capturedPawnIndex] = null;
        }
        tempBoard[to] = piece;
        tempBoard[from] = null;
        
        const boardValue = minimax(tempBoard, depth - 1, -Infinity, Infinity, false, aiColor, nextEnPassantTarget);

        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = { from, to };
        }
    }
    
    if (!bestMove && moves.length > 0) {
        return moves[0];
    }
    
    return bestMove || { from: null, to: null };
};
