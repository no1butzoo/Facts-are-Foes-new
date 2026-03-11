import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Lock, Shield, Eye, Zap, Crown, Check, Loader2, 
    FileText, Video, Download, Users, Star, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const IntelPortalPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, token, user } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('register');
    const [intelContent, setIntelContent] = useState([]);

    useEffect(() => {
        if (isAuthenticated) {
            checkAccess();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    const checkAccess = async () => {
        try {
            const response = await axios.get(`${API}/intel/access`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasAccess(response.data.has_access);
            if (response.data.has_access) {
                fetchIntelContent();
            }
        } catch (error) {
            console.error('Access check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIntelContent = async () => {
        try {
            const response = await axios.get(`${API}/intel/content`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIntelContent(response.data.content || []);
        } catch (error) {
            console.error('Failed to fetch content:', error);
        }
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            setAuthMode('register');
            setShowAuthModal(true);
            return;
        }

        setCheckoutLoading(true);
        try {
            const response = await axios.post(`${API}/intel/create-checkout`, {
                origin_url: window.location.origin
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = response.data.checkout_url;
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to start checkout');
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ff0055' }} />
            </div>
        );
    }

    // Locked State - Show Subscription
    if (!hasAccess) {
        return (
            <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0a0a0f' }}>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2" style={{ borderColor: '#ff0055', backgroundColor: 'rgba(255,0,85,0.1)' }}>
                            <Lock className="w-10 h-10" style={{ color: '#ff0055' }} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#ff0055' }} data-testid="portal-title">
                            ENCRYPTED INTELLIGENCE PORTAL
                        </h1>
                        <p className="text-lg max-w-xl mx-auto" style={{ color: '#888899' }}>
                            The mainstream can't delete what they can't find. Access the hidden knowledge vault.
                        </p>
                    </div>

                    {/* Subscription Card */}
                    <div className="p-8 border-2 relative" style={{ backgroundColor: '#15151e', borderColor: '#ff0055' }}>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span className="px-4 py-1 text-xs uppercase tracking-widest font-bold flex items-center gap-1" style={{ backgroundColor: '#ff0055', color: '#fff' }}>
                                <Shield className="w-3 h-3" />
                                Sovereign Access
                            </span>
                        </div>

                        <div className="text-center mb-8">
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                <span className="text-5xl font-bold" style={{ color: '#ff0055' }}>$18</span>
                                <span style={{ color: '#888899' }}>/month</span>
                            </div>
                            <p style={{ color: '#666' }}>Billed monthly. Cancel anytime.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {[
                                { icon: Eye, title: '24-Hour Advance Intel', desc: 'See narratives before they hit mainstream' },
                                { icon: Zap, title: 'AI Narrative Disruptor', desc: 'Auto-generated counter-intelligence hooks' },
                                { icon: FileText, title: 'Raw Data Archives', desc: 'Unfiltered research and source documents' },
                                { icon: Video, title: 'Exclusive Briefings', desc: 'Weekly video intel drops' },
                                { icon: Download, title: 'Downloadable Assets', desc: 'High-res graphics and templates' },
                                { icon: Users, title: 'Inner Circle Access', desc: 'Private community of awakened minds' }
                            ].map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <feature.icon className="w-5 h-5 mt-1 shrink-0" style={{ color: '#00ffcc' }} />
                                    <div>
                                        <div className="font-bold" style={{ color: '#fff' }}>{feature.title}</div>
                                        <div className="text-sm" style={{ color: '#888899' }}>{feature.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={handleSubscribe}
                            disabled={checkoutLoading}
                            className="w-full py-6 text-lg font-bold"
                            style={{ backgroundColor: '#ff0055', color: '#fff' }}
                            data-testid="intel-subscribe-btn"
                        >
                            {checkoutLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Lock className="w-5 h-5 mr-2" />
                                    Unlock Intelligence Portal
                                </>
                            )}
                        </Button>

                        <p className="text-center mt-4 text-xs" style={{ color: '#666' }}>
                            🔒 Encrypted checkout. Your data stays sovereign.
                        </p>
                    </div>

                    {/* Testimonials */}
                    <div className="mt-12 grid md:grid-cols-3 gap-4">
                        {[
                            { quote: "I saw the narrative shift 3 days before CNN reported it.", author: "Awakened Observer" },
                            { quote: "The counter-intel hooks changed my entire content strategy.", author: "Digital Sovereign" },
                            { quote: "Finally, a source the algorithms can't suppress.", author: "Truth Seeker" }
                        ].map((testimonial, i) => (
                            <div key={i} className="p-4 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                                <div className="flex gap-1 mb-2">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#ff0055' }} />
                                    ))}
                                </div>
                                <p className="text-sm mb-2" style={{ color: '#e0e0e0' }}>"{testimonial.quote}"</p>
                                <p className="text-xs" style={{ color: '#666' }}>— {testimonial.author}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <AuthModal 
                    isOpen={showAuthModal} 
                    onClose={() => setShowAuthModal(false)}
                    mode={authMode}
                    setMode={setAuthMode}
                />
            </div>
        );
    }

    // Unlocked State - Show Content
    return (
        <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0a0a0f' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Badge className="mb-2" style={{ backgroundColor: '#00ffcc', color: '#0a0a0f' }}>
                            <Shield className="w-3 h-3 mr-1" />
                            Access Granted
                        </Badge>
                        <h1 className="text-3xl font-bold" style={{ color: '#fff' }}>Intelligence Portal</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-sm" style={{ color: '#888899' }}>Welcome back,</div>
                        <div className="font-bold" style={{ color: '#00ffcc' }}>{user?.username}</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Button 
                        onClick={() => navigate('/invisible-hand')}
                        className="h-auto py-4 justify-start gap-3"
                        style={{ backgroundColor: '#15151e', border: '1px solid #333', color: '#fff' }}
                    >
                        <Eye className="w-6 h-6" style={{ color: '#ff0055' }} />
                        <div className="text-left">
                            <div className="font-bold">Invisible Hand</div>
                            <div className="text-xs" style={{ color: '#888899' }}>Narrative Visualization</div>
                        </div>
                    </Button>
                    <Button 
                        onClick={() => navigate('/predictive-analytics')}
                        className="h-auto py-4 justify-start gap-3"
                        style={{ backgroundColor: '#15151e', border: '1px solid #333', color: '#fff' }}
                    >
                        <Eye className="w-6 h-6" style={{ color: '#ff0055' }} />
                        <div className="text-left">
                            <div className="font-bold">Predictive Analytics</div>
                            <div className="text-xs" style={{ color: '#888899' }}>Monitor narrative feeds</div>
                        </div>
                    </Button>
                    <Button 
                        onClick={() => navigate('/frequency-cipher')}
                        className="h-auto py-4 justify-start gap-3"
                        style={{ backgroundColor: '#15151e', border: '1px solid #333', color: '#fff' }}
                    >
                        <Zap className="w-6 h-6" style={{ color: '#00ffcc' }} />
                        <div className="text-left">
                            <div className="font-bold">Frequency Cipher</div>
                            <div className="text-xs" style={{ color: '#888899' }}>Decode your intuition</div>
                        </div>
                    </Button>
                    <Button 
                        onClick={() => navigate('/project-thyself')}
                        className="h-auto py-4 justify-start gap-3"
                        style={{ backgroundColor: '#15151e', border: '1px solid #333', color: '#fff' }}
                    >
                        <Crown className="w-6 h-6" style={{ color: '#FFD700' }} />
                        <div className="text-left">
                            <div className="font-bold">Project: Thyself</div>
                            <div className="text-xs" style={{ color: '#888899' }}>Alchemical formulas</div>
                        </div>
                    </Button>
                </div>

                {/* Content Grid */}
                <h2 className="text-xl font-bold mb-4" style={{ color: '#fff' }}>Latest Intel Drops</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {intelContent.map((item, i) => (
                        <div key={i} className="p-6 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                            <Badge className="mb-3" style={{ backgroundColor: 'rgba(255,0,85,0.2)', color: '#ff0055', border: '1px solid rgba(255,0,85,0.3)' }}>
                                {item.type}
                            </Badge>
                            <h3 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>{item.title}</h3>
                            <p className="text-sm mb-4" style={{ color: '#888899' }}>{item.description}</p>
                            <Button className="gap-2" style={{ backgroundColor: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc' }}>
                                Access Content
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IntelPortalPage;
