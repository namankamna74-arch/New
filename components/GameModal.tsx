
import React from 'react';
import { motion } from 'framer-motion';

interface GameModalProps {
    title: string;
    status: string;
    buttonText: string;
    onButtonClick: () => void;
}

// FIX: Removed Variants type to fix import and usage errors.
const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
};

const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
        scale: 1, 
        opacity: 1,
        transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { scale: 0.8, opacity: 0 },
};

const GameModal: React.FC<GameModalProps> = ({ title, status, buttonText, onButtonClick }) => {
    return (
        <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: 0.3 }}
        >
            <motion.div 
                className="text-center p-8 rounded-2xl bg-black/30 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30"
                variants={modalVariants}
            >
                <h2 className="text-5xl font-bold text-purple-300 mb-2 font-orbitron" style={{textShadow: '0 0 10px #c084fc'}}>
                    {title}
                </h2>
                <p className="text-xl text-gray-300 mb-8">{status}</p>
                <motion.button 
                    onClick={onButtonClick} 
                    className="px-8 py-3 bg-purple-600/70 hover:bg-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-purple-500/50 text-xl font-orbitron"
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    {buttonText}
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default GameModal;
