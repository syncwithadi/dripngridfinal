'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import { sanityClient } from '@/sanity/client';
import { allProductsQuery } from '@/sanity/queries';

interface Product {
    _id: string;
    name: string;
    slug: { current: string };
    priceINR: number;
    originalPriceINR?: number;
    category: { _id: string; name: string; slug: { current: string } };
    images: {
        front: { asset: { url: string } };
        back?: { asset: { url: string } };
    };
    badge?: string;
    sizes?: string[];
    colors?: string[];
    gender?: string;
    inStock: boolean;
    salesCount?: number;
    _createdAt?: string;
}

type SortOption = 'newest' | 'best-selling' | 'price-low' | 'price-high';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [selectedGender, setSelectedGender] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSize, setSelectedSize] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // Mobile filter panel
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const data = await sanityClient.fetch(allProductsQuery);
                setProducts(data || []);
            } catch (err) {
                setError('Failed to load products');
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, []);

    // Extract unique values for filters
    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach((p) => {
            if (p.category?.name) cats.add(p.category.name);
        });
        return Array.from(cats);
    }, [products]);

    const sizes = useMemo(() => {
        const allSizes = new Set<string>();
        products.forEach((p) => {
            p.sizes?.forEach((s) => allSizes.add(s));
        });
        return Array.from(allSizes).sort();
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Gender filter
        if (selectedGender !== 'all') {
            result = result.filter(
                (p) => p.gender === selectedGender || p.gender === 'Unisex'
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            result = result.filter((p) => p.category?.name === selectedCategory);
        }

        // Size filter
        if (selectedSize !== 'all') {
            result = result.filter((p) => p.sizes?.includes(selectedSize));
        }

        // Sorting
        switch (sortBy) {
            case 'best-selling':
                result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
                break;
            case 'price-low':
                result.sort((a, b) => a.priceINR - b.priceINR);
                break;
            case 'price-high':
                result.sort((a, b) => b.priceINR - a.priceINR);
                break;
            case 'newest':
            default:
                // Already sorted by createdAt desc from query
                break;
        }

        return result;
    }, [products, selectedGender, selectedCategory, selectedSize, sortBy]);

    const clearFilters = () => {
        setSelectedGender('all');
        setSelectedCategory('all');
        setSelectedSize('all');
    };

    const hasActiveFilters =
        selectedGender !== 'all' ||
        selectedCategory !== 'all' ||
        selectedSize !== 'all';

    if (isLoading) {
        return (
            <div className="container-custom py-24 min-h-[70vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--color-text)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-custom py-24 min-h-[70vh] flex items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="container-custom pt-6 pb-16 min-h-[70vh]">
            {/* Header */}
            <div className="mb-8 pb-5 border-b border-gray-100">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Collection</p>
                <div className="flex items-end justify-between">
                    <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800">
                        Shop All
                    </h1>
                    <p className="text-sm text-gray-400 hidden md:block">
                        Explore our complete collection
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar - Desktop */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-8">
                        {/* Gender Filter */}
                        <div>
                            <h3 className="text-xs font-medium uppercase tracking-wider mb-4">Gender</h3>
                            <div className="space-y-2">
                                {['all', 'Men', 'Women'].map((gender) => (
                                    <button
                                        key={gender}
                                        onClick={() => setSelectedGender(gender)}
                                        className={`block w-full text-left text-sm py-1 transition-colors ${selectedGender === gender
                                                ? 'text-[var(--color-text)] font-medium'
                                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            }`}
                                    >
                                        {gender === 'all' ? 'All' : gender}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <h3 className="text-xs font-medium uppercase tracking-wider mb-4">Category</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`block w-full text-left text-sm py-1 transition-colors ${selectedCategory === 'all'
                                            ? 'text-[var(--color-text)] font-medium'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                        }`}
                                >
                                    All
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`block w-full text-left text-sm py-1 transition-colors ${selectedCategory === cat
                                                ? 'text-[var(--color-text)] font-medium'
                                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size Filter */}
                        <div>
                            <h3 className="text-xs font-medium uppercase tracking-wider mb-4">Size</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedSize('all')}
                                    className={`px-3 py-1 text-xs border transition-colors ${selectedSize === 'all'
                                            ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]'
                                            : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)]'
                                        }`}
                                >
                                    All
                                </button>
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-3 py-1 text-xs border transition-colors ${selectedSize === size
                                                ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)]'
                                                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)]'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--color-border)]">
                        {/* Mobile Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center gap-2 text-sm"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                                />
                            </svg>
                            Filters
                            {hasActiveFilters && (
                                <span className="w-5 h-5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs flex items-center justify-center rounded-full">
                                    !
                                </span>
                            )}
                        </button>

                        <p className="text-sm text-[var(--color-text-muted)] hidden lg:block">
                            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                        </p>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-transparent border border-[var(--color-border)] px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-text)]"
                        >
                            <option value="newest">Newest</option>
                            <option value="best-selling">Best Selling</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>

                    {/* Mobile Filters Panel */}
                    {showFilters && (
                        <div className="lg:hidden mb-8 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Gender */}
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider mb-2">Gender</h3>
                                    <select
                                        value={selectedGender}
                                        onChange={(e) => setSelectedGender(e.target.value)}
                                        className="w-full bg-transparent border border-[var(--color-border)] p-2 text-sm"
                                    >
                                        <option value="all">All</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider mb-2">Category</h3>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full bg-transparent border border-[var(--color-border)] p-2 text-sm"
                                    >
                                        <option value="all">All</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Size */}
                                <div>
                                    <h3 className="text-xs font-medium uppercase tracking-wider mb-2">Size</h3>
                                    <select
                                        value={selectedSize}
                                        onChange={(e) => setSelectedSize(e.target.value)}
                                        className="w-full bg-transparent border border-[var(--color-border)] p-2 text-sm"
                                    >
                                        <option value="all">All</option>
                                        {sizes.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 text-sm text-[var(--color-text-muted)] underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-[var(--color-text-muted)] mb-4">
                                No products match your filters.
                            </p>
                            <button onClick={clearFilters} className="btn-secondary">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
