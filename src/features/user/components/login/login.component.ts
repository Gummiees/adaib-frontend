import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { UserLogin } from '@features/user/models/user';
import { userEvent } from '@features/user/store/user-events';
import { Dispatcher } from '@ngrx/signals/events';
import { UserStore } from '../../store/user-store';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
})
export class LoginComponent {
  public userStore = inject(UserStore);
  private dispatcher = inject(Dispatcher);
  private router = inject(Router);

  public isLoading = computed(() => this.userStore.isLoading());

  private formSubmitted = false;
  public form = new FormGroup({
    username: new FormControl(null, [Validators.required]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(4),
    ]),
  });

  public get username(): FormControl {
    return this.form.get('username') as FormControl;
  }

  public get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  public isButtonDisabled = computed(() => {
    return this.isLoading();
  });

  public shouldShowUsernameError(): boolean {
    return this.formSubmitted && this.username.invalid && this.username.touched;
  }

  public shouldShowPasswordError(): boolean {
    return this.formSubmitted && this.password.invalid && this.password.touched;
  }

  public onUsernameInput(): void {
    if (this.formSubmitted) {
      this.formSubmitted = false;
    }
  }

  public onPasswordInput(): void {
    if (this.formSubmitted) {
      this.formSubmitted = false;
    }
  }

  constructor() {
    effect(() => {
      if (this.userStore.user()) {
        this.router.navigate(['/']);
      }
      if (this.isLoading()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  onLoginClick(): void {
    if (this.isLoading()) {
      return;
    }

    this.formSubmitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const userLogin: UserLogin = {
      username: this.username.value,
      password: this.password.value,
    };
    this.dispatcher.dispatch(userEvent.login(userLogin));
  }
}
