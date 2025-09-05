import { inject } from '@angular/core';
import { User, UserRequest } from '@features/user/models/user';
import { mapResponse } from '@ngrx/operators';
import { PartialStateUpdater, signalStore, withState } from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { getErrorMessage } from '@shared/utils/utils';
import { filter, switchMap } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { userApiEvent } from './user-api-events';
import { userEvent } from './user-events';

type UserState = {
  user: User | null;
  userRequest: UserRequest | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  user: null,
  userRequest: null,
  isLoading: false,
  error: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withReducer(
    on(userEvent.login, ({ payload: userRequest }) => ({
      isLoading: true,
      userRequest: userRequest,
      error: null,
    })),
    on(userEvent.logout, () => ({
      isLoading: true,
      userRequest: null,
      error: null,
    })),
    on(userApiEvent.loginSuccess, ({ payload: user }) => ({
      user,
      userRequest: null,
      isLoading: false,
      error: null,
    })),
    on(userApiEvent.loginFailure, ({ payload: error }) => onFailure(error)),
    on(userApiEvent.logoutSuccess, () => ({
      user: null,
      userRequest: null,
      isLoading: false,
      error: null,
    })),
    on(userApiEvent.logoutFailure, ({ payload: error }) => onFailure(error)),
  ),
  withEffects(
    (store, events = inject(Events), userService = inject(UserService)) => ({
      login$: events.on(userEvent.login).pipe(
        filter(() => !!store.userRequest()),
        switchMap(() =>
          userService.login(store.userRequest()!).pipe(
            mapResponse({
              next: (user) => userApiEvent.loginSuccess(user),
              error: (error) =>
                userApiEvent.loginFailure(getErrorMessage(error)),
            }),
          ),
        ),
      ),
      logout$: events.on(userEvent.logout).pipe(
        switchMap(() =>
          userService.logout().pipe(
            mapResponse({
              next: () => userApiEvent.logoutSuccess(),
              error: (error) =>
                userApiEvent.logoutFailure(getErrorMessage(error)),
            }),
          ),
        ),
      ),
    }),
  ),
);

function onFailure(error: string): PartialStateUpdater<{
  isLoading: boolean;
  userRequest: UserRequest | null;
  error: string | null;
}> {
  return () => ({
    error: error,
    isLoading: false,
    userRequest: null,
  });
}
