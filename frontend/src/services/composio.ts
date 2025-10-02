/**
 * Composio API Client
 * 
 * Provides type-safe API functions for all Composio operations.
 * Uses axios for HTTP requests and follows TanStack Query patterns.
 */

import axios, { AxiosError } from 'axios';

const API_BASE = '/api/v1/composio';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AuthScheme {
  type: 'oauth2' | 'oauth1' | 'api_key' | 'basic_auth' | 'bearer_token';
  fields?: {
    required: string[];
    optional: string[];
  };
}

export interface Toolkit {
  slug: string;
  name: string;
  description: string;
  logo_url?: string;
  categories: string[];
  auth_schemes: AuthScheme[];
}

export interface ToolParameter {
  type: string;
  description?: string;
  required?: boolean;
  default?: any;
  examples?: any[];
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
}

export interface ToolSchema {
  type: string;
  properties: Record<string, ToolParameter>;
  required: string[];
}

export interface ToolDefinition {
  name: string;
  slug: string;
  description: string;
  input_parameters: ToolSchema;
  output_parameters: ToolSchema;
  scopes: string[];
  no_auth: boolean;
  version?: string;
}

export interface Connection {
  connection_id: string;
  app_type: string;
  status: 'ACTIVE' | 'PENDING' | 'FAILED' | 'EXPIRED';
  created_at?: string;
  updated_at?: string;
}

export interface ConnectionInitiateResponse {
  connection_id: string;
  auth_url: string;
  toolkit_slug: string;
  status: string;
}

export interface ConnectionStatusResponse {
  connection_id: string;
  status: 'ACTIVE' | 'PENDING' | 'FAILED' | 'EXPIRED';
  message?: string;
}

export interface ToolkitListResponse {
  success: boolean;
  data: Toolkit[];
  message: string;
}

export interface ToolDefinitionListResponse {
  success: boolean;
  data: ToolDefinition[];
  message: string;
}

export interface ConnectionListResponse {
  success: boolean;
  data: Connection[];
  message: string;
}

export interface ToolExecutionRequest {
  tool_slug: string;
  user_id: string;
  parameters: Record<string, any>;
}

export interface ToolExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
  tool_slug: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all available toolkits with optional filtering
 */
export const fetchToolkits = async (params?: {
  category?: string | null;
  search?: string | null;
}): Promise<ToolkitListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);

  const response = await axios.get<ToolkitListResponse>(
    `${API_BASE}/toolkits${queryParams.toString() ? `?${queryParams}` : ''}`
  );
  return response.data;
};

/**
 * Fetch tool definitions for a specific toolkit
 */
export const fetchToolkitTools = async (
  toolkitSlug: string
): Promise<ToolDefinitionListResponse> => {
  const response = await axios.get<ToolDefinitionListResponse>(
    `${API_BASE}/toolkits/${toolkitSlug}/tools`
  );
  return response.data;
};

/**
 * Fetch metadata for a specific toolkit
 */
export const fetchToolkitMetadata = async (toolkitSlug: string): Promise<any> => {
  const response = await axios.get(`${API_BASE}/toolkits/${toolkitSlug}/metadata`);
  return response.data;
};

/**
 * Initiate OAuth connection for a toolkit
 */
export const initiateConnection = async (
  toolkitSlug: string,
  userId: string
): Promise<ConnectionInitiateResponse> => {
  const response = await axios.post(`${API_BASE}/connections/initiate`, {
    toolkit_slug: toolkitSlug,
    user_id: userId,
  });
  return response.data.data;
};

/**
 * Check the status of a connection
 */
export const checkConnectionStatus = async (
  connectionId: string
): Promise<ConnectionStatusResponse> => {
  const response = await axios.get(
    `${API_BASE}/connections/${connectionId}/status`
  );
  return response.data.data;
};

/**
 * Fetch all connections for a specific user
 */
export const fetchUserConnections = async (
  userId: string
): Promise<ConnectionListResponse> => {
  const response = await axios.get<ConnectionListResponse>(
    `${API_BASE}/users/${userId}/connections`
  );
  return response.data;
};

/**
 * Disconnect an app connection
 */
export const disconnectApp = async (connectionId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/connections/${connectionId}`);
};

/**
 * Execute a Composio tool
 */
export const executeTool = async (
  request: ToolExecutionRequest
): Promise<ToolExecutionResponse> => {
  const response = await axios.post(`${API_BASE}/tools/execute`, request);
  return response.data.data;
};

/**
 * Get available categories for filtering toolkits
 */
export const fetchCategories = async (): Promise<string[]> => {
  // This would need to be implemented on the backend
  // For now, return common categories
  return [
    'Communication',
    'Productivity',
    'Development',
    'Marketing',
    'Sales',
    'Support',
    'Finance',
    'HR',
    'Analytics',
  ];
};

// ============================================================================
// Error Handling
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  [key: string]: any;
}

export const isApiError = (error: unknown): error is AxiosError<ApiError> => {
  return axios.isAxiosError(error) && error.response !== undefined;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};
