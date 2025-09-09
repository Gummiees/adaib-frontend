import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Match } from '@shared/models/match';

@Component({
  selector: 'app-match-score',
  templateUrl: './match-score.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchScoreComponent {
  public match = input.required<Match>();
}
