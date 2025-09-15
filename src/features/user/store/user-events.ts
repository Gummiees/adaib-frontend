import { UserLogin } from '@features/user/models/user';
import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const userEvent = eventGroup({
  source: 'User',
  events: {
    login: type<UserLogin>(),
    logout: type<void>(),
    tokenRefreshRequired: type<void>(),
  },
});
