import { computed, inject } from '@angular/core';
import { Params, Router } from '@angular/router';
import { mapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withState,
} from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { getErrorMessage } from '@shared/utils/utils';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { CompetitionService } from '../services/competition.service';
import { competitionApiEvent } from './competition-api-events';
import { competitionEvents } from './competition-events';
import { competitionNavEvents } from './competition-nav-events';

type CompetitionState = {
  competition: DetailedCompetition | null;
  competitionId: number | null;
  isLoading: boolean;
  error: string | null;
  phase: Phase | 'all';
  group: Group | 'all';
  roundByGroupId: Record<number, Round | 'all'>;
  roundByPhaseId: Record<number, Round | 'all'>;
  roundToEdit: number | null;
  matchToEdit: number | null;
};

const initialState: CompetitionState = {
  competition: null,
  competitionId: null,
  isLoading: false,
  error: null,
  phase: 'all',
  group: 'all',
  roundByGroupId: {},
  roundByPhaseId: {},
  roundToEdit: null,
  matchToEdit: null,
};

export const CompetitionStore = signalStore(
  withState(initialState),
  withReducer(
    on(competitionEvents.getCompetition, ({ payload: id }) => ({
      isLoading: true,
      competitionId: id,
      error: null,
      phase: 'all' as const,
      group: 'all' as const,
      roundByGroupId: {},
      roundByPhaseId: {},
      roundToEdit: null,
      matchToEdit: null,
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
    on(competitionEvents.phaseChange, ({ payload: phase }) => ({
      phase: phase,
    })),
    on(competitionEvents.groupChange, ({ payload: group }) => ({
      group: group,
    })),
    on(
      competitionEvents.roundByPhaseChange,
      ({ payload: roundWithPhase }, state) => ({
        roundByPhaseId: {
          ...state.roundByPhaseId,
          [roundWithPhase.phase.id]: roundWithPhase.round,
        },
      }),
    ),
    on(
      competitionEvents.roundByGroupChange,
      ({ payload: roundWithGroup }, state) => ({
        roundByGroupId: {
          ...state.roundByGroupId,
          [roundWithGroup.group.id]: roundWithGroup.round,
        },
      }),
    ),
    on(competitionNavEvents.toEditRound, ({ payload: round }) => ({
      roundToEdit: round,
    })),
    on(competitionNavEvents.toEditMatch, ({ payload: match }) => ({
      matchToEdit: match,
    })),
  ),
  withComputed((store) => ({
    filteredCompetition: computed<DetailedCompetition | null>(() => {
      const competition = store.competition();
      if (!competition) {
        return null;
      }

      let filteredCompetition = { ...competition };
      const phaseFilter = store.phase();
      const groupFilter = store.group();
      let roundFilter = null;

      if (phaseFilter !== 'all') {
        filteredCompetition = {
          ...filteredCompetition,
          phases: competition.phases.filter(
            (phase) => phase.id === phaseFilter.id,
          ),
        };

        if (groupFilter !== 'all') {
          filteredCompetition = {
            ...filteredCompetition,
            phases: filteredCompetition.phases.map((phase) => ({
              ...phase,
              groups: phase.groups.filter(
                (group) => group.id === groupFilter.id,
              ),
            })),
          };

          roundFilter = store.roundByGroupId()[groupFilter.id];
        } else {
          roundFilter = store.roundByPhaseId()[phaseFilter.id];
        }
      }

      if (roundFilter && roundFilter !== 'all') {
        filteredCompetition = {
          ...filteredCompetition,
          phases: filteredCompetition.phases.map((phase) => ({
            ...phase,
            groups: phase.groups.map((group) => ({
              ...group,
              matches: group.matches.filter(
                (match) => match.round.id === roundFilter.id,
              ),
            })),
          })),
        };
      }

      return filteredCompetition;
    }),
  })),
  withEffects(
    (
      store,
      events = inject(Events),
      competitionService = inject(CompetitionService),
      router = inject(Router),
    ) => ({
      getCompetition$: events.on(competitionEvents.getCompetition).pipe(
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
      error$: events
        .on(competitionApiEvent.getCompetitionFailure)
        .pipe(map(({ payload: error }) => console.error(error))),
      toAddPhase$: events.on(competitionNavEvents.toAddPhase).pipe(
        tap(() => {
          const competition = store.competition();
          if (!competition) {
            return;
          }
          router.navigate(['/admin/competicion', competition.id, 'fase']);
        }),
      ),
      toAddGroup$: events.on(competitionNavEvents.toAddGroup).pipe(
        tap(() => {
          const competition = store.competition();
          if (!competition) {
            return;
          }
          const phase = store.phase();
          const queryParams: Params = addPhaseToQueryParams(phase, {});
          router.navigate(['/admin/competicion', competition.id, 'grupo'], {
            queryParams,
          });
        }),
      ),
      toAddRound$: events.on(competitionNavEvents.toAddRound).pipe(
        tap(() => {
          const competition = store.competition();
          if (!competition) {
            return;
          }
          const phase = store.phase();
          const queryParams: Params = addPhaseToQueryParams(phase, {});
          router.navigate(['/admin/competicion', competition.id, 'jornada'], {
            queryParams,
          });
        }),
      ),
      toAddMatch$: events.on(competitionNavEvents.toAddMatch).pipe(
        tap(() => {
          const competition = store.competition();
          if (!competition) {
            return;
          }
          const phase = store.phase();
          const group = store.group();
          const queryParams: Params = addRoundToQueryParams({
            phase,
            group,
            roundByGroupId: store.roundByGroupId(),
            roundByPhaseId: store.roundByPhaseId(),
            queryParams: addGroupToQueryParams(
              group,
              addPhaseToQueryParams(phase, {}),
            ),
          });
          router.navigate(['/admin/competicion', competition.id, 'partido'], {
            queryParams,
          });
        }),
      ),
      toEditPhase$: events.on(competitionNavEvents.toEditPhase).pipe(
        tap(() => {
          const competition = store.competition();
          const phase = store.phase();
          if (!competition || phase === 'all') {
            return;
          }
          router.navigate([
            '/admin/competicion',
            competition.id,
            'fase',
            phase.id,
          ]);
        }),
      ),
      toEditGroup$: events.on(competitionNavEvents.toEditGroup).pipe(
        tap(() => {
          const competition = store.competition();
          const group = store.group();
          if (!competition || group === 'all') {
            return;
          }
          const phase = store.phase();
          const queryParams: Params = addPhaseToQueryParams(phase, {});
          router.navigate(
            ['/admin/competicion', competition.id, 'grupo', group.id],
            { queryParams },
          );
        }),
      ),
      toEditRound$: events.on(competitionNavEvents.toEditRound).pipe(
        tap(() => {
          const competition = store.competition();
          const roundToEdit = store.roundToEdit();
          if (!competition || !roundToEdit) {
            return;
          }
          patchState(store, () => ({ roundToEdit: null }));
          const phase = store.phase();
          const queryParams: Params = addPhaseToQueryParams(phase, {});
          router.navigate(
            ['/admin/competicion', competition.id, 'jornada', roundToEdit],
            { queryParams },
          );
        }),
      ),
      toEditMatch$: events.on(competitionNavEvents.toEditMatch).pipe(
        tap(() => {
          const competition = store.competition();
          const matchToEdit = store.matchToEdit();
          if (!competition || !matchToEdit) {
            return;
          }
          patchState(store, () => ({ matchToEdit: null }));

          const phase = store.phase();
          const group = store.group();
          const queryParams: Params = addRoundToQueryParams({
            phase,
            group,
            roundByGroupId: store.roundByGroupId(),
            roundByPhaseId: store.roundByPhaseId(),
            queryParams: addGroupToQueryParams(
              group,
              addPhaseToQueryParams(phase, {}),
            ),
          });
          router.navigate(
            ['/admin/competicion', competition.id, 'partido', matchToEdit],
            { queryParams },
          );
        }),
      ),
    }),
  ),
);

function addPhaseToQueryParams(
  phase: Phase | 'all',
  queryParams: Params,
): Params {
  if (phase !== 'all') {
    queryParams['fase'] = phase.id.toString();
  }
  return queryParams;
}

function addGroupToQueryParams(
  group: Group | 'all',
  queryParams: Params,
): Params {
  if (group !== 'all') {
    queryParams['grupo'] = group.id.toString();
  }
  return queryParams;
}

function addRoundToQueryParams({
  phase,
  group,
  roundByGroupId,
  roundByPhaseId,
  queryParams,
}: {
  phase: Phase | 'all';
  group: Group | 'all';
  roundByGroupId: Record<number, Round | 'all'>;
  roundByPhaseId: Record<number, Round | 'all'>;
  queryParams: Params;
}): Params {
  let round: Round | 'all' | null = null;
  if (phase !== 'all') {
    round = roundByPhaseId[phase.id];
  }
  if (group !== 'all') {
    round = roundByGroupId[group.id];
  }
  if (!!round && round !== 'all') {
    queryParams['jornada'] = round.id.toString();
  }
  return queryParams;
}
