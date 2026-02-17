import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Send, Image, Link as LinkIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthModal from '../components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubmitFactPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    
    const [formData, setFormData] = useState({
        title: '',
        false_belief: '',
        truth: '',
        category: '',
        source_url: '',
        image_url: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API}/categories`);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (!formData.title || !formData.false_belief || !formData.truth || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API}/facts`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Myth submitted successfully!');
            navigate(`/fact/${response.data.id}`);
        } catch (error) {
            console.error('Error submitting fact:', error);
            toast.error(error.response?.data?.detail || 'Failed to submit myth');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="submit-title">
                        SUBMIT A <span className="text-primary">MYTH</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Share your knowledge and help uncover facts that turned into foes
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8 p-8 bg-card border border-white/10">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-muted-foreground uppercase tracking-widest text-xs">
                            Title *
                        </Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., The Great Wall Myth"
                            className="bg-black/50 border-white/20 focus:border-primary"
                            required
                            data-testid="title-input"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground uppercase tracking-widest text-xs">
                            Category *
                        </Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger className="bg-black/50 border-white/20" data-testid="category-select">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10">
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* False Belief */}
                    <div className="space-y-2">
                        <Label htmlFor="false_belief" className="text-muted-foreground uppercase tracking-widest text-xs">
                            The Myth (False Belief) *
                        </Label>
                        <Textarea
                            id="false_belief"
                            value={formData.false_belief}
                            onChange={(e) => setFormData({ ...formData, false_belief: e.target.value })}
                            placeholder="What do people commonly believe that is actually false?"
                            className="bg-black/50 border-white/20 focus:border-primary min-h-[120px]"
                            required
                            data-testid="false-belief-input"
                        />
                    </div>

                    {/* Truth */}
                    <div className="space-y-2">
                        <Label htmlFor="truth" className="text-muted-foreground uppercase tracking-widest text-xs">
                            The Truth *
                        </Label>
                        <Textarea
                            id="truth"
                            value={formData.truth}
                            onChange={(e) => setFormData({ ...formData, truth: e.target.value })}
                            placeholder="What is the actual truth? Provide evidence or explanation."
                            className="bg-black/50 border-white/20 focus:border-primary min-h-[120px]"
                            required
                            data-testid="truth-input"
                        />
                    </div>

                    {/* Image URL */}
                    <div className="space-y-2">
                        <Label htmlFor="image_url" className="text-muted-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Image URL (Optional)
                        </Label>
                        <Input
                            id="image_url"
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="bg-black/50 border-white/20 focus:border-primary"
                            data-testid="image-url-input"
                        />
                    </div>

                    {/* Source URL */}
                    <div className="space-y-2">
                        <Label htmlFor="source_url" className="text-muted-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Source URL (Optional)
                        </Label>
                        <Input
                            id="source_url"
                            type="url"
                            value={formData.source_url}
                            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                            placeholder="https://example.com/source"
                            className="bg-black/50 border-white/20 focus:border-primary"
                            data-testid="source-url-input"
                        />
                    </div>

                    {/* Submit */}
                    <Button 
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary"
                        data-testid="submit-btn"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Submit Myth
                            </>
                        )}
                    </Button>
                </form>

                {/* Guidelines */}
                <div className="mt-8 p-6 bg-muted/10 border border-white/5">
                    <h3 className="font-heading text-lg uppercase tracking-widest text-muted-foreground mb-4">
                        Submission Guidelines
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Ensure the myth is a widely believed misconception</li>
                        <li>• Provide accurate, verifiable truth with sources when possible</li>
                        <li>• Be respectful and factual in your submission</li>
                        <li>• AI will automatically generate an in-depth explanation</li>
                    </ul>
                </div>
            </div>

            {/* Auth Modal */}
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
                setMode={setAuthMode}
            />
        </div>
    );
};

export default SubmitFactPage;
