import { inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { UserStore } from '@features/user/store/user-store';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  private userStore = inject(UserStore);

  async canActivate(): Promise<boolean> {
    // Wait for the initial loading to complete
    if (this.userStore.isLoading()) {
      await this.waitForLoadingToComplete();
    }

    const user = this.userStore.user();
    return !!user;
  }

  private async waitForLoadingToComplete(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkLoading = () => {
        if (!this.userStore.isLoading()) {
          resolve();
        } else {
          // Use requestAnimationFrame for efficient polling
          requestAnimationFrame(checkLoading);
        }
      };
      checkLoading();
    });
  }
}
