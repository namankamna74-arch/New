import React, { useState, useEffect, useCallback } from 'react';
import { useSound } from '../hooks/useSound';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const WORDS = ["REACT", "TAILWIND", "JAVASCRIPT", "COMPONENT", "FUSION", "CALCULATOR", "GEMINI"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const MAX_WRONG_GUESSES = 6;
const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );


const Hangman: React.FC = () => {
    const [word, setWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWinner, setIsWinner] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playScore, playLose, playWin } = useSound(isMuted);

    const startNewGame = useCallback(() => {
        setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
        setGuessedLetters([]);
        setWrongGuesses(0);
        setIsGameOver(false);
        setIsWinner(false);
    }, []);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    useEffect(() => {
        if (wrongGuesses >= MAX_WRONG_GUESSES) {
            setIsGameOver(true);
            playLose(false);
        }
        const wordGuessed = word.split('').every(letter => guessedLetters.includes(letter));
        if (word && wordGuessed) {
            setIsGameOver(true);
            setIsWinner(true);
            playWin(false);
        }
    }, [guessedLetters, wrongGuesses, word, playLose, playWin]);

    const handleGuess = (letter: string) => {
        if (isGameOver || guessedLetters.includes(letter)) return;

        setGuessedLetters([...guessedLetters, letter]);
        if (word.includes(letter)) {
            playScore(false);
        } else {
            setWrongGuesses(prev => prev + 1);
        }
    };
    
    const hangmanParts = [
        <circle key="head" cx="100" cy="50" r="20" stroke="white" strokeWidth="4" fill="none" />,
        <line key="body" x1="100" y1="70" x2="100" y2="150" stroke="white" strokeWidth="4" />,
        <line key="arm1" x1="100" y1="90" x2="70" y2="120" stroke="white" strokeWidth="4" />,
        <line key="arm2" x1="100" y1="90" x2="130" y2="120" stroke="white" strokeWidth="4" />,
        <line key="leg1" x1="100" y1="150" x2="70" y2="180" stroke="white" strokeWidth="4" />,
        <line key="leg2" x1="100" y1="150" x2="130" y2="180" stroke="white" strokeWidth="4" />,
    ];

    return (
        <div className="flex flex-col items-center justify-center font-orbitron w-full h-full relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Hangman">
                        <p><strong>Objective:</strong> Guess the secret word one letter at a time before the hangman is fully drawn.</p>
                        <p><strong>How to Play:</strong></p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Click on the letters in the alphabet below to make a guess.</li>
                            <li>If the letter is in the word, it will be revealed.</li>
                            <li>If the letter is not in the word, a part of the hangman will be drawn.</li>
                            <li>You have 6 wrong guesses before you lose. Guess the word to win!</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
            <h2 className="text-4xl mb-4">Hangman</h2>
            <svg height="250" width="200" className="mb-4">
                <line x1="10" y1="230" x2="150" y2="230" stroke="white" strokeWidth="4" />
                <line x1="50" y1="230" x2="50" y2="20" stroke="white" strokeWidth="4" />
                <line x1="50" y1="20" x2="100" y2="20" stroke="white" strokeWidth="4" />
                <line x1="100" y1="20" x2="100" y2="30" stroke="white" strokeWidth="4" />
                {hangmanParts.slice(0, wrongGuesses)}
            </svg>
            <div className="flex gap-4 text-4xl tracking-[.5em] mb-8">
                {word.split('').map((letter, index) => (
                    <span key={index} className="border-b-4 pb-2 w-10 text-center">
                        {guessedLetters.includes(letter) || (isGameOver && !isWinner) ? letter : guessedLetters.includes(letter) ? letter : '_'}
                    </span>
                ))}
            </div>
            
            {isGameOver && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                    <h2 className="text-4xl mb-4">{isWinner ? "You Win!" : "Game Over"}</h2>
                    {!isWinner && <p className="text-2xl mb-4">The word was: {word}</p>}
                    <button onClick={startNewGame} className="px-4 py-2 bg-primary rounded-lg">Play Again</button>
                </div>
            )}

            <div className="grid grid-cols-9 gap-2">
                {ALPHABET.map(letter => (
                    <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={guessedLetters.includes(letter) || isGameOver}
                        className="w-12 h-12 text-2xl bg-white/10 rounded-lg disabled:bg-black/20 disabled:text-gray-600 hover:bg-white/20 transition-colors"
                    >
                        {letter}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Hangman;