import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailedCompetition } from '@shared/models/competition';
import { CompetitionInfoComponent } from './components/competition-info.component';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  standalone: true,
  imports: [CommonModule, CompetitionInfoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  public competition = input.required<DetailedCompetition>();
}
