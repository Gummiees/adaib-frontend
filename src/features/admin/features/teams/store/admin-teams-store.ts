import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { Team } from '@shared/models/team';
import { getErrorMessage } from '@shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { TeamsService } from '../services/teams.service';
import { adminTeamsEvent } from './admin-teams-events';

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
  ),
  withMethods((store) => ({
    getTeamsSuccess: (teams: Team[]) => {
      patchState(store, () => ({
        teams: teams,
        handlingTeam: null,
        isLoading: false,
        error: null,
      }));
    },
    getTeamsFailure: (error: string) => {
      patchState(store, () => ({
        teams: null,
        handlingTeam: null,
        isLoading: false,
        error: error,
      }));
    },
  })),
  withHooks({
    onInit: async (store, teamsService = inject(TeamsService)) => {
      try {
        const teams = await firstValueFrom(teamsService.getAllTeams());
        store.getTeamsSuccess(teams);
      } catch (error) {
        store.getTeamsFailure(getErrorMessage(error));
      }
    },
  }),
);
