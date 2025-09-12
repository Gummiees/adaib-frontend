import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';

export type RoundWithPhase = { phase: Phase; round: Round | 'all' };
export type RoundWithGroup = { group: Group; round: Round | 'all' };

export const competitionEvents = eventGroup({
  source: 'Competition',
  events: {
    getCompetition: type<number>(),
    phaseChange: type<Phase | 'all'>(),
    groupChange: type<Group | 'all'>(),
    roundByPhaseChange: type<RoundWithPhase>(),
    roundByGroupChange: type<RoundWithGroup>(),
  },
});
