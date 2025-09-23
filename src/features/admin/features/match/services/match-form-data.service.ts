import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { DetailedMatch, Match } from '@shared/models/match';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';

@Injectable()
export class MatchFormDataService {
  findMatchInCompetition(
    competition: DetailedCompetition,
    matchId: number,
    allTeams: Team[],
  ): {
    match: DetailedMatch;
    phase: Phase;
    group: Group;
    homeTeam: Team | null;
    awayTeam: Team | null;
    noShowTeam: Team | null;
  } | null {
    let foundMatch: DetailedMatch | null = null;
    let foundPhase: Phase | null = null;
    let foundGroup: Group | null = null;
    let foundAwayTeam: Team | null = null;
    let foundHomeTeam: Team | null = null;
    let foundNoShowTeam: Team | null = null;

    for (const phase of competition.phases) {
      for (const group of phase.groups) {
        const match = group.matches.find((m: Match) => m.id === matchId);
        if (match) {
          foundMatch = {
            ...match,
            round: match.round,
            phaseName: phase.name,
            groupName: group.name,
          };
          foundPhase = phase;
          foundGroup = group;
          foundAwayTeam =
            allTeams.find((t: Team) => t.id === match.awayTeam?.id) ?? null;
          foundHomeTeam =
            allTeams.find((t: Team) => t.id === match.homeTeam.id) ?? null;
          foundNoShowTeam =
            allTeams.find((t: Team) => t.id === match.noShowTeam?.id) ?? null;
          break;
        }
        if (foundMatch) break;
      }
      if (foundMatch) break;
    }

    if (foundMatch && foundPhase && foundGroup) {
      return {
        match: foundMatch,
        phase: foundPhase,
        group: foundGroup,
        homeTeam: foundHomeTeam,
        awayTeam: foundAwayTeam,
        noShowTeam: foundNoShowTeam,
      };
    }

    return null;
  }

  populateFormFromMatch(
    form: FormGroup,
    matchData: {
      match: DetailedMatch;
      phaseId: number;
      groupId: number;
      homeTeamId: number | null;
      awayTeamId: number | null;
      noShowTeamId: number | null;
    },
  ): void {
    const { match, phaseId, groupId, homeTeamId, awayTeamId, noShowTeamId } =
      matchData;

    form.patchValue({
      phaseId: phaseId,
      groupId: groupId,
      roundId: match.round.id,
      homeTeamId: homeTeamId,
      awayTeamId: awayTeamId,
      noShowTeamId: noShowTeamId,
      date: match.date,
      time: match.date,
      homeTeamScore: match.homeTeamScore,
      awayTeamScore: match.awayTeamScore,
      status: match.status,
    });
  }

  getFilteredTeams(allTeams: Team[], selectedGroup: Group | null): Team[] {
    return (
      allTeams?.filter((team) => selectedGroup?.teamIds.includes(team.id)) ?? []
    );
  }

  getSelectedTeams(homeTeam: Team | null, awayTeam: Team | null): Team[] {
    const teams = [];
    if (homeTeam) {
      teams.push(homeTeam);
    }
    if (awayTeam) {
      teams.push(awayTeam);
    }
    return teams;
  }

  findPhaseWithGroup(
    competition: DetailedCompetition,
    groupId: number,
  ): { phase: Phase; group: Group } | null {
    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      if (group) {
        return { phase, group };
      }
    }
    return null;
  }

  findPhaseWithRound(
    competition: DetailedCompetition,
    roundId: number,
  ): { phase: Phase; round: Round } | null {
    for (const phase of competition.phases) {
      const round = phase.rounds.find((r: Round) => r.id === roundId);
      if (round) {
        return { phase, round };
      }
    }
    return null;
  }

  findPhaseWithGroupAndRound(
    competition: DetailedCompetition,
    groupId: number,
    roundId: number,
  ): { phase: Phase; group: Group; round: Round } | null {
    for (const phase of competition.phases) {
      const group = phase.groups.find((g: Group) => g.id === groupId);
      const round = phase.rounds.find((r: Round) => r.id === roundId);

      if (group && round) {
        return { phase, group, round };
      }
    }
    return null;
  }

  resetFormState(form: FormGroup): void {
    form.reset();
    form.markAsPristine();
    form.markAsUntouched();
  }

  restoreFormSelections(
    form: FormGroup,
    selections: {
      phaseId?: number | null;
      groupId?: number | null;
      roundId?: number | null;
    },
  ): void {
    if (selections.phaseId) {
      form.patchValue({ phaseId: selections.phaseId });
    }
    if (selections.groupId) {
      form.patchValue({ groupId: selections.groupId });
    }
    if (selections.roundId) {
      form.patchValue({ roundId: selections.roundId });
    }
  }
}
