import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Triangle, ArrowRight, Zap, Eye, Atom, Landmark, Heart, Leaf, Rocket, UtensilsCrossed, Cpu, Brain } from 'lucide-react';
import { Button } from '../components/ui/button';
import FactCard from '../components/FactCard';

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
    const [featuredFacts, setFeaturedFacts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

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
        </div>
    );
};

export default HomePage;
