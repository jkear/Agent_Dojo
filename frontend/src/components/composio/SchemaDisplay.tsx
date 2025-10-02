/**
 * Schema Display Component
 * 
 * Displays parameter schemas with recursive nested object support.
 * Shows type, description, default values, examples, and required status.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface SchemaProperty {
    type?: string | string[];
    description?: string;
    default?: any;
    examples?: any[];
    enum?: any[];
    items?: SchemaProperty;
    properties?: Record<string, SchemaProperty>;
    required?: string[] | boolean; // Support both formats
    additionalProperties?: boolean | SchemaProperty;
}

interface SchemaDisplayProps {
    schema: {
        type?: string;
        properties?: Record<string, SchemaProperty>;
        required?: string[];
        additionalProperties?: boolean | SchemaProperty;
    } | null | undefined;
    level?: number;
}

export const SchemaDisplay: React.FC<SchemaDisplayProps> = ({
    schema,
    level = 0,
}) => {
    if (!schema || !schema.properties) {
        return (
            <div className="text-sm text-gray-500 italic p-2 bg-white rounded border">
                No parameters defined
            </div>
        );
    }

    const properties = schema.properties;
    const required = schema.required || [];

    return (
        <div className="space-y-2">
            {Object.entries(properties).map(([name, prop]) => (
                <PropertyItem
                    key={name}
                    name={name}
                    property={prop}
                    isRequired={required.includes(name)}
                    level={level}
                />
            ))}
        </div>
    );
};

// ============================================================================
// Property Item Component
// ============================================================================

interface PropertyItemProps {
    name: string;
    property: SchemaProperty;
    isRequired: boolean;
    level: number;
}

const PropertyItem: React.FC<PropertyItemProps> = ({
    name,
    property,
    isRequired,
    level,
}) => {
    const [isExpanded, setIsExpanded] = useState(level === 0);

    const hasNestedProperties =
        (property.type === 'object' && property.properties) ||
        (property.type === 'array' && property.items?.properties);

    // Determine display type
    const displayType = Array.isArray(property.type)
        ? property.type.join(' | ')
        : property.type === 'array' && property.items
            ? `array<${property.items.type || 'any'}>`
            : property.type || 'any';

    return (
        <div
            className={`border rounded-lg bg-white ${level > 0 ? 'ml-4 border-l-2 border-blue-200' : ''
                }`}
        >
            <div
                className={`p-3 ${hasNestedProperties ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                onClick={() => hasNestedProperties && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {/* Property name and type */}
                        <div className="flex items-center gap-2 mb-1">
                            {hasNestedProperties && (
                                <div className="flex-shrink-0">
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            )}
                            <span className="font-mono font-semibold text-sm text-gray-900">
                                {name}
                            </span>
                            {isRequired && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                    required
                                </span>
                            )}
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-mono">
                                {displayType}
                            </span>
                        </div>

                        {/* Description */}
                        {property.description && (
                            <p className="text-sm text-gray-600 mt-1">
                                {property.description}
                            </p>
                        )}

                        {/* Additional info row */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                            {/* Default value */}
                            {property.default !== undefined && (
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500">Default:</span>
                                    <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">
                                        {JSON.stringify(property.default)}
                                    </code>
                                </div>
                            )}

                            {/* Examples */}
                            {property.examples && property.examples.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500">Example:</span>
                                    <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">
                                        {JSON.stringify(property.examples[0])}
                                    </code>
                                </div>
                            )}

                            {/* Enum values */}
                            {property.enum && property.enum.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-gray-500">Options:</span>
                                    {property.enum.map((value, idx) => (
                                        <code
                                            key={idx}
                                            className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-mono"
                                        >
                                            {JSON.stringify(value)}
                                        </code>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested properties for objects */}
            {isExpanded &&
                property.type === 'object' &&
                property.properties &&
                Object.keys(property.properties).length > 0 && (
                    <div className="border-t p-3 bg-gray-50">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                            Object Properties
                        </div>
                        <SchemaDisplay
                            schema={{
                                type: 'object',
                                properties: property.properties,
                                required: Array.isArray(property.required) ? property.required : [],
                            }}
                            level={level + 1}
                        />
                    </div>
                )}

            {/* Nested properties for arrays of objects */}
            {isExpanded &&
                property.type === 'array' &&
                property.items?.properties &&
                Object.keys(property.items.properties).length > 0 && (
                    <div className="border-t p-3 bg-gray-50">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                            Array Item Properties
                        </div>
                        <SchemaDisplay
                            schema={{
                                type: 'object',
                                properties: property.items.properties,
                                required: Array.isArray(property.items.required) ? property.items.required : [],
                            }}
                            level={level + 1}
                        />
                    </div>
                )}
        </div>
    );
};
