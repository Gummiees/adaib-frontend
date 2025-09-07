import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { Competition } from '@features/competitions/models/competition';

@Component({
  selector: 'app-competition-card',
  templateUrl: './competition-card.component.html',
  styleUrls: ['./competition-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CommonModule, MatProgressBarModule],
})
export class CompetitionCardComponent {
  competition = input.required<Competition>();
  progress = computed(() => {
    const competition = this.competition();
    const { status, startDate, endDate } = competition;
    if (!startDate || !endDate) {
      return 1;
    }

    switch (status) {
      case 'NotStarted':
        return 1;
      case 'Finished':
        return 100;
      case 'Ongoing': {
        const progress = this.getProgress(startDate, endDate);
        return Math.max(0, Math.min(100, progress));
      }
    }
  });

  statusClass = computed(() => {
    const competition = this.competition();
    switch (competition.status) {
      case 'NotStarted':
        return 'status-not-started';
      case 'Ongoing':
        return 'status-ongoing';
      case 'Finished':
        return 'status-finished';
      default:
        return 'status-not-started';
    }
  });

  private getProgressPercentage(
    elapsed: number,
    totalDuration: number,
  ): number {
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  }

  private getProgress(startDate: Date, endDate: Date): number {
    const now = new Date();

    if (startDate > endDate || startDate > now) {
      return 1;
    }

    if (endDate < now) {
      return 1;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return this.getProgressPercentage(elapsed, totalDuration);
  }
}
