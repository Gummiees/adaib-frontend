import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailedCompetition } from '@shared/models/competition';

@Component({
  selector: 'app-competition-info',
  templateUrl: './competition-info.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitionInfoComponent {
  public competition = input.required<DetailedCompetition>();
}
