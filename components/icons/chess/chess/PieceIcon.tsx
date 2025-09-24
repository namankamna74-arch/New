import React from 'react';
import { Piece } from '../../../types';

import WhitePawn from '../WhitePawn';
import WhiteRook from '../WhiteRook';
import WhiteKnight from '../WhiteKnight';
import WhiteBishop from '../WhiteBishop';
import WhiteQueen from '../WhiteQueen';
import WhiteKing from '../WhiteKing';
import BlackPawn from './BlackPawn';
import BlackRook from '../BlackRook';
import BlackKnight from './BlackKnight';
import BlackBishop from './BlackBishop';
import BlackQueen from './BlackQueen';
import BlackKing from './BlackKing';

interface PieceIconProps {
  piece: Piece;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ piece }) => {
  if (piece.color === 'w') {
    switch (piece.type) {
      case 'p': return <WhitePawn />;
      case 'r': return <WhiteRook />;
      case 'n': return <WhiteKnight />;
      case 'b': return <WhiteBishop />;
      case 'q': return <WhiteQueen />;
      case 'k': return <WhiteKing />;
      default: return null;
    }
  } else {
    switch (piece.type) {
      case 'p': return <BlackPawn />;
      case 'r': return <BlackRook />;
      case 'n': return <BlackKnight />;
      case 'b': return <BlackBishop />;
      case 'q': return <BlackQueen />;
      case 'k': return <BlackKing />;
      default: return null;
    }
  }
};
