import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import * as Sentry from '@sentry/angular';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class LandingComponent {
  public testLog(): void {
    Sentry.logger.info('User triggered test log', {
      log_source: 'sentry_test',
    });
  }
  public throwTestError(): void {
    throw new Error('Sentry Test Error');
  }
}
