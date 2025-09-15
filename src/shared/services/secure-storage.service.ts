import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { EncryptionService } from './encryption.service';

export type StorageStrategy = 'session' | 'local';

export interface StorageOptions {
  strategy?: StorageStrategy;
  encrypt?: boolean;
  expires?: Date; // Only for cookie strategy
}

@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private readonly memoryStorage = new Map<string, string>();
  private readonly encryptionService = inject(EncryptionService);
  private readonly encryptionKey = environment.secureStorageKey;

  /**
   * Store data securely using the specified strategy
   */
  setItem(key: string, value: string, options: StorageOptions = {}): void {
    const { strategy = 'local' } = options;

    const processedValue = value;

    switch (strategy) {
      case 'session':
        try {
          sessionStorage.setItem(key, processedValue);
        } catch (_error) {
          console.warn(
            'SessionStorage not available, falling back to memory storage',
          );
          this.memoryStorage.set(key, processedValue);
        }
        break;
      case 'local':
        try {
          localStorage.setItem(key, processedValue);
        } catch (_error) {
          console.warn(
            'LocalStorage not available, falling back to memory storage',
          );
          this.memoryStorage.set(key, processedValue);
        }
        break;
    }
  }

  /**
   * Retrieve data from secure storage
   */
  getItem(key: string, options: StorageOptions = {}): string | null {
    const { strategy = 'local' } = options;
    let value: string | null = null;

    switch (strategy) {
      case 'session':
        try {
          value = sessionStorage.getItem(key);
        } catch (_error) {
          console.warn('SessionStorage not available, trying memory storage');
          value = this.memoryStorage.get(key) || null;
        }
        break;
      case 'local':
        try {
          value = localStorage.getItem(key);
        } catch (_error) {
          console.warn('LocalStorage not available, trying memory storage');
          value = this.memoryStorage.get(key) || null;
        }
        break;
    }

    return value;
  }

  /**
   * Remove data from secure storage
   */
  removeItem(key: string, options: StorageOptions = {}): void {
    const { strategy = 'local' } = options;

    switch (strategy) {
      case 'session':
        try {
          sessionStorage.removeItem(key);
        } catch (_error) {
          console.warn(
            'SessionStorage not available, removing from memory storage',
          );
          this.memoryStorage.delete(key);
        }
        break;
      case 'local':
        try {
          localStorage.removeItem(key);
        } catch (_error) {
          console.warn(
            'LocalStorage not available, removing from memory storage',
          );
          this.memoryStorage.delete(key);
        }
        break;
    }
  }

  /**
   * Clear all data from all storage strategies
   */
  clear(): void {
    this.memoryStorage.clear();

    try {
      sessionStorage.clear();
    } catch (_error) {
      console.warn('SessionStorage not available for clearing');
    }

    try {
      localStorage.clear();
    } catch (_error) {
      console.warn('LocalStorage not available for clearing');
    }
  }

  /**
   * Check if a key exists in storage
   */
  hasItem(key: string, options: StorageOptions = {}): boolean {
    return this.getItem(key, options) !== null;
  }

  /**
   * Set user data for key derivation
   * Call this after user login to enable user-specific encryption
   */
  setUserDataForEncryption(userId: string, username: string): void {
    // Store user data for key derivation using the service's methods
    this.setItem('user_id', userId, { strategy: 'session' });
    this.setItem('user_name', username, { strategy: 'session' });

    // Clear the current key to force regeneration with user data
    localStorage.removeItem('_encryption_key');
  }

  /**
   * Generate a user-specific encryption key using the encryption service
   * This is the most secure method for production applications
   */
  async generateUserSpecificKey(
    userId: string,
    username: string,
  ): Promise<string> {
    return await this.encryptionService.generateKeyFromPassword(
      `${userId}:${username}`,
    );
  }

  /**
   * Asynchronous encryption using the encryption service with environment key
   */
  async encryptAsync(text: string, key?: string): Promise<string> {
    const encryptionKey = key || this.encryptionKey;
    return await this.encryptionService.encrypt(text, encryptionKey);
  }

  /**
   * Asynchronous decryption using the encryption service with environment key
   */
  async decryptAsync(encryptedText: string, key?: string): Promise<string> {
    const encryptionKey = key || this.encryptionKey;
    return await this.encryptionService.decrypt(encryptedText, encryptionKey);
  }
}
