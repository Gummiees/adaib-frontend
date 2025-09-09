import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Competition } from '@shared/models/competition';
import { CompetitionProgressComponent } from '../competition-progress/competition-progress.component';

@Component({
  selector: 'app-competition-card',
  templateUrl: './competition-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CommonModule,
    CompetitionProgressComponent,
    MatIconModule,
  ],
})
export class CompetitionCardComponent {
  competition = input.required<Competition>();
}
