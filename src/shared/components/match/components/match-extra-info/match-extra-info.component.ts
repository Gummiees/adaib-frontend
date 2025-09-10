import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailedMatch } from '@shared/models/match';

@Component({
  selector: 'app-match-extra-info',
  templateUrl: './match-extra-info.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchExtraInfoComponent {
  public match = input.required<DetailedMatch>();
}
