import React, { useState, useEffect } from 'react';
import OnePlusLogo from './icons/OnePlusLogo';
import { useSound } from '../hooks/useSound';
import TutorialModal from './TutorialModal';
import { useAppStore } from '../store';
import { AnimatePresence } from 'framer-motion';

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const HelpIcon: React.FC<React.ComponentProps<'svg'>> = (props) => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.451-2.21 1.228-3zM12 18a9 9 0 100-18 9 9 0 000 18z" /> </svg> );

const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [isResult, setIsResult] = useState(false);
    const [showOnePlus, setShowOnePlus] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playClick, playClear, playCalculate, playError } = useSound(isMuted);

    useEffect(() => {
        if (showOnePlus) {
            const timer = setTimeout(() => setShowOnePlus(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [showOnePlus]);
    
    const factorial = (n: number): number => {
        if (n < 0 || n % 1 !== 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    };

    const handleButtonClick = (action: () => void, isCalculation = false) => {
        if (isCalculation) playCalculate(); else playClick();
        action();
    }

    const getParenCount = (exp: string) => {
        return (exp.match(/\(/g) || []).length - (exp.match(/\)/g) || []).length;
    };

    const handleInput = (value: string) => {
        if (showOnePlus) return;
        
        const lastChar = expression.trim().slice(-1);
        const lastCharIsOperator = /[+\-*/]/.test(lastChar);

        if (isResult && !/[+\-*/%]/.test(value)) {
            setDisplay(value);
            setExpression(value);
            setIsResult(false);
            return;
        }

        if (display === '1' && value === '+') {
            setShowOnePlus(true);
            setExpression(prev => prev + value);
            setDisplay(prev => prev + value);
            setIsResult(false);
            return;
        }

        if (/[+\-*/]/.test(value)) {
            if (expression.trim() === '' || expression.trim() === 'Error') return;
            if (lastCharIsOperator) {
                setExpression(prev => prev.trim().slice(0, -1) + value);
            } else {
                setExpression(prev => `${prev}${value}`);
            }
            setDisplay(value);
        } else if (value === '.') {
            if (display.includes('.')) return;
            setDisplay(prev => prev + '.');
            setExpression(prev => prev + '.');
        } else if (value === '(') {
             if (expression === '' || lastCharIsOperator || lastChar === '(') {
                setExpression(prev => prev + value);
             } else {
                 setExpression(prev => prev + '*' + value);
             }
        } else if (value === ')') {
            if (getParenCount(expression) > 0 && !lastCharIsOperator) {
                setExpression(prev => prev + value);
            }
        } else if (['π', 'e'].includes(value)) {
            const constant = value === 'π' ? String(Math.PI) : String(Math.E);
             if (expression === '' || lastCharIsOperator || lastChar === '(') {
                setDisplay(constant);
                setExpression(prev => prev + constant);
             } else {
                setDisplay(constant);
                setExpression(prev => prev + '*' + constant);
             }
        } else { // It's a number
            if (isResult || display === '0' || /[+\-*/]/.test(display)) {
                setDisplay(value);
            } else {
                setDisplay(prev => prev + value);
            }
            setExpression(prev => prev + value);
        }
        
        setIsResult(false);
    };
    
    const handleUnary = (op: 'sqrt' | 'sqr' | 'percent' | 'factorial') => {
        try {
            const currentNumStr = display;
            const currentNum = parseFloat(currentNumStr);
            if (isNaN(currentNum)) { playError(); return; };

            let result;
            let newExpressionPart = '';

            switch(op) {
                case 'sqrt':
                    if (currentNum < 0) { playError(); setDisplay('Error'); return; }
                    result = Math.sqrt(currentNum);
                    newExpressionPart = `Math.sqrt(${currentNum})`;
                    break;
                case 'sqr':
                    result = Math.pow(currentNum, 2);
                    newExpressionPart = `Math.pow(${currentNum}, 2)`;
                    break;
                case 'percent':
                    result = currentNum / 100;
                    newExpressionPart = `(${currentNum}/100)`;
                    break;
                case 'factorial':
                    result = factorial(currentNum);
                    if (isNaN(result)) { playError(); setDisplay('Error'); return; }
                    newExpressionPart = `factorial(${currentNum})`; // This is for display, eval will use regex
                    break;
            }
            
            const expWithoutLastNum = expression.slice(0, expression.length - currentNumStr.length);
            setExpression(expWithoutLastNum + newExpressionPart);
            setDisplay(String(result));
            setIsResult(false);

        } catch {
            playError();
            setDisplay('Error');
            setExpression('');
        }
    }

    const calculateResult = () => {
        if (getParenCount(expression) !== 0) {
            playError();
            setDisplay('Error');
            setExpression('');
            return;
        }

        try {
            let sanitizedExpression = expression
                .replace(/π/g, `(${Math.PI})`)
                .replace(/e/g, `(${Math.E})`)
                .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
                .replace(/\(([^)]+)\)\^2/g, 'Math.pow($1, 2)');
                
            // Handle factorial
            sanitizedExpression = sanitizedExpression.replace(/(\d+)!/g, (match, num) => String(factorial(parseInt(num))));
            
            if (/[+\-*/]$/.test(sanitizedExpression.trim())) {
                sanitizedExpression = sanitizedExpression.trim().slice(0, -1);
            }

            const result = new Function(`return ${sanitizedExpression}`)();
            
            if (isNaN(result) || !isFinite(result)) {
                playError();
                setDisplay('Error');
                setExpression('');
            } else {
                const resultStr = String(result);
                setDisplay(resultStr);
                setExpression(resultStr);
                setIsResult(true);
                setHistory(prev => [`${expression.replace(/\s/g, '')} = ${resultStr}`, ...prev]);
            }
        } catch (error) {
            playError();
            setDisplay('Error');
            setExpression('');
        }
    };
    

    const clearAll = () => {
        playClear();
        setDisplay('0');
        setExpression('');
        setIsResult(false);
    };

    const deleteLast = () => {
        if (isResult || display === 'Error') {
            clearAll();
            return;
        }
        setExpression(prev => prev.slice(0,-1));
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };
    
    const clearHistory = () => {
        playClear();
        setHistory([]);
    };

    const getButtonClass = (type: 'op' | 'num' | 'func' | 'accent') => {
        switch (type) {
            case 'op': return 'bg-accent bg-opacity-30 hover:bg-opacity-50 shadow-accent/30';
            case 'func': return 'bg-gray-500/30 hover:bg-gray-500/50 shadow-gray-500/30';
            case 'accent': return 'bg-primary bg-opacity-30 hover:bg-opacity-50 shadow-primary';
            default: return 'bg-white/10 hover:bg-white/20 shadow-white/20';
        }
    }

    const buttons = [
        { label: 'AC', action: clearAll, className: getButtonClass('accent') },
        { label: 'DEL', action: () => handleButtonClick(deleteLast), className: getButtonClass('accent') },
        { label: '(', action: () => handleButtonClick(() => handleInput('(')), className: getButtonClass('func') },
        { label: ')', action: () => handleButtonClick(() => handleInput(')')), className: getButtonClass('func') },
        
        { label: 'x²', action: () => handleButtonClick(() => handleUnary('sqr')), className: getButtonClass('func') },
        { label: '√', action: () => handleButtonClick(() => handleUnary('sqrt')), className: getButtonClass('func') },
        { label: '%', action: () => handleButtonClick(() => handleUnary('percent')), className: getButtonClass('func') },
        { label: 'x!', action: () => handleButtonClick(() => handleUnary('factorial')), className: getButtonClass('func') },
        
        { label: 'π', action: () => handleButtonClick(() => handleInput('π')), className: getButtonClass('func') },
        { label: 'e', action: () => handleButtonClick(() => handleInput('e')), className: getButtonClass('func') },
        { label: '÷', action: () => handleButtonClick(() => handleInput('/')), className: getButtonClass('op') },
        { label: '×', action: () => handleButtonClick(() => handleInput('*')), className: getButtonClass('op') },
        
        { label: '7', action: () => handleButtonClick(() => handleInput('7')), className: getButtonClass('num') },
        { label: '8', action: () => handleButtonClick(() => handleInput('8')), className: getButtonClass('num') },
        { label: '9', action: () => handleButtonClick(() => handleInput('9')), className: getButtonClass('num') },
        { label: '−', action: () => handleButtonClick(() => handleInput('-')), className: getButtonClass('op') },
        
        { label: '4', action: () => handleButtonClick(() => handleInput('4')), className: getButtonClass('num') },
        { label: '5', action: () => handleButtonClick(() => handleInput('5')), className: getButtonClass('num') },
        { label: '6', action: () => handleButtonClick(() => handleInput('6')), className: getButtonClass('num') },
        { label: '+', action: () => handleButtonClick(() => handleInput('+')), className: getButtonClass('op') },

        { label: '1', action: () => handleButtonClick(() => handleInput('1')), className: getButtonClass('num') },
        { label: '2', action: () => handleButtonClick(() => handleInput('2')), className: getButtonClass('num') },
        { label: '3', action: () => handleButtonClick(() => handleInput('3')), className: getButtonClass('num') },
        { label: '=', action: () => handleButtonClick(calculateResult, true), className: `row-span-2 ${getButtonClass('op')}` },
        
        { label: '0', action: () => handleButtonClick(() => handleInput('0')), className: `col-span-2 ${getButtonClass('num')}` },
        { label: '.', action: () => handleButtonClick(() => handleInput('.')), className: getButtonClass('num') },
    ];

    return (
        <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-background-secondary backdrop-blur-md shadow-lg border border-theme-primary relative">
            <AnimatePresence>
                {isTutorialOpen && (
                    <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title="Calculator">
                        <p>A powerful scientific calculator with a futuristic design.</p>
                        <ul className="list-disc list-inside mt-2">
                            <li><strong>Basic Operations:</strong> Perform addition, subtraction, multiplication, and division.</li>
                            <li><strong>Advanced Functions:</strong> Use parentheses, square (x²), square root (√), percentage (%), and factorial (x!).</li>
                            <li><strong>Constants:</strong> Quickly input Pi (π) and Euler's number (e).</li>
                            <li><strong>History:</strong> Expand the history panel to see your previous calculations.</li>
                        </ul>
                    </TutorialModal>
                )}
            </AnimatePresence>
            <button onClick={() => setIsTutorialOpen(true)} className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10" aria-label="Help"><HelpIcon /></button>
             <style>{`
                @keyframes scanline {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(100%); }
                }
                .scanline-effect::after {
                    content: '';
                    position: absolute;
                    top: -100%;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(0deg, transparent 0%, color-mix(in srgb, var(--color-primary) 10%, transparent) 50%, transparent 100%);
                    animation: scanline 8s linear infinite;
                }
             `}</style>
            <div className="bg-black/40 rounded-lg p-4 mb-4 text-right h-28 flex flex-col justify-end relative overflow-hidden border border-primary/30 shadow-inner shadow-black/50 scanline-effect">
                <div className="text-gray-400 text-lg font-orbitron truncate h-7">{expression.replace(/\*/g, '×').replace(/\//g, '÷') || ' '}</div>
                <div className="text-white text-5xl font-orbitron font-bold truncate" style={{textShadow: '0 0 5px var(--color-primary-shadow)'}}>{display}</div>
            </div>
            
            <div className="relative grid grid-cols-4 grid-rows-7 gap-3">
                {buttons.map((btn, index) => (
                    <button
                        key={index}
                        onClick={btn.action}
                        className={`font-orbitron text-xl p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary active:scale-95 hover:shadow-lg hover:-translate-y-1
                            ${btn.className || ''}
                            ${btn.label === '0' ? 'col-span-2' : ''}
                            ${btn.label === '=' ? 'row-span-2' : ''}
                        `}
                    >
                        {btn.label}
                    </button>
                ))}
                
                {showOnePlus && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                        <div className="animate-pulse">
                            <OnePlusLogo />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <button 
                    onClick={() => {
                        playClick();
                        setIsHistoryVisible(!isHistoryVisible)
                    }} 
                    className="w-full flex justify-between items-center p-3 bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
                    aria-expanded={isHistoryVisible}
                >
                    <span className="font-orbitron font-semibold">History</span>
                    <div className={`transform transition-transform duration-300 ${isHistoryVisible ? 'rotate-180' : 'rotate-0'}`}>
                        <ChevronDownIcon />
                    </div>
                </button>

                <div 
                    className={`
                        transition-[max-height,padding] duration-500 ease-in-out overflow-hidden
                        ${isHistoryVisible ? 'max-h-60 mt-2' : 'max-h-0'}
                    `}
                >
                    <div className="p-4 bg-black/40 rounded-lg">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-theme-primary">
                            <h3 className="font-orbitron text-lg">Calculation History</h3>
                            <button 
                                onClick={clearHistory}
                                className="text-sm px-3 py-1 bg-primary-500/50 hover:bg-primary-500/70 rounded-md transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <ul className="h-40 overflow-y-auto space-y-2 pr-2">
                            {history.length > 0 ? (
                                history.map((item, index) => (
                                    <li key={index} className="text-gray-300 border-b border-theme-primary pb-2">
                                        <span className="text-sm block text-gray-400 truncate">{item.split('=')[0].trim()}</span>
                                        <span className="text-xl font-bold text-white text-right block truncate">= {item.split('=')[1].trim()}</span>
                                    </li>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 h-full flex items-center justify-center">No history yet.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculator;