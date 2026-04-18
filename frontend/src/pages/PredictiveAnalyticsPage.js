import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Eye, AlertTriangle, TrendingUp, Zap, RefreshCw, Clock, 
    Shield, Lock, ChevronRight, Loader2, ExternalLink, Brain, Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PredictiveAnalyticsPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();
    const [newsItems, setNewsItems] = useState([]);
    const [anarchyData, setAnarchyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAnarchy, setLoadingAnarchy] = useState(true);
    const [generating, setGenerating] = useState(null);
    const [foeResponses, setFoeResponses] = useState({});

    useEffect(() => {
        fetchNews();
        fetchAnarchyArithmetic();
    }, []);

    const fetchAnarchyArithmetic = async () => {
        setLoadingAnarchy(true);
        try {
            const response = await axios.get(`${API}/intel/anarchy-arithmetic`);
            setAnarchyData(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch Anarchy Arithmetic:', error);
        } finally {
            setLoadingAnarchy(false);
        }
    };

    const fetchNews = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API}/intel/news`);
            setNewsItems(response.data.articles || []);
        } catch (error) {
            console.error('Failed to fetch news:', error);
            toast.error('Failed to load intelligence feed');
        } finally {
            setLoading(false);
        }
    };

    const generateFoeResponse = async (article, index) => {
        if (!isAuthenticated) {
            toast.error('Login required to generate Foe Responses');
            return;
        }

        setGenerating(index);
        try {
            const response = await axios.post(`${API}/intel/generate-foe-response`, {
                headline: article.title,
                description: article.description,
                source: article.source
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setFoeResponses(prev => ({
                ...prev,
                [index]: response.data.foe_response
            }));
            toast.success('Counter-narrative generated');
        } catch (error) {
            toast.error('Failed to generate response');
        } finally {
            setGenerating(null);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            politics: 'bg-red-500/20 text-red-400 border-red-500/30',
            technology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            science: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            business: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            health: 'bg-green-500/20 text-green-400 border-green-500/30',
            default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return colors[category?.toLowerCase()] || colors.default;
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0a0a0f' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border" style={{ borderColor: '#ff0055', backgroundColor: 'rgba(255,0,85,0.1)' }}>
                        <Eye className="w-4 h-4" style={{ color: '#ff0055' }} />
                        <span className="text-xs uppercase tracking-widest" style={{ color: '#ff0055' }}>Intelligence Division</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#00ffcc' }} data-testid="analytics-title">
                        PREDICTIVE ANALYTICS
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: '#888899' }}>
                        Monitor mainstream narratives. Generate counter-intelligence before the masses even see the headlines.
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Active Feeds', value: '47', icon: TrendingUp },
                        { label: 'Narratives Tracked', value: newsItems.length, icon: Eye },
                        { label: 'Foe Responses', value: Object.keys(foeResponses).length, icon: Zap },
                        { label: 'Prediction Accuracy', value: '94%', icon: Brain }
                    ].map((stat, i) => (
                        <div key={i} className="p-4 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                            <stat.icon className="w-5 h-5 mb-2" style={{ color: '#00ffcc' }} />
                            <div className="text-2xl font-bold" style={{ color: '#fff' }}>{stat.value}</div>
                            <div className="text-xs uppercase tracking-widest" style={{ color: '#888899' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Anarchy Arithmetic Data Visualization */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ color: '#fff' }}>
                        <Activity className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                        The Anarchy Arithmetic Index
                    </h2>
                    <div className="p-6 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                        {loadingAnarchy ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#8b5cf6' }} />
                            </div>
                        ) : (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={anarchyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorStability" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorDissonance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff0055" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ff0055" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="time" stroke="#888899" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888899" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#15151e', borderColor: '#333', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Area 
                                            type="monotone" 
                                            name="Narrative Stability"
                                            dataKey="narrative_stability" 
                                            stroke="#00ffcc" 
                                            fillOpacity={1} 
                                            fill="url(#colorStability)" 
                                            strokeWidth={2}
                                        />
                                        <Area 
                                            type="monotone" 
                                            name="Cognitive Dissonance"
                                            dataKey="cognitive_dissonance" 
                                            stroke="#ff0055" 
                                            fillOpacity={1} 
                                            fill="url(#colorDissonance)" 
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <p className="text-xs text-center mt-4 uppercase tracking-widest" style={{ color: '#888899' }}>
                            Anarchy Arithmetic mapping the degradation of mainstream narrative control over the last 24 hours.
                        </p>
                    </div>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#fff' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: '#ff0055' }} />
                        Mainstream Narrative Feed
                    </h2>
                    <Button 
                        onClick={fetchNews} 
                        disabled={loading}
                        className="gap-2"
                        style={{ backgroundColor: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc' }}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Feed
                    </Button>
                </div>

                {/* News Feed */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00ffcc' }} />
                    </div>
                ) : (
                    <div className="space-y-4" data-testid="news-feed">
                        {newsItems.map((article, index) => (
                            <div 
                                key={index}
                                className="p-6 border transition-all hover:border-opacity-50"
                                style={{ 
                                    backgroundColor: '#15151e', 
                                    borderColor: foeResponses[index] ? '#00ffcc' : '#333'
                                }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className={getCategoryColor(article.category)}>
                                                {article.category || 'General'}
                                            </Badge>
                                            <span className="text-xs flex items-center gap-1" style={{ color: '#666' }}>
                                                <Clock className="w-3 h-3" />
                                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent'}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-lg font-bold mb-2" style={{ color: '#fff' }}>
                                            {article.title}
                                        </h3>
                                        
                                        <p className="text-sm mb-3" style={{ color: '#888899' }}>
                                            {article.description}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-xs" style={{ color: '#666' }}>
                                            <span>Source: {article.source}</span>
                                            {article.url && (
                                                <a 
                                                    href={article.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 hover:underline"
                                                    style={{ color: '#00ffcc' }}
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    View Original
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={() => generateFoeResponse(article, index)}
                                        disabled={generating === index || foeResponses[index]}
                                        className="shrink-0"
                                        style={{ 
                                            backgroundColor: foeResponses[index] ? '#15151e' : '#ff0055',
                                            color: foeResponses[index] ? '#00ffcc' : '#fff',
                                            border: foeResponses[index] ? '1px solid #00ffcc' : 'none'
                                        }}
                                        data-testid={`generate-foe-${index}`}
                                    >
                                        {generating === index ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : foeResponses[index] ? (
                                            <>
                                                <Shield className="w-4 h-4 mr-2" />
                                                Decoded
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4 mr-2" />
                                                Generate Foe Response
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Foe Response */}
                                {foeResponses[index] && (
                                    <div 
                                        className="mt-4 p-4 border-l-4"
                                        style={{ 
                                            backgroundColor: 'rgba(0,255,204,0.05)',
                                            borderLeftColor: '#00ffcc'
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4" style={{ color: '#00ffcc' }} />
                                            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#00ffcc' }}>
                                                Counter-Narrative Intelligence
                                            </span>
                                        </div>
                                        <p style={{ color: '#e0e0e0' }}>{foeResponses[index]}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="mt-12 p-8 text-center border" style={{ backgroundColor: '#15151e', borderColor: '#ff0055' }}>
                    <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: '#ff0055' }} />
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#fff' }}>
                        Unlock Full Intelligence Access
                    </h3>
                    <p className="mb-6" style={{ color: '#888899' }}>
                        Get 24-hour advance predictions, automated counter-narratives, and exclusive briefings.
                    </p>
                    <Button 
                        onClick={() => navigate('/intel-portal')}
                        className="gap-2"
                        style={{ backgroundColor: '#ff0055', color: '#fff' }}
                    >
                        Enter the Intel Portal
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PredictiveAnalyticsPage;
