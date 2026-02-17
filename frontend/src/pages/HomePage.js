import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Triangle, ArrowRight, Zap, Eye, Atom, Landmark, Heart, Leaf, Rocket, UtensilsCrossed, Cpu, Brain, Crown, Check, Loader2 } from 'lucide-react';
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

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            setAuthMode('register');
            setShowAuthModal(true);
            return;
        }

        if (isPremium) {
            toast.success('You are already a premium member!');
            return;
        }

        setCheckoutLoading(true);
        try {
            const response = await axios.post(`${API}/subscription/create-checkout`, {
                plan_id: 'premium_monthly',
                origin_url: window.location.origin
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Redirect to Stripe checkout
            window.location.href = response.data.checkout_url;
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.response?.data?.detail || 'Failed to start checkout');
            setCheckoutLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Seed data first
                await axios.post(`${API}/seed`);
                
                const [factsRes, categoriesRes] = await Promise.all([
                    axios.get(`${API}/facts?featured=true&limit=6`),
                    axios.get(`${API}/categories`)
                ]);
                setFeaturedFacts(factsRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="hero-bg relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
                
                {/* Floating Stars */}
                <div className="absolute inset-0 z-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-primary rounded-full star"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
                    {/* Pyramid Icon */}
                    <div className="w-20 h-20 mx-auto mb-8 bg-primary pyramid-icon animate-float flex items-center justify-center glow-gold-strong">
                        <Triangle className="w-10 h-10 text-primary-foreground" />
                    </div>

                    <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase mb-6 animate-fade-in-up" data-testid="hero-title">
                        <span className="text-foreground">FACTS ARE</span>
                        <br />
                        <span className="text-gradient-gold">FOES</span>
                    </h1>

                    <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animate-delay-100" data-testid="hero-subtitle">
                        Discover the truths hidden beneath centuries of misconceptions. 
                        Unearth the facts that history got wrong.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-delay-200">
                        <Link to="/explore">
                            <Button className="btn-primary text-lg px-10 py-6 gap-2" data-testid="explore-btn">
                                <Eye className="w-5 h-5" />
                                Explore Myths
                            </Button>
                        </Link>
                        <Link to="/submit">
                            <Button variant="outline" className="btn-secondary text-lg px-10 py-6 gap-2" data-testid="submit-myth-btn">
                                <Zap className="w-5 h-5" />
                                Submit a Myth
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in-up animate-delay-300">
                        <div className="text-center">
                            <div className="font-heading text-3xl md:text-4xl font-bold text-primary">{featuredFacts.length}+</div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Myths Busted</div>
                        </div>
                        <div className="text-center">
                            <div className="font-heading text-3xl md:text-4xl font-bold text-secondary">{categories.length}</div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Categories</div>
                        </div>
                        <div className="text-center">
                            <div className="font-heading text-3xl md:text-4xl font-bold text-accent">AI</div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Powered</div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                    <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-primary rounded-full" />
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 px-6 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="categories-title">
                            EXPLORE BY <span className="text-primary">REALM</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Navigate through different domains of debunked myths and misconceptions
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((category, index) => {
                            const IconComponent = CATEGORY_ICONS[category.id] || Atom;
                            return (
                                <Link 
                                    key={category.id} 
                                    to={`/explore?category=${category.id}`}
                                    className="category-card group p-6"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    data-testid={`category-${category.id}`}
                                >
                                    <div className="text-center">
                                        <IconComponent className="w-8 h-8 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <div className="font-heading text-sm uppercase tracking-widest group-hover:text-primary transition-colors">
                                            {category.name}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Facts Section */}
            <section className="py-24 px-6 bg-card/50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-16">
                        <div>
                            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="featured-title">
                                FEATURED <span className="text-primary">REVELATIONS</span>
                            </h2>
                            <p className="text-muted-foreground max-w-xl">
                                The most shocking facts that turned out to be our greatest foes
                            </p>
                        </div>
                        <Link to="/explore" className="hidden md:flex items-center gap-2 text-primary hover:gap-4 transition-all">
                            <span className="uppercase tracking-widest text-sm">View All</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-64 bg-muted/20 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredFacts.map((fact, index) => (
                                <FactCard key={fact.id} fact={fact} index={index} />
                            ))}
                        </div>
                    )}

                    <div className="mt-12 text-center md:hidden">
                        <Link to="/explore">
                            <Button variant="outline" className="btn-secondary gap-2">
                                View All Myths
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Subscription Section */}
            <section className="py-24 px-6 bg-background">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            UNLOCK <span className="text-primary">PREMIUM</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Get unlimited access to AI explanations, exclusive content, and ad-free browsing
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Tier */}
                        <div className="p-8 bg-card border border-white/10 flex flex-col">
                            <div className="mb-6">
                                <h3 className="font-heading text-2xl uppercase tracking-widest mb-2">Free</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-heading text-4xl font-bold">$0</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-muted-foreground">
                                    <Check className="w-5 h-5 text-primary" />
                                    Browse all myths
                                </li>
                                <li className="flex items-center gap-3 text-muted-foreground">
                                    <Check className="w-5 h-5 text-primary" />
                                    3 AI explanations per day
                                </li>
                                <li className="flex items-center gap-3 text-muted-foreground">
                                    <Check className="w-5 h-5 text-primary" />
                                    Submit myths
                                </li>
                                <li className="flex items-center gap-3 text-muted-foreground">
                                    <Check className="w-5 h-5 text-primary" />
                                    Vote on content
                                </li>
                            </ul>
                            <Button variant="outline" className="w-full btn-secondary" disabled>
                                Current Plan
                            </Button>
                        </div>

                        {/* Premium Tier */}
                        <div className="p-8 bg-card border-2 border-primary relative flex flex-col glow-gold">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground px-4 py-1 text-xs uppercase tracking-widest font-bold flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    Most Popular
                                </span>
                            </div>
                            <div className="mb-6">
                                <h3 className="font-heading text-2xl uppercase tracking-widest mb-2 text-primary">Premium</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="font-heading text-4xl font-bold text-primary">$9</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" />
                                    Everything in Free
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" />
                                    <strong>Unlimited</strong> AI explanations
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" />
                                    Ad-free experience
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" />
                                    Early access to new myths
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" />
                                    Premium badge on profile
                                </li>
                                <li className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" />
                                    Priority support
                                </li>
                            </ul>
                            <Button 
                                className="w-full btn-primary"
                                onClick={handleSubscribe}
                                disabled={checkoutLoading || isPremium}
                                data-testid="subscribe-btn"
                            >
                                {checkoutLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Crown className="w-4 h-4 mr-2" />
                                )}
                                {isPremium ? 'You are Premium!' : 'Subscribe for $9/month'}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">
                        KNOW A <span className="text-primary">MYTH</span>?
                    </h2>
                    <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
                        Help us uncover more facts that turned into foes. Submit your knowledge and let AI reveal the truth.
                    </p>
                    <Link to="/submit">
                        <Button className="btn-primary text-lg px-12 py-6" data-testid="cta-submit-btn">
                            Submit a Controversy
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary pyramid-icon" />
                        <span className="font-heading text-sm tracking-widest text-muted-foreground">
                            FACTS ARE FOES © 2024
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Built with ancient wisdom & modern AI</span>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
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
