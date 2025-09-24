
import React, { useState } from 'react';
import { Organelle, OrganelleType, CellType } from '../types';
import { useSound } from '../hooks/useSound';
import { useAppStore } from '../store';

const ORGANELLES: Organelle[] = [
    { id: 'nuc', type: 'nucleus', name: 'Nucleus', function: 'Controls cell activities and contains genetic material (DNA).' },
    { id: 'mit', type: 'mitochondrion', name: 'Mitochondrion', function: 'The "powerhouse" of the cell, generates most of its supply of ATP.' },
    { id: 'rib', type: 'ribosome', name: 'Ribosome', function: 'Synthesizes proteins.' },
    { id: 'er', type: 'endoplasmic_reticulum', name: 'Endoplasmic Reticulum', function: 'Involved in protein and lipid synthesis.' },
    { id: 'gol', type: 'golgi_apparatus', name: 'Golgi Apparatus', function: 'Modifies, sorts, and packages proteins and lipids for secretion or delivery.' },
    { id: 'lys', type: 'lysosome', name: 'Lysosome', function: 'Contains digestive enzymes to break down waste. (Animal cells only)' },
    { id: 'mem', type: 'cell_membrane', name: 'Cell Membrane', function: 'Separates the interior of the cell from the outside environment.' },
    { id: 'cw', type: 'cell_wall', name: 'Cell Wall', function: 'Provides structural support and protection. (Plant cells only)' },
    { id: 'chl', type: 'chloroplast', name: 'Chloroplast', function: 'Conducts photosynthesis. (Plant cells only)' },
    { id: 'vac', type: 'vacuole', name: 'Vacuole', function: 'Stores water, nutrients, and waste products. Much larger in plant cells.' },
];

const ANIMAL_CELL_PARTS: OrganelleType[] = ['nucleus', 'mitochondrion', 'ribosome', 'endoplasmic_reticulum', 'golgi_apparatus', 'lysosome', 'cell_membrane'];
const PLANT_CELL_PARTS: OrganelleType[] = ['nucleus', 'mitochondrion', 'ribosome', 'endoplasmic_reticulum', 'golgi_apparatus', 'cell_membrane', 'cell_wall', 'chloroplast', 'vacuole'];


const BioLab: React.FC = () => {
    const [cellType, setCellType] = useState<CellType>('animal');
    const [placedOrganelles, setPlacedOrganelles] = useState<Organelle[]>([]);
    const [selectedOrganelle, setSelectedOrganelle] = useState<Organelle | null>(null);
    const [feedback, setFeedback] = useState<string>('');
    const isMuted = useAppStore(state => state.isMuted);
    const { playSnap, playSuccess, playFail } = useSound(isMuted);

    const onDragStart = (e: React.DragEvent, organelle: Organelle) => {
        e.dataTransfer.setData('application/json', JSON.stringify(organelle));
        setSelectedOrganelle(organelle);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const organelle = JSON.parse(e.dataTransfer.getData('application/json')) as Organelle;
        if (!placedOrganelles.find(o => o.id === organelle.id)) {
            playSnap(false);
            setPlacedOrganelles(prev => [...prev, organelle]);
        }
    };
    
    const checkCell = () => {
        const required = cellType === 'animal' ? ANIMAL_CELL_PARTS : PLANT_CELL_PARTS;
        const placedTypes = placedOrganelles.map(o => o.type);
        const isCorrect = required.length === placedTypes.length && required.every(part => placedTypes.includes(part));
        
        if (isCorrect) {
            playSuccess(false);
            setFeedback('Correct! You built a perfect ' + cellType + ' cell!');
        } else {
            playFail(false);
            setFeedback('Not quite right. Check the required parts and try again.');
        }
    };

    const reset = (type: CellType) => {
        setCellType(type);
        setPlacedOrganelles([]);
        setSelectedOrganelle(null);
        setFeedback('');
    };

    const availableOrganelles = ORGANELLES.filter(org => !placedOrganelles.find(p => p.id === org.id));
    
    return (
        <div className="flex items-center justify-center font-orbitron w-full h-full p-4 gap-8">
            <div className="w-1/4 h-full flex flex-col">
                <h2 className="text-2xl text-center mb-4">Organelle Bin</h2>
                <div className="flex-grow bg-black/30 rounded-lg p-2 overflow-y-auto">
                    {availableOrganelles.map(org => (
                        <div key={org.id} draggable onDragStart={e => onDragStart(e, org)}
                             className="p-2 mb-2 bg-gray-700 rounded cursor-grab active:cursor-grabbing hover:bg-purple-800">
                            {org.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-1/2 h-full flex flex-col items-center">
                 <div className="flex gap-2 mb-2 p-1 bg-black/30 rounded-lg">
                    <button onClick={() => reset('animal')} className={`px-3 py-1 rounded ${cellType === 'animal' ? 'bg-purple-600' : ''}`}>Animal Cell</button>
                    <button onClick={() => reset('plant')} className={`px-3 py-1 rounded ${cellType === 'plant' ? 'bg-purple-600' : ''}`}>Plant Cell</button>
                </div>
                <div onDragOver={e => e.preventDefault()} onDrop={onDrop}
                     className={`relative w-[400px] h-[400px] bg-pink-300/20 rounded-full border-4 ${cellType === 'plant' ? 'rounded-md border-green-400' : 'border-blue-400'}`}>
                     {placedOrganelles.map((org, i) => (
                         <div key={org.id} className="absolute p-1 text-xs bg-white/20 rounded" style={{ top: `${20 + (i*10)}%`, left: `${20 + (i*5)}%`}}>{org.name}</div>
                     ))}
                </div>
                <button onClick={checkCell} className="mt-4 px-6 py-2 bg-green-600 rounded-lg">Check Cell</button>
                {feedback && <p className="mt-2 text-lg">{feedback}</p>}
            </div>

            <div className="w-1/4 h-full">
                 <h2 className="text-2xl text-center mb-4">Information</h2>
                 <div className="h-4/5 bg-black/30 rounded-lg p-4">
                    {selectedOrganelle ? (
                        <>
                            <h3 className="text-xl text-yellow-300">{selectedOrganelle.name}</h3>
                            <p className="mt-2 text-gray-300">{selectedOrganelle.function}</p>
                        </>
                    ) : (
                        <p>Drag an organelle from the bin to learn about it.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default BioLab;
