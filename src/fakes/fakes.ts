import { ClassificationApi } from '@shared/models/classification';
import { DetailedApiCompetition } from '@shared/models/competition';
import { ApiGroup } from '@shared/models/group';
import { ApiMatch, DetailedMatch } from '@shared/models/match';
import { ApiPhase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { DetailedTeam } from '@shared/models/team';
import { addDays, format, parseISO, subDays } from 'date-fns';

// Helper function to get relative dates
const getRelativeDate = (
  daysOffset: number,
  timeString = '18:00:00',
): string => {
  const today = new Date();
  const targetDate =
    daysOffset >= 0
      ? addDays(today, daysOffset)
      : subDays(today, Math.abs(daysOffset));
  return format(targetDate, 'yyyy-MM-dd') + `T${timeString}`;
};

let _fakeTeams: DetailedTeam[] = [
  {
    id: 1,
    name: 'CB Palma',
    shortName: 'PAL',
    description: 'Club de Baloncesto Palma - Equipo histórico de la capital',
    location: 'Palma',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    active: true,
    matches: [],
  },
  {
    id: 2,
    name: 'Manacor Basket',
    shortName: 'MAN',
    description:
      'Club de baloncesto de Manacor - Tradición deportiva del Llevant',
    location: 'Manacor',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/100px-Real_Madrid_CF.svg.png',
    active: true,
    matches: [],
  },
  {
    id: 3,
    name: 'Inca Basketball',
    shortName: 'INC',
    description:
      'Club de baloncesto de Inca - Representando el centro de Mallorca',
    location: 'Inca',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/sco/c/ce/Valenciacf.svg',
    active: true,
    matches: [],
  },
  {
    id: 4,
    name: 'Sóller Basket',
    shortName: 'SOL',
    description: 'Club de baloncesto de Sóller - De la Serra de Tramuntana',
    location: 'Sóller',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/f/f9/Atletico_Madrid_Logo_2024.svg',
    active: true,
    matches: [],
  },
  {
    id: 5,
    name: 'CB Calvià',
    shortName: 'CAL',
    description: 'Club de Baloncesto Calvià - De la costa oeste',
    location: 'Calvià',
    imageUrl:
      'https://mediaverse.sevillafc.hiway.media/image/6821b3bf/escudosuizo.jpg',
    active: true,
    matches: [],
  },
  {
    id: 6,
    name: 'Marratxí Basket',
    shortName: 'MAR',
    description: 'Club de baloncesto de Marratxí - Tradición deportiva local',
    location: 'Marratxí',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg',
    active: true,
    matches: [],
  },
  {
    id: 7,
    name: 'CB Llucmajor',
    shortName: 'LLU',
    description: 'Club de Baloncesto Llucmajor - Del sur de Mallorca',
    location: 'Llucmajor',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/fr/1/13/Real_betis_logo.svg',
    active: true,
    matches: [],
  },
  {
    id: 8,
    name: 'Alcúdia Basket',
    shortName: 'ALC',
    description: 'Club de baloncesto de Alcúdia - Del norte de la isla',
    location: 'Alcúdia',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/sco/f/f1/Real_Sociedad_logo.svg',
    active: true,
    matches: [],
  },
];

export const fakeRounds: Round[] = [
  // Fase inicial rounds
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
  // Fase grupos rounds
  {
    id: 4,
    name: 'Jornada 1',
  },
  {
    id: 5,
    name: 'Jornada 2',
  },
  {
    id: 6,
    name: 'Jornada 3',
  },
  {
    id: 7,
    name: 'Jornada 4',
  },
  // Semifinal round
  {
    id: 8,
    name: 'Semifinal',
  },
  // Final round
  {
    id: 9,
    name: 'Final',
  },
];

export const fakeMatches: ApiMatch[] = [
  // FASE INICIAL - Jornada 1 (Finished matches - past dates)
  {
    id: 1,
    roundId: 1,
    homeTeamId: 1,
    awayTeamId: 2,
    date: getRelativeDate(-20, '18:00:00'), // 20 days ago
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: 85,
    awayTeamScore: 78,
    result: 'Home',
    status: 'Finished',
  },
  {
    id: 2,
    roundId: 1,
    homeTeamId: 3,
    awayTeamId: 4,
    date: getRelativeDate(-20, '20:00:00'), // 20 days ago
    location: 'Pabellón de Inca',
    homeTeamScore: 92,
    awayTeamScore: 88,
    result: 'Home',
    status: 'Finished',
  },
  {
    id: 3,
    roundId: 1,
    homeTeamId: 5,
    awayTeamId: 6,
    date: getRelativeDate(-19, '18:30:00'), // 19 days ago
    location: 'Polideportivo de Calvià',
    homeTeamScore: 76,
    awayTeamScore: 82,
    result: 'Away',
    status: 'Finished',
  },
  {
    id: 4,
    roundId: 1,
    homeTeamId: 7,
    awayTeamId: 8,
    date: getRelativeDate(-19, '20:00:00'), // 19 days ago
    location: 'Polideportivo de Llucmajor',
    homeTeamScore: 89,
    awayTeamScore: 91,
    result: 'Away',
    status: 'Finished',
  },

  // FASE INICIAL - Jornada 2 (Finished matches - past dates)
  {
    id: 5,
    roundId: 2,
    homeTeamId: 2,
    awayTeamId: 3,
    date: getRelativeDate(-13, '19:00:00'), // 13 days ago
    location: 'Polideportivo de Manacor',
    homeTeamScore: 89,
    awayTeamScore: 91,
    result: 'Away',
    status: 'Finished',
  },
  {
    id: 6,
    roundId: 2,
    homeTeamId: 4,
    awayTeamId: 5,
    date: getRelativeDate(-13, '20:30:00'), // 13 days ago
    location: 'Polideportivo de Sóller',
    homeTeamScore: 83,
    awayTeamScore: 87,
    result: 'Away',
    status: 'Finished',
  },
  {
    id: 7,
    roundId: 2,
    homeTeamId: 6,
    awayTeamId: 7,
    date: getRelativeDate(-12, '18:00:00'), // 12 days ago
    location: 'Polideportivo de Marratxí',
    homeTeamScore: 79,
    awayTeamScore: 84,
    result: 'Away',
    status: 'Finished',
  },
  {
    id: 8,
    roundId: 2,
    homeTeamId: 8,
    awayTeamId: 1,
    date: getRelativeDate(-12, '20:00:00'), // 12 days ago
    location: 'Polideportivo de Alcúdia',
    homeTeamScore: 85,
    awayTeamScore: 91,
    result: 'Away',
    status: 'Finished',
  },

  // FASE INICIAL - Jornada 3 (Mix of finished and ongoing)
  {
    id: 9,
    roundId: 3,
    homeTeamId: 1,
    awayTeamId: 3,
    date: getRelativeDate(-6, '18:00:00'), // 6 days ago
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: 88,
    awayTeamScore: 85,
    result: 'Home',
    status: 'Finished',
  },
  {
    id: 10,
    roundId: 3,
    homeTeamId: 2,
    awayTeamId: 4,
    date: getRelativeDate(-6, '19:30:00'), // 6 days ago
    location: 'Polideportivo de Manacor',
    homeTeamScore: 91,
    awayTeamScore: 89,
    result: 'Home',
    status: 'Finished',
  },
  {
    id: 11,
    roundId: 3,
    homeTeamId: 5,
    awayTeamId: 7,
    date: getRelativeDate(0, '18:00:00'), // Today (ongoing)
    location: 'Polideportivo de Calvià',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'Ongoing',
  },
  {
    id: 12,
    roundId: 3,
    homeTeamId: 6,
    awayTeamId: 8,
    date: getRelativeDate(-5, '20:00:00'), // 5 days ago
    location: 'Polideportivo de Marratxí',
    homeTeamScore: 87,
    awayTeamScore: 90,
    result: 'Away',
    status: 'Finished',
  },

  // FASE GRUPOS - Jornada 1 (Future matches - not started)
  {
    id: 13,
    roundId: 4,
    homeTeamId: 1, // CB Palma (1st)
    awayTeamId: 3, // Inca Basketball (2nd)
    date: getRelativeDate(7, '18:00:00'), // 7 days from now
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },
  {
    id: 14,
    roundId: 4,
    homeTeamId: 2, // Manacor Basket (3rd)
    awayTeamId: 4, // Sóller Basket (4th)
    date: getRelativeDate(7, '20:00:00'), // 7 days from now
    location: 'Polideportivo de Manacor',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },

  // FASE GRUPOS - Jornada 2 (Future matches)
  {
    id: 15,
    roundId: 5,
    homeTeamId: 3,
    awayTeamId: 2,
    date: getRelativeDate(14, '18:00:00'), // 14 days from now
    location: 'Pabellón de Inca',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },
  {
    id: 16,
    roundId: 5,
    homeTeamId: 4,
    awayTeamId: 1,
    date: getRelativeDate(14, '20:00:00'), // 14 days from now
    location: 'Polideportivo de Sóller',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },

  // FASE GRUPOS - Jornada 3 (Future matches)
  {
    id: 17,
    roundId: 6,
    homeTeamId: 1,
    awayTeamId: 4,
    date: getRelativeDate(21, '18:00:00'), // 21 days from now
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },
  {
    id: 18,
    roundId: 6,
    homeTeamId: 2,
    awayTeamId: 3,
    date: getRelativeDate(21, '20:00:00'), // 21 days from now
    location: 'Polideportivo de Manacor',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },

  // FASE GRUPOS - Jornada 4 (Future and cancelled matches)
  {
    id: 19,
    roundId: 7,
    homeTeamId: 1,
    awayTeamId: 2,
    date: getRelativeDate(28, '18:00:00'), // 28 days from now
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'Cancelled', // Postponed due to weather
  },
  {
    id: 20,
    roundId: 7,
    homeTeamId: 3,
    awayTeamId: 4,
    date: getRelativeDate(28, '20:00:00'), // 28 days from now
    location: 'Pabellón de Inca',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },

  // SEMIFINAL (Future matches)
  {
    id: 21,
    roundId: 8,
    homeTeamId: 1, // CB Palma (1st in groups)
    awayTeamId: 3, // Inca Basketball (2nd in groups)
    date: getRelativeDate(35, '18:00:00'), // 35 days from now
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },
  {
    id: 22,
    roundId: 8,
    homeTeamId: 4, // Sóller Basket (3rd in groups)
    awayTeamId: 2, // Manacor Basket (4th in groups)
    date: getRelativeDate(35, '20:00:00'), // 35 days from now
    location: 'Polideportivo de Sóller',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },

  // FINAL (Future match)
  {
    id: 23,
    roundId: 9,
    homeTeamId: 1, // CB Palma (Winner semifinal 1)
    awayTeamId: 2, // Manacor Basket (Winner semifinal 2)
    date: getRelativeDate(42, '18:00:00'), // 42 days from now
    location: 'Polideportivo Municipal de Palma',
    homeTeamScore: null,
    awayTeamScore: null,
    result: undefined,
    status: 'NotStarted',
  },
];

_fakeTeams = _fakeTeams.map((team) => ({
  ...team,
  matches: fakeMatches.map<DetailedMatch>((apiMatch) => {
    let phaseName = '';
    let groupName = '';

    // Determine phase and group based on round ID
    if (apiMatch.roundId && apiMatch.roundId <= 3) {
      phaseName = 'Fase Inicial';
      groupName = 'Fase Inicial';
    } else if (apiMatch.roundId && apiMatch.roundId <= 7) {
      phaseName = 'Fase Grupos';
      groupName = 'Fase Grupos';
    } else if (apiMatch.roundId === 8) {
      phaseName = 'Eliminatorias';
      groupName = 'Semifinal';
    } else if (apiMatch.roundId === 9) {
      phaseName = 'Eliminatorias';
      groupName = 'Final';
    }

    return {
      ...apiMatch,
      homeTeam: _fakeTeams.find((team) => team.id === apiMatch.homeTeamId)!,
      awayTeam: apiMatch.awayTeamId
        ? _fakeTeams.find((team) => team.id === apiMatch.awayTeamId)
        : undefined,
      round: fakeRounds.find((round) => round.id === apiMatch.roundId)!,
      phaseName,
      groupName,
      result: apiMatch.result || undefined,
      date: apiMatch.date ? parseISO(apiMatch.date) : null,
    };
  }),
}));

export const fakeTeams = _fakeTeams;

// Fase Inicial Classification (all 8 teams)
export const fakeClassificationFaseInicial: ClassificationApi[] = [
  {
    position: 1,
    teamId: 1, // CB Palma
    points: 6,
    played: 3,
    wins: 3,
    draws: 0,
    loses: 0,
    scored: 264, // 85+91+88
    conced: 241, // 78+85+85
    difference: 23,
  },
  {
    position: 2,
    teamId: 3, // Inca Basketball
    points: 6,
    played: 3,
    wins: 3,
    draws: 0,
    loses: 0,
    scored: 268, // 92+91+85
    conced: 239, // 88+89+88
    difference: 29,
  },
  {
    position: 3,
    teamId: 2, // Manacor Basket
    points: 3,
    played: 3,
    wins: 1,
    draws: 0,
    loses: 2,
    scored: 257, // 78+89+91
    conced: 267, // 85+91+89
    difference: -10,
  },
  {
    position: 4,
    teamId: 4, // Sóller Basket
    points: 3,
    played: 3,
    wins: 1,
    draws: 0,
    loses: 2,
    scored: 256, // 88+83+89
    conced: 268, // 92+87+91
    difference: -12,
  },
  {
    position: 5,
    teamId: 8, // Alcúdia Basket
    points: 3,
    played: 3,
    wins: 1,
    draws: 0,
    loses: 2,
    scored: 266, // 91+85+90
    conced: 252, // 89+91+87
    difference: 14,
  },
  {
    position: 6,
    teamId: 6, // Marratxí Basket
    points: 3,
    played: 3,
    wins: 1,
    draws: 0,
    loses: 2,
    scored: 248, // 82+79+87
    conced: 251, // 76+84+90
    difference: -3,
  },
  {
    position: 7,
    teamId: 5, // CB Calvià
    points: 0,
    played: 2, // One match ongoing
    wins: 0,
    draws: 0,
    loses: 2,
    scored: 163, // 76+87
    conced: 169, // 82+87
    difference: -6,
  },
  {
    position: 8,
    teamId: 7, // CB Llucmajor
    points: 0,
    played: 2, // One match ongoing
    wins: 0,
    draws: 0,
    loses: 2,
    scored: 173, // 89+84
    conced: 175, // 91+79
    difference: -2,
  },
];

// Fase Grupos Classification (top 4 teams)
export const fakeClassificationFaseGrupos: ClassificationApi[] = [
  {
    position: 1,
    teamId: 1, // CB Palma
    points: 6, // 3 wins in first 3 group matches
    played: 3,
    wins: 3,
    draws: 0,
    loses: 0,
    scored: 255, // Future matches estimated
    conced: 235,
    difference: 20,
  },
  {
    position: 2,
    teamId: 3, // Inca Basketball
    points: 4, // 2 wins, 1 loss
    played: 3,
    wins: 2,
    draws: 0,
    loses: 1,
    scored: 248,
    conced: 245,
    difference: 3,
  },
  {
    position: 3,
    teamId: 4, // Sóller Basket
    points: 2, // 1 win, 2 losses
    played: 3,
    wins: 1,
    draws: 0,
    loses: 2,
    scored: 241,
    conced: 251,
    difference: -10,
  },
  {
    position: 4,
    teamId: 2, // Manacor Basket
    points: 0, // 0 wins, 3 losses
    played: 3,
    wins: 0,
    draws: 0,
    loses: 3,
    scored: 230,
    conced: 243,
    difference: -13,
  },
];

export const fakeGroups: ApiGroup[] = [
  // FASE INICIAL - All 8 teams compete
  {
    id: 1,
    name: 'Fase Inicial',
    teamIds: [1, 2, 3, 4, 5, 6, 7, 8],
    matches: fakeMatches.slice(0, 12), // Matches 1-12 (Jornadas 1-3)
    actualRoundId: 3,
    classification: fakeClassificationFaseInicial,
  },

  // FASE GRUPOS - Top 4 teams from Fase Inicial
  {
    id: 2,
    name: 'Fase Grupos',
    teamIds: [1, 3, 2, 4], // CB Palma, Inca, Manacor, Sóller (top 4)
    matches: fakeMatches.slice(12, 20), // Matches 13-20 (Jornadas 1-4)
    actualRoundId: 7,
    classification: fakeClassificationFaseGrupos,
  },

  // SEMIFINAL - Top 4 teams from Fase Grupos
  {
    id: 3,
    name: 'Semifinal',
    teamIds: [1, 3, 4, 2], // CB Palma, Inca, Sóller, Manacor
    matches: fakeMatches.slice(20, 22), // Matches 21-22
    actualRoundId: 8,
  },

  // FINAL - Winners of semifinals
  {
    id: 4,
    name: 'Final',
    teamIds: [1, 2], // CB Palma vs Manacor Basket
    matches: fakeMatches.slice(22, 23), // Match 23
    actualRoundId: 9,
  },
];

export const fakePhases: ApiPhase[] = [
  {
    id: 1,
    name: 'Fase Inicial',
    groups: [fakeGroups[0]], // Fase Inicial group
    rounds: fakeRounds.slice(0, 3), // Jornadas 1-3
  },
  {
    id: 2,
    name: 'Fase Grupos',
    groups: [fakeGroups[1]], // Fase Grupos group
    rounds: fakeRounds.slice(3, 7), // Jornadas 1-4
  },
  {
    id: 3,
    name: 'Eliminatorias',
    groups: [fakeGroups[2], fakeGroups[3]], // Semifinal and Final
    rounds: fakeRounds.slice(7, 9), // Semifinal and Final
  },
];

export const fakeCompetitions: DetailedApiCompetition[] = [
  {
    id: 1,
    name: 'Copa Mallorca 2025',
    sportName: 'Baloncesto',
    description:
      'Copa de baloncesto de Mallorca 2025 - Competición principal de la isla',
    imageUrl: 'https://i.postimg.cc/85YjdmyW/basketball.png',
    active: true,
    status: 'Ongoing',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    teams: _fakeTeams,
    phases: fakePhases,
  },
  {
    id: 2,
    name: 'Liga Regular 2025-26',
    sportName: 'Baloncesto',
    description: 'Liga regular de baloncesto de Mallorca 2025-26',
    imageUrl: 'https://i.postimg.cc/85YjdmyW/basketball.png',
    active: true,
    status: 'NotStarted',
    startDate: '2025-11-01',
    endDate: '2026-04-30',
    teams: _fakeTeams.slice(0, 6),
    phases: [fakePhases[0], fakePhases[1]],
  },
  {
    id: 3,
    name: 'Supercopa Balear 2024',
    sportName: 'Baloncesto',
    description: 'Supercopa de las Islas Baleares 2024 - Finalizada',
    imageUrl: 'https://i.postimg.cc/85YjdmyW/basketball.png',
    active: true,
    status: 'Finished',
    startDate: '2024-08-01',
    endDate: '2024-08-31',
    teams: _fakeTeams.slice(0, 4),
    phases: [fakePhases[2]],
  },
  {
    id: 4,
    name: 'Copa del Rey 2026',
    sportName: 'Baloncesto',
    description: 'Copa del Rey de Baloncesto 2026 - Próximamente',
    imageUrl: 'https://i.postimg.cc/85YjdmyW/basketball.png',
    active: false,
    status: 'NotStarted',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    teams: [],
    phases: [],
  },
];
