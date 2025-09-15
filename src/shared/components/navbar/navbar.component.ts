import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

  get user(): User | null {
    return this.userStore.user();
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenus(): void {
    this.isMenuOpen.set(false);
  }

  get userButtonText(): string {
    return this.user ? 'Logout' : 'Login';
  }

  isUserButtonDisabled = computed(() => this.userStore.isLoading());

  public async onUserButtonClick(): Promise<void> {
    if (this.user) {
      this.onLogout();
    } else {
      this.onLoginClick();
    }
  }

  private onLoginClick(): void {
    this.router.navigate(['/login']);
  }

  private onLogout(): void {
    if (!this.user) {
      return;
    }

    this.dispatcher.dispatch(userEvent.logout());
    this.router.navigate(['/inicio']);
  }
}
