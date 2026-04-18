import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertTriangle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RedirectPage = () => {
    const { shortCode } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(false);

    useEffect(() => {
        const resolveLink = async () => {
            try {
                const res = await axios.get(`${API}/s/${shortCode}`);
                window.location.href = res.data.target_url;
            } catch (err) {
                console.error("Link resolution failed", err);
                setError(true);
                setTimeout(() => navigate('/'), 3000);
            }
        };

        resolveLink();
    }, [shortCode, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent font-serif">
                <div className="text-center p-8 bg-black/60 border border-[#8A0303]/50 backdrop-blur-md">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[#8A0303]" />
                    <h1 className="text-2xl font-cinzel text-[#D4AF37] mb-2">Dead Link</h1>
                    <p className="text-[#EAE0C8] opacity-70">This path does not exist in the Akashic Record.</p>
                    <p className="text-xs text-[#8A0303] mt-4 uppercase tracking-widest animate-pulse">Redirecting to safe harbor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[#D4AF37]" />
                <p className="font-cinzel text-lg text-[#D4AF37] tracking-widest uppercase animate-pulse">
                    Initiating Sovereign Redirect...
                </p>
            </div>
        </div>
    );
};

export default RedirectPage;