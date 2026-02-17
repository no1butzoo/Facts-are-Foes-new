import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, Crown, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser, token } = useAuth();
    const [status, setStatus] = useState('checking'); // checking, success, error
    const [message, setMessage] = useState('');
    
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (sessionId && token) {
            checkSubscriptionStatus();
        } else if (!token) {
            setStatus('error');
            setMessage('Please log in to complete subscription');
        } else {
            setStatus('error');
            setMessage('Invalid session');
        }
    }, [sessionId, token]);

    const checkSubscriptionStatus = async () => {
        try {
            const response = await axios.get(`${API}/subscription/status/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.payment_status === 'paid') {
                setStatus('success');
                setMessage('Your premium subscription is now active!');
                await refreshUser();
            } else {
                setStatus('error');
                setMessage('Payment not completed. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.detail || 'Failed to verify subscription');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full p-8 bg-card border border-white/10 text-center">
                {status === 'checking' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
                        <h1 className="font-heading text-2xl font-bold mb-2">Processing Payment</h1>
                        <p className="text-muted-foreground">Please wait while we confirm your subscription...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center glow-gold">
                            <Crown className="w-12 h-12 text-primary" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold mb-2 text-primary">Welcome to Premium!</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        
                        <div className="p-4 bg-muted/10 border border-white/5 mb-6 text-left">
                            <h3 className="font-heading text-sm uppercase tracking-widest text-primary mb-3">Your Benefits:</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Unlimited AI explanations
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Ad-free experience
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Early access to new myths
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Premium badge on profile
                                </li>
                            </ul>
                        </div>
                        
                        <Button onClick={() => navigate('/explore')} className="btn-primary w-full gap-2">
                            Start Exploring
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 bg-destructive/20 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <h1 className="font-heading text-2xl font-bold mb-2 text-destructive">Subscription Failed</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <div className="flex gap-4">
                            <Button onClick={() => navigate('/')} variant="outline" className="flex-1 btn-secondary">
                                Back to Home
                            </Button>
                            <Link to="/#pricing" className="flex-1">
                                <Button className="w-full btn-primary">Try Again</Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const SubscriptionCancelPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full p-8 bg-card border border-white/10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-muted/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="font-heading text-2xl font-bold mb-2">Subscription Cancelled</h1>
                <p className="text-muted-foreground mb-6">
                    No worries! You can subscribe anytime to unlock premium features.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => navigate('/')} variant="outline" className="flex-1 btn-secondary">
                        Back to Home
                    </Button>
                    <Button onClick={() => navigate('/#pricing')} className="flex-1 btn-primary">
                        View Plans
                    </Button>
                </div>
            </div>
        </div>
    );
};

export { SubscriptionSuccessPage, SubscriptionCancelPage };
