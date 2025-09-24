import { ChessBoardState, ChessColor } from '../../../types';

const getPos = (index: number) => ({ row: Math.floor(index / 8), col: index % 8 });
const getIdx = (row: number, col: number) => (row >= 0 && row < 8 && col >= 0 && col < 8) ? row * 8 + col : -1;

export const isSquareAttacked = (index: number, attackerColor: ChessColor, board: ChessBoardState): boolean => {
    const opponentColor = attackerColor === 'w' ? 'b' : 'w';

    // Check for pawn attacks
    const pawnAttackDir = attackerColor === 'w' ? 1 : -1;
    const { row, col } = getPos(index);
    for (const dc of [-1, 1]) {
        const pawnIdx = getIdx(row + pawnAttackDir, col + dc);
        if (pawnIdx !== -1) {
            const piece = board[pawnIdx];
            if (piece && piece.type === 'p' && piece.color === attackerColor) return true;
        }
    }
    
    // Check for knight attacks
    const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, dc] of knightMoves) {
        const knightIdx = getIdx(row + dr, col + dc);
        if (knightIdx !== -1) {
            const piece = board[knightIdx];
            if (piece && piece.type === 'n' && piece.color === attackerColor) return true;
        }
    }

    // Check for sliding attacks (Rook, Bishop, Queen)
    const slidingDirections = {
        'r': [[0, 1], [0, -1], [1, 0], [-1, 0]],
        'b': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        'q': [[0, 1], [0, -1], [1, 0], [-1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]
    };
    for (const pieceType of ['r', 'b', 'q'] as ('r'|'b'|'q')[]) {
        for (const [dr, dc] of slidingDirections[pieceType]) {
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const pieceIdx = getIdx(r, c);
                const piece = board[pieceIdx];
                if (piece) {
                    if (piece.color === attackerColor && (piece.type === pieceType || piece.type === 'q')) return true;
                    break;
                }
                r += dr;
                c += dc;
            }
        }
    }
    
    // Check for king attacks
    const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [dr, dc] of kingMoves) {
        const kingIdx = getIdx(row + dr, col + dc);
        if (kingIdx !== -1) {
            const piece = board[kingIdx];
            if (piece && piece.type === 'k' && piece.color === attackerColor) return true;
        }
    }

    return false;
};

export const isKingInCheck = (kingColor: ChessColor, board: ChessBoardState): boolean => {
    const kingIndex = board.findIndex(p => p && p.type === 'k' && p.color === kingColor);
    if (kingIndex === -1) return false; // Should not happen in a real game
    const opponentColor = kingColor === 'w' ? 'b' : 'w';
    return isSquareAttacked(kingIndex, opponentColor, board);
};

export const getValidMoves = (index: number, board: ChessBoardState, enPassantTarget: number | null): number[] => {
    const piece = board[index];
    if (!piece) return [];

    const pseudoLegalMoves = getPseudoLegalMoves(index, board, enPassantTarget);
    
    // Filter out moves that leave the king in check
    const validMoves = pseudoLegalMoves.filter(move => {
        const newBoard = [...board];
        newBoard[move] = newBoard[index];
        newBoard[index] = null;
        // Special case for en passant capture
        if (piece.type === 'p' && move === enPassantTarget) {
            const capturedPawnIndex = piece.color === 'w' ? move + 8 : move - 8;
            newBoard[capturedPawnIndex] = null;
        }
        return !isKingInCheck(piece.color, newBoard);
    });

    return validMoves;
};

const getPseudoLegalMoves = (index: number, board: ChessBoardState, enPassantTarget: number | null): number[] => {
    const piece = board[index];
    if (!piece) return [];
    
    const { row, col } = getPos(index);
    const moves: number[] = [];
    const color = piece.color;
    const opponentColor = color === 'w' ? 'b' : 'w';

    const addMove = (r: number, c: number, canCapture: boolean = true, mustCapture: boolean = false) => {
        const targetIndex = getIdx(r, c);
        if (targetIndex === -1) return false;

        const targetPiece = board[targetIndex];
        if (!targetPiece) {
            if (!mustCapture) moves.push(targetIndex);
            return true;
        }
        if (targetPiece.color === opponentColor && canCapture) {
            moves.push(targetIndex);
        }
        return false;
    };
    
    const addSlidingMoves = (directions: number[][]) => {
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            while (addMove(r,c)) { r += dr; c += dc; }
        }
    };

    switch (piece.type) {
        case 'p': // Pawn
            const dir = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;
            // Move forward
            if (!board[getIdx(row + dir, col)]) {
                addMove(row + dir, col, false);
                // Double move from start
                if (row === startRow && !board[getIdx(row + 2 * dir, col)]) {
                    addMove(row + 2 * dir, col, false);
                }
            }
            // Capture
            [-1, 1].forEach(dc => {
                const targetIdx = getIdx(row + dir, col + dc);
                if (targetIdx !== -1 && board[targetIdx] && board[targetIdx]?.color === opponentColor) {
                    addMove(row + dir, col + dc, true, true);
                }
                // En Passant
                if (targetIdx === enPassantTarget) {
                     addMove(row + dir, col + dc, true, true);
                }
            });
            break;
        case 'r': addSlidingMoves([[0, 1], [0, -1], [1, 0], [-1, 0]]); break;
        case 'n':
            const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            knightMoves.forEach(([dr, dc]) => addMove(row + dr, col + dc));
            break;
        case 'b': addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]); break;
        case 'q': addSlidingMoves([[0, 1], [0, -1], [1, 0], [-1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]); break;
        case 'k':
            const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            kingMoves.forEach(([dr, dc]) => addMove(row + dr, col + dc));
            
            // Castling
            if (!piece.hasMoved && !isKingInCheck(color, board)) {
                // Kingside
                const kingsideRook = board[index + 3];
                if (kingsideRook && !kingsideRook.hasMoved && !board[index + 1] && !board[index + 2]) {
                    if (!isSquareAttacked(index + 1, opponentColor, board) && !isSquareAttacked(index + 2, opponentColor, board)) {
                        moves.push(index + 2);
                    }
                }
                // Queenside
                const queensideRook = board[index - 4];
                if (queensideRook && !queensideRook.hasMoved && !board[index - 1] && !board[index - 2] && !board[index - 3]) {
                     if (!isSquareAttacked(index - 1, opponentColor, board) && !isSquareAttacked(index - 2, opponentColor, board)) {
                        moves.push(index - 2);
                    }
                }
            }
            break;
    }
    
    return moves;
};