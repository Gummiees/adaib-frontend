import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserStore } from '@features/user/store/user-store';
import { FullScreenSpinnerComponent } from '@shared/components/full-screen-spinner/full-screen-spinner.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FullScreenSpinnerComponent,
    CommonModule,
  ],
  templateUrl: './app.html',
})
export class App {
  public userStore = inject(UserStore);
}
