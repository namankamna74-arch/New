
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CelestialBody, Satellite } from '../types';
import { useSound } from '../hooks/useSound';
import { useAppStore } from '../store';

const WIDTH = 800;
const HEIGHT = 600;
const G = 0.1; // Gravitational constant

const AstroClub: React.FC = () => {
    const [planet] = useState<CelestialBody>({ x: WIDTH / 2, y: HEIGHT / 2, radius: 40, mass: 2000, color: '#3B82F6' });
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [isAiming, setIsAiming] = useState(false);
    const [launchVector, setLaunchVector] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const [status, setStatus] = useState("Click and drag from the planet to launch a satellite.");
    const simLoopRef = useRef<number>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMuted = useAppStore(state => state.isMuted);
    // FIX: Pass boolean argument to sound functions.
    const { playLaunch, playSuccess, playFail } = useSound(isMuted);

    const checkOrbitStatus = useCallback((sat: Satellite) => {
        const dx = sat.x - planet.x;
        const dy = sat.y - planet.y;
        const dist = Math.hypot(dx, dy);

        if (dist < planet.radius) {
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playFail(false);
            setStatus(`Satellite #${sat.id} crashed!`);
            return 'crashed';
        }
        if (dist > WIDTH * 2) {
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playFail(false);
            setStatus(`Satellite #${sat.id} achieved escape velocity!`);
            return 'escaped';
        }

        const speed = Math.hypot(sat.vx, sat.vy);
        const orbitalV = Math.sqrt(G * planet.mass / dist);
        
        if (Math.abs(speed - orbitalV) < 0.5 && sat.path.length > 100) {
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playSuccess(false);
            setStatus(`Satellite #${sat.id} has achieved a stable orbit!`);
        }
        return 'orbiting';
    }, [planet, playFail, playSuccess]);

    const simulationLoop = useCallback(() => {
        setSatellites(prevSats => {
            const newSats = prevSats.map(sat => {
                const dx = planet.x - sat.x;
                const dy = planet.y - sat.y;
                const distSq = dx * dx + dy * dy;
                const force = G * planet.mass / distSq;
                const ax = force * (dx / Math.sqrt(distSq));
                const ay = force * (dy / Math.sqrt(distSq));

                const newVx = sat.vx + ax;
                const newVy = sat.vy + ay;
                const newX = sat.x + newVx;
                const newY = sat.y + newVy;

                const newPath = [...sat.path, { x: newX, y: newY }];
                if (newPath.length > 200) newPath.shift();
                
                return { ...sat, x: newX, y: newY, vx: newVx, vy: newVy, path: newPath };
            });

            const activeSats = newSats.filter(sat => {
                return checkOrbitStatus(sat) === 'orbiting';
            });
            
            return activeSats;
        });
        simLoopRef.current = requestAnimationFrame(simulationLoop);
    }, [planet, checkOrbitStatus]);
    
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Draw Planet
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Satellites and paths
        satellites.forEach(sat => {
            ctx.strokeStyle = '#A78BFA';
            ctx.lineWidth = 1;
            ctx.beginPath();
            sat.path.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.fillRect(sat.x - 3, sat.y - 3, 6, 6);
        });

        // Draw aiming vector
        if (isAiming) {
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(launchVector.x1, launchVector.y1);
            ctx.lineTo(launchVector.x2, launchVector.y2);
            ctx.stroke();
        }
    }, [satellites, isAiming, launchVector, planet]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        setLaunchVector({ x1: planet.x, y1: planet.y, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
        setIsAiming(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isAiming) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        setLaunchVector(v => ({ ...v, x2: e.clientX - rect.left, y2: e.clientY - rect.top }));
    };

    const handleMouseUp = () => {
        if (!isAiming) return;
        setIsAiming(false);
        // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
        playLaunch(false);
        const newSat: Satellite = {
            id: satellites.length + 1,
            x: planet.x,
            y: planet.y - planet.radius - 5,
            vx: (launchVector.x2 - launchVector.x1) * 0.05,
            vy: (launchVector.y2 - launchVector.y1) * 0.05,
            path: [],
        };
        setSatellites(s => [...s, newSat]);
        setStatus(`Launched Satellite #${newSat.id}!`);
    };

    useEffect(() => {
        simLoopRef.current = requestAnimationFrame(simulationLoop);
        return () => cancelAnimationFrame(simLoopRef.current!);
    }, [simulationLoop]);

    return (
        <div className="flex flex-col items-center justify-center font-orbitron w-full h-full p-4">
            <h1 className="text-4xl text-purple-300 mb-2">Astro Club: Orbit Simulator</h1>
            <p className="text-gray-400 mb-4 h-6">{status}</p>
            <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                className="bg-black/50 border-2 border-purple-400/50 rounded-lg cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default AstroClub;
