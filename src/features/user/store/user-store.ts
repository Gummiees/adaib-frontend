import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { User, UserLogin } from '@features/user/models/user';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { getErrorMessage } from '@shared/utils/utils';
import { of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { DeviceStorageService } from '../services/device-storage.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { UserStorageService } from '../services/user-storage.service';
import { UserService } from '../services/user.service';
import { userApiEvent } from './user-api-events';
import { userEvent } from './user-events';

type UserState = {
  user: User | null;
  userLogin: UserLogin | null;
  isLoading: boolean;
  error: string | null;
};

const getInitialState = (): UserState => {
  return {
    user: null,
    userLogin: null,
    isLoading: true, // Start loading to check stored user
    error: null,
  };
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState(getInitialState()),
  withMethods((store) => ({
    initSuccess(user: User): void {
      patchState(store, () => ({
        user,
        isLoading: false,
        error: null,
      }));
    },
    initFailure(): void {
      patchState(store, () => ({
        user: null,
        isLoading: false,
        error: null,
      }));
    },
  })),
  withReducer(
    on(userEvent.login, ({ payload: userLogin }) => ({
      isLoading: true,
      userLogin: userLogin,
      error: null,
    })),
    on(userEvent.logout, () => ({
      isLoading: true,
      error: null,
    })),
    on(userEvent.tokenRefreshRequired, () => ({
      isLoading: true,
      error: null,
    })),
    on(userApiEvent.loginSuccess, ({ payload: user }) => ({
      user,
      userLogin: null,
      isLoading: false,
    })),
    on(userApiEvent.loginFailure, ({ payload: error }) => ({
      user: null,
      userLogin: null,
      isLoading: false,
      error: error,
    })),
    on(userApiEvent.logoutSuccess, () => ({
      user: null,
      userLogin: null,
      isLoading: false,
    })),
    on(userApiEvent.logoutFailure, ({ payload: error }) => ({
      isLoading: false,
      error: error,
    })),
    on(userApiEvent.tokenRefreshSuccess, ({ payload: user }) => ({
      user,
      isLoading: false,
      error: null,
    })),
    on(userApiEvent.tokenRefreshFailure, ({ payload: error }) => ({
      user: null,
      isLoading: false,
      error: error,
    })),
  ),
  withHooks({
    onInit: async (store, userStorage = inject(UserStorageService)) => {
      const storedUser = await userStorage.getUser();
      if (storedUser && storedUser.authToken) {
        store.initSuccess(storedUser);
      } else {
        store.initFailure();
      }
    },
  }),
  withEffects(
    (
      store,
      events = inject(Events),
      userService = inject(UserService),
      userStorage = inject(UserStorageService),
      deviceStorage = inject(DeviceStorageService),
      tokenRefreshService = inject(TokenRefreshService),
      router = inject(Router),
      snackbar = inject(MatSnackBar),
    ) => ({
      login$: events.on(userEvent.login).pipe(
        filter(() => !!store.userLogin()),
        switchMap(() =>
          userService
            .login({
              deviceId: deviceStorage.getDeviceId(),
              ...store.userLogin()!,
            })
            .pipe(
              switchMap(async (user) => {
                await userStorage.storeUser(user);
                router.navigate(['/inicio']);
                return userApiEvent.loginSuccess(user);
              }),
              catchError((error) => {
                snackbar.open(getErrorMessage(error), 'Cerrar');
                return of(userApiEvent.loginFailure(getErrorMessage(error)));
              }),
            ),
        ),
      ),
      logout$: events.on(userEvent.logout).pipe(
        switchMap(() =>
          userService.logout(deviceStorage.getDeviceId()).pipe(
            switchMap(async () => {
              userStorage.clearUser();
              router.navigate(['/inicio']);
              return userApiEvent.logoutSuccess();
            }),
            catchError((error) => {
              userStorage.clearUser();
              snackbar.open(getErrorMessage(error), 'Cerrar');
              return of(userApiEvent.logoutFailure(getErrorMessage(error)));
            }),
          ),
        ),
      ),
      tokenRefresh$: events.on(userEvent.tokenRefreshRequired).pipe(
        filter(() => !!store.user()),
        switchMap(() =>
          tokenRefreshService.refreshTokenIfNeeded(store.user()!).pipe(
            switchMap((refreshedUser) => {
              return of(userApiEvent.tokenRefreshSuccess(refreshedUser));
            }),
            catchError((error) => {
              // On refresh failure, logout the user
              userStorage.clearUser();
              router.navigate(['/inicio']);
              snackbar.open(
                'Sesión expirada. Por favor, inicia sesión nuevamente.',
                'Cerrar',
              );
              return of(
                userApiEvent.tokenRefreshFailure(getErrorMessage(error)),
              );
            }),
          ),
        ),
      ),
    }),
  ),
);
