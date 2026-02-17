import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, ThumbsUp, ThumbsDown, FileText, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import FactCard from '../components/FactCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, token } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userFacts, setUserFacts] = useState([]);
    const [stats, setStats] = useState({ total_facts: 0, total_upvotes: 0, total_downvotes: 0 });
    const [loading, setLoading] = useState(true);

    const targetUserId = userId || user?.id;

    useEffect(() => {
        if (!isAuthenticated && !userId) {
            navigate('/');
            return;
        }

        if (targetUserId) {
            fetchUserData();
        }
    }, [targetUserId, isAuthenticated, userId]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // If viewing own profile
            if (!userId || userId === user?.id) {
                setProfileUser(user);
            }

            const [factsRes, statsRes] = await Promise.all([
                axios.get(`${API}/users/${targetUserId}/facts`),
                axios.get(`${API}/users/${targetUserId}/stats`)
            ]);

            setUserFacts(factsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const displayUser = profileUser || user;

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 p-8 bg-card border border-white/10">
                    {/* Avatar */}
                    <div className="relative">
                        <img 
                            src={displayUser?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${displayUser?.username}`}
                            alt={displayUser?.username}
                            className="w-32 h-32 border-2 border-primary glow-gold"
                            data-testid="profile-avatar"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2" data-testid="profile-username">
                            {displayUser?.username}
                        </h1>
                        <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mb-6">
                            <Calendar className="w-4 h-4" />
                            Seeker since {new Date(displayUser?.created_at || Date.now()).toLocaleDateString()}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center md:text-left">
                                <div className="font-heading text-3xl font-bold text-primary">{stats.total_facts}</div>
                                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                    <FileText className="w-3 h-3" />
                                    Myths
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="font-heading text-3xl font-bold text-secondary">{stats.total_upvotes}</div>
                                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    Upvotes
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="font-heading text-3xl font-bold text-accent">{stats.total_downvotes}</div>
                                <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                                    <ThumbsDown className="w-3 h-3" />
                                    Downvotes
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="submissions" className="w-full">
                    <TabsList className="w-full justify-start bg-card border border-white/10 p-1">
                        <TabsTrigger 
                            value="submissions" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest"
                            data-testid="submissions-tab"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Submissions ({userFacts.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="submissions" className="mt-8">
                        {userFacts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-facts-grid">
                                {userFacts.map((fact, index) => (
                                    <FactCard key={fact.id} fact={fact} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-card border border-white/10">
                                <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 pyramid-icon flex items-center justify-center">
                                    <User className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-heading text-xl font-bold mb-2">No submissions yet</h3>
                                <p className="text-muted-foreground">
                                    Start sharing your knowledge by submitting a myth
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ProfilePage;
