import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { DetailedCompetition } from '@shared/models/competition';

export const competitionApiEvent = eventGroup({
  source: 'CompetitionApi',
  events: {
    getCompetitionSuccess: type<DetailedCompetition>(),
    getCompetitionFailure: type<string>(),
  },
});
