
import React from 'react';
import { motion } from 'framer-motion';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
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

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, title, children }) => {
    // AnimatePresence will handle the conditional rendering
    return (
        <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: 0.3 }}
        >
            <motion.div 
                className="w-full max-w-lg bg-background-secondary p-8 rounded-2xl border-2 border-theme-primary shadow-2xl shadow-primary"
                onClick={e => e.stopPropagation()}
                variants={modalVariants}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-primary font-orbitron">{title} Tutorial</h2>
                    <button onClick={onClose} className="text-2xl hover:text-primary">&times;</button>
                </div>
                <div className="text-text-secondary space-y-4">
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TutorialModal;
