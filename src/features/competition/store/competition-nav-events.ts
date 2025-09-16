import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const competitionNavEvents = eventGroup({
  source: 'Navigate through competition',
  events: {
    toAddPhase: type<void>(),
    toAddGroup: type<void>(),
    toAddRound: type<void>(),
    toAddMatch: type<void>(),
    toEditPhase: type<void>(),
    toEditGroup: type<void>(),
    toEditRound: type<number>(),
    toEditMatch: type<number>(),
  },
});
