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
    return (
      this.team()?.matches.filter(
        (match) =>
          match.status === 'NotStarted' ||
          match.status === 'Postponed' ||
          (match.date && match.date > new Date() && match.status === 'Rest'),
      ) || []
    );
  });

  public pastMatches = computed<DetailedMatch[]>(() => {
    return (
      this.team()?.matches.filter(
        (match) =>
          match.status === 'Finished' ||
          match.status === 'Cancelled' ||
          match.status === 'Ongoing' ||
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

    const uniqueMatches = matches.filter(
      (match, index, self) =>
        index === self.findIndex((m) => m.id === match.id),
    );

    return uniqueMatches.sort((a, b) => {
      const aTime = a.date?.getTime() ?? -Infinity;
      const bTime = b.date?.getTime() ?? -Infinity;
      return bTime - aTime;
    });
  }

  public getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      NotStarted: 'No iniciado',
      Ongoing: 'En curso',
      Finished: 'Finalizado',
      Cancelled: 'Cancelado',
      Postponed: 'Aplazado',
      Rest: 'Descanso',
    };
    return statusMap[status] || status;
  }

  public getStatusClass(status: string): string {
    const statusClassMap: Record<string, string> = {
      NotStarted: 'bg-gray-100 text-gray-800',
      Ongoing: 'bg-blue-100 text-blue-800',
      Finished: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
      Postponed: 'bg-yellow-100 text-yellow-800',
      Rest: 'bg-purple-100 text-purple-800',
    };
    return statusClassMap[status] || 'bg-gray-100 text-gray-800';
  }

  public onMatchTeamClicked(team: Team) {
    this.router.navigate(['/competiciones', this.competition().id], {
      queryParams: { tab: 'equipos', equipo: team.id.toString() },
    });
  }
}
