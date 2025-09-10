import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
import { Match } from '@shared/models/match';
import { DetailedTeam } from '@shared/models/team';
import { CompetitionService } from '../competition/services/competition.service';
import { CompetitionStore } from '../competition/store/competition-store';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  standalone: true,
  providers: [CompetitionStore, CompetitionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundComponent, CommonModule, FullSpinnerComponent],
})
export class TeamComponent {
  public competitionStore = inject(CompetitionStore);

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
      phaseName: this.getPhaseName(team.id, competition),
      groupName: this.getGroupName(team.id, competition),
      matches: this.getTeamMatches(team.id, competition),
    };

    return detailedTeam;
  });

  public onNotFoundButtonClick(): void {
    this.errorButtonClick.emit();
  }

  private getPhaseName(
    teamId: number,
    competition: DetailedCompetition,
  ): string {
    // Find the phase that contains this team
    for (const phase of competition.phases) {
      for (const group of phase.groups) {
        if (group.teamIds.includes(teamId)) {
          return phase.name;
        }
      }
    }
    return 'Fase no encontrada';
  }

  private getGroupName(
    teamId: number,
    competition: DetailedCompetition,
  ): string {
    // Find the group that contains this team
    for (const phase of competition.phases) {
      for (const group of phase.groups) {
        if (group.teamIds.includes(teamId)) {
          return group.name;
        }
      }
    }
    return 'Grupo no encontrado';
  }

  private getTeamMatches(
    teamId: number,
    competition: DetailedCompetition,
  ): Match[] {
    const teamMatches: Match[] = [];

    // Find all matches for this team across all phases and groups
    for (const phase of competition.phases) {
      for (const group of phase.groups) {
        if (group.teamIds.includes(teamId)) {
          // Add all matches from this group where the team participates
          for (const match of group.matches) {
            if (match.homeTeam.id === teamId || match.awayTeam?.id === teamId) {
              teamMatches.push(match);
            }
          }
        }
      }
    }

    return teamMatches;
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
}
