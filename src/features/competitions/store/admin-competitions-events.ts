import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Competition } from '@shared/models/competition';

export const adminCompetitionsEvent = eventGroup({
  source: 'AdminCompetition',
  events: {
    addCompetition: type<Competition>(),
    updateCompetition: type<Competition>(),
  },
});
