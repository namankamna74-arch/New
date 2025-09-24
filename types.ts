export enum View {
    Home,
    Calculator,
    TicTacToe,
    Chess,
    Tetris,
    Minesweeper,
    Sudoku,
    Solitaire,
    AstroClub,
    PhysicsLab,
    MindBenders,
    BioLab,
    ChemLab,
    PacMan,
    TwentyFortyEight,
    Checkers,
    ConnectFour,
    Snake,
    Asteroids,
    Breakout,
    Hangman,
    Pong,
    Reversi,
    SpaceInvaders,
    WordSearch
}

// --- General App Types ---
export type Theme = 'nova' | 'cyber' | 'solar';

// --- General Game Types ---
export type GameOpponent = 'human' | 'ai';

// --- Tic-Tac-Toe Types ---
export type Player = 'X' | 'O';
export type SquareValue = Player | null;
export type BoardState = SquareValue[];

// --- Chess Types ---
export type ChessColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type ChessDifficulty = 'easy' | 'medium' | 'hard';

export interface Piece {
    id: number;
    type: PieceType;
    color: ChessColor;
    hasMoved?: boolean;
}

export type ChessSquare = Piece | null;
export type ChessBoardState = ChessSquare[];
export type GameTheme = 'light' | 'dark';

// --- Tetris Types ---
export type TetrominoShape = (0 | 1)[][];
export interface Tetromino {
    shape: TetrominoShape;
    color: string;
}
export type GameGrid = (string | 0)[][];

// --- Minesweeper Types ---
export interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
}
export type MinesweeperGrid = Cell[][];
export type MinesweeperDifficulty = 'easy' | 'medium' | 'hard';

// --- Solitaire Types ---
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    isFaceUp: boolean;
}
export type Pile = Card[];

// --- Astro Club (Orbital Mechanics) ---
export interface CelestialBody {
    x: number;
    y: number;
    radius: number;
    mass: number;
    color: string;
}
export interface Satellite {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    path: { x: number; y: number }[];
}

// --- Physics Lab ---
export type PhysicsTopic = 'newton' | 'momentum' | 'projectile';
export interface PhysicsObject {
    id: number;
    mass: number;
    radius: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color?: string;
}
export interface Cannon {
    angle: number;
    power: number;
}

// --- Mind Benders (Psychology) ---
export type Bias = 'confirmation' | 'anchoring' | 'framing';
export interface BiasTest {
    type: Bias;
    title: string;
    description: string;
    scenario: string;
    questions: { text: string, isCorrect?: boolean }[];
    explanation: string;
}

// --- Bio Lab (Cell Builder) ---
export type OrganelleType = 'nucleus' | 'mitochondrion' | 'ribosome' | 'endoplasmic_reticulum' | 'golgi_apparatus' | 'lysosome' | 'cell_membrane' | 'cytoplasm' | 'cell_wall' | 'chloroplast' | 'vacuole';
export interface Organelle {
    id: string;
    type: OrganelleType;
    name: string;
    function: string;
}
export type CellType = 'animal' | 'plant';

// --- Chem Lab (Molecule Builder) ---
export type AtomType = 'H' | 'C' | 'N' | 'O';
export interface Atom {
    id: number;
    type: AtomType;
    x: number;
    y: number;
    bonds: number[]; // ids of connected atoms
}
export interface Bond {
    id: string;
    from: number;
    to: number;
}
export interface Molecule {
    name: string;
    formula: string;
    structure: { atom: AtomType, connections: number[] }[];
}

// --- Pac-Man Types ---
export enum Tile {
    EMPTY,
    WALL,
    PELLET,
    POWER_PELLET,
    GHOST_LAIR,
}
export type PacManBoard = Tile[][];
export interface Position {
    x: number;
    y: number;
}
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP';
export interface Ghost {
    id: number;
    name: string;
    position: Position;
    direction: Direction;
    color: string;
    isFrightened: boolean;
    isEaten: boolean;
    spawnPoint: Position;
}

// --- 2048 Types ---
export interface TileData {
    id: number;
    value: number;
    isNew?: boolean;
    isMerged?: boolean;
}
export type GridType = (TileData | null)[][];

// --- Checkers Types ---
export type CheckersPlayer = 'red' | 'black';
export interface CheckersPiece {
    id: number;
    player: CheckersPlayer;
    isKing: boolean;
}
export type CheckersBoard = (CheckersPiece | null)[][];

// --- Connect Four Types ---
export type ConnectFourPlayer = 1 | 2;
export type ConnectFourGrid = (0 | ConnectFourPlayer)[][];

// --- Snake Types ---
export type SnakeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';