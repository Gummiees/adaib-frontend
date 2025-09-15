import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

export interface EncryptionOptions {
  keyLength?: number;
  iterations?: number;
  salt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  /**
   * Encrypt text using AES-GCM
   */
  async encrypt(text: string, key: string): Promise<string> {
    return this.encryptAESGCM(text, key);
  }

  /**
   * Decrypt text using AES-GCM
   */
  async decrypt(encryptedText: string, key: string): Promise<string> {
    return this.decryptAESGCM(encryptedText, key);
  }

  /**
   * Generate a key from a password using PBKDF2
   */
  async generateKeyFromPassword(
    password: string,
    iterations = 100000,
  ): Promise<string> {
    try {
      const salt = environment.secureStorageSalt;
      const saltBuffer = salt
        ? new TextEncoder().encode(salt)
        : crypto.getRandomValues(new Uint8Array(16));

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits'],
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256,
      );

      return Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to generate key from password:', error);
      throw new Error('Failed to generate key from password');
    }
  }

  /**
   * Generate a user-specific key using Web Crypto API
   */
  async generateUserSpecificKey(
    userId: string,
    username: string,
  ): Promise<string> {
    try {
      // Combine user data for key derivation
      const userData = `${userId}:${username}:${Date.now()}`;

      return await this.generateKeyFromPassword(userData);
    } catch (error) {
      console.error('Failed to generate user-specific key:', error);
      throw new Error('Failed to generate secure encryption key');
    }
  }

  /**
   * AES-GCM encryption using Web Crypto API
   */
  private async encryptAESGCM(text: string, key: string): Promise<string> {
    try {
      const keyBuffer = this.hexToArrayBuffer(key);
      const textBuffer = new TextEncoder().encode(text);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt'],
      );

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        textBuffer,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('AES-GCM encryption failed:', error);
      throw new Error('AES-GCM encryption failed');
    }
  }

  /**
   * AES-GCM decryption using Web Crypto API
   */
  private async decryptAESGCM(
    encryptedText: string,
    key: string,
  ): Promise<string> {
    try {
      const keyBuffer = this.hexToArrayBuffer(key);
      const combined = new Uint8Array(
        atob(encryptedText)
          .split('')
          .map((c) => c.charCodeAt(0)),
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        encrypted,
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('AES-GCM decryption failed:', error);
      throw new Error('AES-GCM decryption failed');
    }
  }

  /**
   * Convert hex string to ArrayBuffer
   */
  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }
}
