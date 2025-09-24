
import React, { useState, useRef } from 'react';
import { Atom, AtomType, Bond, Molecule } from '../types';
import { useSound } from '../hooks/useSound';
import { useAppStore } from '../store';

const ATOM_PROPS: { [key in AtomType]: { color: string, valence: number } } = {
    'H': { color: 'bg-gray-300', valence: 1 },
    'C': { color: 'bg-gray-600', valence: 4 },
    'N': { color: 'bg-blue-500', valence: 3 },
    'O': { color: 'bg-red-500', valence: 2 },
};

const CHALLENGES: Molecule[] = [
    { name: 'Water', formula: 'H₂O', structure: [] },
    { name: 'Methane', formula: 'CH₄', structure: [] },
    { name: 'Ammonia', formula: 'NH₃', structure: [] },
    { name: 'Carbon Dioxide', formula: 'CO₂', structure: [] },
];

const ChemLab: React.FC = () => {
    const [atoms, setAtoms] = useState<Atom[]>([]);
    const [bonds, setBonds] = useState<Bond[]>([]);
    const [nextAtomId, setNextAtomId] = useState(0);
    const [activeBond, setActiveBond] = useState<number | null>(null);
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [feedback, setFeedback] = useState<{ message: string; color: string } | null>(null);
    const isMuted = useAppStore(state => state.isMuted);
    const { playSnap, playSuccess, playFail } = useSound(isMuted);
    const workspaceRef = useRef<HTMLDivElement>(null);

    const setFeedbackMessage = (message: string, type: 'success' | 'error' | 'info') => {
        const color = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-yellow-300';
        setFeedback({ message, color });
        setTimeout(() => setFeedback(null), 3000);
    };

    const addAtom = (type: AtomType) => {
        playSnap(false);
        setAtoms(prev => [...prev, { id: nextAtomId, type, x: 250, y: 150, bonds: [] }]);
        setNextAtomId(id => id + 1);
    };

    const handleAtomClick = (atom: Atom) => {
        if (activeBond === null) {
            setActiveBond(atom.id);
        } else {
            if (activeBond === atom.id) {
                setActiveBond(null);
                return;
            }
            const startAtom = atoms.find(a => a.id === activeBond)!;
            if (startAtom.bonds.length < ATOM_PROPS[startAtom.type].valence && atom.bonds.length < ATOM_PROPS[atom.type].valence) {
                playSnap(false);
                const bondId = `${Math.min(activeBond, atom.id)}-${Math.max(activeBond, atom.id)}`;
                if (!bonds.find(b => b.id === bondId)) {
                    setBonds(prev => [...prev, { id: bondId, from: activeBond, to: atom.id }]);
                    setAtoms(prev => prev.map(a => {
                        if (a.id === activeBond) return { ...a, bonds: [...a.bonds, atom.id] };
                        if (a.id === atom.id) return { ...a, bonds: [...a.bonds, startAtom.id] };
                        return a;
                    }));
                }
            } else {
                playFail(false);
                setFeedbackMessage('Valence limit reached for one of the atoms.', 'error');
            }
            setActiveBond(null);
        }
    };
    
    const checkChallenge = () => {
        const formulaCounts = atoms.reduce((acc, atom) => {
            acc[atom.type] = (acc[atom.type] || 0) + 1;
            return acc;
        }, {} as { [key in AtomType]?: number });
        
        const challenge = CHALLENGES[challengeIndex];
        let formulaCorrect = false;

        if(challenge.name === 'Water' && formulaCounts.H === 2 && formulaCounts.O === 1 && Object.keys(formulaCounts).length === 2) formulaCorrect = true;
        if(challenge.name === 'Methane' && formulaCounts.C === 1 && formulaCounts.H === 4 && Object.keys(formulaCounts).length === 2) formulaCorrect = true;
        if(challenge.name === 'Ammonia' && formulaCounts.N === 1 && formulaCounts.H === 3 && Object.keys(formulaCounts).length === 2) formulaCorrect = true;
        if(challenge.name === 'Carbon Dioxide' && formulaCounts.C === 1 && formulaCounts.O === 2 && Object.keys(formulaCounts).length === 2) formulaCorrect = true;
        
        const valenceCorrect = atoms.every(a => a.bonds.length === ATOM_PROPS[a.type].valence);
        
        if(formulaCorrect && valenceCorrect) {
            playSuccess(false);
            setFeedbackMessage('Correct! Moving to next challenge.', 'success');
            setTimeout(() => {
                setChallengeIndex(i => (i + 1) % CHALLENGES.length);
                resetWorkspace();
            }, 1500);
        } else if (!formulaCorrect) {
            playFail(false);
            setFeedbackMessage('The chemical formula is incorrect.', 'error');
        } else {
            playFail(false);
            setFeedbackMessage('Formula is right, but the bonds are wrong. Check valence rules!', 'error');
        }
    }

    const resetWorkspace = () => {
        setAtoms([]);
        setBonds([]);
        setNextAtomId(0);
        setActiveBond(null);
        setFeedback(null);
    };

    return (
        <div className="flex items-center justify-center font-orbitron w-full h-full p-4 gap-8">
            <div className="w-1/4 h-full flex flex-col items-center">
                <h2 className="text-2xl mb-4">Atom Palette</h2>
                <div className="space-y-2">
                    {Object.entries(ATOM_PROPS).map(([type, props]) => (
                        <button key={type} onClick={() => addAtom(type as AtomType)} 
                                className={`w-24 p-2 rounded ${props.color} text-black font-bold text-xl`}>
                            {type}
                        </button>
                    ))}
                </div>
                 <h2 className="text-2xl mt-8 mb-4">Controls</h2>
                 <button onClick={resetWorkspace} className="p-2 bg-red-600 rounded w-24">Reset</button>
            </div>
            <div className="w-1/2 h-full flex flex-col items-center">
                <div className="p-2 bg-black/20 rounded-lg text-center mb-4 min-h-[80px]">
                    <h3 className="text-xl">Challenge</h3>
                    <p className="text-2xl text-yellow-300">Build: {CHALLENGES[challengeIndex].name} ({CHALLENGES[challengeIndex].formula})</p>
                </div>
                <div ref={workspaceRef} className="w-full flex-grow bg-black/30 rounded-lg relative overflow-hidden">
                    {/* Bonds */}
                    <svg className="absolute w-full h-full pointer-events-none">
                        {bonds.map(bond => {
                            const fromAtom = atoms.find(a => a.id === bond.from);
                            const toAtom = atoms.find(a => a.id === bond.to);
                            if (!fromAtom || !toAtom) return null;
                            return <line key={bond.id} x1={fromAtom.x} y1={fromAtom.y} x2={toAtom.x} y2={toAtom.y} stroke="white" strokeWidth="4" />
                        })}
                    </svg>
                    {/* Atoms */}
                    {atoms.map(atom => (
                        <div key={atom.id} onClick={() => handleAtomClick(atom)}
                             className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-2xl cursor-pointer
                                        ${ATOM_PROPS[atom.type].color} ${activeBond === atom.id ? 'ring-4 ring-yellow-300' : ''}`}
                             style={{ left: atom.x - 24, top: atom.y - 24 }}>
                            {atom.type}
                        </div>
                    ))}
                </div>
                <div className="h-12 flex items-center">
                    {feedback ? (
                         <p className={`mt-4 text-lg font-semibold ${feedback.color}`}>{feedback.message}</p>
                    ) : (
                        <button onClick={checkChallenge} className="mt-4 px-6 py-2 bg-green-600 rounded-lg">Check Molecule</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChemLab;
