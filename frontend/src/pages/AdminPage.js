import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Users, FileText, ThumbsUp, Eye, Share2, TrendingUp, 
    Star, Trash2, Shield, BarChart3, Loader2, ChevronLeft,
    ChevronRight, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [facts, setFacts] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [userPage, setUserPage] = useState(0);
    const [factPage, setFactPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalFacts, setTotalFacts] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        fetchAdminData();
    }, [isAuthenticated, token]);

    const fetchAdminData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            
            const [statsRes, usersRes, factsRes, timelineRes] = await Promise.all([
                axios.get(`${API}/admin/stats`, { headers }),
                axios.get(`${API}/admin/users?limit=10`, { headers }),
                axios.get(`${API}/admin/facts?limit=10`, { headers }),
                axios.get(`${API}/admin/engagement/timeline?days=7`, { headers })
            ]);
            
            setStats(statsRes.data);
            setUsers(usersRes.data.users);
            setTotalUsers(usersRes.data.total);
            setFacts(factsRes.data.facts);
            setTotalFacts(factsRes.data.total);
            setTimeline(timelineRes.data.timeline);
            setIsAdmin(true);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error('Admin access required');
                setIsAdmin(false);
            } else {
                toast.error('Failed to load admin data');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (page) => {
        try {
            const response = await axios.get(`${API}/admin/users?limit=10&skip=${page * 10}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
            setUserPage(page);
        } catch (error) {
            toast.error('Failed to load users');
        }
    };

    const fetchFacts = async (page) => {
        try {
            const response = await axios.get(`${API}/admin/facts?limit=10&skip=${page * 10}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFacts(response.data.facts);
            setFactPage(page);
        } catch (error) {
            toast.error('Failed to load facts');
        }
    };

    const toggleFeature = async (factId) => {
        try {
            const response = await axios.put(`${API}/admin/facts/${factId}/feature`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(response.data.message);
            fetchFacts(factPage);
            fetchAdminData();
        } catch (error) {
            toast.error('Failed to update fact');
        }
    };

    const deleteFact = async (factId) => {
        try {
            await axios.delete(`${API}/admin/facts/${factId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Fact deleted');
            fetchFacts(factPage);
            fetchAdminData();
        } catch (error) {
            toast.error('Failed to delete fact');
        }
    };

    const deleteUser = async (userId) => {
        try {
            await axios.delete(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('User deleted');
            fetchUsers(userPage);
            fetchAdminData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete user');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-card border border-white/10">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
                    <h2 className="font-heading text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">You don't have admin privileges</p>
                    <Button onClick={() => navigate('/')} className="btn-secondary">
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    const maxViews = Math.max(...timeline.map(t => t.views), 1);

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-primary pyramid-icon flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight" data-testid="admin-title">
                            ADMIN <span className="text-primary">PANEL</span>
                        </h1>
                        <p className="text-muted-foreground">Manage your Facts Are Foes platform</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="p-6 bg-card border border-white/10">
                        <Users className="w-6 h-6 text-primary mb-2" />
                        <div className="font-heading text-3xl font-bold">{stats?.total_users || 0}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Users</div>
                    </div>
                    <div className="p-6 bg-card border border-white/10">
                        <FileText className="w-6 h-6 text-secondary mb-2" />
                        <div className="font-heading text-3xl font-bold">{stats?.total_facts || 0}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Facts</div>
                    </div>
                    <div className="p-6 bg-card border border-white/10">
                        <ThumbsUp className="w-6 h-6 text-accent mb-2" />
                        <div className="font-heading text-3xl font-bold">{stats?.total_votes || 0}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Votes</div>
                    </div>
                    <div className="p-6 bg-card border border-white/10">
                        <Eye className="w-6 h-6 text-cyan mb-2" />
                        <div className="font-heading text-3xl font-bold">{stats?.total_views || 0}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Views</div>
                    </div>
                    <div className="p-6 bg-card border border-white/10">
                        <Share2 className="w-6 h-6 text-green-500 mb-2" />
                        <div className="font-heading text-3xl font-bold">{stats?.total_shares || 0}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Shares</div>
                    </div>
                </div>

                {/* Engagement Timeline */}
                <div className="p-6 bg-card border border-white/10 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="font-heading text-xl uppercase tracking-widest">7-Day Engagement</h2>
                    </div>
                    <div className="flex items-end gap-2 h-40">
                        {timeline.map((day, index) => (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex flex-col gap-1">
                                    <div 
                                        className="w-full bg-primary/80 transition-all"
                                        style={{ height: `${(day.views / maxViews) * 100}px` }}
                                        title={`${day.views} views`}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-primary" /> Views
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="facts" className="w-full">
                    <TabsList className="w-full justify-start bg-card border border-white/10 p-1 mb-6">
                        <TabsTrigger 
                            value="facts" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Facts ({totalFacts})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="users" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Users ({totalUsers})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="top" 
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest"
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Top Performing
                        </TabsTrigger>
                    </TabsList>

                    {/* Facts Tab */}
                    <TabsContent value="facts">
                        <div className="bg-card border border-white/10 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/20">
                                    <tr>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Title</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Category</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Author</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Votes</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facts.map((fact) => (
                                        <tr key={fact.id} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="p-4">
                                                <span className="font-medium">{fact.title.slice(0, 40)}{fact.title.length > 40 ? '...' : ''}</span>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="border-primary/30 text-primary uppercase text-xs">
                                                    {fact.category}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{fact.author_username}</td>
                                            <td className="p-4">
                                                <span className="text-green-500">+{fact.upvotes}</span>
                                                <span className="text-muted-foreground mx-1">/</span>
                                                <span className="text-red-500">-{fact.downvotes}</span>
                                            </td>
                                            <td className="p-4">
                                                {fact.is_featured ? (
                                                    <Badge className="bg-accent text-accent-foreground uppercase text-xs">Featured</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground uppercase text-xs">Normal</Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toggleFeature(fact.id)}
                                                        className="border-white/20 hover:border-primary"
                                                        data-testid={`feature-${fact.id}`}
                                                    >
                                                        <Star className={`w-4 h-4 ${fact.is_featured ? 'fill-primary text-primary' : ''}`} />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                                                data-testid={`delete-fact-${fact.id}`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-card border-white/10">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="font-heading">Delete Fact?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete "{fact.title}" and all its votes.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="border-white/20">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction 
                                                                    onClick={() => deleteFact(fact.id)}
                                                                    className="bg-destructive text-destructive-foreground"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between p-4 border-t border-white/5">
                                <span className="text-sm text-muted-foreground">
                                    Showing {factPage * 10 + 1}-{Math.min((factPage + 1) * 10, totalFacts)} of {totalFacts}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchFacts(factPage - 1)}
                                        disabled={factPage === 0}
                                        className="border-white/20"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchFacts(factPage + 1)}
                                        disabled={(factPage + 1) * 10 >= totalFacts}
                                        className="border-white/20"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <div className="bg-card border border-white/10 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/20">
                                    <tr>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">User</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Email</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Joined</th>
                                        <th className="text-left p-4 text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatar_url} alt={user.username} className="w-8 h-8" />
                                                    <span className="font-medium">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground">{user.email}</td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                                            data-testid={`delete-user-${user.id}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-card border-white/10">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="font-heading flex items-center gap-2">
                                                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                                                Delete User?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete {user.username} and ALL their submitted facts.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="border-white/20">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => deleteUser(user.id)}
                                                                className="bg-destructive text-destructive-foreground"
                                                            >
                                                                Delete User
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between p-4 border-t border-white/5">
                                <span className="text-sm text-muted-foreground">
                                    Showing {userPage * 10 + 1}-{Math.min((userPage + 1) * 10, totalUsers)} of {totalUsers}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchUsers(userPage - 1)}
                                        disabled={userPage === 0}
                                        className="border-white/20"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchUsers(userPage + 1)}
                                        disabled={(userPage + 1) * 10 >= totalUsers}
                                        className="border-white/20"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Top Performing Tab */}
                    <TabsContent value="top">
                        <div className="space-y-6">
                            {/* Top row - Top Facts and Category Distribution side by side on desktop */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Top Facts */}
                                <div className="bg-card border border-white/10 p-6">
                                    <h3 className="font-heading text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        Top Facts by Upvotes
                                    </h3>
                                    <div className="space-y-4">
                                        {stats?.top_facts?.map((fact, index) => (
                                            <div key={fact.id} className="flex items-center gap-4 p-3 bg-muted/10 border border-white/5">
                                                <span className="font-heading text-2xl text-primary">#{index + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{fact.title}</div>
                                                    <div className="text-sm text-muted-foreground">{fact.author_username}</div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="font-bold text-green-500">+{fact.upvotes}</div>
                                                    <div className="text-xs text-muted-foreground">{fact.category}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Category Distribution */}
                                <div className="bg-card border border-white/10 p-6">
                                    <h3 className="font-heading text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-secondary" />
                                        Facts by Category
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(stats?.category_stats || {}).map(([category, count]) => (
                                            <div key={category} className="flex items-center gap-4">
                                                <span className="w-28 text-sm uppercase tracking-widest text-muted-foreground truncate">{category}</span>
                                                <div className="flex-1 h-6 bg-muted/20 overflow-hidden min-w-[100px]">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-primary to-secondary"
                                                        style={{ width: `${(count / Math.max(...Object.values(stats?.category_stats || {1:1}))) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-sm w-8 text-right">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity - Full width */}
                            <div className="bg-card border border-white/10 p-6">
                                <h3 className="font-heading text-lg uppercase tracking-widest mb-4">
                                    Last 7 Days Activity
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-muted/10 border border-white/5 text-center">
                                        <div className="font-heading text-2xl text-primary">{stats?.recent_facts || 0}</div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">New Facts</div>
                                    </div>
                                    <div className="p-4 bg-muted/10 border border-white/5 text-center">
                                        <div className="font-heading text-2xl text-secondary">{stats?.recent_users || 0}</div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">New Users</div>
                                    </div>
                                    <div className="p-4 bg-muted/10 border border-white/5 text-center">
                                        <div className="font-heading text-2xl text-cyan">
                                            {timeline.reduce((sum, d) => sum + d.views, 0)}
                                        </div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Total Views</div>
                                    </div>
                                    <div className="p-4 bg-muted/10 border border-white/5 text-center">
                                        <div className="font-heading text-2xl text-green-500">
                                            {timeline.reduce((sum, d) => sum + d.shares, 0)}
                                        </div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">Total Shares</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminPage;
