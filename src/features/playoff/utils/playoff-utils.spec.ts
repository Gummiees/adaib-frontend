import { Group } from '@shared/models/group';
import { Team } from '@shared/models/team';
import { getPlayoffSourceTeams } from './playoff-utils';

function buildTeam(id: number): Team {
  return {
    id,
    name: `Team ${id}`,
    imageUrl: '',
    arena: '',
    active: true,
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
