import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  competitionEvents,
  RoundWithGroup,
} from '@features/competition/store/competition-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { Dispatcher } from '@ngrx/signals/events';
import { Phase } from '@shared/models/phase';

@Component({
  selector: 'app-phase-filter',
  templateUrl: './phase-filter.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, CommonModule],
})
export class PhaseFilterComponent {
  public store = inject(CompetitionStore);
  public dispatcher = inject(Dispatcher);

  public onPhaseFilterChange(phase: Phase | 'all'): void {
    this.dispatcher.dispatch(competitionEvents.phaseChange(phase));
    this.dispatcher.dispatch(competitionEvents.groupChange('all'));

    const competition = this.store.competition();
    if (phase !== 'all') {
      this.dispatchRoundChange(phase);
    } else if (competition) {
      for (const phase of competition.phases) {
        this.dispatchRoundChange(phase);
      }
    }
  }

  private dispatchRoundChange(phase: Phase) {
    this.dispatcher.dispatch(
      competitionEvents.roundByPhaseChange({
        phase: phase,
        round: phase.rounds.length > 0 ? phase.rounds[0] : 'all',
      }),
    );

    for (const group of phase.groups) {
      const roundRecord: RoundWithGroup = {
        group: group,
        round: group.actualRound ?? 'all',
      };
      this.dispatcher.dispatch(
        competitionEvents.roundByGroupChange(roundRecord),
      );
    }
  }
}
