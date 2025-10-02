/**
 * Toolkit Browser Component
 * 
 * Displays all available Composio toolkits with search and filtering capabilities.
 * Follows the patterns from copilot-instructions.md.
 */

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, Grid, List, Filter, X } from 'lucide-react';
import {
    fetchToolkits,
    fetchCategories,
    type Toolkit,
} from '../../services/composio';

interface ToolkitBrowserProps {
    onSelectToolkit?: (toolkit: Toolkit) => void;
}

export const ToolkitBrowser: React.FC<ToolkitBrowserProps> = ({
    onSelectToolkit,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch toolkits with search and category filters
    const { data: toolkitsResponse, isLoading, error } = useQuery({
        queryKey: ['toolkits', searchQuery, selectedCategory],
        queryFn: () =>
            fetchToolkits({
                search: searchQuery || null,
                category: selectedCategory,
            }),
    });

    // Fetch categories for filter
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    const toolkits = toolkitsResponse?.data || [];

    return (
        <div className="toolkit-browser h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Composio Toolkits
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Browse 150+ app integrations for your AI agents
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid'
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list'
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded ${showFilters || selectedCategory
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search toolkits..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filters */}
                {showFilters && categories && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">Categories</span>
                            {selectedCategory && (
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {/* Category filters */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category: string) => {
                                const isActive = selectedCategory === category;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}                {/* Active Filters Display */}
                {(searchQuery || selectedCategory) && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Active filters:</span>
                        {searchQuery && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Search: "{searchQuery}"
                                <button onClick={() => setSearchQuery('')}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Category: {selectedCategory}
                                <button onClick={() => setSelectedCategory(null)}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-600">Loading toolkits...</div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-red-600">
                            Error loading toolkits. Please try again.
                        </div>
                    </div>
                ) : toolkits.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-gray-600 mb-2">No toolkits found</p>
                            <p className="text-sm text-gray-500">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {toolkits.map((toolkit: Toolkit) => (
                            <ToolkitCard
                                key={toolkit.slug}
                                toolkit={toolkit}
                                onClick={() => onSelectToolkit?.(toolkit)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {toolkits.map((toolkit: Toolkit) => (
                            <ToolkitListItem
                                key={toolkit.slug}
                                toolkit={toolkit}
                                onClick={() => onSelectToolkit?.(toolkit)}
                            />
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {toolkits.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Showing {toolkits.length} toolkit{toolkits.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Toolkit Card Component (Grid View)
// ============================================================================

interface ToolkitCardProps {
    toolkit: Toolkit;
    onClick?: () => void;
}

const ToolkitCard: React.FC<ToolkitCardProps> = ({ toolkit, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="toolkit-card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all p-4 text-left w-full"
        >
            <div className="flex items-start gap-3 mb-3">
                <img
                    src={toolkit.logo_url || `/icons/${toolkit.slug}.svg`}
                    alt={toolkit.name}
                    className="w-12 h-12 rounded"
                    onError={(e) => {
                        e.currentTarget.src = '/icons/default-app.svg';
                    }}
                />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {toolkit.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{toolkit.slug}</p>
                </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {toolkit.description}
            </p>

            {toolkit.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {toolkit.categories.slice(0, 2).map((category) => (
                        <span
                            key={category}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                        >
                            {category}
                        </span>
                    ))}
                    {toolkit.categories.length > 2 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                            +{toolkit.categories.length - 2}
                        </span>
                    )}
                </div>
            )}

            {toolkit.auth_schemes.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {toolkit.auth_schemes[0].type.toUpperCase()}
                </div>
            )}
        </button>
    );
};

// ============================================================================
// Toolkit List Item Component (List View)
// ============================================================================

interface ToolkitListItemProps {
    toolkit: Toolkit;
    onClick?: () => void;
}

const ToolkitListItem: React.FC<ToolkitListItemProps> = ({
    toolkit,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className="toolkit-list-item bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all p-4 text-left w-full"
        >
            <div className="flex items-center gap-4">
                <img
                    src={toolkit.logo_url || `/icons/${toolkit.slug}.svg`}
                    alt={toolkit.name}
                    className="w-12 h-12 rounded flex-shrink-0"
                    onError={(e) => {
                        e.currentTarget.src = '/icons/default-app.svg';
                    }}
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{toolkit.name}</h3>
                        <span className="text-xs text-gray-500">({toolkit.slug})</span>
                        {toolkit.auth_schemes.length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                {toolkit.auth_schemes[0].type.toUpperCase()}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-1">
                        {toolkit.description}
                    </p>

                    {toolkit.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {toolkit.categories.map((category) => (
                                <span
                                    key={category}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                >
                                    {category}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 text-gray-400">
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </div>
            </div>
        </button>
    );
};
