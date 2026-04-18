import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Triangle, ArrowRight, Eye, Atom, Landmark, Heart, Leaf, Rocket, UtensilsCrossed, Cpu, Brain, Crown, Check, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import FactCard from '../components/FactCard';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_ICONS = {
    science: Atom,
    history: Landmark,
    health: Heart,
    nature: Leaf,
    space: Rocket,
    food: UtensilsCrossed,
    technology: Cpu,
    psychology: Brain
};

const HomePage = () => {
    const { isAuthenticated, isPremium, token } = useAuth();
    const [featuredFacts, setFeaturedFacts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('register');

    const handleSubscribe = async (planId = 'premium_monthly') => {
        if (!isAuthenticated) {
            setAuthMode('register');
            setShowAuthModal(true);
            return;
        }

        if (isPremium && planId === 'premium_monthly') {
            toast.success('You are already a premium member!');
            return;
        }

        setCheckoutLoading(true);
        try {
            const response = await axios.post(`${API}/subscription/create-checkout`, {
                plan_id: planId,
                origin_url: window.location.origin
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = response.data.checkout_url;
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to initiate checkout');
        } finally {
            setCheckoutLoading(false);
        }
    };

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [factsRes, catsRes] = await Promise.all([
                    axios.get(`${API}/facts?featured=true&limit=3`),
                    axios.get(`${API}/categories`)
                ]);
                setFeaturedFacts(factsRes.data);
                setCategories(catsRes.data);
            } catch (error) {
                console.error('Failed to fetch home data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    return (
        <div className="min-h-screen bg-transparent font-serif text-[#EAE0C8]">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden hero-bg border-b border-[#D4AF37]/20">
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border border-[#D4AF37]/50 bg-black/40 backdrop-blur-sm animate-fade-in-up">
                                <Triangle className="w-4 h-4 text-[#D4AF37]" />
                                <span className="font-heading text-xs uppercase tracking-widest text-[#D4AF37]">The Veil Is Lifting</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-heading font-black mb-6 leading-tight animate-fade-in-up animate-delay-100 text-transparent bg-clip-text bg-gradient-to-b from-[#FFF8D6] to-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                FACTS ARE <br className="hidden lg:block" />FOES
                            </h1>
                            <p className="text-lg md:text-xl text-[#EAE0C8]/80 mb-8 max-w-2xl mx-auto lg:mx-0 animate-fade-in-up animate-delay-200">
                                They built a temple of narratives to control your perception. We built the hammer to shatter it. Decode the illusion, master the Frequency Cipher, and become Sovereign.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animate-delay-300">
                                <Link to="/explore">
                                    <Button className="btn-primary w-full sm:w-auto h-14">
                                        Enter the Archive
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Button 
                                    className="btn-secondary w-full sm:w-auto h-14"
                                    onClick={() => handleSubscribe('sovereign_monthly')}
                                >
                                    Initiate Sovereignty
                                </Button>
                            </div>
                        </div>
                        <div className="relative hidden lg:block animate-fade-in-up animate-delay-400">
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent blur-3xl rounded-full" />
                            <div className="relative border border-[#D4AF37]/30 bg-black/40 backdrop-blur-md p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)] overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Eye className="w-48 h-48 text-[#D4AF37]" />
                                </div>
                                <h3 className="font-heading text-2xl font-bold mb-6 text-[#D4AF37] flex items-center gap-3">
                                    <Shield className="w-6 h-6" />
                                    The Narrative Intelligence Platform
                                </h3>
                                <ul className="space-y-4 text-left">
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
                                        <span className="text-[#EAE0C8]">Track global manipulation via <b>The Invisible Hand</b></span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
                                        <span className="text-[#EAE0C8]">Diagnose your mind with <b>The Frequency Cipher</b></span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
                                        <span className="text-[#EAE0C8]">Author your reality with <b>The Game Master's Manifesto</b></span>
                                    </li>
                                </ul>
                                <Link to="/intel-portal">
                                    <Button className="w-full mt-8 bg-transparent border border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/10 font-heading uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,204,0.2)] hover:shadow-[0_0_25px_rgba(0,255,204,0.4)]">
                                        Access Portal
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Truths */}
            <section className="py-20 px-6 relative z-10 bg-black/40 backdrop-blur-sm border-b border-[#D4AF37]/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                                The Akashic Highlights
                            </h2>
                            <p className="text-[#EAE0C8]/70 font-serif">Curated truths that dismantle universal illusions.</p>
                        </div>
                        <Link to="/explore" className="hidden sm:flex text-[#D4AF37] hover:text-[#FFF8D6] font-heading font-bold uppercase tracking-widest text-sm items-center gap-2 group transition-colors">
                            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredFacts.map(fact => (
                                <FactCard key={fact.id} fact={fact} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Ascension Tiers */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-[#FFF8D6] to-[#D4AF37]">
                        Choose Your Ascension
                    </h2>
                    <p className="text-[#EAE0C8]/80 text-lg max-w-2xl mx-auto font-serif">
                        From mere observer to architect of reality. Select the depth of your initiation.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Tier */}
                    <div className="p-8 border border-[#D4AF37]/30 bg-black/60 backdrop-blur-md hover:border-[#D4AF37]/60 transition-all flex flex-col">
                        <div className="mb-8 flex-1">
                            <h3 className="font-heading text-2xl font-bold text-[#EAE0C8] mb-2">The Observer</h3>
                            <div className="text-3xl font-bold text-[#EAE0C8] mb-6">$0<span className="text-sm font-normal text-white/50">/forever</span></div>
                            <p className="text-white/60 mb-6 font-serif">Read the truths written by others.</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white/80">
                                    <Check className="w-5 h-5 text-white/30" />
                                    Access the Public Archive
                                </li>
                                <li className="flex items-center gap-3 text-white/80">
                                    <Check className="w-5 h-5 text-white/30" />
                                    Vote on Truths
                                </li>
                            </ul>
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full border-white/20 text-white hover:bg-white/10 font-heading uppercase tracking-widest h-12"
                            onClick={() => {
                                if(!isAuthenticated) {
                                    setAuthMode('register');
                                    setShowAuthModal(true);
                                } else {
                                    toast.success('You are already an Observer.');
                                }
                            }}
                        >
                            {isAuthenticated ? 'Current Level' : 'Begin'}
                        </Button>
                    </div>

                    {/* Premium Tier */}
                    <div className="p-8 border border-[#D4AF37] bg-black/60 backdrop-blur-md relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.15)] flex flex-col group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-black font-heading font-bold uppercase tracking-widest text-xs px-4 py-1">
                            Most Selected
                        </div>
                        <div className="mb-8 flex-1 mt-4">
                            <h3 className="font-heading text-2xl font-bold text-[#D4AF37] mb-2 flex items-center gap-2">
                                <Crown className="w-5 h-5" /> The Initiate
                            </h3>
                            <div className="text-4xl font-bold text-[#D4AF37] mb-6">$9<span className="text-lg font-normal text-[#D4AF37]/50">/mo</span></div>
                            <p className="text-[#EAE0C8]/80 mb-6 font-serif">Decode reality with automated intelligence.</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-[#EAE0C8]">
                                    <Check className="w-5 h-5 text-[#D4AF37]" />
                                    Unlimited AI Decryptions
                                </li>
                                <li className="flex items-center gap-3 text-[#EAE0C8]">
                                    <Check className="w-5 h-5 text-[#D4AF37]" />
                                    Ad-free Sanctuary
                                </li>
                                <li className="flex items-center gap-3 text-[#EAE0C8]">
                                    <Check className="w-5 h-5 text-[#D4AF37]" />
                                    Initiate Signet Badge
                                </li>
                            </ul>
                        </div>
                        <Button 
                            className="w-full bg-[#D4AF37] text-black hover:bg-transparent hover:text-[#D4AF37] border border-[#D4AF37] transition-all font-heading uppercase tracking-widest h-12"
                            onClick={() => handleSubscribe('premium_monthly')}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Claim Initiation'}
                        </Button>
                    </div>

                    {/* Sovereign Tier */}
                    <div className="p-8 border border-[#8A0303]/50 bg-black/60 backdrop-blur-md hover:border-[#8A0303] transition-all flex flex-col shadow-[0_0_20px_rgba(138,3,3,0.1)]">
                        <div className="mb-8 flex-1">
                            <h3 className="font-heading text-2xl font-bold text-[#ff3333] mb-2">The Sovereign</h3>
                            <div className="text-3xl font-bold text-[#ff3333] mb-6">$18<span className="text-sm font-normal text-[#ff3333]/50">/mo</span></div>
                            <p className="text-white/60 mb-6 font-serif">You do not read the narrative. You write it.</p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white/90">
                                    <Check className="w-5 h-5 text-[#ff3333]" />
                                    Full Intelligence Portal
                                </li>
                                <li className="flex items-center gap-3 text-white/90">
                                    <Check className="w-5 h-5 text-[#ff3333]" />
                                    The Game Master's Manifesto
                                </li>
                                <li className="flex items-center gap-3 text-white/90">
                                    <Check className="w-5 h-5 text-[#ff3333]" />
                                    Sovereign Links (Redirects)
                                </li>
                            </ul>
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full border-[#8A0303] text-[#ff3333] hover:bg-[#8A0303]/20 font-heading uppercase tracking-widest h-12"
                            onClick={() => handleSubscribe('sovereign_monthly')}
                            disabled={checkoutLoading}
                        >
                            {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Ascend'}
                        </Button>
                    </div>
                </div>
            </section>

            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                mode={authMode}
                setMode={setAuthMode}
            />
        </div>
    );
};

export default HomePage;