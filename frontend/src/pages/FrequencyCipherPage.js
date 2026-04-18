import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
    Brain, Heart, AlertTriangle, Shield, Zap, RefreshCw,
    CheckCircle, XCircle, ArrowRight, Eye, Lock, Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FrequencyCipherPage = () => {
    const { isAuthenticated, token } = useAuth();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [result, setResult] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [frequencyData, setFrequencyData] = useState([]);

    useEffect(() => {
        const fetchFrequencyData = async () => {
            try {
                const response = await axios.get(`${API}/intel/frequency-cipher`);
                setFrequencyData(response.data.data);
            } catch (error) {
                console.error("Failed to load frequency data:", error);
            }
        };
        fetchFrequencyData();
    }, []);

    const questions = [
        {
            id: 1,
            text: "When you first encounter this information, where do you feel the reaction?",
            optionA: { text: "Tightness in chest, racing thoughts", type: "fear" },
            optionB: { text: "Calm knowing, expanded awareness", type: "intuition" }
        },
        {
            id: 2,
            text: "Does this thought make you want to...",
            optionA: { text: "Defend, argue, or prove something", type: "fear" },
            optionB: { text: "Observe, question, or explore further", type: "intuition" }
        },
        {
            id: 3,
            text: "If you imagine acting on this feeling, you see...",
            optionA: { text: "Conflict, judgment, separation", type: "fear" },
            optionB: { text: "Clarity, alignment, connection", type: "intuition" }
        },
        {
            id: 4,
            text: "The source of this 'fact' makes you feel...",
            optionA: { text: "Obligated to believe or reject", type: "fear" },
            optionB: { text: "Free to discern for yourself", type: "intuition" }
        },
        {
            id: 5,
            text: "When you sit with this quietly, it...",
            optionA: { text: "Gets louder, more urgent, demanding", type: "fear" },
            optionB: { text: "Settles into a quiet certainty", type: "intuition" }
        }
    ];

    const handleAnswer = (type) => {
        const newAnswers = [...answers, type];
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculateResult(newAnswers);
        }
    };

    const calculateResult = async (allAnswers) => {
        const fearCount = allAnswers.filter(a => a === 'fear').length;
        const intuitionCount = allAnswers.filter(a => a === 'intuition').length;
        
        const fearPercentage = (fearCount / allAnswers.length) * 100;
        const intuitionPercentage = (intuitionCount / allAnswers.length) * 100;

        let status, message, color;
        
        if (intuitionPercentage >= 80) {
            status = "SOVEREIGN SIGNAL";
            message = "Your inner compass is calibrated. This guidance comes from your authentic self, not external programming.";
            color = "#00ffcc";
        } else if (intuitionPercentage >= 60) {
            status = "MIXED FREQUENCY";
            message = "Some authentic signal detected, but noise is present. Pause before acting. The truth is there—beneath the static.";
            color = "#FFD700";
        } else if (fearCount >= 60) {
            status = "FACT-CHECKED BY FEAR";
            message = "This response is being filtered through conditioning. The 'facts' are speaking, not your knowing. Return to stillness.";
            color = "#ff0055";
        } else {
            status = "RECALIBRATING";
            message = "The signal is unclear. This is not the moment for action. Wait for resonance.";
            color = "#888899";
        }

        const resultData = {
            status,
            message,
            color,
            fearPercentage,
            intuitionPercentage,
            result_type: status
        };

        setResult(resultData);
        setShowAnalysis(true);

        // Submit to backend if logged in
        if (isAuthenticated) {
            try {
                await axios.post(`${API}/intel/cipher-submit`, {
                    answers: allAnswers,
                    fear_percentage: fearPercentage,
                    intuition_percentage: intuitionPercentage,
                    result_type: status
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Frequency signature archived');
            } catch (error) {
                console.error('Failed to save result:', error);
                toast.error('Failed to archive signature');
            }
        }
    };

    const reset = () => {
        setCurrentQuestion(0);
        setAnswers([]);
        setResult(null);
        setShowAnalysis(false);
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0a0a0f' }}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border" style={{ borderColor: '#00ffcc', backgroundColor: 'rgba(0,255,204,0.1)' }}>
                        <Zap className="w-4 h-4" style={{ color: '#00ffcc' }} />
                        <span className="text-xs uppercase tracking-widest" style={{ color: '#00ffcc' }}>Frequency Analysis Tool</span>
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#00ffcc' }} data-testid="cipher-title">
                        THE FREQUENCY CIPHER
                    </h1>
                    <p className="text-lg max-w-xl mx-auto" style={{ color: '#888899' }}>
                        Decode whether you're being fact-checked by fear or guided by authentic intuition.
                    </p>
                </div>

                {/* Global Frequency Chart */}
                <div className="mb-12 p-6 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6" style={{ color: '#fff' }}>
                        <Activity className="w-5 h-5" style={{ color: '#00ffcc' }} />
                        Global Frequency Radar (Last 7 Days)
                    </h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={frequencyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="day" stroke="#888899" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888899" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#15151e', borderColor: '#333', color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Line 
                                    type="monotone" 
                                    name="Fear (Hz)"
                                    dataKey="fear_hz" 
                                    stroke="#ff0055" 
                                    strokeWidth={2}
                                    dot={{ fill: '#ff0055', strokeWidth: 2 }}
                                />
                                <Line 
                                    type="monotone" 
                                    name="Intuition (Hz)"
                                    dataKey="intuition_hz" 
                                    stroke="#00ffcc" 
                                    strokeWidth={2}
                                    dot={{ fill: '#00ffcc', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {!showAnalysis ? (
                    /* Question Card */
                    <div className="p-8 border" style={{ backgroundColor: '#15151e', borderColor: '#333' }}>
                        {/* Progress */}
                        <div className="flex items-center gap-2 mb-6">
                            {questions.map((_, i) => (
                                <div 
                                    key={i}
                                    className="flex-1 h-1"
                                    style={{ 
                                        backgroundColor: i <= currentQuestion ? '#00ffcc' : '#333'
                                    }}
                                />
                            ))}
                        </div>

                        <div className="text-sm mb-2" style={{ color: '#666' }}>
                            Question {currentQuestion + 1} of {questions.length}
                        </div>

                        <h2 className="text-2xl font-bold mb-8" style={{ color: '#fff' }}>
                            {questions[currentQuestion].text}
                        </h2>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleAnswer(questions[currentQuestion].optionA.type)}
                                className="w-full p-6 text-left border transition-all hover:border-opacity-100"
                                style={{ 
                                    backgroundColor: '#0a0a0f',
                                    borderColor: '#ff0055',
                                    borderOpacity: 0.3
                                }}
                                data-testid="option-a"
                            >
                                <div className="flex items-center gap-4">
                                    <AlertTriangle className="w-6 h-6 shrink-0" style={{ color: '#ff0055' }} />
                                    <span style={{ color: '#e0e0e0' }}>{questions[currentQuestion].optionA.text}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAnswer(questions[currentQuestion].optionB.type)}
                                className="w-full p-6 text-left border transition-all hover:border-opacity-100"
                                style={{ 
                                    backgroundColor: '#0a0a0f',
                                    borderColor: '#00ffcc',
                                    borderOpacity: 0.3
                                }}
                                data-testid="option-b"
                            >
                                <div className="flex items-center gap-4">
                                    <Heart className="w-6 h-6 shrink-0" style={{ color: '#00ffcc' }} />
                                    <span style={{ color: '#e0e0e0' }}>{questions[currentQuestion].optionB.text}</span>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Results */
                    <div className="p-8 border" style={{ backgroundColor: '#15151e', borderColor: result.color }}>
                        <div className="text-center mb-8">
                            <div 
                                className="w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2"
                                style={{ borderColor: result.color }}
                            >
                                {result.intuitionPercentage >= 60 ? (
                                    <Shield className="w-12 h-12" style={{ color: result.color }} />
                                ) : (
                                    <AlertTriangle className="w-12 h-12" style={{ color: result.color }} />
                                )}
                            </div>

                            <Badge 
                                className="mb-4 text-sm px-4 py-1"
                                style={{ backgroundColor: `${result.color}20`, color: result.color, border: `1px solid ${result.color}` }}
                            >
                                {result.status}
                            </Badge>

                            <p className="text-lg" style={{ color: '#e0e0e0' }}>
                                {result.message}
                            </p>
                        </div>

                        {/* Frequency Bars */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm flex items-center gap-2" style={{ color: '#ff0055' }}>
                                        <AlertTriangle className="w-4 h-4" />
                                        Fear Frequency
                                    </span>
                                    <span className="text-sm" style={{ color: '#ff0055' }}>{result.fearPercentage}%</span>
                                </div>
                                <div className="h-3" style={{ backgroundColor: '#1a1a1a' }}>
                                    <div 
                                        className="h-full transition-all"
                                        style={{ width: `${result.fearPercentage}%`, backgroundColor: '#ff0055' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm flex items-center gap-2" style={{ color: '#00ffcc' }}>
                                        <Heart className="w-4 h-4" />
                                        Intuition Frequency
                                    </span>
                                    <span className="text-sm" style={{ color: '#00ffcc' }}>{result.intuitionPercentage}%</span>
                                </div>
                                <div className="h-3" style={{ backgroundColor: '#1a1a1a' }}>
                                    <div 
                                        className="h-full transition-all"
                                        style={{ width: `${result.intuitionPercentage}%`, backgroundColor: '#00ffcc' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                onClick={reset}
                                className="flex-1 gap-2"
                                style={{ backgroundColor: 'transparent', border: '1px solid #666', color: '#888899' }}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Recalibrate
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/intel-portal'}
                                className="flex-1 gap-2"
                                style={{ backgroundColor: '#00ffcc', color: '#0a0a0f' }}
                            >
                                Deeper Analysis
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-8 p-6 border" style={{ backgroundColor: 'rgba(0,255,204,0.05)', borderColor: '#00ffcc', borderStyle: 'dashed' }}>
                    <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#00ffcc' }}>
                        <Brain className="w-5 h-5" />
                        How It Works
                    </h3>
                    <p className="text-sm" style={{ color: '#888899' }}>
                        The Frequency Cipher measures whether your current mental state is being driven by 
                        <span style={{ color: '#ff0055' }}> conditioned fear responses </span>
                        (fight/flight, ego protection, tribal signaling) or 
                        <span style={{ color: '#00ffcc' }}> authentic intuition </span>
                        (calm knowing, expanded awareness, inner alignment). Facts become foes when they 
                        trigger your defense mechanisms instead of your discernment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FrequencyCipherPage;
