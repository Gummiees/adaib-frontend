import { inject, Injectable } from '@angular/core';
import { AdminGroupService } from '@features/admin/features/group/services/admin-group.service';
import { AdminMatchService } from '@features/admin/features/match/services/admin-match.service';
import { AdminRoundService } from '@features/admin/features/round/services/admin-round.service';
import { DetailedMatch, FormApiMatch } from '@shared/models/match';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { firstValueFrom } from 'rxjs';
import {
  getPlayoffLegCount,
  getPlayoffRoundNames,
  PLAYOFF_GROUP_NAME,
} from '../utils/playoff-utils';

@Injectable()
export class PlayoffBracketAdminService {
  private adminGroupService = inject(AdminGroupService);
  private adminRoundService = inject(AdminRoundService);
  private adminMatchService = inject(AdminMatchService);

  async saveSeedsAndOpeningRound({
    competitionId,
    phase,
    playoffGroupName,
    seedTeamIds,
    scheduledDates,
    locations,
    existingMatches,
  }: {
    competitionId: number;
    phase: Phase;
    playoffGroupName: string;
    seedTeamIds: (number | null)[];
    scheduledDates: (string | null)[];
    locations: (string | null)[];
    existingMatches: DetailedMatch[];
  }): Promise<void> {
    const teamIds = seedTeamIds.filter((teamId): teamId is number => !!teamId);
    const groupId = await this.ensurePlayoffGroup({
      competitionId,
      phase,
      playoffGroupName,
      teamIds,
    });
    const rounds = await this.ensurePlayoffRounds({
      competitionId,
      phase,
      teamCount: teamIds.length,
    });
    const openingRound = rounds[0];

    if (!openingRound) {
      return;
    }

    await this.saveOpeningRoundMatches({
      competitionId,
      phaseId: phase.id,
      groupId,
      roundId: openingRound.id,
      roundCount: rounds.length,
      seedTeamIds,
      scheduledDates,
      locations,
      existingMatches,
    });
  }

  async saveMatchResult({
    competitionId,
    phaseId,
    groupId,
    match,
    homeTeamScore,
    awayTeamScore,
    date,
    location,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    match: DetailedMatch;
    homeTeamScore: number;
    awayTeamScore: number;
    date?: string | null;
    location?: string | null;
  }): Promise<void> {
    await firstValueFrom(
      this.adminMatchService.updateMatch({
        competitionId,
        phaseId,
        groupId,
        match: {
          id: match.id,
          roundId: match.round.id,
          homeTeamId: match.homeTeam.id,
          awayTeamId: match.awayTeam?.id,
          noShowTeamId: null,
          status: 'Finished',
          date: date ?? (match.date ? match.date.toISOString() : null),
          location: location ?? match.location ?? null,
          homeTeamScore,
          awayTeamScore,
        },
      }),
    );
  }

  async createMatch({
    competitionId,
    phaseId,
    groupId,
    roundId,
    homeTeamId,
    awayTeamId,
    date,
    location,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    roundId: number;
    homeTeamId: number;
    awayTeamId?: number;
    date?: string | null;
    location?: string | null;
  }): Promise<void> {
    await firstValueFrom(
      this.adminMatchService.addMatch({
        competitionId,
        phaseId,
        groupId,
        match: {
          id: 0,
          roundId,
          homeTeamId,
          awayTeamId,
          noShowTeamId: null,
          status: awayTeamId ? 'NotStarted' : 'Rest',
          date: date ?? null,
          location: location ?? null,
          homeTeamScore: null,
          awayTeamScore: null,
        },
      }),
    );
  }

  private async ensurePlayoffGroup({
    competitionId,
    phase,
    playoffGroupName,
    teamIds,
  }: {
    competitionId: number;
    phase: Phase;
    playoffGroupName: string;
    teamIds: number[];
  }): Promise<number> {
    const group =
      phase.groups.find((phaseGroup) => phaseGroup.name === playoffGroupName) ??
      phase.groups.find((phaseGroup) => phaseGroup.name === PLAYOFF_GROUP_NAME);

    if (group) {
      await firstValueFrom(
        this.adminGroupService.updateGroup({
          competitionId,
          phaseId: phase.id,
          group: {
            id: group.id,
            name: playoffGroupName,
            teamIds,
          },
        }),
      );

      return group.id;
    }

    return await firstValueFrom(
      this.adminGroupService.addGroup({
        competitionId,
        phaseId: phase.id,
        group: {
          id: 0,
          name: playoffGroupName,
          teamIds,
        },
      }),
    );
  }

  private async ensurePlayoffRounds({
    competitionId,
    phase,
    teamCount,
  }: {
    competitionId: number;
    phase: Phase;
    teamCount: number;
  }): Promise<Round[]> {
    const roundNames = getPlayoffRoundNames(teamCount);
    const rounds: Round[] = [];

    for (const name of roundNames) {
      const existingRound = phase.rounds.find((round) => round.name === name);

      if (existingRound) {
        rounds.push(existingRound);
        continue;
      }

      const roundId = await firstValueFrom(
        this.adminRoundService.addRound({
          competitionId,
          phaseId: phase.id,
          round: { id: 0, name },
        }),
      );
      rounds.push({ id: roundId, name });
    }

    return rounds;
  }

  private async saveOpeningRoundMatches({
    competitionId,
    phaseId,
    groupId,
    roundId,
    roundCount,
    seedTeamIds,
    scheduledDates,
    locations,
    existingMatches,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    roundId: number;
    roundCount: number;
    seedTeamIds: (number | null)[];
    scheduledDates: (string | null)[];
    locations: (string | null)[];
    existingMatches: DetailedMatch[];
  }): Promise<void> {
    const pairCount = Math.ceil(seedTeamIds.length / 2);
    const roundLegCount = getPlayoffLegCount(0, roundCount);
    let existingMatchOffset = 0;
    let scheduledDateOffset = 0;
    let locationOffset = 0;

    for (let index = 0; index < pairCount; index++) {
      const firstTeamId = seedTeamIds[index * 2];
      const secondTeamId = seedTeamIds[index * 2 + 1];
      const homeTeamId = firstTeamId ?? secondTeamId;
      const awayTeamId = firstTeamId ? secondTeamId ?? undefined : undefined;
      const tieLegCount = awayTeamId ? roundLegCount : 1;
      const tieExistingMatches = existingMatches.slice(
        existingMatchOffset,
        existingMatchOffset + tieLegCount,
      );
      const tieScheduledDates = scheduledDates.slice(
        scheduledDateOffset,
        scheduledDateOffset + tieLegCount,
      );
      const tieLocations = locations.slice(
        locationOffset,
        locationOffset + tieLegCount,
      );

      existingMatchOffset += tieLegCount;
      scheduledDateOffset += tieLegCount;
      locationOffset += tieLegCount;

      if (!homeTeamId) {
        continue;
      }

      for (let legIndex = 0; legIndex < tieLegCount; legIndex++) {
        const existingMatch = tieExistingMatches[legIndex];
        const isSecondLeg = legIndex === 1;
        const payload = this.buildOpeningRoundMatch({
          existingMatch,
          roundId,
          homeTeamId: isSecondLeg && awayTeamId ? awayTeamId : homeTeamId,
          awayTeamId: isSecondLeg ? homeTeamId : awayTeamId,
          scheduledDate: tieScheduledDates[legIndex] ?? null,
          location: tieLocations[legIndex] ?? null,
        });

        if (existingMatch) {
          await firstValueFrom(
            this.adminMatchService.updateMatch({
              competitionId,
              phaseId,
              groupId,
              match: payload,
            }),
          );
        } else {
          await firstValueFrom(
            this.adminMatchService.addMatch({
              competitionId,
              phaseId,
              groupId,
              match: payload,
            }),
          );
        }
      }
    }
  }

  private buildOpeningRoundMatch({
    existingMatch,
    roundId,
    homeTeamId,
    awayTeamId,
    scheduledDate,
    location,
  }: {
    existingMatch?: DetailedMatch;
    roundId: number;
    homeTeamId: number;
    awayTeamId?: number;
    scheduledDate: string | null;
    location: string | null;
  }): FormApiMatch {
    const hasSameTeams =
      existingMatch?.homeTeam.id === homeTeamId &&
      existingMatch.awayTeam?.id === awayTeamId;

    return {
      id: existingMatch?.id ?? 0,
      roundId,
      homeTeamId,
      awayTeamId,
      noShowTeamId: hasSameTeams ? existingMatch.noShowTeam?.id : null,
      status: hasSameTeams
        ? existingMatch.status
        : awayTeamId
          ? 'NotStarted'
          : 'Rest',
      date:
        scheduledDate ??
        (hasSameTeams && existingMatch.date
          ? existingMatch.date.toISOString()
          : null),
      location: location ?? (hasSameTeams ? existingMatch.location ?? null : null),
      homeTeamScore: hasSameTeams ? existingMatch.homeTeamScore : null,
      awayTeamScore: hasSameTeams ? existingMatch.awayTeamScore : null,
    };
  }
}
