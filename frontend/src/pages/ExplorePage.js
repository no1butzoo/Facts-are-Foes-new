import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Atom, Landmark, Heart, Leaf, Rocket, UtensilsCrossed, Cpu, Brain, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import FactCard from '../components/FactCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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

const ExplorePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [facts, setFacts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const selectedCategory = searchParams.get('category') || 'all';

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchFacts();
    }, [selectedCategory, searchQuery]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API}/categories`);
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchFacts = async () => {
        setLoading(true);
        try {
            let url = `${API}/facts?limit=50`;
            if (selectedCategory && selectedCategory !== 'all') {
                url += `&category=${selectedCategory}`;
            }
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            const response = await axios.get(url);
            setFacts(response.data);
        } catch (error) {
            console.error('Error fetching facts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (value) => {
        if (value === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', value);
        }
        setSearchParams(searchParams);
    };

    const clearFilters = () => {
        setSearchQuery('');
        searchParams.delete('category');
        setSearchParams(searchParams);
    };

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="explore-title">
                        EXPLORE <span className="text-primary">MYTHS</span>
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Dive into our collection of debunked facts and discover the truth behind popular misconceptions
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-card/50 border border-white/10">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search myths..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 bg-black/50 border-white/20 focus:border-primary h-12"
                            data-testid="search-input"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="w-full md:w-64">
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                            <SelectTrigger className="bg-black/50 border-white/20 h-12" data-testid="category-filter">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10">
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => {
                                    const IconComponent = CATEGORY_ICONS[cat.id] || Atom;
                                    return (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <span className="flex items-center gap-2">
                                                <IconComponent className="w-4 h-4" />
                                                {cat.name}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || selectedCategory !== 'all') && (
                        <Button 
                            variant="outline" 
                            onClick={clearFilters}
                            className="border-white/20 hover:border-primary"
                            data-testid="clear-filters-btn"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Results Count */}
                <div className="mb-6 text-sm text-muted-foreground">
                    Showing <span className="text-primary font-bold">{facts.length}</span> myths
                    {selectedCategory !== 'all' && (
                        <span> in <span className="text-primary">{categories.find(c => c.id === selectedCategory)?.name}</span></span>
                    )}
                    {searchQuery && (
                        <span> matching "<span className="text-primary">{searchQuery}</span>"</span>
                    )}
                </div>

                {/* Facts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-muted/20 animate-pulse" />
                        ))}
                    </div>
                ) : facts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="facts-grid">
                        {facts.map((fact, index) => (
                            <FactCard key={fact.id} fact={fact} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 mx-auto mb-6 bg-muted/20 pyramid-icon flex items-center justify-center">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-2xl font-bold mb-2">No myths found</h3>
                        <p className="text-muted-foreground mb-6">
                            Try adjusting your search or filters to find what you're looking for
                        </p>
                        <Button onClick={clearFilters} className="btn-secondary">
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorePage;
