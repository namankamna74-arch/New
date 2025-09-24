
import React, { useRef, useEffect, Suspense } from 'react';
import { View, Theme } from '../types';
import { 
    CalculatorIcon, TicTacToeIcon, ChessIcon, TetrisIcon,
    MinesweeperIcon, SudokuIcon, SolitaireIcon,
    AstroClubIcon, PhysicsLabIcon, MindBendersIcon, BioLabIcon, ChemLabIcon,
    PacManIcon, TwentyFortyEightIcon, CheckersIcon, ConnectFourIcon, SnakeIcon,
    AsteroidsIcon, BreakoutIcon, HangmanIcon, PongIcon, ReversiIcon,
    SpaceInvadersIcon, WordSearchIcon
} from './Icons';
import { useAppStore } from '../store';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Center } from '@react-three/drei';
import * as THREE from 'three';

interface HomeScreenProps {
    onNavigate: (view: View) => void;
}

const THEME_COLORS = {
    nova: new THREE.Color('#a855f7'),
    cyber: new THREE.Color('#34d399'),
    solar: new THREE.Color('#fb923c'),
};

const ThreeDTitle = () => {
    const { theme } = useAppStore();
    const vec = new THREE.Vector3();
    const textRef = useRef<any>();
    const { viewport } = useThree();

    const color = THEME_COLORS[theme];

// FIX: Add delta argument to useFrame callback
    useFrame((state, delta) => {
        if (!textRef.current) return;
        state.camera.position.lerp(vec.set(state.mouse.x * 2, state.mouse.y * 1, 6), 0.05);
        state.camera.lookAt(0, 0, 0);
        textRef.current.rotation.y = THREE.MathUtils.lerp(textRef.current.rotation.y, state.mouse.x * Math.PI * 0.1, 0.05);
        textRef.current.rotation.x = THREE.MathUtils.lerp(textRef.current.rotation.x, -state.mouse.y * Math.PI * 0.1, 0.05);
    });

    return (
        <Center ref={textRef}>
{/* FIX: Use material props on Text component directly to avoid JSX type errors */}
{/* FIX: Removed emissive and emissiveIntensity props to resolve TypeScript error as they are not found in the component's type definition. */}
            <Text
                font="https://fonts.gstatic.com/s/orbitron/v25/yMJRMIlzdpvBhQQL_Qq7dy0.woff"
                fontSize={viewport.width / 8}
                letterSpacing={-0.05}
                lineHeight={1}
                material-toneMapped={false}
                color={color}
            >
                Nova Nexus
            </Text>
        </Center>
    )
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const { setTheme } = useAppStore();

    const features = [
        { view: View.Calculator, title: "Calculator", icon: <CalculatorIcon />, color: "from-purple-500 to-indigo-500" },
        { view: View.TicTacToe, title: "Tic-Tac-Toe", icon: <TicTacToeIcon />, color: "from-green-500 to-teal-500" },
        { view: View.Chess, title: "Chess", icon: <ChessIcon />, color: "from-gray-400 to-gray-600" },
        { view: View.Tetris, title: "Tetris", icon: <TetrisIcon />, color: "from-cyan-500 to-blue-500" },
        { view: View.Minesweeper, title: "Minesweeper", icon: <MinesweeperIcon />, color: "from-gray-600 to-slate-800" },
        { view: View.Sudoku, title: "Sudoku", icon: <SudokuIcon />, color: "from-indigo-400 to-purple-600" },
        { view: View.Solitaire, title: "Solitaire", icon: <SolitaireIcon />, color: "from-teal-600 to-cyan-800" },
        { view: View.Snake, title: "Snake", icon: <SnakeIcon />, color: "from-lime-500 to-green-600" },
        { view: View.Pong, title: "Pong", icon: <PongIcon />, color: "from-slate-300 to-slate-500" },
        { view: View.Breakout, title: "Breakout", icon: <BreakoutIcon />, color: "from-rose-400 to-red-600" },
        { view: View.SpaceInvaders, title: "Invaders", icon: <SpaceInvadersIcon />, color: "from-green-300 to-green-500" },
        { view: View.PacMan, title: "Pac-Man", icon: <PacManIcon />, color: "from-yellow-400 to-amber-500" },
        { view: View.TwentyFortyEight, title: "2048", icon: <TwentyFortyEightIcon />, color: "from-amber-400 to-orange-600" },
        { view: View.Checkers, title: "Checkers", icon: <CheckersIcon />, color: "from-red-500 to-red-800" },
        { view: View.ConnectFour, title: "Connect 4", icon: <ConnectFourIcon />, color: "from-blue-500 to-blue-700" },
        { view: View.Hangman, title: "Hangman", icon: <HangmanIcon />, color: "from-stone-500 to-stone-700" },
        { view: View.Reversi, title: "Reversi", icon: <ReversiIcon />, color: "from-emerald-500 to-emerald-700" },
        { view: View.WordSearch, title: "Word Search", icon: <WordSearchIcon />, color: "from-sky-500 to-sky-700" },
        { view: View.Asteroids, title: "Asteroids", icon: <AsteroidsIcon />, color: "from-slate-500 to-slate-700" },
        { view: View.AstroClub, title: "Astro Club", icon: <AstroClubIcon />, color: "from-sky-500 to-indigo-600" },
        { view: View.PhysicsLab, title: "Physics Lab", icon: <PhysicsLabIcon />, color: "from-rose-500 to-pink-600" },
        { view: View.MindBenders, title: "Mind Benders", icon: <MindBendersIcon />, color: "from-amber-500 to-orange-600" },
        { view: View.BioLab, title: "Bio Lab", icon: <BioLabIcon />, color: "from-lime-500 to-green-600" },
        { view: View.ChemLab, title: "Chem Lab", icon: <ChemLabIcon />, color: "from-fuchsia-600 to-purple-700" },
    ].map(f => ({ ...f, description: '', shadow: `shadow-${f.color.split('-')[1]}-500/50`}));
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!gridRef.current) return;
            const cards = Array.from(gridRef.current.children) as HTMLDivElement[];
            for(const card of cards) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty("--mouse-x", `${x}px`);
                card.style.setProperty("--mouse-y", `${y}px`);
                
                const rotateX = (y - rect.height / 2) / 10;
                const rotateY = -(x - rect.width / 2) / 10;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        };
        const handleMouseLeave = () => {
             if (!gridRef.current) return;
            const cards = Array.from(gridRef.current.children) as HTMLDivElement[];
            for(const card of cards) {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            }
        }
        
        const gridEl = gridRef.current;
        if(gridEl) {
            gridEl.addEventListener("mousemove", handleMouseMove);
            gridEl.addEventListener("mouseleave", handleMouseLeave);
        }
        return () => {
            if(gridEl) {
                gridEl.removeEventListener("mousemove", handleMouseMove);
                gridEl.removeEventListener("mouseleave", handleMouseLeave);
            }
        }
    }, []);


    return (
        <div className="flex flex-col items-center justify-center w-full h-screen p-8">
            <div className="text-center mb-2 relative h-40 w-full">
                <Suspense fallback={<div className="text-7xl font-orbitron">Nova Nexus</div>}>
                    <Canvas>
                        {/* FIX: Removed light components to fix JSX type errors. The Text component uses material-toneMapped={false} so it remains visible. */}
                        <ThreeDTitle />
                    </Canvas>
                </Suspense>
                 <div className="absolute top-0 right-0 flex items-center gap-2 p-1 rounded-full bg-background-secondary backdrop-blur-sm">
                    <span className="text-sm font-orbitron px-2">Theme:</span>
                     {(['nova', 'cyber', 'solar'] as Theme[]).map(t => (
                        <button 
                            key={t}
                            onClick={() => setTheme(t)}
                            aria-label={`Switch to ${t} theme`}
                            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                            style={{
                                backgroundColor: t === 'nova' ? '#a855f7' : t === 'cyber' ? '#34d399' : '#fb923c'
                            }}
                        />
                    ))}
                </div>
            </div>
             <p className="text-xl text-text-secondary -mt-2 mb-6 animate-fade-in-up">
                    Your portal for scientific discovery and play.
                </p>
            <div className="w-full max-w-7xl flex-grow overflow-y-auto pr-4 scroll-container" >
                <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 interactive-grid">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            onClick={() => onNavigate(feature.view)}
                            className={`
                                feature-card p-4 rounded-2xl bg-background-secondary backdrop-blur-lg border border-theme-primary
                                flex flex-col items-center justify-center text-center aspect-square
                                cursor-pointer transition-all duration-300 ease-in-out
                                hover:border-white/30 group animate-fade-in-up relative overflow-hidden
                            `}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className={`
                                mb-3 p-3 rounded-full bg-gradient-to-br ${feature.color}
                                transition-all duration-300 group-hover:shadow-lg 
                                group-hover:${feature.shadow}
                            `}>
                                {React.cloneElement(feature.icon, { className: 'w-8 h-8' })}
                            </div>
                            <h2 className="font-orbitron text-md font-bold">{feature.title}</h2>
                        </div>
                    ))}
                </div>
            </div>
             <style>{`
                @property --mouse-x { syntax: '<length>'; initial-value: 0px; inherits: false; }
                @property --mouse-y { syntax: '<length>'; initial-value: 0px; inherits: false; }
                
                .feature-card::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    background: radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1), transparent 40%);
                    transition: opacity 0.5s;
                }
                .feature-card:hover::before {
                    opacity: 1;
                }
                .feature-card {
                    transform-style: preserve-3d;
                    will-change: transform;
                }
                @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
                .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
                /* Custom scrollbar for webkit browsers */
                .scroll-container::-webkit-scrollbar { width: 8px; }
                .scroll-container::-webkit-scrollbar-track { background: transparent; }
                .scroll-container::-webkit-scrollbar-thumb { background-color: color-mix(in srgb, var(--color-primary) 30%, transparent); border-radius: 20px; }
                .scroll-container::-webkit-scrollbar-thumb:hover { background-color: color-mix(in srgb, var(--color-primary) 50%, transparent); }
             `}</style>
        </div>
    );
};

export default HomeScreen;
