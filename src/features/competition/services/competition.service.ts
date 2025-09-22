import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import {
  Classification,
  ClassificationApi,
} from '@shared/models/classification';
import {
  DetailedApiCompetition,
  DetailedCompetition,
} from '@shared/models/competition';
import { ApiGroup, Group } from '@shared/models/group';
import { ApiMatch, DetailedMatch } from '@shared/models/match';
import { ApiPhase, Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';
import { parseISO } from 'date-fns';
import { map, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

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
      id: competition.id,
      sportName: competition.sportName,
      name: competition.name,
      description: competition.description,
      imageUrl: competition.imageUrl,
      active: competition.active,
      status: competition.status,
      teams: competition.teams,
      startDate: competition.startDate ? parseISO(competition.startDate) : null,
      endDate: competition.endDate ? parseISO(competition.endDate) : null,
      phases: this.parsePhases(competition.phases, competition.teams),
    };
  }

  private parsePhases(phases: ApiPhase[], teams: Team[]): Phase[] {
    return phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      rounds: phase.rounds,
      groups: this.parseGroups({
        groups: phase.groups,
        teams: teams,
        rounds: phase.rounds,
        phaseName: phase.name,
      }),
    }));
  }

  private parseGroups({
    groups,
    teams,
    rounds,
    phaseName,
  }: {
    groups: ApiGroup[];
    teams: Team[];
    rounds: Round[];
    phaseName: string;
  }): Group[] {
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      classification: this.parseClassification(
        group.classification || [],
        teams,
      ),
      teamIds: group.teamIds,
      actualRound: group.actualRoundId
        ? rounds.find((round) => round.id === group.actualRoundId)
        : null,
      matches: this.parseMatches({
        matches: group.matches,
        teams: teams,
        rounds: rounds,
        phaseName: phaseName,
        groupName: group.name,
      }),
    }));
  }

  private parseClassification(
    classification: ClassificationApi[],
    teams: Team[],
  ): Classification[] {
    return classification
      .filter((classification) =>
        teams.some((team) => team.id === classification.teamId),
      )
      .map((classification) => ({
        id: uuidv4(),
        position: classification.position,
        points: classification.points,
        played: classification.played,
        wins: classification.wins,
        loses: classification.loses,
        scored: classification.scored,
        conced: classification.conced,
        difference: classification.difference,
        team: teams.find((team) => team.id === classification.teamId)!,
      }));
  }

  private parseMatches({
    matches,
    teams,
    rounds,
    phaseName,
    groupName,
  }: {
    matches: ApiMatch[];
    teams: Team[];
    rounds: Round[];
    phaseName: string;
    groupName: string;
  }): DetailedMatch[] {
    return matches.map<DetailedMatch>((match) => {
      const homeTeam = teams.find((team) => team.id === match.homeTeamId);
      const awayTeam = teams.find((team) => team.id === match.awayTeamId);
      const round = rounds.find((round) => round.id === match.roundId);
      if (!round) {
        throw new Error('Round not found');
      }
      if (!homeTeam) {
        throw new Error('Home team not found');
      }
      return {
        id: match.id,
        status: match.status,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        round: round,
        phaseName: phaseName,
        groupName: groupName,
        location: match.location,
        result: match.result,
        homeTeamScore: match.homeTeamScore,
        awayTeamScore: match.awayTeamScore,
        date: match.date ? parseISO(match.date) : null,
      };
    });
  }
}
