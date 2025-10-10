import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Team } from '@shared/models/team';

export const apiAdminTeamsEvent = eventGroup({
  source: 'ApiAdminTeams',
  events: {
    getTeamsSuccess: type<Team[]>(),
    getTeamsFailure: type<string>(),
  },
});
