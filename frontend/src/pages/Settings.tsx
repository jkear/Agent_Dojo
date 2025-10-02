import { Moon, Sun, Monitor, Bell, Globe, Shield, Zap, Key, Save, CheckCircle, XCircle, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { credentialService, ApiKeyType, maskApiKey } from '../services/credentials'

interface ApiKeyState {
    value: string;
    configured: boolean;
    showKey: boolean;
    validating: boolean;
    valid: boolean | null;
}

export function Settings() {
    const { theme, setTheme } = useTheme()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // API Key states
    const [apiKeys, setApiKeys] = useState<Record<ApiKeyType, ApiKeyState>>({
        [ApiKeyType.OPENAI]: { value: '', configured: false, showKey: false, validating: false, valid: null },
        [ApiKeyType.ANTHROPIC]: { value: '', configured: false, showKey: false, validating: false, valid: null },
        [ApiKeyType.GOOGLE_AI]: { value: '', configured: false, showKey: false, validating: false, valid: null },
        [ApiKeyType.COMPOSIO]: { value: '', configured: false, showKey: false, validating: false, valid: null },
    });

    // General settings
    const [defaultModel, setDefaultModel] = useState('gpt-4');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            await credentialService.initialize();

            // Load which API keys are configured
            const configured = await credentialService.getConfiguredKeys();

            setApiKeys(prev => {
                const updated = { ...prev };
                Object.values(ApiKeyType).forEach(type => {
                    updated[type] = {
                        ...updated[type],
                        configured: configured.includes(type),
                    };
                });
                return updated;
            });

            // Load default model setting
            const model = await credentialService.getSetting<string>('default_model');
            if (model) setDefaultModel(model);

        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleApiKeyChange = (type: ApiKeyType, value: string) => {
        setApiKeys(prev => ({
            ...prev,
            [type]: { ...prev[type], value, valid: null },
        }));
    };

    const toggleShowKey = (type: ApiKeyType) => {
        setApiKeys(prev => ({
            ...prev,
            [type]: { ...prev[type], showKey: !prev[type].showKey },
        }));
    };

    const validateAndSaveKey = async (type: ApiKeyType) => {
        const key = apiKeys[type].value.trim();

        if (!key) {
            toast.error('API key cannot be empty');
            return;
        }

        setApiKeys(prev => ({
            ...prev,
            [type]: { ...prev[type], validating: true },
        }));

        try {
            // Validate the key format
            const validation = await credentialService.validateApiKey(type, key);

            if (!validation.valid) {
                setApiKeys(prev => ({
                    ...prev,
                    [type]: { ...prev[type], validating: false, valid: false },
                }));
                toast.error(validation.message || 'Invalid API key');
                return;
            }

            // Save the key
            await credentialService.setApiKey(type, key);

            setApiKeys(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    validating: false,
                    valid: true,
                    configured: true,
                    value: '', // Clear the input after saving
                },
            }));

            toast.success(`${getKeyLabel(type)} saved successfully`);
        } catch (error) {
            console.error(`Failed to save ${type}:`, error);
            setApiKeys(prev => ({
                ...prev,
                [type]: { ...prev[type], validating: false, valid: false },
            }));
            toast.error(`Failed to save ${getKeyLabel(type)}`);
        }
    };

    const deleteKey = async (type: ApiKeyType) => {
        if (!confirm(`Are you sure you want to delete your ${getKeyLabel(type)}?`)) {
            return;
        }

        try {
            await credentialService.deleteApiKey(type);
            setApiKeys(prev => ({
                ...prev,
                [type]: { ...prev[type], configured: false, value: '' },
            }));
            toast.success(`${getKeyLabel(type)} deleted`);
        } catch (error) {
            console.error(`Failed to delete ${type}:`, error);
            toast.error(`Failed to delete ${getKeyLabel(type)}`);
        }
    };

    const saveDefaultModel = async () => {
        setSaving(true);
        try {
            await credentialService.setSetting('default_model', defaultModel);
            toast.success('Default model saved');
        } catch (error) {
            console.error('Failed to save default model:', error);
            toast.error('Failed to save default model');
        } finally {
            setSaving(false);
        }
    };

    const getKeyLabel = (type: ApiKeyType): string => {
        const labels = {
            [ApiKeyType.OPENAI]: 'OpenAI API Key',
            [ApiKeyType.ANTHROPIC]: 'Anthropic API Key',
            [ApiKeyType.GOOGLE_AI]: 'Google AI API Key',
            [ApiKeyType.COMPOSIO]: 'Composio API Key',
        };
        return labels[type];
    };

    const getKeyDescription = (type: ApiKeyType): string => {
        const descriptions = {
            [ApiKeyType.OPENAI]: 'Required for GPT models. Get your key from platform.openai.com',
            [ApiKeyType.ANTHROPIC]: 'Optional. Required for Claude models. Get from console.anthropic.com',
            [ApiKeyType.GOOGLE_AI]: 'Optional. Required for Gemini models. Get from makersuite.google.com',
            [ApiKeyType.COMPOSIO]: 'Required for app integrations. Get from app.composio.dev',
        };
        return descriptions[type];
    };

    const getKeyPlaceholder = (type: ApiKeyType): string => {
        const placeholders = {
            [ApiKeyType.OPENAI]: 'sk-...',
            [ApiKeyType.ANTHROPIC]: 'sk-ant-...',
            [ApiKeyType.GOOGLE_AI]: 'AIza...',
            [ApiKeyType.COMPOSIO]: 'composio_...',
        };
        return placeholders[type];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Customize your Agent Dojo experience</p>
                        </div>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* API Keys Section */}
                    <div className="macos-card p-6 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                <Key className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API Keys</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your provider API keys securely</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {Object.values(ApiKeyType).map((type) => {
                                const state = apiKeys[type];
                                const isRequired = type === ApiKeyType.OPENAI || type === ApiKeyType.COMPOSIO;
                                return (
                                    <div key={type} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {getKeyLabel(type)}
                                                    {isRequired && <span className="ml-1 text-red-500">*</span>}
                                                </label>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {getKeyDescription(type)}
                                                </p>
                                            </div>
                                            {state.configured && (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                    <span className="text-xs text-green-600">Configured</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type={state.showKey ? 'text' : 'password'}
                                                    value={state.value}
                                                    onChange={(e) => handleApiKeyChange(type, e.target.value)}
                                                    placeholder={state.configured ? '••••••••••••' : getKeyPlaceholder(type)}
                                                    className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                                />
                                                {state.value && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleShowKey(type)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        {state.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => validateAndSaveKey(type)}
                                                disabled={!state.value.trim() || state.validating}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm min-w-[90px] justify-center"
                                            >
                                                {state.validating ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                        <span>Saving</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-3.5 h-3.5" />
                                                        <span>Save</span>
                                                    </>
                                                )}
                                            </button>

                                            {state.configured && (
                                                <button
                                                    onClick={() => deleteKey(type)}
                                                    className="px-2.5 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                    title="Delete API key"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {state.valid === false && (
                                            <div className="flex items-center gap-1.5 text-red-600 text-xs">
                                                <XCircle className="w-3.5 h-3.5" />
                                                <span>Invalid API key format</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>🔒 Secure Storage:</strong> Your API keys are encrypted and stored locally on your device using Tauri Stronghold. They never leave your machine.
                            </p>
                        </div>
                    </div>

                    {/* Default Model Selection */}
                    <div className="macos-card p-6 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Agent Defaults</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Default settings for new agents</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Default AI Model
                                </label>
                                <select
                                    value={defaultModel}
                                    onChange={(e) => setDefaultModel(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="claude-3-opus">Claude 3 Opus</option>
                                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                    <option value="gemini-pro">Gemini Pro</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    The default model used when creating new agents
                                </p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={saveDefaultModel}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Save</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="macos-card p-6 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Sun className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Theme
                                </label>
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Light Mode */}
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'light'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <Sun className={`w-8 h-8 mx-auto mb-2 ${theme === 'light' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        <div className={`text-sm font-medium ${theme === 'light' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            Light
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Bright & clear
                                        </div>
                                    </button>

                                    {/* Dark Mode */}
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'dark'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <Moon className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        <div className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            Dark
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Easy on eyes
                                        </div>
                                    </button>

                                    {/* System Mode */}
                                    <button
                                        onClick={() => {
                                            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                                            setTheme(systemTheme)
                                        }}
                                        className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                                    >
                                        <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            System
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Auto-adjust
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="macos-card p-6 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage notification preferences</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Agent Completions</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Get notified when agents complete tasks</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Workflow Updates</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Updates about workflow execution</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Error Alerts</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Get notified about errors and failures</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="macos-card p-6 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Optimize application performance</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-save Workflows</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automatically save workflow changes</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable Caching</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cache responses for faster loading</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Language & Region */}
                    <div className="macos-card p-6 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Language & Region</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Set language and regional preferences</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Language
                                </label>
                                <select className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option>English (US)</option>
                                    <option>English (UK)</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Timezone
                                </label>
                                <select className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option>America/New_York (EST)</option>
                                    <option>America/Los_Angeles (PST)</option>
                                    <option>Europe/London (GMT)</option>
                                    <option>Europe/Paris (CET)</option>
                                    <option>Asia/Tokyo (JST)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
