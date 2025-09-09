import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { Competition } from '@shared/models/competition';
import { getErrorMessage } from '@shared/utils/utils';
import { switchMap } from 'rxjs/operators';
import { CompetitionsService } from '../services/competitions.service';
import { competitionsApiEvent } from './competitions-api-events';
import { getCompetitionsEvent } from './competitions-events';

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
  withReducer(
    on(getCompetitionsEvent, () => ({
      isLoading: true,
      error: null,
    })),
    on(
      competitionsApiEvent.getCompetitionsSuccess,
      ({ payload: competitions }) => ({
        isLoading: false,
        competitions: competitions,
      }),
    ),
    on(competitionsApiEvent.getCompetitionsFailure, ({ payload: error }) => ({
      competitions: null,
      isLoading: false,
      error: error,
    })),
  ),
  withEffects(
    (
      _,
      events = inject(Events),
      competitionsService = inject(CompetitionsService),
    ) => ({
      getCompetitions$: events.on(getCompetitionsEvent).pipe(
        switchMap(() =>
          competitionsService.getAllCompetitions().pipe(
            mapResponse({
              next: (competitions) =>
                competitionsApiEvent.getCompetitionsSuccess(competitions),
              error: (error) =>
                competitionsApiEvent.getCompetitionsFailure(
                  getErrorMessage(error),
                ),
            }),
          ),
        ),
      ),
    }),
  ),
);
