import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { Eye, TrendingUp, AlertTriangle, Shield, Activity, Zap, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InvisibleHandPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvisibleHandData = async () => {
            try {
                const response = await axios.get(`${API}/intel/invisible-hand`);
                setData(response.data.data);
            } catch (error) {
                console.error('Failed to load invisible hand data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvisibleHandData();
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-4 border bg-black/90 border-[#333]">
                    <p className="mb-2 font-bold text-white">{label}</p>
                    <p className="text-[#ff0055]">Narrative Control: {payload[0].value}%</p>
                    <p className="text-[#00ffcc]">Truth Signal: {payload[1].value}%</p>
                    <p className="text-[#FFD700]">Fear Index: {payload[2].value}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0a0a0f' }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border" style={{ borderColor: '#ff0055', backgroundColor: 'rgba(255,0,85,0.1)' }}>
                        <Eye className="w-4 h-4" style={{ color: '#ff0055' }} />
                        <span className="text-xs uppercase tracking-widest" style={{ color: '#ff0055' }}>Global Narrative Monitor</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#fff' }}>
                        THE INVISIBLE HAND
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: '#888899' }}>
                        Visualizing the hidden correlation between fear-based news cycles and narrative control.
                    </p>
                </div>

                {/* Main Chart */}
                <div className="p-6 border mb-8" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#fff' }}>
                            <Activity className="w-5 h-5" style={{ color: '#00ffcc' }} />
                            Narrative vs. Truth Signal
                        </h2>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1" style={{ color: '#ff0055' }}>
                                <div className="w-3 h-3 rounded-full bg-[#ff0055]" /> Narrative
                            </span>
                            <span className="flex items-center gap-1" style={{ color: '#00ffcc' }}>
                                <div className="w-3 h-3 rounded-full bg-[#00ffcc]" /> Truth
                            </span>
                            <span className="flex items-center gap-1" style={{ color: '#FFD700' }}>
                                <div className="w-3 h-3 rounded-full bg-[#FFD700]" /> Fear
                            </span>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00ffcc' }} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorNarrative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff0055" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ff0055" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorTruth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area 
                                        type="monotone" 
                                        name="Narrative Control"
                                        dataKey="narrative" 
                                        stroke="#ff0055" 
                                        fillOpacity={1} 
                                        fill="url(#colorNarrative)" 
                                        strokeWidth={2}
                                    />
                                    <Area 
                                        type="monotone" 
                                        name="Truth Signal"
                                        dataKey="truth" 
                                        stroke="#00ffcc" 
                                        fillOpacity={1} 
                                        fill="url(#colorTruth)" 
                                        strokeWidth={2}
                                    />
                                    <Line 
                                        type="step" 
                                        name="Fear Index"
                                        dataKey="fear" 
                                        stroke="#FFD700" 
                                        strokeWidth={1} 
                                        dot={false}
                                        strokeDasharray="5 5"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Analysis Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 border" style={{ backgroundColor: '#15151e', borderColor: '#ff0055' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5" style={{ color: '#ff0055' }} />
                            <h3 className="font-bold text-white">Narrative Spikes</h3>
                        </div>
                        <p className="text-sm text-[#888899]">
                            Spikes in "Narrative Control" consistently align with manufactured fear events. The data shows a 94% correlation.
                        </p>
                    </div>

                    <div className="p-6 border" style={{ backgroundColor: '#15151e', borderColor: '#00ffcc' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5" style={{ color: '#00ffcc' }} />
                            <h3 className="font-bold text-white">Truth Resonance</h3>
                        </div>
                        <p className="text-sm text-[#888899]">
                            The "Truth Signal" is inverse to mainstream volume. Silence often speaks louder than headlines.
                        </p>
                    </div>

                    <div className="p-6 border" style={{ backgroundColor: '#15151e', borderColor: '#FFD700' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5" style={{ color: '#FFD700' }} />
                            <h3 className="font-bold text-white">Prediction Alpha</h3>
                        </div>
                        <p className="text-sm text-[#888899]">
                            By tracking the divergence, we can predict major narrative shifts 48-72 hours in advance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvisibleHandPage;
