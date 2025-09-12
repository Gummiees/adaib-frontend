import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { competitionEvents } from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Dispatcher } from '@ngrx/signals/events';
import { Round } from '@shared/models/round';

@Component({
  selector: 'app-round-filter',
  templateUrl: './round-filter.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, CommonModule],
})
export class RoundFilterComponent {
  public store = inject(CompetitionStore);
  public dispatcher = inject(Dispatcher);

  public availableRounds = computed<Round[]>(() => {
    const phase = this.store.phase();
    if (phase === 'all') {
      return [];
    }
    return phase.rounds ?? [];
  });

  public selectedRound = computed<Round | 'all'>(() => {
    const group = this.store.group();
    if (group !== 'all') {
      return this.store.roundByGroupId()[group.id] ?? 'all';
    }

    const phase = this.store.phase();
    if (phase === 'all') {
      return 'all';
    }
    return this.store.roundByPhaseId()[phase.id] ?? 'all';
  });

  public onRoundFilterChange(round: Round | 'all'): void {
    const phase = this.store.phase();
    if (phase === 'all') {
      return;
    }

    this.dispatcher.dispatch(
      competitionEvents.roundByPhaseChange({
        phase: phase,
        round: round,
      }),
    );

    const group = this.store.group();
    if (group === 'all') {
      return;
    }

    this.dispatcher.dispatch(
      competitionEvents.roundByGroupChange({
        group: group,
        round: round,
      }),
    );
  }
}
