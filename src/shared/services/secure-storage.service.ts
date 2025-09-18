import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { EncryptionService } from './encryption.service';

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
  setItem(key: string, value: string): void {
    const processedValue = value;

    try {
      localStorage.setItem(key, processedValue);
    } catch (_error) {
      console.warn(
        'LocalStorage not available, falling back to memory storage',
      );
      this.memoryStorage.set(key, processedValue);
    }
  }

  /**
   * Retrieve data from secure storage
   */
  getItem(key: string): string | null {
    let value: string | null = null;

    try {
      value = localStorage.getItem(key);
    } catch (_error) {
      console.warn('LocalStorage not available, trying memory storage');
      value = this.memoryStorage.get(key) || null;
    }

    return value;
  }

  /**
   * Remove data from secure storage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (_error) {
      console.warn('LocalStorage not available, removing from memory storage');
      this.memoryStorage.delete(key);
    }
  }

  /**
   * Clear all data from all storage strategies
   */
  clear(): void {
    this.memoryStorage.clear();

    try {
      localStorage.clear();
    } catch (_error) {
      console.warn('LocalStorage not available for clearing');
    }
  }

  /**
   * Check if a key exists in storage
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Set user data for key derivation
   * Call this after user login to enable user-specific encryption
   */
  setUserDataForEncryption(userId: string, username: string): void {
    // Store user data for key derivation using the service's methods
    this.setItem('user_id', userId);
    this.setItem('user_name', username);

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
