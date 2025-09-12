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
import { Group } from '@shared/models/group';

@Component({
  selector: 'app-group-filter',
  templateUrl: './group-filter.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, CommonModule],
})
export class GroupFilterComponent {
  public store = inject(CompetitionStore);
  public dispatcher = inject(Dispatcher);

  public availableGroups = computed<Group[]>(() => {
    const phase = this.store.phase();
    if (phase === 'all') {
      return [];
    }
    return phase.groups ?? [];
  });

  public onGroupFilterChange(group: Group | 'all'): void {
    this.dispatcher.dispatch(competitionEvents.groupChange(group));
    if (group === 'all') {
      return;
    }

    this.dispatcher.dispatch(
      competitionEvents.roundByGroupChange({
        group: group,
        round: group.actualRound ?? 'all',
      }),
    );

    const phase = this.store.phase();
    if (phase === 'all') {
      return;
    }
    this.dispatcher.dispatch(
      competitionEvents.roundByPhaseChange({
        phase: phase,
        round: group.actualRound ?? 'all',
      }),
    );
  }
}
