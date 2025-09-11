import { signalStore, withState } from '@ngrx/signals';

import { on, withReducer } from '@ngrx/signals/events';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { summaryEvents } from './summary-events';

type SummaryState = {
  phase: Phase | null;
  group: Group | 'all';
};

const initialState: SummaryState = {
  phase: null,
  group: 'all',
};

export const SummaryStore = signalStore(
  withState(initialState),
  withReducer(
    on(summaryEvents.phaseChange, ({ payload: phase }) => ({
      phase: phase,
      group:
        phase.groups.find((group) => group.matches.length > 0) ??
        ('all' as const),
    })),
    on(summaryEvents.groupChange, ({ payload: group }) => ({
      group: group,
    })),
  ),
);
