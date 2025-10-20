import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { MatchComponent } from '@shared/components/match/match.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
import { DetailedMatch } from '@shared/models/match';
import { DetailedTeam, Team } from '@shared/models/team';
import {
  sortMatches,
  sortMatchesByDateOldestToNewest,
} from '@shared/utils/utils';
import { TeamInfoComponent } from './components/team-info.component';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  standalone: true,
  providers: [CompetitionStore, CompetitionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NotFoundComponent,
    CommonModule,
    FullSpinnerComponent,
    TeamInfoComponent,
    MatchComponent,
  ],
})
export class TeamComponent {
  public competitionStore = inject(CompetitionStore);
  private router = inject(Router);
  public teamId = input.required<number>();
  public competition = input.required<DetailedCompetition>();
  public errorButtonClick = output<void>();

  public team = computed<DetailedTeam | null>(() => {
    const teamId = this.teamId();
    const competition = this.competition();

    const team = competition.teams.find((team) => team.id === teamId);
    if (!team) {
      return null;
    }

    const detailedTeam: DetailedTeam = {
      ...team,
      matches: this.getTeamMatches(team.id, competition),
    };

    return detailedTeam;
  });

  public futureMatches = computed<DetailedMatch[]>(() => {
    return sortMatchesByDateOldestToNewest(
      this.team()?.matches.filter(
        (match) =>
          match.status === 'NotStarted' ||
          (match.date && match.date > new Date() && match.status === 'Rest'),
      ) || [],
    );
  });

  public pastMatches = computed<DetailedMatch[]>(() => {
    return (
      this.team()?.matches.filter(
        (match) =>
          match.status === 'Finished' ||
          match.status === 'Cancelled' ||
          match.status === 'OnGoing' ||
          match.status === 'NoShow' ||
          (match.date && match.date <= new Date() && match.status === 'Rest'),
      ) || []
    );
  });

  public onNotFoundButtonClick(): void {
    this.errorButtonClick.emit();
  }

  private getTeamMatches(
    teamId: number,
    competition: DetailedCompetition,
  ): DetailedMatch[] {
    const matches = competition.phases.flatMap((phase) =>
      phase.groups.flatMap((group) =>
        group.matches.filter(
          (match) =>
            match.homeTeam.id === teamId || match.awayTeam?.id === teamId,
        ),
      ),
    );

    return sortMatches(
      matches.filter(
        (match, index, self) =>
          index === self.findIndex((m) => m.id === match.id),
      ),
    );
  }

  public onMatchTeamClicked(team: Team): void {
    this.router.navigate(['/competiciones', this.competition().id], {
      queryParams: { tab: 'equipos', equipo: team.id.toString() },
    });
  }
}
