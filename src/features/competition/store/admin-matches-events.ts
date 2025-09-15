import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Group } from '@shared/models/group';
import { DetailedMatch } from '@shared/models/match';
import { Phase } from '@shared/models/phase';

export type AdminMatchEvent = {
  match: DetailedMatch;
  phase: Phase;
  group: Group;
};

export const adminMatchesEvent = eventGroup({
  source: 'AdminMatches',
  events: {
    addMatch: type<AdminMatchEvent>(),
    updateMatch: type<AdminMatchEvent>(),
    deleteMatch: type<number>(),
  },
});
