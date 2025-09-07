import { Classification } from '@features/competitions/models/classification';
import { DetailedCompetition } from '@features/competitions/models/competition';
import { Group } from '@features/competitions/models/group';
import { Phase } from '@features/competitions/models/phase';
import { DetailedTeam } from '@features/teams/models/team';
import { Match } from '@shared/models/match';

let _fakeTeams: DetailedTeam[] = [
  {
    id: 1,
    name: 'Equipo 1',
    description: 'Descripción 1',
    imageUrl: 'https://via.placeholder.com/150',
    active: true,
    location: 'Sa Pobla',
    phaseName: 'Semifinales',
    groupName: 'Grupo 2',
    matches: [],
  },
  {
    id: 2,
    name: 'Equipo 2',
    description: 'Descripción 2',
    imageUrl: 'https://via.placeholder.com/150',
    active: true,
    location: 'Palma',
    phaseName: 'Finales',
    groupName: 'Grupo 1',
    matches: [],
  },
];

export const fakeMatches: Match[] = [
  {
    id: 1,
    round: 1,
    homeTeamId: _fakeTeams[0].id,
    awayTeamId: _fakeTeams[1].id,
    status: 'NotStarted',
  },
  {
    id: 2,
    round: 1,
    homeTeamId: _fakeTeams[1].id,
    awayTeamId: _fakeTeams[0].id,
    status: 'Ongoing',
    homeTeamScore: 0,
    awayTeamScore: 1,
    date: new Date(),
    location: 'Sa Pobla',
  },
  {
    id: 3,
    round: 1,
    homeTeamId: _fakeTeams[0].id,
    awayTeamId: _fakeTeams[1].id,
    status: 'Finished',
    homeTeamScore: 1,
    awayTeamScore: 0,
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    location: 'Sa Pobla',
  },
];

_fakeTeams = _fakeTeams.map((team) => ({
  ...team,
  matches: fakeMatches,
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

export const fakeGroups: Group[] = [
  {
    id: 1,
    name: 'Grupo 1',
    teamIds: _fakeTeams.map((team) => team.id),
    matches: fakeMatches,
    classification: fakeClassification,
    actualRound: 1,
  },
  {
    id: 2,
    name: 'Grupo 2',
    teamIds: _fakeTeams.map((team) => team.id),
    matches: fakeMatches,
    classification: fakeClassification,
    actualRound: 2,
  },
];

export const faksePhases: Phase[] = [
  {
    id: 1,
    name: 'Semifinales',
    groups: fakeGroups,
  },
  {
    id: 2,
    name: 'Finales',
    groups: fakeGroups,
  },
];

export const fakeCompetitions: DetailedCompetition[] = [
  {
    id: 1,
    name: 'La Liga',
    sportName: 'Baloncesto',
    description: 'La Liga es una competición que se juega en España.',
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
    imageUrl:
      'https://www.aidebcompeticiones.com/clients/aideb/leagues/000068/000068_thumb.png',
    active: true,
    status: 'NotStarted',
    teams: _fakeTeams,
    phases: faksePhases,
  },
];
