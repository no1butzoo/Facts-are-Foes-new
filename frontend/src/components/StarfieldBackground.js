import React from 'react';
import { toast } from 'sonner';

const occultQuotes = [
    "As above, so below.",
    "The All is Mind; The Universe is Mental.",
    "Every cause has its effect; every effect has its cause.",
    "Nothing rests; everything moves; everything vibrates.",
    "The lips of wisdom are closed, except to the ears of Understanding.",
    "Know Thyself, and thou shalt know the Universe and God.",
    "Man is a microcosm, or a little world, because he is an extract from all the stars.",
    "The soul is the mirror of the universe.",
    "Solve et Coagula.",
    "That which is Below corresponds to that which is Above."
];

const Star = ({ top, left, size, duration, delay, interactive }) => {
    const handleStarClick = () => {
        if (interactive) {
            const quote = occultQuotes[Math.floor(Math.random() * occultQuotes.length)];
            toast.custom((t) => (
                <div className="bg-[#05050A] border border-[#D4AF37] p-6 text-[#EAE0C8] shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col gap-2 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
                    <p className="font-heading text-xs text-[#D4AF37] uppercase tracking-widest">Akashic Resonance</p>
                    <p className="font-body italic text-lg leading-relaxed">"{quote}"</p>
                </div>
            ));
        }
    };

    return (
        <div 
            onClick={handleStarClick}
            className={`absolute rounded-full animate-star-drift z-0 ${interactive ? 'cursor-pointer hover:shadow-[0_0_15px_#D4AF37] hover:scale-150 transition-transform bg-[#D4AF37] z-10' : 'bg-white opacity-40'}`}
            style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${duration}s`,
                animationDelay: `-${delay}s`, // Negative delay so they start on screen
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear'
            }}
        />
    );
};

const StarfieldBackground = () => {
    // Generate static array of stars to prevent hydration mismatch or re-renders
    const stars = Array.from({ length: 150 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 150, // Start further right to drift left
        size: Math.random() * 2 + 1,
        duration: Math.random() * 100 + 50, // Very slow drift
        delay: Math.random() * 100,
        interactive: i % 10 === 0 // 1 in 10 stars is interactive
    }));

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-auto z-[-1] bg-[#05050A]">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020204] via-transparent to-[#0a0a0f] opacity-80" />
            
            {/* Esoteric Overlay/Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at center, transparent 30%, rgba(2,2,4,0.8) 100%)'
            }} />

            {stars.map((star) => (
                <Star key={star.id} {...star} />
            ))}
        </div>
    );
};

export default StarfieldBackground;