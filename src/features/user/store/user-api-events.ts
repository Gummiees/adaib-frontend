import { User } from '@features/user/models/user';
import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const userApiEvent = eventGroup({
  source: 'UserApi',
  events: {
    loginSuccess: type<User>(),
    loginFailure: type<string>(),
    logoutSuccess: type<void>(),
    logoutFailure: type<string>(),
    tokenRefreshSuccess: type<User>(),
    tokenRefreshFailure: type<string>(),
  },
});
