
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhysicsObject } from '../types';
import { useSound } from '../hooks/useSound';
import { useAppStore } from '../store';

const WIDTH = 800;
const HEIGHT = 400;
const GRAVITY = 0.1;

const PhysicsLab: React.FC = () => {
    const [topic, setTopic] = useState<"newton" | "momentum" | "projectile">('newton');

    const renderTopic = () => {
        switch (topic) {
            case 'newton': return <NewtonLab />;
            case 'momentum': return <MomentumLab />;
            case 'projectile': return <ProjectileLab />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-start font-orbitron w-full h-full p-4">
            <h1 className="text-4xl text-purple-300 mb-4">Physics Lab</h1>
            <div className="flex gap-2 mb-4 p-2 bg-black/30 rounded-lg">
                <button onClick={() => setTopic('newton')} className={`px-4 py-1 rounded transition-colors ${topic === 'newton' ? 'bg-purple-600' : 'hover:bg-purple-800'}`}>Newton's Laws</button>
                <button onClick={() => setTopic('momentum')} className={`px-4 py-1 rounded transition-colors ${topic === 'momentum' ? 'bg-purple-600' : 'hover:bg-purple-800'}`}>Momentum</button>
                <button onClick={() => setTopic('projectile')} className={`px-4 py-1 rounded transition-colors ${topic === 'projectile' ? 'bg-purple-600' : 'hover:bg-purple-800'}`}>Projectiles</button>
            </div>
            <div className="w-full flex-grow bg-black/30 rounded-lg border border-white/10">
                {renderTopic()}
            </div>
        </div>
    );
};

// --- Newton's Law Lab ---
const NewtonLab: React.FC = () => {
    const [mass, setMass] = useState(10);
    const [force, setForce] = useState(5);
    const [position, setPosition] = useState(50);
    const [velocity, setVelocity] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const simRef = useRef<number>();
    const isMuted = useAppStore(state => state.isMuted);
    // FIX: Pass boolean argument to sound functions.
    const { playLaunch } = useSound(isMuted);


    const runSimulation = useCallback(() => {
        if (!isSimulating) return;
        const acceleration = force / mass;
        const newVelocity = velocity + acceleration * 0.1;
        const newPosition = position + newVelocity * 0.1;
        
        setVelocity(newVelocity);
        setPosition(newPosition);

        if (newPosition > WIDTH - 50) {
            setIsSimulating(false);
        } else {
            simRef.current = requestAnimationFrame(runSimulation);
        }
    }, [isSimulating, position, velocity, force, mass]);
    
    useEffect(() => {
        if (isSimulating) {
            simRef.current = requestAnimationFrame(runSimulation);
        }
        return () => {
            if (simRef.current) cancelAnimationFrame(simRef.current);
        }
    }, [isSimulating, runSimulation]);
    
    const start = () => {
        setPosition(50);
        setVelocity(0);
        setIsSimulating(true);
    }

    return (
        <div className="p-4 text-center h-full flex flex-col justify-between">
            <div>
                <h2 className="text-2xl mb-4">Force Lab (F = ma)</h2>
                <div className="flex justify-center gap-8 mb-8 items-center flex-wrap">
                    <div>Mass (kg): <input type="range" min="1" max="50" value={mass} onChange={e => setMass(Number(e.target.value))} className="w-40" /> {mass}</div>
                    <div>Force (N): <input type="range" min="1" max="50" value={force} onChange={e => setForce(Number(e.target.value))} className="w-40" /> {force}</div>
                    <button onClick={start} disabled={isSimulating} className="px-4 py-2 bg-green-600 rounded disabled:bg-gray-500">Apply Force</button>
                </div>
            </div>
            <div className="h-40 bg-gray-800 relative rounded border border-gray-600">
                <div className="absolute bg-cyan-400 rounded" style={{ left: `${position}px`, bottom: 0, width: '40px', height: '40px', transition: 'left 16ms linear' }} />
            </div>
            <p className="mt-4 text-xl">Acceleration: <span className="text-yellow-300">{(force/mass).toFixed(2)} m/s²</span> | Velocity: <span className="text-yellow-300">{velocity.toFixed(2)} m/s</span></p>
        </div>
    );
};

// --- Momentum Lab ---
const MomentumLab: React.FC = () => {
    const [obj1, setObj1] = useState({ mass: 10, vx: 5, x: 100 });
    const [obj2, setObj2] = useState({ mass: 15, vx: -3, x: WIDTH - 150 });
    const [simulating, setSimulating] = useState(false);
    const isMuted = useAppStore(state => state.isMuted);
    const { playBlock } = useSound(isMuted);

    const reset = () => {
        setObj1({ mass: obj1.mass, vx: obj1.vx, x: 100 });
        setObj2({ mass: obj2.mass, vx: obj2.vx, x: WIDTH - 150 });
        setSimulating(true);
    };

    useEffect(() => {
        if (!simulating) return;
        let animationFrame: number;

        const animate = () => {
            setObj1(o => ({...o, x: o.x + o.vx * 0.2}));
            setObj2(o => ({...o, x: o.x + o.vx * 0.2}));
            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [simulating]);

    useEffect(() => {
        if (obj1.x + 40 > obj2.x) {
            // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
            playBlock(false);
            setSimulating(false);
            const { mass: m1, vx: v1 } = obj1;
            const { mass: m2, vx: v2 } = obj2;
            const v1_final = ((m1 - m2) / (m1 + m2)) * v1 + ((2 * m2) / (m1 + m2)) * v2;
            const v2_final = ((2 * m1) / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2;
            setObj1(o => ({ ...o, vx: v1_final }));
            setObj2(o => ({ ...o, vx: v2_final }));
        }
    }, [obj1.x, obj2.x, obj1, obj2, playBlock]);

    return (
        <div className="p-4 text-center h-full flex flex-col">
            <h2 className="text-2xl mb-4">Elastic Collisions</h2>
            <div className="flex justify-around items-center mb-4">
                <div>
                    <label>Ball 1 Mass: {obj1.mass} kg</label>
                    <input type="range" min="5" max="50" value={obj1.mass} onChange={e => setObj1(o=>({...o, mass: +e.target.value}))}/>
                    <label>Ball 1 Velocity: {obj1.vx} m/s</label>
                    <input type="range" min="-10" max="10" value={obj1.vx} onChange={e => setObj1(o=>({...o, vx: +e.target.value}))}/>
                </div>
                 <button onClick={reset} className="px-4 py-2 bg-green-600 rounded">Collide!</button>
                 <div>
                    <label>Ball 2 Mass: {obj2.mass} kg</label>
                    <input type="range" min="5" max="50" value={obj2.mass} onChange={e => setObj2(o=>({...o, mass: +e.target.value}))}/>
                    <label>Ball 2 Velocity: {-obj2.vx} m/s</label>
                    <input type="range" min="-10" max="10" value={-obj2.vx} onChange={e => setObj2(o=>({...o, vx: -Number(e.target.value)}))}/>
                </div>
            </div>
            <div className="flex-grow bg-gray-800 relative rounded border border-gray-600">
                <div className="absolute bg-blue-500 rounded-full" style={{ left: obj1.x, bottom: '50%', transform: 'translateY(50%)', width: 40, height: 40 }}/>
                <div className="absolute bg-red-500 rounded-full" style={{ left: obj2.x, bottom: '50%', transform: 'translateY(50%)', width: 40, height: 40 }}/>
            </div>
        </div>
    );
};

// --- Projectile Lab ---
const ProjectileLab: React.FC = () => {
    const [angle, setAngle] = useState(45);
    const [power, setPower] = useState(50);
    const [path, setPath] = useState<{x:number, y:number}[]>([]);
    const [target] = useState({ x: Math.random() * (WIDTH - 200) + 150, size: 30 });
    const isMuted = useAppStore(state => state.isMuted);
    const { playLaunch, playSuccess, playFail } = useSound(isMuted);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const fire = () => {
        // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
        playLaunch(false);
        const rad = angle * (Math.PI / 180);
        const v0 = power * 0.3;
        const vx = v0 * Math.cos(rad);
        const vy = -v0 * Math.sin(rad); // Y is inverted in canvas
        const newPath: {x:number, y:number}[] = [];
        let hit = false;
        
        for (let t = 0; t < 200; t += 0.1) {
            const x = vx * t;
            const y = (vy * t) + (0.5 * GRAVITY * t * t);
            if (y > 0) break;
            newPath.push({ x: x + 20, y: HEIGHT - 20 + y });
            if (Math.hypot(newPath[newPath.length - 1].x - target.x, newPath[newPath.length - 1].y - (HEIGHT - target.size/2)) < target.size/2) {
                hit = true;
            }
        }
        setPath(newPath);
        // FIX: Expected 1 arguments, but got 0. Pass boolean argument to fix.
        if (hit) playSuccess(false); else playFail(false);
    };

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Ground
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);

        // Cannon
        ctx.save();
        ctx.translate(20, HEIGHT - 20);
        ctx.rotate(angle * Math.PI / 180 * -1);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, -5, 40, 10);
        ctx.restore();
        
        // Target
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(target.x, HEIGHT - target.size / 2, target.size / 2, 0, 2 * Math.PI);
        ctx.fill();

        // Path
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        path.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

    }, [angle, power, path, target]);

    return (
        <div className="p-4 text-center h-full flex flex-col">
            <h2 className="text-2xl mb-4">Projectile Motion</h2>
            <div className="flex justify-center gap-8 mb-4 items-center">
                <div>Angle: <input type="range" min="0" max="90" value={angle} onChange={e => setAngle(+e.target.value)} /> {angle}°</div>
                <div>Power: <input type="range" min="10" max="100" value={power} onChange={e => setPower(+e.target.value)} /> {power}</div>
                <button onClick={fire} className="px-4 py-2 bg-red-600 rounded">Fire!</button>
            </div>
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="bg-gray-800 rounded mx-auto" />
        </div>
    );
};

export default PhysicsLab;
