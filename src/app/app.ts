import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { SnackbarComponent } from '@shared/components/snackbar/snackbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnackbarComponent, MatButtonModule],
  templateUrl: './app.html',
})
export class App {
  public throwTestError(): void {
    throw new Error('Sentry Test Error');
  }
}
