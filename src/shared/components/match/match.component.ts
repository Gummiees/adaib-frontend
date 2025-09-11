import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatchInfoComponent } from '@shared/components/match/components/match-info/match-info.component';
import { MatchScoreComponent } from '@shared/components/match/components/match-score/match-score.component';
import { MatchTeamComponent } from '@shared/components/match/components/match-team/match-team.component';
import { DetailedMatch, Match } from '@shared/models/match';
import { Team } from '@shared/models/team';
import { MatchExtraInfoComponent } from './components/match-extra-info/match-extra-info.component';

@Component({
  selector: 'app-match',
  templateUrl: './match.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatchTeamComponent,
    MatchScoreComponent,
    MatchInfoComponent,
    MatchExtraInfoComponent,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchComponent {
  public match = input.required<Match>();
  public showExtraInfo = input<boolean>(false);
  public compactView = input<boolean>(false);
  public matchTeamClicked = output<Team>();

  public isDetailedMatch = computed<boolean>(() => {
    return 'phaseName' in this.match();
  });

  public detailedMatch = computed<DetailedMatch>(() => {
    return this.match() as DetailedMatch;
  });

  public isTeamWinner(team: Team) {
    const match = this.match();
    if (!match.result) return false;
    return match.result === 'Home'
      ? match.homeTeam.id === team.id
      : match.awayTeam?.id === team.id;
  }

  public onMatchTeamClicked(team: Team): void {
    this.matchTeamClicked.emit(team);
  }

  public isMatchOngoing(): boolean {
    return this.match().status === 'Ongoing';
  }
}
