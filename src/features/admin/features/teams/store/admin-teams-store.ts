import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { Team } from '@shared/models/team';
import { getErrorMessage } from '@shared/utils/utils';
import { firstValueFrom, switchMap } from 'rxjs';
import { AdminTeamsService } from '../services/admin-teams.service';
import { adminTeamsEvent } from './admin-teams-events';
import { apiAdminTeamsEvent } from './api-admin-teams-events';

type AdminTeamsState = {
  teams: Team[] | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AdminTeamsState = {
  teams: null,
  isLoading: true,
  error: null,
};

export const AdminTeamsStore = signalStore(
  withState(initialState),
  withReducer(
    on(adminTeamsEvent.addTeam, ({ payload: team }, state) => ({
      teams: [...(state.teams ?? []), team],
    })),
    on(adminTeamsEvent.updateTeam, ({ payload: team }, state) => {
      const teams = state.teams?.map((t) => (t.id === team.id ? team : t));
      return { teams };
    }),
    on(adminTeamsEvent.deleteTeam, ({ payload: id }, state) => ({
      teams: state.teams?.filter((t) => t.id !== id),
    })),
    on(adminTeamsEvent.getTeams, () => ({
      teams: null,
      isLoading: true,
      error: null,
    })),
    on(apiAdminTeamsEvent.getTeamsSuccess, ({ payload: teams }) => ({
      teams: teams,
      isLoading: false,
    })),
    on(apiAdminTeamsEvent.getTeamsFailure, ({ payload: error }) => ({
      isLoading: false,
      error: error,
    })),
  ),
  withMethods((store) => ({
    getTeamsSuccess: (teams: Team[]) => {
      patchState(store, () => ({
        teams: teams,
        isLoading: false,
        error: null,
      }));
    },
    getTeamsFailure: (error: string) => {
      patchState(store, () => ({
        teams: null,
        isLoading: false,
        error: error,
      }));
    },
  })),
  withHooks({
    onInit: async (store, teamsService = inject(AdminTeamsService)) => {
      try {
        const teams = await firstValueFrom(teamsService.getAllTeams());
        store.getTeamsSuccess(teams);
      } catch (error) {
        store.getTeamsFailure(getErrorMessage(error));
      }
    },
  }),
  withEffects(
    (
      _,
      events = inject(Events),
      adminTeamsService = inject(AdminTeamsService),
    ) => ({
      getCompetitions$: events.on(adminTeamsEvent.getTeams).pipe(
        switchMap(() =>
          adminTeamsService.getAllTeams().pipe(
            mapResponse({
              next: (teams) => apiAdminTeamsEvent.getTeamsSuccess(teams),
              error: (error) =>
                apiAdminTeamsEvent.getTeamsFailure(getErrorMessage(error)),
            }),
          ),
        ),
      ),
    }),
  ),
);
