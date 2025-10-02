/**
 * Connection Manager Component
 * 
 * Manages user's connected Composio apps with OAuth flow handling.
 * Features:
 * - Display active connections with status
 * - Initiate new connections via OAuth popup
 * - Poll connection status during OAuth flow
 * - Disconnect apps
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Link,
    Unlink,
    Plus,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
} from 'lucide-react';
import {
    fetchUserConnections,
    fetchToolkits,
    initiateConnection,
    checkConnectionStatus,
    disconnectApp,
    type Connection,
    type Toolkit,
    type ConnectionInitiateResponse,
    type ConnectionStatusResponse,
} from '../../services/composio'; interface ConnectionManagerProps {
    userId: string;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
    userId,
}) => {
    const queryClient = useQueryClient();
    const [showAddConnection, setShowAddConnection] = useState(false);
    const [selectedToolkit, setSelectedToolkit] = useState<string | null>(null);

    // Fetch user connections
    const {
        data: connectionsResponse,
        isLoading: connectionsLoading,
        refetch: refetchConnections,
    } = useQuery({
        queryKey: ['user-connections', userId],
        queryFn: () => fetchUserConnections(userId),
        refetchInterval: 5000, // Auto-refresh every 5 seconds
    });

    const connections = connectionsResponse?.data || [];

    // Disconnect mutation
    const disconnectMutation = useMutation({
        mutationFn: (connectionId: string) => disconnectApp(connectionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-connections'] });
        },
    });

    const handleDisconnect = async (connectionId: string, appName: string) => {
        if (
            !confirm(`Are you sure you want to disconnect ${appName}? This cannot be undone.`)
        ) {
            return;
        }

        try {
            await disconnectMutation.mutateAsync(connectionId);
        } catch (error) {
            alert('Failed to disconnect app. Please try again.');
        }
    };

    return (
        <div className="connection-manager h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage your connected apps and integrations
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddConnection(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Connection
                    </button>
                </div>
            </div>

            {/* Connections List */}
            <div className="flex-1 overflow-y-auto p-6">
                {connectionsLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                        <p className="text-gray-600 mt-4">Loading connections...</p>
                    </div>
                ) : connections.length === 0 ? (
                    <div className="text-center py-12">
                        <Unlink className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No connections yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Connect your first app to start using Composio tools
                        </p>
                        <button
                            onClick={() => setShowAddConnection(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Connection
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {connections.map((connection: Connection) => (
                            <ConnectionCard
                                key={connection.connection_id}
                                connection={connection}
                                onDisconnect={handleDisconnect}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Connection Modal */}
            {showAddConnection && (
                <AddConnectionModal
                    userId={userId}
                    onClose={() => setShowAddConnection(false)}
                    onSuccess={() => {
                        setShowAddConnection(false);
                        refetchConnections();
                    }}
                />
            )}
        </div>
    );
};

// ============================================================================
// Connection Card Component
// ============================================================================

interface ConnectionCardProps {
    connection: Connection;
    onDisconnect: (connectionId: string, appName: string) => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
    connection,
    onDisconnect,
}) => {
    const getStatusIcon = () => {
        switch (connection.status) {
            case 'ACTIVE':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'PENDING':
                return <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />;
            case 'FAILED':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = () => {
        switch (connection.status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-700';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700';
            case 'FAILED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <img
                        src={`/icons/${connection.app_type.toLowerCase()}.svg`}
                        alt={connection.app_type}
                        className="w-10 h-10 rounded"
                        onError={(e) => {
                            e.currentTarget.src = '/icons/default-app.svg';
                        }}
                    />
                    <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                            {connection.app_type.replace('_', ' ')}
                        </h3>
                        <p className="text-xs text-gray-500">
                            <p className="text-xs text-gray-500">
                                {connection.created_at && new Date(connection.created_at).toLocaleDateString()}
                            </p>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                </div>
            </div>

            <div className="mb-3">
                <span
                    className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor()}`}
                >
                    {connection.status}
                </span>
            </div>

            {connection.status === 'ACTIVE' && (
                <button
                    onClick={() =>
                        onDisconnect(
                            connection.connection_id,
                            connection.app_type.replace('_', ' ')
                        )
                    }
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                >
                    <Unlink className="w-4 h-4" />
                    Disconnect
                </button>
            )}
        </div>
    );
};

// ============================================================================
// Add Connection Modal Component
// ============================================================================

interface AddConnectionModalProps {
    userId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AddConnectionModal: React.FC<AddConnectionModalProps> = ({
    userId,
    onClose,
    onSuccess,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingConnection, setPendingConnection] = useState<{
        connectionId: string;
        appType: string;
        popup: Window | null;
    } | null>(null);

    // Fetch available toolkits
    const { data: toolkitsResponse } = useQuery({
        queryKey: ['toolkits'],
        queryFn: () => fetchToolkits({}),
    });

    const toolkits = toolkitsResponse?.data || [];

    // Filter toolkits by search query
    const filteredToolkits = toolkits.filter((toolkit: Toolkit) =>
        toolkit.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initiate connection mutation
    const initiateMutation = useMutation({
        mutationFn: (toolkitSlug: string) => initiateConnection(toolkitSlug, userId),
        onSuccess: (data: ConnectionInitiateResponse) => {
            // Open OAuth popup
            const popup = window.open(
                data.auth_url,
                'OAuth',
                'width=600,height=700,left=200,top=100'
            );

            setPendingConnection({
                connectionId: data.connection_id,
                appType: data.toolkit_slug,
                popup,
            });

            // Start polling for connection status
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await checkConnectionStatus(
                        data.connection_id
                    );

                    if (statusResponse.status === 'ACTIVE') {
                        clearInterval(pollInterval);
                        popup?.close();
                        setPendingConnection(null);
                        onSuccess();
                    } else if (statusResponse.status === 'FAILED') {
                        clearInterval(pollInterval);
                        popup?.close();
                        setPendingConnection(null);
                        alert('Connection failed. Please try again.');
                    }
                } catch (error) {
                    console.error('Error polling connection status:', error);
                }
            }, 2000);

            // Clear interval if popup is closed manually
            const checkPopupClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(pollInterval);
                    clearInterval(checkPopupClosed);
                    setPendingConnection(null);
                }
            }, 1000);
        },
        onError: (error) => {
            alert(`Failed to initiate connection: ${error}`);
        },
    });

    const handleConnect = async (toolkitSlug: string) => {
        try {
            await initiateMutation.mutateAsync(toolkitSlug);
        } catch (error) {
            console.error('Connection error:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Modal Header */}
                <div className="border-b p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Add Connection</h2>
                        <p className="text-sm text-gray-600">
                            Select an app to connect
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={!!pendingConnection}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Search apps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        disabled={!!pendingConnection}
                    />
                </div>

                {/* Pending Connection Status */}
                {pendingConnection && (
                    <div className="p-4 bg-blue-50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            <div>
                                <p className="font-semibold">Waiting for authorization...</p>
                                <p className="text-sm text-gray-600">
                                    Complete the OAuth flow in the popup window
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toolkits Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3">
                        {filteredToolkits.map((toolkit: Toolkit) => (
                            <button
                                key={toolkit.slug}
                                onClick={() => handleConnect(toolkit.slug)}
                                disabled={!!pendingConnection || initiateMutation.isLoading}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <img
                                    src={toolkit.logo_url || `/icons/${toolkit.slug}.svg`}
                                    alt={toolkit.name}
                                    className="w-10 h-10 rounded"
                                    onError={(e) => {
                                        e.currentTarget.src = '/icons/default-app.svg';
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold">{toolkit.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {toolkit.description}
                                    </div>
                                </div>
                                <Link className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
