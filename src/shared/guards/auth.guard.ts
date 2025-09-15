import { inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { UserStore } from '@features/user/store/user-store';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private userStore = inject(UserStore);

  async canActivate(): Promise<boolean> {
    const user = this.userStore.user();
    return !!user;
  }
}
