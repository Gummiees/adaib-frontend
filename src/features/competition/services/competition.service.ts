import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import {
  DetailedApiCompetition,
  DetailedCompetition,
} from '@shared/models/competition';
import { ApiGroup, Group } from '@shared/models/group';
import { ApiMatch, Match } from '@shared/models/match';
import { ApiPhase, Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { map, Observable } from 'rxjs';

@Injectable()
export class CompetitionService {
  private http = inject(HttpClient);

  getCompetitionById(id: number): Observable<DetailedCompetition> {
    return this.http
      .get<DetailedApiCompetition>(`${environment.apiUrl}/Competition/${id}`)
      .pipe(map((competition) => this.parseDetailedCompetition(competition)));
  }

  private parseDetailedCompetition(
    competition: DetailedApiCompetition,
  ): DetailedCompetition {
    return {
      ...competition,
      startDate: competition.startDate ? new Date(competition.startDate) : null,
      endDate: competition.endDate ? new Date(competition.endDate) : null,
      phases: this.parsePhases(competition.phases, competition.teams),
    };
  }

  private parsePhases(phases: ApiPhase[], teams: Team[]): Phase[] {
    return phases.map((phase) => ({
      ...phase,
      groups: this.parseGroups(phase.groups, teams),
    }));
  }

  private parseGroups(groups: ApiGroup[], teams: Team[]): Group[] {
    return groups.map((group) => ({
      ...group,
      matches: this.parseMatches(group.matches, teams),
    }));
  }

  private parseMatches(matches: ApiMatch[], teams: Team[]): Match[] {
    return matches.map<Match>((match) => {
      const homeTeam = teams.find((team) => team.id === match.homeTeamId);
      const awayTeam = teams.find((team) => team.id === match.awayTeamId);
      if (!homeTeam) {
        throw new Error('Home team not found');
      }
      return {
        ...match,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
      };
    });
  }
}
