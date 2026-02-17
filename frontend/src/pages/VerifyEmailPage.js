import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser, isAuthenticated } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            verifyEmail();
        } else {
            setStatus('error');
            setMessage('No verification token provided');
        }
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await axios.post(`${API}/auth/verify-email`, { token });
            setStatus('success');
            setMessage(response.data.message);
            
            // Refresh user data if logged in
            if (isAuthenticated) {
                await refreshUser();
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.detail || 'Verification failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full p-8 bg-card border border-white/10 text-center">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
                        <h1 className="font-heading text-2xl font-bold mb-2">Verifying Email</h1>
                        <p className="text-muted-foreground">Please wait while we verify your email...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="font-heading text-2xl font-bold mb-2 text-green-500">Email Verified!</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <Button onClick={() => navigate('/')} className="btn-primary">
                            Continue to Home
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 bg-destructive/20 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <h1 className="font-heading text-2xl font-bold mb-2 text-destructive">Verification Failed</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <Button onClick={() => navigate('/')} className="btn-secondary">
                            Back to Home
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
