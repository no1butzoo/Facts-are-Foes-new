import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, ArrowRight, Atom, Landmark, Heart, Leaf, Rocket, UtensilsCrossed, Cpu, Brain } from 'lucide-react';
import { Badge } from './ui/badge';

const CATEGORY_ICONS = {
    science: Atom,
    history: Landmark,
    health: Heart,
    nature: Leaf,
    space: Rocket,
    food: UtensilsCrossed,
    technology: Cpu,
    psychology: Brain
};

const FactCard = ({ fact, index = 0 }) => {
    const IconComponent = CATEGORY_ICONS[fact.category] || Atom;

    return (
        <Link 
            to={`/fact/${fact.id}`}
            className="fact-card group animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
            data-testid={`fact-card-${fact.id}`}
        >
            {/* Image */}
            {fact.image_url && (
                <div className="relative h-48 -mx-8 -mt-8 mb-4 overflow-hidden">
                    <img 
                        src={fact.image_url} 
                        alt={fact.title}
                        className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
            )}

            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-3">
                <IconComponent className="w-4 h-4 text-primary" />
                <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest text-xs">
                    {fact.category}
                </Badge>
                {fact.is_featured && (
                    <Badge className="bg-accent text-accent-foreground uppercase tracking-widest text-xs">
                        Featured
                    </Badge>
                )}
            </div>

            {/* Title */}
            <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                {fact.title}
            </h3>

            {/* False Belief Preview */}
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                <span className="text-destructive font-medium">Myth:</span> {fact.false_belief}
            </p>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {fact.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4" />
                        {fact.downvotes}
                    </span>
                </div>
                <span className="flex items-center gap-1 text-primary text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Read More
                    <ArrowRight className="w-4 h-4" />
                </span>
            </div>
        </Link>
    );
};

export default FactCard;
