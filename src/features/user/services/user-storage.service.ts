import { inject, Injectable } from '@angular/core';
import { SecureStorageService } from '@shared/services/secure-storage.service';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserStorageService {
  private readonly secureStorage = inject(SecureStorageService);

  // Storage keys
  private readonly USER_KEY = 'user_data';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Store user data securely
   * Uses different storage strategies based on data sensitivity
   */
  async storeUser(user: User): Promise<void> {
    // Set user data for key derivation (persists across page refreshes)
    this.secureStorage.setUserDataForEncryption(
      user.id.toString(),
      user.username,
    );

    // Also store user data in localStorage as backup (non-sensitive data)
    this.secureStorage.setItem('user_id', user.id.toString(), {
      strategy: 'local',
    });
    this.secureStorage.setItem('user_name', user.username, {
      strategy: 'local',
    });

    // Generate user-specific key for this session
    const userKey = await this.secureStorage.generateUserSpecificKey(
      user.id.toString(),
      user.username,
    );

    // Store sensitive token data in sessionStorage (persists across page refreshes)
    const encryptedToken = await this.secureStorage.encryptAsync(
      user.authToken,
      userKey,
    );
    this.secureStorage.setItem(this.TOKEN_KEY, encryptedToken, {
      strategy: 'session',
    });

    // Store refresh token in sessionStorage (encrypted, persists across page refreshes)
    if (user.refreshToken) {
      const encryptedRefreshToken = await this.secureStorage.encryptAsync(
        user.refreshToken,
        userKey,
      );
      this.secureStorage.setItem(
        this.REFRESH_TOKEN_KEY,
        encryptedRefreshToken,
        {
          strategy: 'session',
        },
      );
    }

    // Store non-sensitive user data in encrypted localStorage
    const userData = {
      id: user.id,
      name: user.username,
      expiresAt: user.expiresAt.toISOString(),
    };

    const encryptedUserData = await this.secureStorage.encryptAsync(
      JSON.stringify(userData),
      userKey,
    );
    this.secureStorage.setItem(this.USER_KEY, encryptedUserData, {
      strategy: 'local',
    });
  }

  /**
   * Retrieve user data from secure storage
   */
  async getUser(): Promise<User | null> {
    try {
      const userDataStr = this.secureStorage.getItem(this.USER_KEY, {
        strategy: 'local',
      });

      if (!userDataStr) {
        return null;
      }

      // Get user data from sessionStorage first, fallback to localStorage
      let userId = this.secureStorage.getItem('user_id', {
        strategy: 'session',
      });
      let username = this.secureStorage.getItem('user_name', {
        strategy: 'session',
      });

      // Fallback to localStorage if not found in sessionStorage
      if (!userId || !username) {
        userId = this.secureStorage.getItem('user_id', {
          strategy: 'local',
        });
        username = this.secureStorage.getItem('user_name', {
          strategy: 'local',
        });
      }

      if (!userId || !username) {
        // User data not available, clear everything
        this.clearUser();
        return null;
      }

      // Generate user-specific key using stored user data
      const userKey = await this.secureStorage.generateUserSpecificKey(
        userId,
        username,
      );

      // Decrypt user data
      const decryptedUserDataStr = await this.secureStorage.decryptAsync(
        userDataStr,
        userKey,
      );

      const userData = JSON.parse(decryptedUserDataStr);

      // Get and decrypt auth token from sessionStorage
      const token = this.secureStorage.getItem(this.TOKEN_KEY, {
        strategy: 'session',
      });

      // Get and decrypt refresh token
      const refreshToken = this.secureStorage.getItem(this.REFRESH_TOKEN_KEY, {
        strategy: 'session',
      });

      if (!token || !refreshToken) {
        return null;
      }

      // Decrypt the token
      const decryptedToken = await this.secureStorage.decryptAsync(
        token,
        userKey,
      );

      const decryptedRefreshToken = await this.secureStorage.decryptAsync(
        refreshToken,
        userKey,
      );

      return {
        id: userData.id,
        username: userData.name,
        authToken: decryptedToken,
        refreshToken: decryptedRefreshToken,
        expiresAt: new Date(userData.expiresAt),
      };
    } catch (error) {
      console.error('❌ Failed to retrieve user data:', error);
      this.clearUser();
      return null;
    }
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null && user.authToken !== null;
  }

  /**
   * Get only the auth token
   */
  async getAuthToken(): Promise<string | null> {
    // Get token from sessionStorage
    const token = this.secureStorage.getItem(this.TOKEN_KEY, {
      strategy: 'session',
    });

    if (!token) {
      return null;
    }

    // Get user data for key generation
    const userId = this.secureStorage.getItem('user_id', {
      strategy: 'session',
    });
    const username = this.secureStorage.getItem('user_name', {
      strategy: 'session',
    });

    if (!userId || !username) {
      return null;
    }

    // Generate user-specific key
    const userKey = await this.secureStorage.generateUserSpecificKey(
      userId,
      username,
    );

    // Decrypt the token
    return await this.secureStorage.decryptAsync(token, userKey);
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    const refreshToken = this.secureStorage.getItem(this.REFRESH_TOKEN_KEY, {
      strategy: 'session',
    });

    if (!refreshToken) {
      return null;
    }

    // Get user data for key generation
    const userId = this.secureStorage.getItem('user_id', {
      strategy: 'session',
    });
    const username = this.secureStorage.getItem('user_name', {
      strategy: 'session',
    });

    if (!userId || !username) {
      return null;
    }

    // Generate user-specific key
    const userKey = await this.secureStorage.generateUserSpecificKey(
      userId,
      username,
    );

    // Decrypt the refresh token
    return await this.secureStorage.decryptAsync(refreshToken, userKey);
  }

  /**
   * Update auth token (useful for token refresh)
   */
  async updateAuthToken(token: string): Promise<void> {
    // Get user data for key generation
    const userId = this.secureStorage.getItem('user_id', {
      strategy: 'session',
    });
    const username = this.secureStorage.getItem('user_name', {
      strategy: 'session',
    });

    if (!userId || !username) {
      throw new Error('User data not available for token update');
    }

    // Generate user-specific key
    const userKey = await this.secureStorage.generateUserSpecificKey(
      userId,
      username,
    );

    // Encrypt the token
    const encryptedToken = await this.secureStorage.encryptAsync(
      token,
      userKey,
    );

    this.secureStorage.setItem(this.TOKEN_KEY, encryptedToken, {
      strategy: 'session',
    });
  }

  /**
   * Clear all user data from storage
   */
  clearUser(): void {
    this.secureStorage.removeItem(this.USER_KEY, { strategy: 'local' });
    this.secureStorage.removeItem(this.TOKEN_KEY, { strategy: 'session' });
    this.secureStorage.removeItem(this.REFRESH_TOKEN_KEY, {
      strategy: 'session',
    });
    // Clear user data used for key generation
    this.secureStorage.removeItem('user_id', { strategy: 'session' });
    this.secureStorage.removeItem('user_name', { strategy: 'session' });
  }

  /**
   * Clear all storage (useful for logout)
   */
  clearAll(): void {
    this.secureStorage.clear();
  }
}
