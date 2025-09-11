import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';

export const summaryEvents = eventGroup({
  source: 'Summary',
  events: {
    phaseChange: type<Phase>(),
    groupChange: type<Group | 'all'>(),
  },
});
