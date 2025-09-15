import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../models/user';
import { DeviceStorageService } from './device-storage.service';
import { UserStorageService } from './user-storage.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private userService = inject(UserService);
  private userStorage = inject(UserStorageService);
  private deviceStorage = inject(DeviceStorageService);
  private isRefreshing = false;
  private refreshPromise: Promise<User> | null = null;

  /**
   * Refreshes the user's token if it's expired or about to expire
   * @param user The current user object
   * @returns Observable<User> with the refreshed user data
   */
  refreshTokenIfNeeded(user: User): Observable<User> {
    // If token is still valid (not expired and has at least 5 minutes left)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (user.expiresAt > fiveMinutesFromNow) {
      return of(user);
    }

    // If we don't have a refresh token, we can't refresh
    if (!user.refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return new Observable((observer) => {
        this.refreshPromise!.then(
          (refreshedUser) => observer.next(refreshedUser),
          (error) => observer.error(error),
        );
      });
    }

    // Start the refresh process
    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(user);

    return new Observable((observer) => {
      this.refreshPromise!.then(
        (refreshedUser) => {
          this.isRefreshing = false;
          this.refreshPromise = null;
          observer.next(refreshedUser);
          observer.complete();
        },
        (error) => {
          this.isRefreshing = false;
          this.refreshPromise = null;
          observer.error(error);
        },
      );
    });
  }

  private async performTokenRefresh(user: User): Promise<User> {
    try {
      const refreshedUser = await this.userService
        .refreshToken({
          refreshToken: user.refreshToken!,
          deviceId: this.deviceStorage.getDeviceId(),
        })
        .toPromise();

      if (!refreshedUser) {
        throw new Error('Token refresh failed');
      }

      // Store the refreshed user
      await this.userStorage.storeUser(refreshedUser);

      return refreshedUser;
    } catch (error) {
      // Clear user data on refresh failure
      this.userStorage.clearUser();
      throw error;
    }
  }

  /**
   * Checks if a token is expired or about to expire
   * @param user The user object to check
   * @returns boolean indicating if token needs refresh
   */
  isTokenExpiredOrExpiring(user: User): boolean {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return user.expiresAt <= fiveMinutesFromNow;
  }
}
