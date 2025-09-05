import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { userEvent } from '@features/user/store/user-events';
import { Dispatcher } from '@ngrx/signals/events';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class LoginComponent {
  private dispatcher = inject(Dispatcher);

  onLoginClick(): void {
    // FIXME: use real values
    this.dispatcher.dispatch(userEvent.login({ email: '', password: '' }));
  }
}
