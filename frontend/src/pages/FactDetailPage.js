import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    ThumbsUp, ThumbsDown, ArrowLeft, Sparkles, ExternalLink, User, Calendar,
    Atom, Landmark, Heart, Leaf, Rocket, UtensilsCrossed, Cpu, Brain, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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

const FactDetailPage = () => {
    const { id } = useParams();
    const { isAuthenticated, token } = useAuth();
    const [fact, setFact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userVote, setUserVote] = useState(null);
    const [generatingAI, setGeneratingAI] = useState(false);

    useEffect(() => {
        fetchFact();
        if (isAuthenticated) {
            fetchUserVote();
        }
    }, [id, isAuthenticated]);

    const fetchFact = async () => {
        try {
            const response = await axios.get(`${API}/facts/${id}`);
            setFact(response.data);
        } catch (error) {
            console.error('Error fetching fact:', error);
            toast.error('Failed to load fact');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserVote = async () => {
        try {
            const response = await axios.get(`${API}/facts/${id}/vote`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserVote(response.data.vote_type);
        } catch (error) {
            console.error('Error fetching vote:', error);
        }
    };

    const handleVote = async (voteType) => {
        if (!isAuthenticated) {
            toast.error('Please login to vote');
            return;
        }

        try {
            await axios.post(`${API}/facts/${id}/vote`, { vote_type: voteType }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Refresh fact and vote
            fetchFact();
            fetchUserVote();
            toast.success(userVote === voteType ? 'Vote removed' : 'Vote recorded!');
        } catch (error) {
            console.error('Error voting:', error);
            toast.error('Failed to record vote');
        }
    };

    const generateAIExplanation = async () => {
        setGeneratingAI(true);
        try {
            const response = await axios.post(`${API}/facts/${id}/explain`);
            setFact(prev => ({ ...prev, ai_explanation: response.data.explanation }));
            toast.success('AI explanation generated!');
        } catch (error) {
            console.error('Error generating explanation:', error);
            toast.error('Failed to generate AI explanation');
        } finally {
            setGeneratingAI(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!fact) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="font-heading text-2xl font-bold mb-4">Fact not found</h2>
                    <Link to="/explore">
                        <Button className="btn-secondary">Back to Explore</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const IconComponent = CATEGORY_ICONS[fact.category] || Atom;

    return (
        <div className="min-h-screen">
            {/* Hero Image */}
            {fact.image_url && (
                <div className="relative h-[40vh] overflow-hidden">
                    <img 
                        src={fact.image_url} 
                        alt={fact.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                </div>
            )}

            <div className="max-w-4xl mx-auto px-6 py-12 -mt-24 relative z-10">
                {/* Back Button */}
                <Link 
                    to="/explore" 
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
                    data-testid="back-btn"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="uppercase tracking-widest text-sm">Back to Explore</span>
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest">
                            {fact.category}
                        </Badge>
                        {fact.is_featured && (
                            <Badge className="bg-accent text-accent-foreground uppercase tracking-widest">
                                Featured
                            </Badge>
                        )}
                    </div>

                    <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6" data-testid="fact-title">
                        {fact.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {fact.author_username}
                        </span>
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(fact.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {/* False Belief */}
                    <div className="p-8 bg-destructive/10 border border-destructive/30">
                        <h3 className="font-heading text-lg uppercase tracking-widest text-destructive mb-4">
                            The Myth
                        </h3>
                        <p className="text-xl text-foreground leading-relaxed drop-cap" data-testid="false-belief">
                            {fact.false_belief}
                        </p>
                    </div>

                    {/* Truth */}
                    <div className="p-8 bg-primary/10 border border-primary/30">
                        <h3 className="font-heading text-lg uppercase tracking-widest text-primary mb-4">
                            The Truth
                        </h3>
                        <p className="text-xl text-foreground leading-relaxed drop-cap" data-testid="truth">
                            {fact.truth}
                        </p>
                    </div>

                    {/* AI Explanation */}
                    <div className="p-8 bg-card border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-lg uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                AI Analysis
                            </h3>
                            {!fact.ai_explanation && (
                                <Button 
                                    onClick={generateAIExplanation}
                                    disabled={generatingAI}
                                    variant="outline"
                                    className="border-secondary text-secondary hover:bg-secondary/10"
                                    data-testid="generate-ai-btn"
                                >
                                    {generatingAI ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                        {fact.ai_explanation ? (
                            <p className="text-muted-foreground leading-relaxed" data-testid="ai-explanation">
                                {fact.ai_explanation}
                            </p>
                        ) : (
                            <p className="text-muted-foreground italic">
                                Click "Generate" to get an AI-powered deep dive into this myth
                            </p>
                        )}
                    </div>

                    {/* Source */}
                    {fact.source_url && (
                        <a 
                            href={fact.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                            data-testid="source-link"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Source
                        </a>
                    )}
                </div>

                {/* Voting */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="font-heading text-lg uppercase tracking-widest text-muted-foreground">
                            Was this helpful?
                        </h3>
                        <div className="flex items-center gap-4">
                            <Button
                                variant={userVote === 'up' ? 'default' : 'outline'}
                                onClick={() => handleVote('up')}
                                className={userVote === 'up' ? 'bg-primary text-primary-foreground' : 'border-white/20'}
                                data-testid="upvote-btn"
                            >
                                <ThumbsUp className="w-5 h-5 mr-2" />
                                {fact.upvotes}
                            </Button>
                            <Button
                                variant={userVote === 'down' ? 'default' : 'outline'}
                                onClick={() => handleVote('down')}
                                className={userVote === 'down' ? 'bg-destructive text-destructive-foreground' : 'border-white/20'}
                                data-testid="downvote-btn"
                            >
                                <ThumbsDown className="w-5 h-5 mr-2" />
                                {fact.downvotes}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FactDetailPage;
