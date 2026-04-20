import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Triangle, Menu, X, User, LogOut, Plus, Compass, Shield, GraduationCap, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import AuthModal from './AuthModal';

const Layout = ({ children }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const openLogin = () => {
        setAuthMode('login');
        setShowAuthModal(true);
    };

    const openRegister = () => {
        setAuthMode('register');
        setShowAuthModal(true);
    };

    const navLinks = [
        { path: '/', label: 'Home', icon: Triangle },
        { path: '/explore', label: 'Explore', icon: Compass },
        { path: '/intel-portal', label: 'Intelligence', icon: Shield },
        { path: '/game-master-manifesto', label: 'The Manifesto', icon: GraduationCap },
        { path: '/foes', label: 'The Foes', icon: Eye },
    ];

    return (
        <div className="min-h-screen bg-transparent">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-[#D4AF37]/20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
                            <div className="w-10 h-10 bg-primary pyramid-icon flex items-center justify-center group-hover:animate-glow-pulse transition-all">
                                <Triangle className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="font-heading text-xl font-bold tracking-wider text-foreground hidden sm:block">
                                FACTS ARE FOES
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map(({ path, label }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    data-testid={`nav-${label.toLowerCase()}`}
                                    className={`font-body uppercase tracking-widest text-sm transition-all hover:text-primary ${
                                        location.pathname === path ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Auth Section */}
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/submit" data-testid="submit-fact-btn">
                                        <Button variant="outline" className="hidden sm:flex border-primary text-primary hover:bg-primary/10">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Submit Fact
                                        </Button>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button 
                                                className="flex items-center gap-2 p-2 hover:bg-white/5 transition-all"
                                                data-testid="user-menu-trigger"
                                            >
                                                <img 
                                                    src={user?.avatar_url} 
                                                    alt={user?.username}
                                                    className="w-8 h-8 border border-primary/50"
                                                />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-card border-white/10">
                                            <DropdownMenuItem asChild>
                                                <Link to="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="profile-link">
                                                    <User className="w-4 h-4" />
                                                    Profile
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link to="/submit" className="flex items-center gap-2 cursor-pointer sm:hidden" data-testid="submit-link-mobile">
                                                    <Plus className="w-4 h-4" />
                                                    Submit Fact
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link to="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="admin-link">
                                                    <Shield className="w-4 h-4" />
                                                    Admin Panel
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem 
                                                onClick={logout}
                                                className="flex items-center gap-2 cursor-pointer text-destructive"
                                                data-testid="logout-btn"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button 
                                        variant="ghost" 
                                        onClick={openLogin}
                                        className="text-foreground hover:text-primary"
                                        data-testid="login-btn"
                                    >
                                        Login
                                    </Button>
                                    <Button 
                                        onClick={openRegister}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        data-testid="register-btn"
                                    >
                                        Join
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button 
                                className="md:hidden p-2 hover:bg-white/5"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                data-testid="mobile-menu-toggle"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
                            {navLinks.map(({ path, label, icon: Icon }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 py-3 font-body uppercase tracking-widest text-sm transition-all ${
                                        location.pathname === path ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20">
                {children}
            </main>

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

export default Layout;
