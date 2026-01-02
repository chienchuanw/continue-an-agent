/**
 * Secure API Key Manager
 *
 * This service manages API keys using VSCode Secret Storage instead of plain text config files.
 * It provides a secure way to store and retrieve API keys for different LLM providers.
 *
 * Design Principles:
 * - Security-first: Never store API keys in plain text
 * - Provider-agnostic: Works with any LLM provider
 * - IDE-integrated: Uses VSCode Secret Storage API
 *
 * @see extensions/vscode/src/stubs/SecretStorage.ts - VSCode implementation
 * @see docs/roadmap.md - Phase 0.3 API Key Security Management
 */

import { IDE } from "../index.js";

/**
 * Secure API Key Manager
 *
 * Manages API keys using IDE's secure storage mechanism.
 */
export class SecureApiKeyManager {
  private static readonly KEY_PREFIX = "continue.apiKey.";

  constructor(private readonly ide: IDE) {}

  /**
   * Store an API key securely
   *
   * @param provider - Provider name (e.g., "anthropic", "openai")
   * @param apiKey - API key to store
   */
  async storeApiKey(provider: string, apiKey: string): Promise<void> {
    const key = this.getStorageKey(provider);
    await this.ide.writeSecrets({ [key]: apiKey });
  }

  /**
   * Retrieve an API key
   *
   * @param provider - Provider name
   * @returns API key or undefined if not found
   */
  async getApiKey(provider: string): Promise<string | undefined> {
    const key = this.getStorageKey(provider);
    const secrets = await this.ide.readSecrets([key]);
    const value = secrets[key];
    // Treat empty string as undefined (deleted key)
    return value === "" ? undefined : value;
  }

  /**
   * Delete an API key
   *
   * @param provider - Provider name
   */
  async deleteApiKey(provider: string): Promise<void> {
    const key = this.getStorageKey(provider);
    // VSCode Secret Storage doesn't have a delete method in the IDE interface
    // We store an empty string to effectively delete it
    await this.ide.writeSecrets({ [key]: "" });
  }

  /**
   * Check if an API key exists for a provider
   *
   * @param provider - Provider name
   * @returns true if API key exists
   */
  async hasApiKey(provider: string): Promise<boolean> {
    const apiKey = await this.getApiKey(provider);
    return apiKey !== undefined && apiKey !== "";
  }

  /**
   * List all providers with stored API keys
   *
   * This is a best-effort implementation since the IDE interface
   * doesn't provide a way to list all keys. We check common providers.
   *
   * @returns Array of provider names
   */
  async listProviders(): Promise<string[]> {
    const commonProviders = [
      "anthropic",
      "openai",
      "gemini",
      "mistral",
      "cohere",
      "groq",
      "together",
      "replicate",
    ];

    const providers: string[] = [];

    for (const provider of commonProviders) {
      if (await this.hasApiKey(provider)) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Get storage key for a provider
   *
   * @param provider - Provider name
   * @returns Storage key
   */
  private getStorageKey(provider: string): string {
    return `${SecureApiKeyManager.KEY_PREFIX}${provider}`;
  }

  /**
   * Migrate API key from config to secure storage
   *
   * This helper method can be used to migrate existing plain text API keys
   * from config files to secure storage.
   *
   * @param provider - Provider name
   * @param apiKey - API key from config
   */
  async migrateFromConfig(provider: string, apiKey: string): Promise<void> {
    if (apiKey && apiKey.trim() !== "") {
      await this.storeApiKey(provider, apiKey);
    }
  }

  /**
   * Get API key with fallback to environment variable
   *
   * This method first checks secure storage, then falls back to environment variables.
   * Useful for backward compatibility and CI/CD environments.
   *
   * @param provider - Provider name
   * @param envVarName - Environment variable name (e.g., "ANTHROPIC_API_KEY")
   * @returns API key or undefined
   */
  async getApiKeyWithFallback(
    provider: string,
    envVarName: string,
  ): Promise<string | undefined> {
    // First try secure storage
    const storedKey = await this.getApiKey(provider);
    if (storedKey) {
      return storedKey;
    }

    // Fall back to environment variable
    return process.env[envVarName];
  }
}
