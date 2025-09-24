
import React, { useState } from 'react';
import { Bias, BiasTest } from '../types';
import { useSound } from '../hooks/useSound';
import GameModal from './GameModal';
import { useAppStore } from '../store';

const BIAS_TESTS: BiasTest[] = [
    {
        type: 'confirmation',
        title: 'Confirmation Bias',
        description: 'We tend to search for, interpret, favor, and recall information that confirms our pre-existing beliefs.',
        scenario: 'I am thinking of a rule that the sequence "2, 4, 6" follows. Your job is to guess the rule by testing other sequences of three numbers.',
        questions: [], // Custom input for this one
        explanation: 'The rule was simply "any three ascending numbers". Many people guess "add 2" and only test sequences that fit their theory (e.g., 8, 10, 12). They don\'t try to disprove their idea by testing sequences like "1, 2, 3" or "10, 20, 30", which also follow the rule. This is confirmation bias in action!'
    },
    {
        type: 'anchoring',
        title: 'Anchoring Bias',
        description: 'We rely too heavily on the first piece of information offered (the "anchor") when making decisions.',
        scenario: 'Is the population of Turkey greater or less than 100 million? Now, what is your best estimate of the population of Turkey?',
        questions: [], // Custom input
        explanation: 'The actual population is about 85 million. The initial question about "100 million" serves as an anchor. Most people who are first asked this question tend to guess a number closer to 100 million than people who are not given an anchor.'
    },
    {
        type: 'framing',
        title: 'The Framing Effect',
        description: 'Drawing different conclusions from the same information, depending on how that information is presented.',
        scenario: 'Imagine a disease outbreak is expected to kill 600 people. Two alternative programs to combat the disease have been proposed. Which do you choose?',
        questions: [
            { text: 'Program A: "200 people will be saved."' },
            { text: 'Program B: "There is a 1/3 probability that 600 people will be saved, and a 2/3 probability that no people will be saved."' }
        ],
        explanation: 'Statistically, Program A and B are identical. However, most people choose Program A because it sounds more certain ("will be saved"). When the options are "framed" differently (e.g., Program C: "400 people will die"), choices often change, demonstrating the framing effect.'
    }
];

const MindBenders: React.FC = () => {
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [stage, setStage] = useState<'intro' | 'test' | 'reveal'>('intro');
    const [userAnswer, setUserAnswer] = useState<string>('');
    const isMuted = useAppStore(state => state.isMuted);
    const { playClick, playSuccess } = useSound(isMuted);

    const test = BIAS_TESTS[currentTestIndex];

    const handleNext = () => {
        playClick();
        if (stage === 'intro') setStage('test');
        if (stage === 'test') setStage('reveal');
        if (stage === 'reveal') {
            setStage('intro');
            setCurrentTestIndex((currentTestIndex + 1) % BIAS_TESTS.length);
            setUserAnswer('');
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center font-orbitron w-full h-full p-8">
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-4xl text-purple-300 mb-2">{test.title}</h1>
                <p className="text-gray-400 mb-6">{test.description}</p>

                <div className="p-6 bg-black/30 rounded-lg min-h-[200px] flex flex-col justify-center">
                    {stage === 'intro' && (
                        <>
                            <p className="text-xl mb-6">Let's run an experiment.</p>
                            <button onClick={handleNext} className="px-6 py-2 bg-purple-600 rounded-lg self-center">Begin</button>
                        </>
                    )}
                    {stage === 'test' && (
                        <>
                           <p className="text-lg mb-4">{test.scenario}</p>
                           {test.questions.length > 0 ? (
                               <div className="flex gap-4 justify-center">
                                   {test.questions.map((q, i) => <button key={i} onClick={handleNext} className="px-4 py-2 bg-blue-600 rounded">{q.text}</button>)}
                               </div>
                           ) : (
                               <input type="text" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} className="bg-gray-800 text-white p-2 rounded w-1/2 mx-auto mb-4" />
                           )}
                           <button onClick={handleNext} className="px-6 py-2 bg-green-600 rounded-lg self-center mt-4">Submit</button>
                        </>
                    )}
                    {stage === 'reveal' && (
                        <>
                           <h3 className="text-2xl text-yellow-300 mb-4">The Reveal</h3>
                           <p className="text-lg mb-6">{test.explanation}</p>
                           <button onClick={handleNext} className="px-6 py-2 bg-purple-600 rounded-lg self-center">Next Test</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MindBenders;
