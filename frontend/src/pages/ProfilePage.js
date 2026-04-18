import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, ThumbsUp, ThumbsDown, FileText, Calendar, Loader2, Link as LinkIcon, Activity, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import FactCard from '../components/FactCard';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, token } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userFacts, setUserFacts] = useState([]);
    const [stats, setStats] = useState({ total_facts: 0, total_upvotes: 0, total_downvotes: 0 });
    const [loading, setLoading] = useState(true);

    // Sovereign links state
    const [links, setLinks] = useState([]);
    const [newShortCode, setNewShortCode] = useState('');
    const [newTargetUrl, setNewTargetUrl] = useState('');
    const [creatingLink, setCreatingLink] = useState(false);

    // Radar chart state
    const [radarData, setRadarData] = useState([]);

    const targetUserId = userId || user?.id;
    const isOwnProfile = !userId || userId === user?.id;

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
            if (isOwnProfile) {
                setProfileUser(user);
            }

            const headers = isAuthenticated ? { Authorization: `Bearer ${token}` } : {};

            const [factsRes, statsRes] = await Promise.all([
                axios.get(`${API}/users/${targetUserId}/facts`),
                axios.get(`${API}/users/${targetUserId}/stats`)
            ]);

            setUserFacts(factsRes.data);
            setStats(statsRes.data);

            if (isOwnProfile && (user?.tier === 'sovereign' || user?.is_admin)) {
                const [linksRes, radarRes] = await Promise.all([
                    axios.get(`${API}/links/my-links`, { headers }),
                    axios.get(`${API}/intel/project-thyself`, { headers })
                ]);
                setLinks(linksRes.data);
                setRadarData(radarRes.data.data);
            } else if (isOwnProfile) {
                const radarRes = await axios.get(`${API}/intel/project-thyself`, { headers });
                setRadarData(radarRes.data.data);
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLink = async (e) => {
        e.preventDefault();
        if (!newShortCode || !newTargetUrl) return;

        setCreatingLink(true);
        try {
            const res = await axios.post(`${API}/links`, {
                short_code: newShortCode,
                target_url: newTargetUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinks([res.data, ...links]);
            setNewShortCode('');
            setNewTargetUrl('');
            toast.success("Sovereign Link forged.");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to forge link.");
        } finally {
            setCreatingLink(false);
        }
    };

    const handleDeleteLink = async (linkId) => {
        try {
            await axios.delete(`${API}/links/${linkId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinks(links.filter(l => l.id !== linkId));
            toast.success("Link dissolved.");
        } catch (error) {
            toast.error("Failed to dissolve link.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            </div>
        );
    }

    const displayUser = profileUser || user;
    const isSovereign = isOwnProfile && (user?.tier === 'sovereign' || user?.is_admin);

    return (
        <div className="min-h-screen py-12 px-6 bg-transparent font-serif text-[#EAE0C8]">
            <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 p-8 bg-black/60 border border-[#D4AF37]/30 backdrop-blur-md shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <img 
                            src={displayUser?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${displayUser?.username}`}
                            alt={displayUser?.username}
                            className="w-32 h-32 border-2 border-[#D4AF37] glow-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                            data-testid="profile-avatar"
                        />
                        {displayUser?.tier === 'sovereign' && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-3 py-1 text-xs font-heading font-bold tracking-widest uppercase">
                                Sovereign
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mb-2 text-[#D4AF37]" data-testid="profile-username">
                            {displayUser?.username}
                        </h1>
                        <p className="text-[#EAE0C8]/60 flex items-center justify-center md:justify-start gap-2 mb-6 text-sm">
                            <Calendar className="w-4 h-4" />
                            Initiated {new Date(displayUser?.created_at || Date.now()).toLocaleDateString()}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 border-t border-[#D4AF37]/20 pt-6 mt-6">
                            <div className="text-center md:text-left">
                                <div className="font-heading text-3xl font-bold text-[#EAE0C8]">{stats.total_facts}</div>
                                <div className="text-xs uppercase tracking-widest text-[#D4AF37] flex items-center justify-center md:justify-start gap-1 mt-1">
                                    <FileText className="w-3 h-3" />
                                    Akashic Records
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="font-heading text-3xl font-bold text-[#00ffcc]">{stats.total_upvotes}</div>
                                <div className="text-xs uppercase tracking-widest text-[#D4AF37] flex items-center justify-center md:justify-start gap-1 mt-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    Resonance
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="font-heading text-3xl font-bold text-[#8A0303]">{stats.total_downvotes}</div>
                                <div className="text-xs uppercase tracking-widest text-[#D4AF37] flex items-center justify-center md:justify-start gap-1 mt-1">
                                    <ThumbsDown className="w-3 h-3" />
                                    Dissonance
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="submissions" className="w-full">
                    <TabsList className="w-full justify-start bg-black/40 border border-[#D4AF37]/20 p-1 mb-8 rounded-none overflow-x-auto overflow-y-hidden">
                        <TabsTrigger 
                            value="submissions" 
                            className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black uppercase tracking-widest font-heading rounded-none"
                            data-testid="submissions-tab"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Archive ({userFacts.length})
                        </TabsTrigger>
                        
                        {isOwnProfile && (
                            <TabsTrigger 
                                value="alchemy" 
                                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black uppercase tracking-widest font-heading rounded-none"
                            >
                                <Activity className="w-4 h-4 mr-2" />
                                Cognitive Alchemy
                            </TabsTrigger>
                        )}

                        {isSovereign && (
                            <TabsTrigger 
                                value="links" 
                                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black uppercase tracking-widest font-heading rounded-none"
                            >
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Sovereign Links
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Submissions Content */}
                    <TabsContent value="submissions">
                        {userFacts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-facts-grid">
                                {userFacts.map((fact, index) => (
                                    <FactCard key={fact.id} fact={fact} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-black/40 border border-[#D4AF37]/20 backdrop-blur-sm">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30">
                                    <User className="w-8 h-8 text-[#D4AF37]/50" />
                                </div>
                                <h3 className="font-heading text-xl font-bold mb-2 text-[#D4AF37]">The Archive is Empty</h3>
                                <p className="text-[#EAE0C8]/60">
                                    Begin transcribing truths to build your legacy.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Cognitive Alchemy Content */}
                    {isOwnProfile && (
                        <TabsContent value="alchemy">
                            <div className="bg-black/60 border border-[#D4AF37]/30 p-8 backdrop-blur-md">
                                <h2 className="font-heading text-2xl text-[#D4AF37] mb-6 flex items-center gap-2">
                                    <Activity className="w-6 h-6" /> Your Alchemy Profile
                                </h2>
                                <div className="h-96 w-full relative">
                                    {radarData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                <PolarGrid stroke="#D4AF37" strokeOpacity={0.2} />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#EAE0C8', fontSize: 12, fontFamily: 'Cinzel' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar 
                                                    name="Resilience" 
                                                    dataKey="A" 
                                                    stroke="#D4AF37" 
                                                    fill="#D4AF37" 
                                                    fillOpacity={0.4} 
                                                />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#05050A', borderColor: '#D4AF37', color: '#FFF8D6' }}
                                                    itemStyle={{ color: '#FFF8D6' }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-[#D4AF37]/50 font-heading">
                                            Calibrating Resonance...
                                        </div>
                                    )}
                                </div>
                                <p className="text-center text-sm text-[#EAE0C8]/50 mt-4 italic">
                                    Your resistance against narrative manipulation across five vectors.
                                </p>
                            </div>
                        </TabsContent>
                    )}

                    {/* Sovereign Links Content */}
                    {isSovereign && (
                        <TabsContent value="links">
                            <div className="grid md:grid-cols-3 gap-8">
                                {/* Create Form */}
                                <div className="md:col-span-1 bg-black/60 border border-[#D4AF37]/30 p-6 backdrop-blur-md h-fit">
                                    <h2 className="font-heading text-xl text-[#D4AF37] mb-4 flex items-center gap-2">
                                        <Plus className="w-5 h-5" /> Forge Link
                                    </h2>
                                    <form onSubmit={handleCreateLink} className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Short Code</label>
                                            <div className="flex items-center">
                                                <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 border-r-0 px-3 h-12 flex items-center text-[#EAE0C8]/60 font-mono text-sm">
                                                    /s/
                                                </span>
                                                <input
                                                    type="text"
                                                    value={newShortCode}
                                                    onChange={(e) => setNewShortCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                                    placeholder="awaken"
                                                    className="flex-1 input-dark rounded-none border-l-0"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Target URL</label>
                                            <input
                                                type="url"
                                                value={newTargetUrl}
                                                onChange={(e) => setNewTargetUrl(e.target.value)}
                                                placeholder="https://example.com/truth"
                                                className="w-full input-dark rounded-none"
                                                required
                                            />
                                        </div>
                                        <Button 
                                            type="submit" 
                                            disabled={creatingLink}
                                            className="w-full bg-[#D4AF37] text-black hover:bg-transparent hover:text-[#D4AF37] border border-[#D4AF37] transition-all font-heading uppercase tracking-widest"
                                        >
                                            {creatingLink ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Forge Redirect'}
                                        </Button>
                                    </form>
                                </div>

                                {/* Link List */}
                                <div className="md:col-span-2 space-y-4">
                                    {links.length === 0 ? (
                                        <div className="text-center py-12 border border-[#D4AF37]/20 bg-black/40 backdrop-blur-sm text-[#EAE0C8]/60">
                                            No links forged yet.
                                        </div>
                                    ) : (
                                        links.map(link => (
                                            <div key={link.id} className="p-4 border border-[#D4AF37]/30 bg-black/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="overflow-hidden flex-1 w-full">
                                                    <a 
                                                        href={`${window.location.origin}/s/${link.short_code}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-heading text-lg text-[#D4AF37] hover:underline flex items-center gap-2 mb-1"
                                                    >
                                                        /s/{link.short_code}
                                                    </a>
                                                    <p className="text-sm text-[#EAE0C8]/60 truncate" title={link.target_url}>
                                                        &rarr; {link.target_url}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-[#D4AF37]/20 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                                                    <div className="text-center">
                                                        <div className="font-heading text-2xl text-[#00ffcc]">{link.clicks}</div>
                                                        <div className="text-[10px] uppercase tracking-widest text-[#EAE0C8]/50">Clicks</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteLink(link.id)}
                                                        className="p-2 text-[#8A0303] hover:bg-[#8A0303]/10 hover:text-[#ff3333] transition-colors rounded-full ml-auto"
                                                        title="Dissolve Link"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
};

export default ProfilePage;