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
import { AdminTeamsService } from '../services/admin-teams.service';
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
    on(adminTeamsEvent.addTeam, ({ payload: team }, state) => {
      console.log('teams', state.teams);
      const newTeams = [...(state.teams ?? []), team];
      console.log('newTeams', newTeams);
      return {
        teams: newTeams,
      };
    }),
    on(adminTeamsEvent.updateTeam, ({ payload: team }, state) => {
      console.log('teams', state.teams);
      const updatedTeams = state.teams?.map((t) =>
        t.id === team.id ? team : t,
      );
      console.log('updatedTeams', updatedTeams);
      return {
        teams: updatedTeams,
      };
    }),
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
);
