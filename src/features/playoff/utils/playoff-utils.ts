import { DetailedMatch, MatchStatus } from '@shared/models/match';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';

export const PLAYOFF_PHASE_NAME = 'Play-Off';
export const PLAYOFF_GROUP_NAME = 'Play-Off';
export const PLAYOFF_SOURCE_PHASE_NAME = 'Segunda fase';
export const PLAYOFF_MAX_TEAM_COUNT = 8;
export const PLAYOFF_BRACKET_SIZE = 8;

const PLAYOFF_ROUNDS = ['Cuartos', 'Semifinales', 'Final'];

export function isPlayoffPhase(phase: Phase): boolean {
  return phase.name.trim().toLowerCase() === PLAYOFF_PHASE_NAME.toLowerCase();
}

export function getDashboardPhases(
  phases: Phase[],
  showPlayoffPhase: boolean,
): Phase[] {
  if (showPlayoffPhase) {
    return phases;
  }

  return phases.filter((phase) => !isPlayoffPhase(phase));
}

export function getPlayoffGroupName(sourceGroupName: string): string {
  return `${PLAYOFF_GROUP_NAME} - ${sourceGroupName}`;
}

export function getPlayoffSourceTeams(group: Group): Team[] {
  return [...group.classification]
    .sort((a, b) => a.position - b.position)
    .slice(0, PLAYOFF_MAX_TEAM_COUNT)
    .map((classification) => classification.team);
}

export function getNextPowerOfTwo(value: number): number {
  if (value <= 2) {
    return 2;
  }

  return 2 ** Math.ceil(Math.log2(value));
}

export function getPlayoffRoundNames(teamCount: number): string[] {
  return teamCount > 0 ? PLAYOFF_ROUNDS : [];
}

export function getPlayoffLegCount(roundIndex: number, roundCount: number): number {
  return roundIndex === 0 && roundCount > 1 ? 2 : 1;
}

export function sortPlayoffMatches(matches: DetailedMatch[]): DetailedMatch[] {
  return [...matches].sort((a, b) => a.id - b.id);
}

export function getMatchWinner(match: DetailedMatch): Team | null {
  if (match.result === 'Home') {
    return match.homeTeam;
  }

  if (match.result === 'Away') {
    return match.awayTeam ?? null;
  }

  if (match.status === 'Rest' && !match.awayTeam) {
    return match.homeTeam;
  }

  if (
    isFinishedStatus(match.status) &&
    match.homeTeamScore !== null &&
    match.homeTeamScore !== undefined &&
    match.awayTeamScore !== null &&
    match.awayTeamScore !== undefined
  ) {
    if (match.homeTeamScore > match.awayTeamScore) {
      return match.homeTeam;
    }

    if (match.awayTeam && match.awayTeamScore > match.homeTeamScore) {
      return match.awayTeam;
    }
  }

  return null;
}

export function isFinishedStatus(status: MatchStatus): boolean {
  return status === 'Finished' || status === 'NoShow' || status === 'Rest';
}
