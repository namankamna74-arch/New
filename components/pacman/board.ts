import { Tile, PacManBoard } from '../../types';

export const TILE_SIZE = 20; // in pixels

const { EMPTY: E, WALL: W, PELLET: P, POWER_PELLET: O, GHOST_LAIR: G } = Tile;

export const initialBoardLayout: PacManBoard = [
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, O, P, P, P, P, P, P, P, P, P, P, P, W, W, P, P, P, P, P, P, P, P, P, P, P, O, W],
    [W, P, W, W, W, W, P, W, W, W, W, W, P, W, W, P, W, W, W, W, W, P, W, W, W, W, P, W],
    [W, P, W, W, W, W, P, W, W, W, W, W, P, W, W, P, W, W, W, W, W, P, W, W, W, W, P, W],
    [W, P, W, W, W, W, P, W, W, W, W, W, P, W, W, P, W, W, W, W, W, P, W, W, W, W, P, W],
    [W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, W],
    [W, P, W, W, W, W, P, W, W, P, W, W, W, W, W, W, W, W, P, W, W, P, W, W, W, W, P, W],
    [W, P, W, W, W, W, P, W, W, P, W, W, W, W, W, W, W, W, P, W, W, P, W, W, W, W, P, W],
    [W, P, P, P, P, P, P, W, W, P, P, P, P, W, W, P, P, P, P, W, W, P, P, P, P, P, P, W],
    [W, W, W, W, W, W, P, W, W, W, W, W, E, W, W, E, W, W, W, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, W, W, W, E, W, W, E, W, W, W, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, E, E, E, E, E, E, E, E, E, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, W, W, W, G, G, W, W, W, E, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, W, G, G, G, G, G, G, W, E, W, W, P, W, W, W, W, W, W],
    [E, E, E, E, E, E, P, E, E, E, W, G, G, G, G, G, G, W, E, E, E, P, E, E, E, E, E, E],
    [W, W, W, W, W, W, P, W, W, E, W, G, G, G, G, G, G, W, E, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, W, W, W, W, W, W, W, W, E, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, E, E, E, E, E, E, E, E, E, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, W, W, W, W, W, W, W, W, E, W, W, P, W, W, W, W, W, W],
    [W, W, W, W, W, W, P, W, W, E, W, W, W, W, W, W, W, W, E, W, W, P, W, W, W, W, W, W],
    [W, P, P, P, P, P, P, P, P, P, P, P, P, W, W, P, P, P, P, P, P, P, P, P, P, P, P, W],
    [W, P, W, W, W, W, P, W, W, W, W, W, P, W, W, P, W, W, W, W, W, P, W, W, W, W, P, W],
    [W, P, W, W, W, W, P, W, W, W, W, W, P, W, W, P, W, W, W, W, W, P, W, W, W, W, P, W],
    [W, O, P, P, W, W, P, P, P, P, P, P, P, E, E, P, P, P, P, P, P, P, W, W, P, P, O, W],
    [W, W, W, P, W, W, P, W, W, P, W, W, W, W, W, W, W, W, P, W, W, P, W, W, P, W, W, W],
    [W, W, W, P, W, W, P, W, W, P, W, W, W, W, W, W, W, W, P, W, W, P, W, W, P, W, W, W],
    [W, P, P, P, P, P, P, W, W, P, P, P, P, W, W, P, P, P, P, W, W, P, P, P, P, P, P, W],
    [W, P, W, W, W, W, W, W, W, W, W, W, P, W, W, P, W, W, W, W, W, W, W, W, W, W, P, W],
    [W, P, W, W, W, W, W, W, W, W, W, W, P, W, W, P, W, W, W, W, W, W, W, W, W, W, P, W],
    [W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
];
