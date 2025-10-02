/**
 * Secure Credential Management Service
 * 
 * Uses Tauri Stronghold plugin for encrypted storage of sensitive API keys
 * and Tauri Store plugin for general application settings.
 * 
 * Stronghold provides encrypted, secure storage ideal for API keys and tokens.
 * Store provides simple key-value storage for non-sensitive configuration.
 */

import { Store } from '@tauri-apps/plugin-store';
import { Stronghold, Client } from '@tauri-apps/plugin-stronghold';

// Types for supported API keys
export enum ApiKeyType {
  OPENAI = 'openai_api_key',
  ANTHROPIC = 'anthropic_api_key',
  GOOGLE_AI = 'google_ai_api_key',
  COMPOSIO = 'composio_api_key',
}

interface ApiKeyValidationResult {
  valid: boolean;
  message?: string;
}

class CredentialService {
  private stronghold: Stronghold | null = null;
  private client: Client | null = null;
  private store: Store | null = null;
  private initialized = false;

  /**
   * Initialize the credential service
   * Must be called before using any other methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize Stronghold for encrypted API keys
      const vaultPath = 'vault.hold';
      const vaultKey = await this.getOrCreateVaultKey();
      
      this.stronghold = await Stronghold.load(vaultPath, vaultKey);
      
      const clientName = 'agent_dojo_credentials';
      try {
        this.client = await this.stronghold.loadClient(clientName);
      } catch {
        this.client = await this.stronghold.createClient(clientName);
      }

      // Initialize Store for general settings
      this.store = await Store.load('settings.json');

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize credential service:', error);
      throw new Error('Could not initialize secure storage');
    }
  }

  /**
   * Get or create a vault encryption key
   * In production, this should prompt the user for a password
   */
  private async getOrCreateVaultKey(): Promise<string> {
    if (!this.store) {
      this.store = await Store.load('settings.json');
    }

    let vaultKey = await this.store.get<string>('vault_key');
    
    if (!vaultKey) {
      // Generate a random key for first-time setup
      // TODO: In production, prompt user for a master password
      vaultKey = this.generateSecureKey();
      await this.store.set('vault_key', vaultKey);
      await this.store.save();
    }

    return vaultKey;
  }

  /**
   * Generate a secure random key
   */
  private generateSecureKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store an API key securely in Stronghold
   */
  async setApiKey(type: ApiKeyType, key: string): Promise<void> {
    await this.ensureInitialized();

    try {
      const store = this.client!.getStore();
      const data = Array.from(new TextEncoder().encode(key));
      await store.insert(type, data);
      await this.stronghold!.save();
    } catch (error) {
      console.error(`Failed to store API key ${type}:`, error);
      throw new Error(`Could not save ${type}`);
    }
  }

  /**
   * Retrieve an API key from Stronghold
   */
  async getApiKey(type: ApiKeyType): Promise<string | null> {
    await this.ensureInitialized();

    try {
      const store = this.client!.getStore();
      const data = await store.get(type);
      
      if (!data) return null;
      
      return new TextDecoder().decode(new Uint8Array(data));
    } catch (error) {
      console.error(`Failed to retrieve API key ${type}:`, error);
      return null;
    }
  }

  /**
   * Delete an API key from Stronghold
   */
  async deleteApiKey(type: ApiKeyType): Promise<void> {
    await this.ensureInitialized();

    try {
      const store = this.client!.getStore();
      await store.remove(type);
      await this.stronghold!.save();
    } catch (error) {
      console.error(`Failed to delete API key ${type}:`, error);
      throw new Error(`Could not delete ${type}`);
    }
  }

  /**
   * Validate an API key by testing it against the provider
   */
  async validateApiKey(type: ApiKeyType, key: string): Promise<ApiKeyValidationResult> {
    // Basic format validation
    if (!key || key.trim().length === 0) {
      return { valid: false, message: 'API key cannot be empty' };
    }

    switch (type) {
      case ApiKeyType.OPENAI:
        if (!key.startsWith('sk-')) {
          return { valid: false, message: 'OpenAI keys should start with "sk-"' };
        }
        if (key.length < 40) {
          return { valid: false, message: 'OpenAI key appears too short' };
        }
        break;

      case ApiKeyType.ANTHROPIC:
        if (!key.startsWith('sk-ant-')) {
          return { valid: false, message: 'Anthropic keys should start with "sk-ant-"' };
        }
        break;

      case ApiKeyType.GOOGLE_AI:
        if (key.length < 30) {
          return { valid: false, message: 'Google AI key appears too short' };
        }
        break;

      case ApiKeyType.COMPOSIO:
        if (key.length < 20) {
          return { valid: false, message: 'Composio key appears too short' };
        }
        break;
    }

    // TODO: Add actual API validation by making test requests
    // For now, just return valid if format checks pass
    return { valid: true };
  }

  /**
   * Check if an API key is stored
   */
  async hasApiKey(type: ApiKeyType): Promise<boolean> {
    const key = await this.getApiKey(type);
    return key !== null && key.length > 0;
  }

  /**
   * Get all configured API keys (returns only the types, not the actual keys)
   */
  async getConfiguredKeys(): Promise<ApiKeyType[]> {
    const configured: ApiKeyType[] = [];
    
    for (const type of Object.values(ApiKeyType)) {
      if (await this.hasApiKey(type)) {
        configured.push(type);
      }
    }
    
    return configured;
  }

  /**
   * Store a general application setting
   */
  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.store!.set(key, value);
      await this.store!.save();
    } catch (error) {
      console.error(`Failed to store setting ${key}:`, error);
      throw new Error(`Could not save setting ${key}`);
    }
  }

  /**
   * Retrieve a general application setting
   */
  async getSetting<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();
    
    try {
      const value = await this.store!.get<T>(key);
      return value || null;
    } catch (error) {
      console.error(`Failed to retrieve setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Clear all stored credentials (use with caution!)
   */
  async clearAllCredentials(): Promise<void> {
    await this.ensureInitialized();

    for (const type of Object.values(ApiKeyType)) {
      try {
        await this.deleteApiKey(type);
      } catch {
        // Continue even if deletion fails
      }
    }
  }
}

// Export singleton instance
export const credentialService = new CredentialService();

// Utility function to mask API keys for display
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
