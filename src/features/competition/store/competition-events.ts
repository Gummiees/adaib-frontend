import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const competitionEvent = eventGroup({
  source: 'Competition',
  events: {
    getCompetition: type<number>(),
  },
});
