
import React, { useState, useEffect } from 'react';
import { View, Theme } from './types';
import Calculator from './components/Calculator';
import TicTacToe from './components/TicTacToe';
import Chess from './components/Chess';
import HomeScreen from './components/HomeScreen';
import Tetris from './components/Tetris';
import Minesweeper from './components/Minesweeper';
import Sudoku from './components/Sudoku';
import Solitaire from './components/Solitaire';
import AstroClub from './components/AstroClub';
import PhysicsLab from './components/PhysicsLab';
import MindBenders from './components/MindBenders';
import BioLab from './components/BioLab';
import ChemLab from './components/ChemLab';
import PacMan from './components/PacMan';
import TwentyFortyEight from './components/2048';
import Checkers from './components/Checkers';
import ConnectFour from './components/ConnectFour';
// FIX: The Snake component file was truncated. Added a default export to the file. This import should now work.
import Snake from './components/Snake';
import Asteroids from './components/Asteroids';
import Breakout from './components/Breakout';
import Hangman from './components/Hangman';
import Pong from './components/Pong';
import Reversi from './components/Reversi';
import SpaceInvaders from './components/SpaceInvaders';
import WordSearch from './components/WordSearch';
import { useSound } from './hooks/useSound';
import { useAppStore } from './store';
import { SoundOnIcon, SoundOffIcon, BackIcon } from './components/Icons';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Home);
    const { theme, isMuted, setTheme, toggleMute } = useAppStore();
    const { playClick, playNavigate, toggleAmbient, isAmbientPlaying } = useSound(isMuted);

    useEffect(() => {
        if (!isMuted && !isAmbientPlaying) {
            toggleAmbient(true);
        } else if (isMuted && isAmbientPlaying) {
            toggleAmbient(false);
        }
    }, [isMuted, isAmbientPlaying, toggleAmbient]);
    
    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    const handleSetView = (view: View) => {
        if (currentView === View.Home) {
            playNavigate();
        } else {
            playClick();
        }
        setCurrentView(view);
    }
    
    const ThemeSwitcher: React.FC = () => (
        <div className="absolute top-5 right-20 z-50 flex gap-1 p-1 rounded-full bg-black/30 backdrop-blur-sm">
            {(['nova', 'cyber', 'solar'] as Theme[]).map(t => (
                 <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-label={`Switch to ${t} theme`}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${theme === t ? 'ring-2 ring-white/80' : ''}`}
                    style={{
                        backgroundColor: t === 'nova' ? '#a855f7' : t === 'cyber' ? '#34d399' : '#fb923c'
                    }}
                 />
            ))}
        </div>
    );

    const renderView = () => {
        switch (currentView) {
            case View.Calculator: return <Calculator />;
            case View.TicTacToe: return <TicTacToe />;
            case View.Chess: return <Chess />;
            case View.Tetris: return <Tetris />;
            case View.Minesweeper: return <Minesweeper />;
            case View.Sudoku: return <Sudoku />;
            case View.Solitaire: return <Solitaire />;
            case View.AstroClub: return <AstroClub />;
            case View.PhysicsLab: return <PhysicsLab />;
            case View.MindBenders: return <MindBenders />;
            case View.BioLab: return <BioLab />;
            case View.ChemLab: return <ChemLab />;
            case View.PacMan: return <PacMan />;
            case View.TwentyFortyEight: return <TwentyFortyEight />;
            case View.Checkers: return <Checkers />;
            case View.ConnectFour: return <ConnectFour />;
            case View.Snake: return <Snake />;
            case View.Asteroids: return <Asteroids />;
            case View.Breakout: return <Breakout />;
            case View.Hangman: return <Hangman />;
            case View.Pong: return <Pong />;
            case View.Reversi: return <Reversi />;
            case View.SpaceInvaders: return <SpaceInvaders />;
            case View.WordSearch: return <WordSearch />;
            case View.Home:
            default:
                 return <HomeScreen onNavigate={handleSetView} />;
        }
    };
    
    return (
        <div className="min-h-screen bg-background-primary text-text-primary flex items-center justify-center p-4 font-roboto relative overflow-hidden transition-colors duration-500">
             <style>{`
                @keyframes gradient-animation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animated-gradient {
                    background: linear-gradient(-45deg, var(--bg-primary), var(--color-primary), var(--color-accent), var(--bg-primary));
                    background-size: 400% 400%;
                    animation: gradient-animation 25s ease infinite;
                }
             `}</style>
             <div className="absolute inset-0 animated-gradient z-0 opacity-50"></div>
             
             {currentView !== View.Home && (
                 <>
                    <button 
                        onClick={() => handleSetView(View.Home)}
                        className="absolute top-5 left-5 z-50 p-3 rounded-full bg-black/30 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-primary"
                        aria-label="Back to Home"
                    >
                        <BackIcon />
                    </button>
                    <ThemeSwitcher />
                    <button
                        onClick={() => {
                            toggleMute();
                            if (isMuted) playClick(true);
                        }}
                        className="absolute top-5 right-5 z-50 p-3 rounded-full bg-black/30 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-primary"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
                    </button>
                    <div className="w-full max-w-7xl h-[95vh] min-h-[700px] flex items-center justify-center rounded-3xl bg-background-secondary backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden border-2 border-theme-primary relative z-10">
                        {renderView()}
                    </div>
                 </>
             )}
             {currentView === View.Home && <div className="relative z-10 w-full h-full">{renderView()}</div>}
        </div>
    );
};

export default App;
