import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, mode, setMode }) => {
    const { login, register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
                toast.success('Welcome back, seeker of truth!');
            } else {
                await register(formData.username, formData.email, formData.password);
                toast.success('Welcome to Facts Are Foes!');
            }
            onClose();
            setFormData({ username: '', email: '', password: '' });
        } catch (error) {
            const message = error.response?.data?.detail || 'Something went wrong';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-white/10 sm:max-w-md" data-testid="auth-modal">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl text-center text-primary">
                        {mode === 'login' ? 'ENTER THE VAULT' : 'JOIN THE SEEKERS'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {mode === 'register' && (
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-muted-foreground uppercase tracking-widest text-xs">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="bg-black/50 border-white/20 focus:border-primary"
                                placeholder="Enter your username"
                                required
                                data-testid="register-username-input"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-muted-foreground uppercase tracking-widest text-xs">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-black/50 border-white/20 focus:border-primary"
                            placeholder="Enter your email"
                            required
                            data-testid="auth-email-input"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-muted-foreground uppercase tracking-widest text-xs">
                            Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="bg-black/50 border-white/20 focus:border-primary pr-10"
                                placeholder="Enter your password"
                                required
                                data-testid="auth-password-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest"
                        data-testid="auth-submit-btn"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            mode === 'login' ? 'Enter' : 'Create Account'
                        )}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        data-testid="auth-toggle-mode"
                    >
                        {mode === 'login' ? "Don't have an account? Join now" : 'Already a seeker? Login'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal;
