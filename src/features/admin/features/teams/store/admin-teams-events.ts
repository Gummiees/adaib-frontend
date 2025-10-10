import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Team } from '@shared/models/team';

export const adminTeamsEvent = eventGroup({
  source: 'AdminTeams',
  events: {
    getTeams: type<void>(),
    addTeam: type<Team>(),
    updateTeam: type<Team>(),
    deleteTeam: type<number>(),
  },
});
