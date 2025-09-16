import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  competitionEvents,
  RoundWithGroup,
} from '@features/competition/store/competition-events';
import { competitionNavEvents } from '@features/competition/store/competition-nav-events';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { UserStore } from '@features/user/store/user-store';
import { Dispatcher } from '@ngrx/signals/events';
import { Phase } from '@shared/models/phase';

@Component({
  selector: 'app-phase-filter',
  templateUrl: './phase-filter.component.html',
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
export class PhaseFilterComponent {
  public competitionStore = inject(CompetitionStore);
  public userStore = inject(UserStore);
  public dispatcher = inject(Dispatcher);

  public onPhaseFilterChange(phase: Phase | 'all'): void {
    this.dispatcher.dispatch(competitionEvents.phaseChange(phase));
    this.dispatcher.dispatch(competitionEvents.groupChange('all'));

    const competition = this.competitionStore.competition();
    if (phase !== 'all') {
      this.dispatchRoundChange(phase);
    } else if (competition) {
      for (const phase of competition.phases) {
        this.dispatchRoundChange(phase);
      }
    }
  }

  private dispatchRoundChange(phase: Phase): void {
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

  public onCreatePhaseClick(): void {
    this.dispatcher.dispatch(competitionNavEvents.toAddPhase());
  }
  public onEditPhaseClick(): void {
    this.dispatcher.dispatch(competitionNavEvents.toEditPhase());
  }
}
