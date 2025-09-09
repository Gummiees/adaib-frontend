import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Match } from '@shared/models/match';

@Component({
  selector: 'app-match-info',
  templateUrl: './match-info.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchInfoComponent {
  public match = input.required<Match>();
}
