import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import { 
    Crown, Lock, Eye, Zap, BookOpen, ChevronRight, 
    Star, Flame, Diamond, Sparkles, Shield, Loader2, User
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProjectThyselfPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, token } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('register');
    const [expandedFormula, setExpandedFormula] = useState(null);
    const [radarData, setRadarData] = useState([]);
    const [loadingRadar, setLoadingRadar] = useState(true);

    useEffect(() => {
        const fetchRadarData = async () => {
            setLoadingRadar(true);
            try {
                const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API}/intel/project-thyself`, { headers });
                setRadarData(response.data.data);
            } catch (error) {
                console.error("Failed to load radar data:", error);
            } finally {
                setLoadingRadar(false);
            }
        };
        fetchRadarData();
    }, [isAuthenticated, token]);

    const formulas = [
        {
            id: 1,
            title: "The Observer Protocol",
            subtitle: "From Reaction to Response",
            icon: Eye,
            color: "#00ffcc",
            preview: "Learn to witness your thoughts without becoming them. The first step to narrative sovereignty.",
            locked: false
        },
        {
            id: 2,
            title: "The Polarity Transmutation",
            subtitle: "Converting Mental Poverty",
            icon: Flame,
            color: "#ff0055",
            preview: "Every limiting belief contains its opposite truth. Extract gold from the lead of conditioning.",
            locked: true
        },
        {
            id: 3,
            title: "The Frequency Lock",
            subtitle: "Immunity to Manipulation",
            icon: Shield,
            color: "#FFD700",
            preview: "Build an energetic firewall against narrative hijacking. Become untouchable to fear-based programming.",
            locked: true
        },
        {
            id: 4,
            title: "The Reality Architect",
            subtitle: "Conscious World-Building",
            icon: Diamond,
            color: "#9333ea",
            preview: "Move from consumer to creator. Design the narrative you wish to inhabit.",
            locked: true
        },
        {
            id: 5,
            title: "The Sovereign Integration",
            subtitle: "The Final Synthesis",
            icon: Crown,
            color: "#00ffcc",
            preview: "Merge all formulas into a unified operating system. Become the author of your experience.",
            locked: true
        }
    ];

    const handleAccess = (formula) => {
        if (formula.locked) {
            if (!isAuthenticated) {
                setShowAuthModal(true);
            } else {
                navigate('/intel-portal');
            }
        } else {
            setExpandedFormula(expandedFormula === formula.id ? null : formula.id);
        }
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0a0a0f' }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border" style={{ borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' }}>
                        <Crown className="w-4 h-4" style={{ color: '#FFD700' }} />
                        <span className="text-xs uppercase tracking-widest" style={{ color: '#FFD700' }}>Premium Alchemical Content</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="thyself-title">
                        <span style={{ color: '#FFD700' }}>PROJECT:</span>
                        <span style={{ color: '#fff' }}> THYSELF</span>
                    </h1>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: '#888899' }}>
                        The specific alchemical formulas for turning Mental Poverty into Narrative Wealth.
                    </p>
                </div>

                {/* Cognitive Alchemy Radar */}
                <div className="mb-12 p-8 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#fff' }}>
                            <User className="w-5 h-5" style={{ color: '#9333ea' }} />
                            Your Cognitive Alchemy Profile
                        </h2>
                        {!isAuthenticated && (
                            <Badge style={{ backgroundColor: '#ff005520', color: '#ff0055', border: '1px solid #ff0055' }}>
                                Uncalibrated
                            </Badge>
                        )}
                    </div>
                    
                    <div className="h-80 w-full relative">
                        {loadingRadar ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#9333ea' }} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888899', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar 
                                        name="Alchemy Level" 
                                        dataKey="A" 
                                        stroke="#9333ea" 
                                        fill="#9333ea" 
                                        fillOpacity={0.5} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#15151e', borderColor: '#333', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                        {!isAuthenticated && !loadingRadar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <div className="text-center">
                                    <Lock className="w-8 h-8 mx-auto mb-2" style={{ color: '#ff0055' }} />
                                    <p className="text-white font-bold mb-2">Profile Locked</p>
                                    <Button 
                                        size="sm" 
                                        onClick={() => setShowAuthModal(true)}
                                        style={{ backgroundColor: '#ff0055', color: '#fff' }}
                                    >
                                        Login to Calibrate
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-center mt-6 text-[#888899] uppercase tracking-widest">
                        Values represent your resilience against psychological manipulation.
                    </p>
                </div>

                {/* Progress Path */}
                <div className="relative mb-12">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5" style={{ backgroundColor: '#333' }} />
                    
                    <div className="space-y-6">
                        {formulas.map((formula, index) => (
                            <div 
                                key={formula.id}
                                className="relative pl-20"
                            >
                                {/* Node */}
                                <div 
                                    className="absolute left-4 w-8 h-8 flex items-center justify-center border-2 z-10"
                                    style={{ 
                                        backgroundColor: '#0a0a0f',
                                        borderColor: formula.locked ? '#333' : formula.color
                                    }}
                                >
                                    {formula.locked ? (
                                        <Lock className="w-4 h-4" style={{ color: '#666' }} />
                                    ) : (
                                        <formula.icon className="w-4 h-4" style={{ color: formula.color }} />
                                    )}
                                </div>

                                {/* Card */}
                                <div 
                                    className={`p-6 border cursor-pointer transition-all ${formula.locked ? 'opacity-60' : ''}`}
                                    style={{ 
                                        backgroundColor: '#15151e',
                                        borderColor: expandedFormula === formula.id ? formula.color : '#333'
                                    }}
                                    onClick={() => handleAccess(formula)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge 
                                                    style={{ 
                                                        backgroundColor: `${formula.color}20`,
                                                        color: formula.color,
                                                        border: `1px solid ${formula.color}40`
                                                    }}
                                                >
                                                    Formula {formula.id}
                                                </Badge>
                                                {formula.locked && (
                                                    <Badge style={{ backgroundColor: '#333', color: '#666' }}>
                                                        <Lock className="w-3 h-3 mr-1" />
                                                        Requires Portal Access
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-xl font-bold mb-1" style={{ color: formula.locked ? '#666' : '#fff' }}>
                                                {formula.title}
                                            </h3>
                                            <p className="text-sm" style={{ color: '#888899' }}>
                                                {formula.subtitle}
                                            </p>
                                        </div>

                                        <ChevronRight 
                                            className={`w-6 h-6 transition-transform ${expandedFormula === formula.id ? 'rotate-90' : ''}`}
                                            style={{ color: formula.locked ? '#333' : formula.color }}
                                        />
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedFormula === formula.id && !formula.locked && (
                                        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#333' }}>
                                            <p className="mb-4" style={{ color: '#e0e0e0' }}>{formula.preview}</p>
                                            <div className="p-4 border" style={{ backgroundColor: '#0a0a0f', borderColor: formula.color, borderStyle: 'dashed' }}>
                                                <h4 className="font-bold mb-2 flex items-center gap-2" style={{ color: formula.color }}>
                                                    <BookOpen className="w-4 h-4" />
                                                    Core Teaching
                                                </h4>
                                                <p className="text-sm" style={{ color: '#888899' }}>
                                                    You are not your thoughts. You are not the narrative. You are the awareness 
                                                    in which all narratives arise. When you identify with a "fact," you become 
                                                    imprisoned by it. When you observe a "fact," you remain free to use it—or not.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="p-8 border text-center" style={{ backgroundColor: '#15151e', borderColor: '#FFD700' }}>
                    <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#FFD700' }} />
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#fff' }}>
                        Unlock All 5 Alchemical Formulas
                    </h3>
                    <p className="mb-6" style={{ color: '#888899' }}>
                        Full access to Project: Thyself is included with Intelligence Portal membership.
                    </p>
                    <Button
                        onClick={() => navigate('/intel-portal')}
                        className="gap-2"
                        style={{ backgroundColor: '#FFD700', color: '#0a0a0f' }}
                    >
                        <Crown className="w-4 h-4" />
                        Access Intelligence Portal - $18/month
                    </Button>
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
};

export default ProjectThyselfPage;
