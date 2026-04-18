import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NetworkPingWidget = () => {
    const { isAuthenticated, isPremium, user } = useAuth();
    const [lastChecked, setLastChecked] = useState(new Date().toISOString());

    useEffect(() => {
        // Only ping for paid users or admins
        if (!isAuthenticated || (!isPremium && user?.tier !== 'sovereign' && !user?.is_admin)) {
            return;
        }

        const fetchPings = async () => {
            try {
                const res = await axios.get(`${API}/network/events?since=${encodeURIComponent(lastChecked)}`);
                const events = res.data.events;
                
                if (events && events.length > 0) {
                    // Reverse to show oldest to newest (chronological order)
                    events.reverse().forEach((event, index) => {
                        // Stagger the toasts slightly if multiple
                        setTimeout(() => {
                            const isSub = event.event_type === 'subscription';
                            toast.custom((t) => (
                                <div className="bg-[#05050A]/90 border border-[#D4AF37]/50 p-4 shadow-[0_0_15px_rgba(212,175,55,0.2)] backdrop-blur-md flex items-start gap-3 max-w-sm w-full">
                                    <div className="mt-0.5">
                                        {isSub ? (
                                            <UserPlus className="w-5 h-5 text-[#00ffcc]" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 text-[#FFD700]" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-cinzel text-xs text-[#D4AF37] tracking-widest uppercase mb-1 flex items-center gap-2">
                                            <Activity className="w-3 h-3 animate-pulse" />
                                            Live Node Ping
                                        </p>
                                        <p className="text-sm font-serif text-[#EAE0C8]">{event.message}</p>
                                    </div>
                                </div>
                            ), { duration: 5000 });
                        }, index * 1000);
                    });
                    
                    // Update last checked to the newest event's timestamp
                    setLastChecked(events[events.length - 1].created_at);
                }
            } catch (error) {
                // Silently fail on background polling errors
                console.error('Ping poll failed:', error);
            }
        };

        const interval = setInterval(fetchPings, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [isAuthenticated, isPremium, user, lastChecked]);

    return null; // This component doesn't render anything directly, just spawns toasts
};

export default NetworkPingWidget;