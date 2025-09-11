import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Dispatcher } from '@ngrx/signals/events';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { summaryEvents } from '../../store/summary-events';
import { SummaryStore } from '../../store/summary-store';
import { CompetitionInfoComponent } from '../competition-info/competition-info.component';

@Component({
  selector: 'app-info-with-filters',
  templateUrl: './info-with-filters.component.html',
  standalone: true,
  imports: [CompetitionInfoComponent, MatSelectModule, MatFormFieldModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoWithFiltersComponent {
  public store = inject(SummaryStore);
  public competition = input.required<DetailedCompetition>();
  public dispatcher = inject(Dispatcher);

  public availablePhases = computed<Phase[]>(() => {
    return [
      ...new Set(this.competition().phases.filter((phase) => phase.groups)),
    ];
  });

  public availableGroups = computed<Group[]>(() => {
    return [...new Set(this.store.phase()?.groups ?? [])];
  });

  public onPhaseChange(phase: Phase) {
    this.dispatcher.dispatch(summaryEvents.phaseChange(phase));
  }

  public onGroupChange(group: Group | 'all') {
    this.dispatcher.dispatch(summaryEvents.groupChange(group));
  }
}
