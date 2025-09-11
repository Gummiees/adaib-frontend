import { Classification } from '@shared/models/classification';
import { DetailedApiCompetition } from '@shared/models/competition';
import { ApiGroup } from '@shared/models/group';
import { ApiMatch, DetailedMatch } from '@shared/models/match';
import { ApiPhase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { DetailedTeam } from '@shared/models/team';

let _fakeTeams: DetailedTeam[] = [
  {
    id: 1,
    name: 'FC Barcelona',
    shortName: 'FCB',
    description:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/142px-FC_Barcelona_%28crest%29.svg.png',
    active: true,
    location: 'Sa Pobla',
    matches: [],
  },
  {
    id: 2,
    name: 'DEPORTIVO-INMOVYP-VIPHOME',
    // description: 'Descripción 2',
    // imageUrl:
    //   'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    active: true,
    // location: 'Palma',
    matches: [],
  },
  {
    id: 3,
    name: 'Test',
    description: 'Descripción 3',
    imageUrl:
      'https://www.aidebcompeticiones.com/master/teams/005208/005208.png',
    active: false,
    location: 'Manacor',
    matches: [],
  },
];

export const fakeRounds: Round[] = [
  {
    id: 1,
    name: 'Jornada 1',
  },
  {
    id: 2,
    name: 'Jornada 2',
  },
  {
    id: 3,
    name: 'Jornada 3',
  },
  {
    id: 4,
    name: 'Jornada 4',
  },
  {
    id: 5,
    name: 'Jornada 5',
  },
  {
    id: 6,
    name: 'Jornada 6',
  },
  {
    id: 7,
    name: 'Jornada 7',
  },
  {
    id: 8,
    name: 'Jornada 8',
  },
  {
    id: 9,
    name: 'Jornada 9',
  },
  {
    id: 10,
    name: 'Jornada 10',
  },
  {
    id: 11,
    name: 'Jornada 11',
  },
  {
    id: 12,
    name: 'Jornada 12',
  },
  {
    id: 13,
    name: 'Jornada 13',
  },
  {
    id: 14,
    name: 'Jornada 14',
  },
];

export const fakeMatches: ApiMatch[] = [
  {
    id: 1,
    roundId: 1,
    homeTeamId: _fakeTeams[0].id,
    awayTeamId: _fakeTeams[1].id,
    status: 'NotStarted',
  },
  {
    id: 3,
    roundId: 1,
    homeTeamId: _fakeTeams[0].id,
    status: 'Rest',
  },
  {
    id: 4,
    roundId: 2,
    homeTeamId: _fakeTeams[1].id,
    awayTeamId: _fakeTeams[0].id,
    status: 'Ongoing',
    homeTeamScore: 0,
    awayTeamScore: 1,
    date: new Date(),
    location: 'Sa Pobla',
  },
  {
    id: 5,
    roundId: 2,
    homeTeamId: _fakeTeams[0].id,
    awayTeamId: _fakeTeams[1].id,
    status: 'Finished',
    result: 'Home',
    homeTeamScore: 5,
    awayTeamScore: 0,
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    location: 'Sa Pobla',
  },
  {
    id: 6,
    roundId: 2,
    homeTeamId: _fakeTeams[0].id,
    awayTeamId: _fakeTeams[1].id,
    status: 'Cancelled',
    location: 'Sa Pobla',
  },
];

_fakeTeams = _fakeTeams.map((team) => ({
  ...team,
  matches: fakeMatches.map<DetailedMatch>((apiMatch) => ({
    ...apiMatch,
    homeTeam: _fakeTeams.find((team) => team.id === apiMatch.homeTeamId)!,
    awayTeam: _fakeTeams.find((team) => team.id === apiMatch.awayTeamId)!,
    round: fakeRounds.find((round) => round.id === apiMatch.roundId)!,
    phaseName: 'Finales',
    groupName: 'Grupo 1',
  })),
}));

export const fakeTeams = _fakeTeams;

export const fakeClassification: Classification[] = [
  {
    position: 1,
    teamId: _fakeTeams[0].id,
    points: 10,
  },
  {
    position: 2,
    teamId: _fakeTeams[1].id,
    points: 5,
  },
];

export const fakeGroups: ApiGroup[] = [
  {
    id: 1,
    name: 'Grupo 1',
    teamIds: _fakeTeams.map((team) => team.id),
    matches: fakeMatches.slice(0, 2),
    classification: fakeClassification,
    actualRoundId: 1,
  },
  {
    id: 2,
    name: 'Grupo 2',
    teamIds: _fakeTeams.map((team) => team.id),
    matches: fakeMatches.slice(1, 4),
    classification: fakeClassification,
    actualRoundId: 2,
  },
  {
    id: 3,
    name: 'Grupo 3',
    teamIds: _fakeTeams.map((team) => team.id),
    matches: [],
    classification: fakeClassification,
  },
];

export const faksePhases: ApiPhase[] = [
  {
    id: 1,
    name: 'Finales',
    groups: fakeGroups,
    rounds: fakeRounds,
  },
  {
    id: 2,
    name: 'Semifinales',
    groups: [fakeGroups[1]],
    rounds: fakeRounds,
  },
  {
    id: 3,
    name: 'Fase de grupos',
    groups: [],
    rounds: [],
  },
];

export const fakeCompetitions: DetailedApiCompetition[] = [
  {
    id: 1,
    name: 'La Liga',
    sportName: 'Baloncesto',
    description:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?',
    imageUrl:
      'https://www.aidebcompeticiones.com/clients/aideb/leagues/000068/000068_thumb.png',
    active: true,
    status: 'NotStarted',
    teams: _fakeTeams,
    phases: faksePhases,
  },
  {
    id: 2,
    name: 'La Copa',
    sportName: 'Baloncesto',
    description: 'La Copa es una competición que se juega en España.',
    imageUrl:
      'https://www.aidebcompeticiones.com/clients/aideb/leagues/000069/000069_thumb.png',
    active: true,
    status: 'Ongoing',
    startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    teams: _fakeTeams,
    phases: faksePhases,
  },
  {
    id: 3,
    name: 'La Supercopa',
    sportName: 'Baloncesto',
    description: 'La Supercopa es una competición que se juega en España.',
    imageUrl:
      'https://www.aidebcompeticiones.com/clients/aideb/leagues/000070/000070_thumb.png',
    active: true,
    status: 'Finished',
    startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    endDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    teams: _fakeTeams,
    phases: faksePhases,
  },
  {
    id: 4,
    name: 'La Liga 2',
    sportName: 'Baloncesto',
    description: 'La Liga 2 es una competición que se juega en España.',
    startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    active: false,
    status: 'NotStarted',
    teams: [],
    phases: [],
  },
];
