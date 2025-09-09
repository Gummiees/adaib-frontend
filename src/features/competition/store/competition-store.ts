import { inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { DetailedCompetition } from '@shared/models/competition';
import { getErrorMessage } from '@shared/utils/utils';
import { filter, switchMap } from 'rxjs/operators';
import { CompetitionService } from '../services/competition.service';
import { competitionApiEvent } from './competition-api-events';
import { getCompetitionEvent } from './competition-events';

type CompetitionState = {
  competition: DetailedCompetition | null;
  competitionId: number | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: CompetitionState = {
  competition: null,
  competitionId: null,
  isLoading: false,
  error: null,
};

export const CompetitionStore = signalStore(
  withState(initialState),
  withReducer(
    on(getCompetitionEvent, ({ payload: id }) => ({
      isLoading: true,
      competitionId: id,
      error: null,
    })),
    on(
      competitionApiEvent.getCompetitionSuccess,
      ({ payload: competition }) => ({
        isLoading: false,
        competition: competition,
      }),
    ),
    on(competitionApiEvent.getCompetitionFailure, ({ payload: error }) => ({
      competition: null,
      isLoading: false,
      error: error,
    })),
  ),
  withEffects(
    (
      store,
      events = inject(Events),
      competitionService = inject(CompetitionService),
    ) => ({
      login$: events.on(getCompetitionEvent).pipe(
        filter(() => !!store.competitionId()),
        switchMap(() =>
          competitionService.getCompetitionById(store.competitionId()!).pipe(
            mapResponse({
              next: (competition) =>
                competitionApiEvent.getCompetitionSuccess(competition),
              error: (error) =>
                competitionApiEvent.getCompetitionFailure(
                  getErrorMessage(error),
                ),
            }),
          ),
        ),
      ),
    }),
  ),
);
