import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Competition } from '@shared/models/competition';
import { firstValueFrom } from 'rxjs';
import { CompetitionsService } from '../services/competitions.service';

type CompetitionsState = {
  competitions: Competition[] | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: CompetitionsState = {
  competitions: null,
  isLoading: false,
  error: null,
};

export const CompetitionsStore = signalStore(
  withState(initialState),
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
      const competitions = await firstValueFrom(
        competitionsService.getAllCompetitions(),
      );
      store.getCompetitionsSuccess(competitions);
    },
  }),
);
