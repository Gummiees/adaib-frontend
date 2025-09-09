import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatchInfoComponent } from '@shared/components/match/components/match-info/match-info.component';
import { MatchScoreComponent } from '@shared/components/match/components/match-score/match-score.component';
import { MatchTeamComponent } from '@shared/components/match/components/match-team/match-team.component';
import { Match } from '@shared/models/match';
import { Team } from '@shared/models/team';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatchTeamComponent,
    MatchScoreComponent,
    MatchInfoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchComponent {
  public match = input.required<Match>();

  public isTeamWinner(team: Team) {
    const match = this.match();
    if (!match.result) return false;
    return match.result === 'Home'
      ? match.homeTeam.id === team.id
      : match.awayTeam?.id === team.id;
  }
}
