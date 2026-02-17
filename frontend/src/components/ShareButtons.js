import { Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ShareButtons = ({ fact, url }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = url || window.location.href;
    const shareText = `🏛️ Myth Busted: "${fact.title}" - Did you know? ${fact.false_belief.slice(0, 100)}... Discover the truth!`;

    const trackShare = async (platform) => {
        try {
            await axios.post(`${API}/engagement`, {
                fact_id: fact.id,
                event_type: 'share',
                value: platform
            });
        } catch (error) {
            console.error('Failed to track share:', error);
        }
    };

    const shareToTwitter = () => {
        trackShare('twitter');
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareToFacebook = () => {
        trackShare('facebook');
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareToLinkedIn = () => {
        trackShare('linkedin');
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            trackShare('copy_link');
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-2">Share:</span>
            <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                className="border-white/20 hover:border-primary hover:bg-primary/10 p-2"
                data-testid="share-twitter"
            >
                <Twitter className="w-4 h-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={shareToFacebook}
                className="border-white/20 hover:border-primary hover:bg-primary/10 p-2"
                data-testid="share-facebook"
            >
                <Facebook className="w-4 h-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={shareToLinkedIn}
                className="border-white/20 hover:border-primary hover:bg-primary/10 p-2"
                data-testid="share-linkedin"
            >
                <Linkedin className="w-4 h-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="border-white/20 hover:border-primary hover:bg-primary/10 p-2"
                data-testid="share-copy"
            >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
            </Button>
        </div>
    );
};

export default ShareButtons;
