import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { Competition } from '@shared/models/competition';
import { getErrorMessage } from '@shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { CompetitionsService } from '../services/competitions.service';
import { adminCompetitionsEvent } from './admin-competitions-events';

type CompetitionsState = {
  competitions: Competition[] | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: CompetitionsState = {
  competitions: null,
  isLoading: true,
  error: null,
};

export const CompetitionsStore = signalStore(
  withState(initialState),
  withReducer(
    on(
      adminCompetitionsEvent.addCompetition,
      ({ payload: competition }, state) => ({
        competitions: [...(state.competitions ?? []), competition],
      }),
    ),
    on(
      adminCompetitionsEvent.updateCompetition,
      ({ payload: competition }, state) => ({
        competitions: state.competitions?.map((c) =>
          c.id === competition.id ? competition : c,
        ),
      }),
    ),
    on(adminCompetitionsEvent.deleteCompetition, ({ payload: id }, state) => ({
      competitions: state.competitions?.filter((c) => c.id !== id),
    })),
  ),
  withMethods((store) => ({
    getCompetitionsSuccess: (competitions: Competition[]) => {
      patchState(store, () => ({
        competitions: competitions,
        isLoading: false,
        error: null,
      }));
    },
    getCompetitionsFailure: (error: string) => {
      patchState(store, () => ({
        competitions: null,
        isLoading: false,
        error: error,
      }));
    },
  })),
  withHooks({
    onInit: async (
      store,
      competitionsService = inject(CompetitionsService),
    ) => {
      try {
        const competitions = await firstValueFrom(
          competitionsService.getAllCompetitions(),
        );
        store.getCompetitionsSuccess(competitions);
      } catch (error) {
        store.getCompetitionsFailure(getErrorMessage(error));
      }
    },
  }),
);
