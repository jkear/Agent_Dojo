/**
 * Tool Detail Panel Component
 * 
 * Displays detailed information about tools in a toolkit including
 * complete parameter schemas, scopes, and auth requirements.
 */

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { X, Code, Lock, Key, ChevronDown, ChevronUp } from 'lucide-react';
import {
    fetchToolkitTools,
    fetchToolkitMetadata,
    type Toolkit,
    type ToolDefinition,
} from '../../services/composio';
import { SchemaDisplay } from './SchemaDisplay';

interface ToolDetailPanelProps {
    toolkit: Toolkit;
    onClose: () => void;
}

export const ToolDetailPanel: React.FC<ToolDetailPanelProps> = ({
    toolkit,
    onClose,
}) => {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'tools' | 'metadata'>('tools');

    // Fetch tools for this toolkit
    const { data: toolsResponse, isLoading: toolsLoading } = useQuery({
        queryKey: ['toolkit-tools', toolkit.slug],
        queryFn: () => fetchToolkitTools(toolkit.slug),
    });

    // Fetch toolkit metadata
    const { data: metadataResponse } = useQuery({
        queryKey: ['toolkit-metadata', toolkit.slug],
        queryFn: () => fetchToolkitMetadata(toolkit.slug),
    });

    const tools = toolsResponse?.data || [];
    const metadata = metadataResponse?.data;

    return (
        <div className="tool-detail-panel h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={toolkit.logo_url || `/icons/${toolkit.slug}.svg`}
                        alt={toolkit.name}
                        className="w-10 h-10 rounded"
                        onError={(e) => {
                            e.currentTarget.src = '/icons/default-app.svg';
                        }}
                    />
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{toolkit.name}</h2>
                        <p className="text-sm text-gray-600">{toolkit.description}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b px-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('tools')}
                        className={`py-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'tools'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Tools ({tools.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('metadata')}
                        className={`py-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'metadata'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Auth & Metadata
                        </div>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'tools' ? (
                    <div className="divide-y">
                        {toolsLoading ? (
                            <div className="p-8 text-center text-gray-600">
                                Loading tools...
                            </div>
                        ) : tools.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                No tools available for this toolkit
                            </div>
                        ) : (
                            tools.map((tool: ToolDefinition) => (
                                <ToolItem
                                    key={tool.slug}
                                    tool={tool}
                                    isExpanded={selectedTool === tool.slug}
                                    onToggle={() =>
                                        setSelectedTool(
                                            selectedTool === tool.slug ? null : tool.slug
                                        )
                                    }
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <MetadataTab toolkit={toolkit} metadata={metadata} />
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Tool Item Component
// ============================================================================

interface ToolItemProps {
    tool: ToolDefinition;
    isExpanded: boolean;
    onToggle: () => void;
}

const ToolItem: React.FC<ToolItemProps> = ({ tool, isExpanded, onToggle }) => {
    return (
        <div className="p-4">
            <button
                onClick={onToggle}
                className="w-full text-left hover:bg-gray-50 -m-4 p-4 rounded transition-colors"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-900">
                                {tool.name}
                            </h3>
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                        <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
                                {tool.slug}
                            </span>
                            {tool.no_auth && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                    No Auth Required
                                </span>
                            )}
                            {tool.version && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                    v{tool.version}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>

            {/* Expanded tool details */}
            {isExpanded && (
                <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                    {/* Input Parameters */}
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span>Input Parameters</span>
                            {tool.input_parameters?.required?.length > 0 && (
                                <span className="text-xs text-red-600">
                                    ({tool.input_parameters.required.length} required)
                                </span>
                            )}
                        </h4>
                        <SchemaDisplay schema={tool.input_parameters} />
                    </div>

                    {/* Output Parameters */}
                    <div>
                        <h4 className="font-semibold mb-2">Output Parameters</h4>
                        <SchemaDisplay schema={tool.output_parameters} />
                    </div>

                    {/* Required Scopes */}
                    {tool.scopes && tool.scopes.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Required Scopes
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tool.scopes.map((scope: string) => (
                                    <span
                                        key={scope}
                                        className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-mono"
                                    >
                                        {scope}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Metadata Tab Component
// ============================================================================

interface MetadataTabProps {
    toolkit: Toolkit;
    metadata: any;
}

const MetadataTab: React.FC<MetadataTabProps> = ({ toolkit, metadata }) => {
    return (
        <div className="p-4 space-y-6">
            {/* Auth Schemes */}
            <div>
                <h3 className="font-semibold text-lg mb-3">Authentication Methods</h3>
                <div className="space-y-3">
                    {toolkit.auth_schemes.map((scheme, idx) => (
                        <div key={idx} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold capitalize">{scheme.type}</span>
                            </div>
                            {scheme.fields && (
                                <div className="ml-6 space-y-2 text-sm">
                                    {scheme.fields.required &&
                                        scheme.fields.required.length > 0 && (
                                            <div>
                                                <span className="font-medium">Required fields:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {scheme.fields.required.map((field: string) => (
                                                        <span
                                                            key={field}
                                                            className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs"
                                                        >
                                                            {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    {scheme.fields.optional &&
                                        scheme.fields.optional.length > 0 && (
                                            <div>
                                                <span className="font-medium">Optional fields:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {scheme.fields.optional.map((field: string) => (
                                                        <span
                                                            key={field}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                                        >
                                                            {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Categories */}
            {toolkit.categories && toolkit.categories.length > 0 && (
                <div>
                    <h3 className="font-semibold text-lg mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                        {toolkit.categories.map((category: string) => (
                            <span
                                key={category}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                                {category}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional Metadata */}
            {metadata && (
                <div>
                    <h3 className="font-semibold text-lg mb-3">Additional Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                            {JSON.stringify(metadata, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
