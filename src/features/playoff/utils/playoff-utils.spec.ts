import { Group } from '@shared/models/group';
import { DetailedMatch } from '@shared/models/match';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';
import {
  alignPlayoffMatchTeams,
  getPlayoffSourceTeams,
  getSavedMatchesForPlayoffTie,
} from './playoff-utils';

function buildTeam(id: number): Team {
  return {
    id,
    name: `Team ${id}`,
    imageUrl: '',
    arena: '',
    active: true,
  };
}

function buildMatch(
  id: number,
  homeTeam: Team,
  awayTeam?: Team,
): DetailedMatch {
  const round: Round = { id: 1, name: 'Semifinales' };

  return {
    id,
    round,
    homeTeam,
    awayTeam,
    phaseName: 'Play-Off',
    groupName: 'Play-Off - A',
    status: 'NotStarted',
    date: null,
    location: homeTeam.arena,
    homeTeamScore: null,
    awayTeamScore: null,
    result: null,
    noShowTeam: null,
  };
}

describe('getPlayoffSourceTeams', () => {
  it('returns only the first 8 teams ordered by classification position', () => {
    const teams = Array.from({ length: 10 }, (_, index) =>
      buildTeam(index + 1),
    );
    const group = {
      id: 1,
      name: 'Segunda fase',
      actualRound: null,
      matches: [],
      teamIds: teams.map((team) => team.id),
      classification: [
        teams[8],
        teams[0],
        teams[9],
        teams[1],
        teams[2],
        teams[3],
        teams[4],
        teams[5],
        teams[6],
        teams[7],
      ].map((team, index) => ({
        id: `${team.id}`,
        position: index + 1,
        points: 0,
        played: 0,
        wins: 0,
        loses: 0,
        scored: 0,
        conced: 0,
        difference: 0,
        team,
      })),
    } satisfies Group;

    expect(getPlayoffSourceTeams(group).map((team) => team.id)).toEqual([
      9, 1, 10, 2, 3, 4, 5, 6,
    ]);
  });
});

describe('getSavedMatchesForPlayoffTie', () => {
  it('matches saved ties by expected teams instead of creation order', () => {
    const [seedOne, seedTwo, seedThree, seedFour] = [1, 2, 3, 4].map(buildTeam);
    const lowerTieCreatedFirst = buildMatch(10, seedThree, seedFour);
    const upperTieCreatedSecond = buildMatch(11, seedOne, seedTwo);
    const usedMatchIds = new Set<number>();

    const upperTie = getSavedMatchesForPlayoffTie({
      savedMatches: [lowerTieCreatedFirst, upperTieCreatedSecond],
      usedMatchIds,
      legCount: 1,
      homeTeam: seedOne,
      awayTeam: seedTwo,
    });
    upperTie.forEach((match) => usedMatchIds.add(match.id));

    const lowerTie = getSavedMatchesForPlayoffTie({
      savedMatches: [lowerTieCreatedFirst, upperTieCreatedSecond],
      usedMatchIds,
      legCount: 1,
      homeTeam: seedThree,
      awayTeam: seedFour,
    });

    expect(upperTie.map((match) => match.id)).toEqual([11]);
    expect(lowerTie.map((match) => match.id)).toEqual([10]);
  });

  it('does not assign an unrelated saved match when a winner is known', () => {
    const [seedOne, seedTwo, seedThree] = [1, 2, 3].map(buildTeam);
    const unrelatedTie = buildMatch(10, seedTwo, seedThree);

    expect(
      getSavedMatchesForPlayoffTie({
        savedMatches: [unrelatedTie],
        usedMatchIds: new Set<number>(),
        legCount: 1,
        homeTeam: seedOne,
        awayTeam: null,
      }),
    ).toEqual([]);
  });
});

describe('alignPlayoffMatchTeams', () => {
  it('keeps match metadata but resets result fields when entrants changed', () => {
    const [expectedHome, expectedAway, staleAway] = [1, 2, 3].map(buildTeam);
    const staleMatch = {
      ...buildMatch(10, expectedHome, staleAway),
      status: 'Finished' as const,
      homeTeamScore: 70,
      awayTeamScore: 65,
      result: 'Home' as const,
    };

    expect(
      alignPlayoffMatchTeams({
        match: staleMatch,
        homeTeam: expectedHome,
        awayTeam: expectedAway,
      }),
    ).toEqual({
      ...staleMatch,
      awayTeam: expectedAway,
      status: 'NotStarted',
      homeTeamScore: null,
      awayTeamScore: null,
      result: null,
    });
  });
});
