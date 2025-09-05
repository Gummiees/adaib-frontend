import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { User } from '@features/user/models/user';
import { userEvent } from '@features/user/store/user-events';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, CommonModule, MatButtonModule],
})
export class NavbarComponent {
  private userStore = inject(UserStore);
  private router = inject(Router);
  private dispatcher = inject(Dispatcher);

  isMenuOpen = signal(false);
  userMenuOpen = signal(false);

  get user(): User | null {
    return this.userStore.user();
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  closeMenus(): void {
    this.isMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  async onLogout(): Promise<void> {
    if (!this.userMenuOpen() || !this.user) {
      return;
    }

    this.dispatcher.dispatch(userEvent.logout());
  }

  onLoginClick(): void {
    this.router.navigate(['/login']);
  }
}
