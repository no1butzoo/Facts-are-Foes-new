import { useState } from 'react';
import { Eye, Shield, Sparkles, AlertTriangle, Hexagon } from 'lucide-react';
import { Button } from '../components/ui/button';

const FOES = [
    {
        id: 1,
        title: "The Algorithmic Overseer",
        description: "A manifestation of the digital systems that feed on human outrage. It dictates what you see to ensure you remain angry, divided, and highly engaged.",
        image: "https://images.unsplash.com/photo-1517187654069-ba29110a1d9e?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
        theme: "#D4AF37",
        weakness: "Silence and Digital Detachment"
    },
    {
        id: 2,
        title: "The Narrative Architect",
        description: "The unseen hand weaving the illusion. It controls the language, ensuring that the only words available to describe reality serve its own agenda.",
        image: "https://images.pexels.com/photos/34642205/pexels-photo-34642205.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        theme: "#00ffcc",
        weakness: "Semantic Sovereignty (Naming your own reality)"
    },
    {
        id: 3,
        title: "The Echo Chamber",
        description: "An infinite fractal mirror maze where people are trapped, staring into golden reflective monoliths that show them exactly what they fear most to confirm their biases.",
        image: "https://images.unsplash.com/photo-1566214358736-df5a0048a9db?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
        theme: "#8A0303",
        weakness: "Courageous Inquiry"
    },
    {
        id: 4,
        title: "The Attention Harvester",
        description: "A cosmic parasite feeding on streams of glowing white light emitting from screens. It converts your limited mortal time into its own immortality.",
        image: "https://images.pexels.com/photos/21243629/pexels-photo-21243629.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        theme: "#9333ea",
        weakness: "Presence and Stillness"
    }
];

const FoesOfTheFuturePage = () => {
    const [selectedFoe, setSelectedFoe] = useState(FOES[0]);

    return (
        <div className="min-h-screen py-12 px-6 bg-transparent font-serif text-[#EAE0C8]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[#D4AF37]/50 bg-black/40 backdrop-blur-sm">
                        <Hexagon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="font-heading text-xs uppercase tracking-widest text-[#D4AF37]">Visionary Divination</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-heading font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-[#FFF8D6] to-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        FOES OF THE FUTURE
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto text-[#EAE0C8]/80 mb-8 italic">
                        "To defeat an enemy, you must first behold its true form."
                    </p>
                    <p className="text-sm text-[#D4AF37]/60 max-w-2xl mx-auto uppercase tracking-widest font-heading border-b border-[#D4AF37]/20 pb-8">
                        The AI-Generated Art Series mapping the archetypes of psychological manipulation.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Foe Selector */}
                    <div className="lg:col-span-4 space-y-4">
                        {FOES.map((foe) => (
                            <button
                                key={foe.id}
                                onClick={() => setSelectedFoe(foe)}
                                className={`w-full text-left p-6 border transition-all duration-500 relative overflow-hidden group ${
                                    selectedFoe.id === foe.id 
                                        ? 'bg-black/60 shadow-[0_0_20px_rgba(212,175,55,0.15)]' 
                                        : 'bg-black/40 hover:bg-black/50 opacity-60 hover:opacity-100'
                                }`}
                                style={{ borderColor: selectedFoe.id === foe.id ? foe.theme : 'rgba(212,175,55,0.2)' }}
                            >
                                <div 
                                    className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" 
                                    style={{ backgroundColor: foe.theme }} 
                                />
                                <h3 className="font-heading text-xl font-bold relative z-10" style={{ color: selectedFoe.id === foe.id ? foe.theme : '#EAE0C8' }}>
                                    {foe.title}
                                </h3>
                            </button>
                        ))}
                    </div>

                    {/* Foe Display */}
                    <div className="lg:col-span-8">
                        <div 
                            className="border p-1 bg-black/60 backdrop-blur-md transition-all duration-700"
                            style={{ borderColor: `${selectedFoe.theme}80`, boxShadow: `0 0 40px ${selectedFoe.theme}20` }}
                        >
                            <div className="relative aspect-video sm:aspect-[21/9] lg:aspect-video overflow-hidden border border-black group">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-700 z-10" />
                                <img 
                                    src={selectedFoe.image} 
                                    alt={selectedFoe.title}
                                    className="w-full h-full object-cover mix-blend-luminosity transform scale-105 group-hover:scale-100 transition-transform duration-1000 grayscale hover:grayscale-0"
                                />
                                <div 
                                    className="absolute bottom-0 left-0 right-0 p-8 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent z-20"
                                >
                                    <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" style={{ color: selectedFoe.theme }}>
                                        {selectedFoe.title}
                                    </h2>
                                    <p className="text-lg text-[#EAE0C8] max-w-2xl leading-relaxed mb-6">
                                        {selectedFoe.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-3 px-4 py-3 border border-[#EAE0C8]/20 bg-black/40 w-fit">
                                        <Shield className="w-5 h-5" style={{ color: selectedFoe.theme }} />
                                        <div className="text-sm">
                                            <span className="font-heading uppercase tracking-widest text-[#EAE0C8]/50 mr-2">Alchemical Counter-Measure:</span>
                                            <span className="text-[#EAE0C8] font-bold">{selectedFoe.weakness}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoesOfTheFuturePage;