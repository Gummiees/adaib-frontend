import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Competition } from '@shared/models/competition';

export const apiCompetitionsEvent = eventGroup({
  source: 'Competitions',
  events: {
    getCompetitionsSuccess: type<Competition[]>(),
    getCompetitionsFailure: type<string>(),
  },
});
