import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Team } from '@shared/models/team';

export type MatchTeamPosition = 'left' | 'right';

@Component({
  selector: 'app-match-team',
  templateUrl: './match-team.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchTeamComponent {
  public isWinner = input.required<boolean>();
  public team = input.required<Team>();
  public position = input<MatchTeamPosition>();
}
