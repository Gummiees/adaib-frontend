import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetailedCompetition } from '@shared/models/competition';

@Component({
  selector: 'app-competition-info',
  templateUrl: './competition-info.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitionInfoComponent {
  public competition = input.required<DetailedCompetition>();
}
