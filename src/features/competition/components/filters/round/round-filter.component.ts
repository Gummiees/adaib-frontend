import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { competitionEvents } from '@features/competition/store/competition-events';
import { competitionNavEvents } from '@features/competition/store/competition-nav-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { Round } from '@shared/models/round';

@Component({
  selector: 'app-round-filter',
  templateUrl: './round-filter.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class RoundFilterComponent {
  public competitionStore = inject(CompetitionStore);
  public userStore = inject(UserStore);
  public dispatcher = inject(Dispatcher);

  public availableRounds = computed<Round[]>(() => {
    const phase = this.competitionStore.phase();
    if (phase === 'all') {
      return [];
    }
    return phase.rounds ?? [];
  });

  public selectedRoundId = computed<number | 'all'>(() => {
    const round = this.selectedRound();
    if (round === 'all') {
      return 'all';
    }
    return round.id;
  });

  private selectedRound = computed<Round | 'all'>(() => {
    const group = this.competitionStore.group();
    let round: Round | 'all' = 'all';
    if (group !== 'all') {
      round = this.competitionStore.roundByGroupId()[group.id] ?? 'all';
    }

    if (round === 'all') {
      const phase = this.competitionStore.phase();
      if (phase === 'all') {
        return 'all';
      }
      round = this.competitionStore.roundByPhaseId()[phase.id] ?? 'all';
    }

    return round;
  });

  public onRoundFilterChange(roundId: number | 'all'): void {
    const phase = this.competitionStore.phase();
    if (phase === 'all') {
      return;
    }
    const round = phase.rounds.find((round) => round.id === roundId) ?? 'all';
    this.dispatcher.dispatch(
      competitionEvents.roundByPhaseChange({
        phase: phase,
        round: round,
      }),
    );

    const group = this.competitionStore.group();
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

  public onCreateRoundClick(): void {
    this.dispatcher.dispatch(competitionNavEvents.toAddRound());
  }

  public onEditRoundClick(): void {
    const round = this.selectedRound();
    if (round === 'all') {
      return;
    }
    this.dispatcher.dispatch(competitionNavEvents.toEditRound(round.id));
  }
}
