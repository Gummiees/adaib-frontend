import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const competitionsEvent = eventGroup({
  source: 'Competitions',
  events: {
    getCompetitions: type<void>(),
  },
});
