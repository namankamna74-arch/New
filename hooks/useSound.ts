

import { useRef, useCallback, useState } from 'react';

type SoundType = 'click' | 'move' | 'capture' | 'check' | 'win' | 'lose' | 'clear' | 'calculate' | 'error' | 'navigate' | 'lineClear' | 'reveal' | 'flip' | 'launch' | 'snap' | 'success' | 'fail' | 'chomp' | 'eatGhost' | 'death' | 'score' | 'swoosh' | 'block';

interface SynthParams {
    freq: number;
    vol?: number;
    decay?: number;
    type?: OscillatorType;
    attack?: number;
    release?: number;
    harmonics?: { freqRatio: number; vol: number, type?: OscillatorType }[];
    filter?: { freq: number; type: BiquadFilterType; Q: number; attack?: number; };
}

export const useSound = (isMuted: boolean) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const ambientNodeRef = useRef<OscillatorNode | null>(null);
    const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

    const getAudioContext = useCallback(() => {
        if (typeof window === 'undefined') return null;
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
                return null;
            }
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    const playSynth = useCallback((params: SynthParams[]) => {
        const audioContext = getAudioContext();
        if (!audioContext) return;
        const now = audioContext.currentTime;
        const totalDuration = Math.max(...params.map(p => (p.attack ?? 0.01) + (p.release ?? 0.1) + (p.decay ?? 0.1))) + 0.1;

        params.forEach(({ freq, vol = 0.2, decay = 0.1, type = 'sine', attack = 0.001, release = 0.1, harmonics = [], filter }) => {
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(vol, now + attack);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + release + decay);

            let lastNode: AudioNode = gainNode;
            if (filter) {
                const filterNode = audioContext.createBiquadFilter();
                filterNode.type = filter.type;
                filterNode.frequency.setValueAtTime(filter.freq * (filter.attack ?? 1), now);
                if(filter.attack) filterNode.frequency.exponentialRampToValueAtTime(filter.freq, now + filter.attack);
                filterNode.Q.value = filter.Q;
                gainNode.connect(filterNode);
                lastNode = filterNode;
            }
            
            lastNode.connect(audioContext.destination);

            const createOsc = (f: number, v: number, oscType: OscillatorType) => {
                const osc = audioContext.createOscillator();
                osc.type = oscType;
                osc.frequency.setValueAtTime(f, now);
                
                const oscGain = audioContext.createGain();
                oscGain.gain.setValueAtTime(v, now);

                osc.connect(oscGain).connect(lastNode);
                osc.start(now);
                osc.stop(now + totalDuration);
            };

            createOsc(freq, 1, type);
            harmonics.forEach(h => createOsc(freq * h.freqRatio, h.vol, h.type || type));
        });

    }, [getAudioContext]);
    
    const playSound = useCallback((type: SoundType, forcePlay = false) => {
        if ((isMuted && !forcePlay)) return;
        
        switch (type) {
            case 'click': playSynth([{ freq: 440, vol: 0.1, decay: 0.05, type: 'triangle', harmonics: [{ freqRatio: 2, vol: 0.5 }] }]); break;
            case 'navigate': playSynth([{ freq: 523.25, vol: 0.15, decay: 0.2, type: 'sine', harmonics: [{ freqRatio: 1.5, vol: 0.5 }] }]); break;
            case 'move': playSynth([{ freq: 200, vol: 0.2, decay: 0.1, type: 'square' }]); break;
            case 'capture': playSynth([{ freq: 150, vol: 0.25, decay: 0.2, type: 'sawtooth', filter: {type: 'lowpass', freq: 800, Q: 2} }]); break;
            case 'check': playSynth([{ freq: 880, vol: 0.2, decay: 0.3, type: 'sawtooth' }, { freq: 910, vol: 0.2, decay: 0.3, type: 'sawtooth' }]); break;
            case 'win': playSynth([{ freq: 523.25, vol: 0.2 }, { freq: 659.25, vol: 0.2, decay: 0.15 }, { freq: 783.99, vol: 0.2, decay: 0.25 }]); break; 
            case 'lose': playSynth([{ freq: 207.65, vol: 0.2, decay: 0.5, type: 'sawtooth'}, { freq: 155.56, vol: 0.2, decay: 0.5, type: 'sawtooth' }]); break;
            case 'clear': playSynth([{ freq: 350, decay: 0.15, vol: 0.2, type: 'square' }]); break;
            case 'calculate': playSynth([{ freq: 659.25, decay: 0.08 }, { freq: 880, decay: 0.1 }]); break;
            case 'error': playSynth([{ freq: 120, decay: 0.4, type: 'sawtooth', vol: 0.25, harmonics: [{freqRatio: 1.05, vol: 0.8}] }]); break;
            case 'lineClear': playSynth([{ freq: 783.99, vol: 0.25, decay: 0.4, type: 'triangle', harmonics: [{ freqRatio: 1.25, vol: 0.5, type: 'sine' }] }]); break;
            case 'reveal': playSynth([{ freq: 800, vol: 0.05, decay: 0.05, type: 'sine' }]); break;
            case 'flip': playSynth([{ freq: 600, vol: 0.1, decay: 0.1, type: 'triangle', filter: { type: 'highpass', freq: 500, Q: 1} }]); break;
            
            // New Educational Sounds
            case 'launch': playSynth([{ freq: 100, vol: 0.3, decay: 0.8, type: 'sawtooth', filter: { type: 'lowpass', freq: 400, Q: 1, attack: 0.1 } }, { freq: 2000, vol: 0.1, decay: 0.3, type: 'sawtooth' }]); break;
            case 'snap': playSynth([{ freq: 300, vol: 0.15, decay: 0.05, type: 'square' }]); break;
            case 'success': playSynth([{ freq: 600, vol: 0.2, decay: 0.1}, { freq: 800, vol: 0.2, decay: 0.2, attack: 0.05}]); break;
            case 'fail': playSynth([{ freq: 150, vol: 0.2, decay: 0.3, type: 'sawtooth'}]); break;

            case 'chomp': playSynth([{ freq: 220, vol: 0.1, decay: 0.05, type: 'square' }]); break;
            case 'eatGhost': playSynth([{ freq: 440, vol: 0.2, decay: 0.2 }, { freq: 880, vol: 0.2, decay: 0.3, attack: 0.1 }]); break;
            case 'death': playSynth([{ freq: 440, decay: 0.1 }, { freq: 330, decay: 0.1, attack: 0.05 }, { freq: 220, decay: 0.2, attack: 0.1 }]); break;
            case 'score': playSynth([{ freq: 880, vol: 0.15, decay: 0.08, type: 'sine' }]); break;
            case 'swoosh': playSynth([{ freq: 1500, vol: 0.1, decay: 0.2, type: 'sawtooth', filter: {type: 'lowpass', freq: 5000, Q: 1, attack: 0.2} }]); break;
            case 'block': playSynth([{ freq: 110, vol: 0.2, decay: 0.1, type: 'square' }]); break;
        }
    }, [isMuted, playSynth]);

    const toggleAmbient = useCallback((play: boolean) => {
        const audioContext = getAudioContext();
        if (!audioContext) return;

        if (play && !ambientNodeRef.current) {
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 3);

            const osc = audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 40;
            
            const lfo = audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1;

            const lfoGain = audioContext.createGain();
            lfoGain.gain.value = 5;

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gainNode).connect(audioContext.destination);
            
            osc.start();
            lfo.start();
            
            ambientNodeRef.current = osc;
            setIsAmbientPlaying(true);
        } else if (!play && ambientNodeRef.current) {
            ambientNodeRef.current.stop();
            ambientNodeRef.current.disconnect();
            ambientNodeRef.current = null;
            setIsAmbientPlaying(false);
        }
    }, [getAudioContext]);
    
    // FIX: Add default values to force parameter to fix "Expected 1 arguments, but got 0" errors.
    return {
        isAmbientPlaying,
        toggleAmbient,
        playClick: (force: boolean = false) => playSound('click', force),
        playNavigate: (force: boolean = false) => playSound('navigate', force),
        playMove: (force: boolean = false) => playSound('move', force),
        playCapture: (force: boolean = false) => playSound('capture', force),
        playCheck: (force: boolean = false) => playSound('check', force),
        playWin: (force: boolean = false) => playSound('win', force),
        playLose: (force: boolean = false) => playSound('lose', force),
        playClear: (force: boolean = false) => playSound('clear', force),
        playCalculate: (force: boolean = false) => playSound('calculate', force),
        playError: (force: boolean = false) => playSound('error', force),
        playLineClear: (force: boolean = false) => playSound('lineClear', force),
        playReveal: (force: boolean = false) => playSound('reveal', force),
        playFlip: (force: boolean = false) => playSound('flip', force),
        playLaunch: (force: boolean = false) => playSound('launch', force),
        playSnap: (force: boolean = false) => playSound('snap', force),
        playSuccess: (force: boolean = false) => playSound('success', force),
        playFail: (force: boolean = false) => playSound('fail', force),
        playChomp: (force: boolean = false) => playSound('chomp', force),
        playEatGhost: (force: boolean = false) => playSound('eatGhost', force),
        playDeath: (force: boolean = false) => playSound('death', force),
        playScore: (force: boolean = false) => playSound('score', force),
        playSwoosh: (force: boolean = false) => playSound('swoosh', force),
        playBlock: (force: boolean = false) => playSound('block', force),
    }
};
