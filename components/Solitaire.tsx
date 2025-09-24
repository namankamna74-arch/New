
import React, { useState, useEffect } from 'react';
import { useSound } from '../hooks/useSound';
import { Card, Pile, Rank, Suit } from '../types';
import GameModal from './GameModal';
import { useAppStore } from '../store';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_VALUES: { [key in Rank]: number } = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };
const SUIT_COLORS: { [key in Suit]: string } = { hearts: 'text-red-500', diamonds: 'text-red-500', clubs: 'text-black', spades: 'text-black' };

const createDeck = (): Pile => {
    let idCounter = 0;
    const deck: Pile = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({ id: `card-${idCounter++}`, suit, rank, isFaceUp: false });
        });
    });
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const CardComponent: React.FC<{ card?: Card | null, isPlaceholder?: boolean, onDoubleClick?: () => void, onDragStart?: (e: React.DragEvent) => void }> = ({ card, isPlaceholder, onDoubleClick, onDragStart }) => (
    <div
        draggable={!!card && card.isFaceUp}
        onDragStart={onDragStart}
        onDoubleClick={onDoubleClick}
        className={`w-20 h-28 rounded-lg border-2 flex items-center justify-center transition-transform duration-200 
                    ${isPlaceholder ? 'border-dashed border-white/20' : 'bg-white shadow-md'}
                    ${card && card.isFaceUp ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}>
        {card && card.isFaceUp ? (
            <div className={`text-center font-bold ${SUIT_COLORS[card.suit]}`}>
                <div className="text-2xl">{card.rank}</div>
                <div>{{ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit]}</div>
            </div>
        ) : (
            !isPlaceholder && <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md"></div>
        )}
    </div>
);


const Solitaire: React.FC = () => {
    const [stock, setStock] = useState<Pile>([]);
    const [waste, setWaste] = useState<Pile>([]);
    const [foundations, setFoundations] = useState<Pile[]>(() => [[], [], [], []]);
    const [tableau, setTableau] = useState<Pile[]>(() => [[], [], [], [], [], [], []]);
    const [isWin, setIsWin] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playMove, playWin } = useSound(isMuted);

    const startGame = () => {
        const deck = createDeck();
        // Deal tableau
        const newTableau: Pile[] = [[], [], [], [], [], [], []];
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                newTableau[j].push(deck.pop()!);
            }
        }
        newTableau.forEach(pile => pile[pile.length - 1].isFaceUp = true);
        setTableau(newTableau);
        setStock(deck);
        setWaste([]);
        setFoundations([[], [], [], []]);
        setIsWin(false);
    };

    useEffect(startGame, []);

    const handleStockClick = () => {
        if(isWin) return;
        playMove();
        if (stock.length > 0) {
            const newStock = [...stock];
            const newWaste = [...waste];
            const card = newStock.pop()!;
            card.isFaceUp = true;
            newWaste.push(card);
            setStock(newStock);
            setWaste(newWaste);
        } else { // Reset stock from waste
            const newStock = [...waste].reverse().map(c => ({...c, isFaceUp: false}));
            setStock(newStock);
            setWaste([]);
        }
    };

    const canPlaceOnFoundation = (card: Card, foundationPile: Pile): boolean => {
        const topCard = foundationPile[foundationPile.length - 1];
        if (!topCard) return card.rank === 'A';
        return card.suit === topCard.suit && RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1;
    };
    
    const handleCardDoubleClick = (card: Card, source: 'waste' | 'tableau', tableauIndex?: number) => {
        for (let i = 0; i < foundations.length; i++) {
            if (canPlaceOnFoundation(card, foundations[i])) {
                playMove();
                const newFoundations = foundations.map(f => [...f]);
                newFoundations[i].push(card);
                setFoundations(newFoundations);

                if (source === 'waste') {
                    setWaste(w => w.slice(0, -1));
                } else if (source === 'tableau' && tableauIndex !== undefined) {
                    const newTableau = tableau.map(t => [...t]);
                    newTableau[tableauIndex].pop();
                    if (newTableau[tableauIndex].length > 0) {
                        newTableau[tableauIndex][newTableau[tableauIndex].length - 1].isFaceUp = true;
                    }
                    setTableau(newTableau);
                }
                return; // Exit after successful move
            }
        }
    };


    const onDragStart = (e: React.DragEvent, data: any) => {
        e.dataTransfer.setData("solitaire/data", JSON.stringify(data));
    };

    const onDrop = (e: React.DragEvent, targetPileType: string, targetPileIndex: number) => {
        const data = JSON.parse(e.dataTransfer.getData("solitaire/data"));
        const { card, pile: sourcePile, cardIndex: sourceCardIndex, index: sourcePileIndex } = data;
        
        const cardToMove = card as Card;
        
        if (targetPileType === 'foundation') {
            const cardsBeingMoved = sourcePile === 'tableau' ? tableau[sourcePileIndex].slice(sourceCardIndex) : [cardToMove];
            if (cardsBeingMoved.length > 1) return; // Only single cards to foundation

            if (canPlaceOnFoundation(cardToMove, foundations[targetPileIndex])) {
                playMove();
                const newFoundations = foundations.map(f => [...f]);
                newFoundations[targetPileIndex].push(cardToMove);
                setFoundations(newFoundations);

                if (sourcePile === 'waste') {
                    setWaste(w => w.slice(0, -1));
                } else if (sourcePile === 'tableau') {
                    const newTableau = tableau.map(t => [...t]);
                    newTableau[sourcePileIndex] = newTableau[sourcePileIndex].slice(0, sourceCardIndex);
                     if(newTableau[sourcePileIndex].length > 0) {
                        newTableau[sourcePileIndex][newTableau[sourcePileIndex].length -1].isFaceUp = true;
                    }
                    setTableau(newTableau);
                }
            }
        } else if (targetPileType === 'tableau') {
            const targetTableauPile = tableau[targetPileIndex];
            const topCard = targetTableauPile[targetTableauPile.length - 1];

            const canPlaceOnTableau = (card: Card, topCard?: Card): boolean => {
                if (!topCard) return card.rank === 'K';
                return SUIT_COLORS[card.suit] !== SUIT_COLORS[topCard.suit] && RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] - 1;
            };

            if (canPlaceOnTableau(cardToMove, topCard)) {
                 playMove();
                const cardsToMove = sourcePile === 'tableau' ? tableau[sourcePileIndex].slice(sourceCardIndex) : [cardToMove];
                
                const newTableau = tableau.map(t => [...t]);
                newTableau[targetPileIndex].push(...cardsToMove);
                setTableau(newTableau);

                if (sourcePile === 'waste') {
                    setWaste(w => w.slice(0, -1));
                } else if (sourcePile === 'tableau') {
                    newTableau[sourcePileIndex] = newTableau[sourcePileIndex].slice(0, sourceCardIndex);
                     if(newTableau[sourcePileIndex].length > 0) {
                        newTableau[sourcePileIndex][newTableau[sourcePileIndex].length -1].isFaceUp = true;
                    }
                    setTableau(newTableau);
                }
            }
        }
    };

    useEffect(() => {
        if (foundations.flat().length === 52) {
            setIsWin(true);
            playWin();
        }
    }, [foundations, playWin]);

    return (
        <div className="flex flex-col items-center w-full h-full p-4 bg-green-800 font-orbitron">
            <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-3xl">Solitaire</h2>
                <button onClick={startGame} className="px-4 py-2 bg-purple-600 rounded-lg">New Game</button>
            </div>
            {isWin && <GameModal title="You Win!" status="Congratulations!" buttonText="Play Again" onButtonClick={startGame} />}
            <div className="w-full grid grid-cols-7 gap-4">
                {/* Top row: Stock, Waste, Foundations */}
                <div onClick={handleStockClick} className="cursor-pointer">
                    {stock.length > 0 ? <CardComponent card={stock[stock.length - 1]} /> : <CardComponent isPlaceholder={true} />}
                </div>
                 <div>
                    {waste.length > 0 && 
                        <CardComponent 
                            card={waste[waste.length - 1]} 
                            onDragStart={(e) => onDragStart(e, { card: waste[waste.length - 1], pile: 'waste' })}
                            onDoubleClick={() => handleCardDoubleClick(waste[waste.length - 1], 'waste')}
                        />
                    }
                </div>
                <div></div> {/* Spacer */}
                {foundations.map((pile, i) => (
                    <div key={i} onDragOver={e=>e.preventDefault()} onDrop={e => onDrop(e, 'foundation', i)}>
                         <CardComponent card={pile[pile.length - 1]} isPlaceholder={pile.length === 0} />
                    </div>
                ))}

                {/* Bottom row: Tableau */}
                {tableau.map((pile, i) => (
                    <div key={i} className="relative h-96" onDragOver={e=>e.preventDefault()} onDrop={e => onDrop(e, 'tableau', i)}>
                         <CardComponent isPlaceholder={pile.length === 0} />
                         {pile.map((card, cardIndex) => (
                             <div key={card.id} className="absolute" style={{ top: `${cardIndex * 2}rem`}}>
                                <CardComponent 
                                    card={card} 
                                    onDragStart={(e: React.DragEvent) => onDragStart(e, { card, cardIndex, pile: 'tableau', index: i })}
                                    onDoubleClick={() => cardIndex === pile.length - 1 && handleCardDoubleClick(card, 'tableau', i)}
                                />
                            </div>
                         ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Solitaire;
