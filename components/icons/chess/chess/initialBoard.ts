import { ChessBoardState, Piece } from '../../../types';

let pieceId = 0;

const createPiece = (type: Piece['type'], color: Piece['color']): Piece => ({
  id: pieceId++,
  type,
  color,
  hasMoved: false,
});

const B = (type: Piece['type']) => createPiece(type, 'b');
const W = (type: Piece['type']) => createPiece(type, 'w');

export const getInitialBoard = (): ChessBoardState => {
  pieceId = 0; // Reset ID counter for new games
  return [
    B('r'), B('n'), B('b'), B('q'), B('k'), B('b'), B('n'), B('r'),
    B('p'), B('p'), B('p'), B('p'), B('p'), B('p'), B('p'), B('p'),
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    W('p'), W('p'), W('p'), W('p'), W('p'), W('p'), W('p'), W('p'),
    W('r'), W('n'), W('b'), W('q'), W('k'), W('b'), W('n'), W('r'),
  ];
};