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
import { Group } from '@shared/models/group';

@Component({
  selector: 'app-group-filter',
  templateUrl: './group-filter.component.html',
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
export class GroupFilterComponent {
  public competitionStore = inject(CompetitionStore);
  public userStore = inject(UserStore);
  public dispatcher = inject(Dispatcher);

  public availableGroups = computed<Group[]>(() => {
    const phase = this.competitionStore.phase();
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

    const phase = this.competitionStore.phase();
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
  public onCreateGroupClick(): void {
    this.dispatcher.dispatch(competitionNavEvents.toAddGroup());
  }
  public onEditGroupClick(): void {
    this.dispatcher.dispatch(competitionNavEvents.toEditGroup());
  }
}
