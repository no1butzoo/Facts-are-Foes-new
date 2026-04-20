import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, BookOpen, Feather, Eye, Key, ChevronRight, Scroll, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const GameMasterManifestoPage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [activeCodex, setActiveCodex] = useState(0);

    const isSovereign = isAuthenticated && (user?.tier === 'sovereign' || user?.is_admin);

    const codices = [
        {
            title: "I. The Illusion of the Board",
            content: "You have been playing a game you did not design, on a board you cannot see, using rules you never agreed to. The first act of the Game Master is to flip the board. The 'News' is not a record of events; it is a spell cast to direct your energy.",
            ritual: "Observe a trending outrage today. Do not absorb it. Watch how it commands the attention of others. You are no longer the piece; you are the hand."
        },
        {
            title: "II. The Architecture of Belief",
            content: "Every fact is a brick; every narrative is a temple. They build temples of fear because frightened minds seek shelter. To become Sovereign, you must dismantle their temples and build your own sanctuaries of Will.",
            ritual: "Identify one core belief you hold about the 'state of the world' that causes you anxiety. Trace it to its source. Who benefits from you holding this brick?"
        },
        {
            title: "III. The Alchemical Word",
            content: "Language is the original magic. When they say 'Crisis', they cast a net. When you say 'Opportunity', you cut the net. The Game Master speaks not to describe reality, but to create it.",
            ritual: "For 24 hours, eliminate the words 'can't', 'terrifying', and 'impossible' from your vocabulary. Replace them with 'choosing not to', 'initiatory', and 'unmapped'."
        }
    ];

    if (!isSovereign && activeCodex > 0) {
        setActiveCodex(0); // Force back to preview if they try to hack state
    }

    return (
        <div className="min-h-screen py-12 px-6 bg-transparent relative overflow-hidden font-serif text-[#EAE0C8]">
            <div className="max-w-4xl mx-auto relative z-10">
                {/* Ancient Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center gap-3 mb-6">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                        <Crown className="w-8 h-8 text-[#D4AF37]" />
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-heading font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-[#FFF8D6] to-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        THE GAME MASTER'S<br />MANIFESTO
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto text-[#D4AF37] italic opacity-80">
                        "Do not fight the narrative. Become the author."
                    </p>
                </div>

                {/* The Codices */}
                <div className="grid md:grid-cols-12 gap-8">
                    {/* Navigation Menu */}
                    <div className="md:col-span-4 space-y-4">
                        {codices.map((codex, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveCodex(index)}
                                className={`w-full text-left p-4 border transition-all duration-500 relative overflow-hidden group ${
                                    activeCodex === index 
                                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                                        : 'bg-black/40 border-[#D4AF37]/30 hover:border-[#D4AF37]/60'
                                }`}
                                disabled={!isSovereign && index > 0}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-heading font-bold ${activeCodex === index ? 'text-[#D4AF37]' : 'text-[#EAE0C8]'}`}>
                                        Codex {index + 1}
                                    </span>
                                    {!isSovereign && index > 0 ? (
                                        <Lock className="w-4 h-4 text-[#8A0303]" />
                                    ) : (
                                        <ChevronRight className={`w-4 h-4 transition-transform ${activeCodex === index ? 'text-[#D4AF37] translate-x-1' : 'text-[#D4AF37]/50'}`} />
                                    )}
                                </div>
                                <p className="text-sm mt-2 opacity-70 truncate">{codex.title}</p>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-8">
                        <div className="p-8 border border-[#D4AF37] bg-black/60 backdrop-blur-md relative min-h-[400px]">
                            {/* Decorative Corners */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#D4AF37]" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#D4AF37]" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#D4AF37]" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#D4AF37]" />

                            {!isSovereign && activeCodex > 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/80 backdrop-blur-sm z-20">
                                    <Key className="w-12 h-12 text-[#8A0303] mb-4 drop-shadow-[0_0_10px_rgba(138,3,3,0.8)]" />
                                    <h3 className="font-heading text-2xl text-[#D4AF37] mb-4">Esoteric Knowledge Locked</h3>
                                    <p className="mb-6 opacity-80">This codex is reserved for Sovereign Initiates. You must demonstrate the Will to ascend.</p>
                                    <Button 
                                        onClick={() => navigate('/intel-portal')}
                                        className="font-heading bg-[#8A0303] hover:bg-[#8A0303]/80 text-[#EAE0C8] border border-[#8A0303]"
                                    >
                                        Initiate Sovereignty
                                    </Button>
                                </div>
                            ) : null}

                            <div className={`transition-opacity duration-500 ${!isSovereign && activeCodex > 0 ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
                                <h2 className="text-3xl font-heading text-[#D4AF37] mb-6 flex items-center gap-3">
                                    <Scroll className="w-6 h-6" />
                                    {codices[activeCodex].title}
                                </h2>
                                
                                <div className="space-y-6 text-lg leading-relaxed">
                                    <p className="first-letter:text-6xl first-letter:font-heading first-letter:text-[#D4AF37] first-letter:mr-3 first-letter:float-left">
                                        {codices[activeCodex].content}
                                    </p>
                                    
                                    <div className="mt-8 p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/30">
                                        <h4 className="font-heading text-[#D4AF37] flex items-center gap-2 mb-3">
                                            <Sparkles className="w-4 h-4" />
                                            The Ritual of Application
                                        </h4>
                                        <p className="italic opacity-90">
                                            {codices[activeCodex].ritual}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isSovereign && activeCodex === 2 && (
                    <div className="mt-12 text-center animate-fade-in-up">
                        <Button 
                            onClick={() => toast.success("Your Will has been recorded in the Akashic Record.")}
                            className="bg-[#D4AF37] text-black hover:bg-transparent hover:text-[#D4AF37] border border-[#D4AF37] px-12 py-6 text-lg font-heading tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                        >
                            <Feather className="w-5 h-5 mr-2" />
                            Sign The Manifesto
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameMasterManifestoPage;