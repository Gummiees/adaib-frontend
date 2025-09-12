import { computed, inject } from '@angular/core';
import { mapResponse } from '@ngrx/operators';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEffects, withReducer } from '@ngrx/signals/events';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Round } from '@shared/models/round';
import { getErrorMessage } from '@shared/utils/utils';
import { filter, map, switchMap } from 'rxjs/operators';
import { CompetitionService } from '../services/competition.service';
import { competitionApiEvent } from './competition-api-events';
import { competitionEvents } from './competition-events';

type CompetitionState = {
  competition: DetailedCompetition | null;
  competitionId: number | null;
  isLoading: boolean;
  error: string | null;
  phase: Phase | 'all';
  group: Group | 'all';
  roundByGroupId: Record<number, Round | 'all'>;
  roundByPhaseId: Record<number, Round | 'all'>;
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
    ) => ({
      login$: events.on(competitionEvents.getCompetition).pipe(
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
    }),
  ),
);
