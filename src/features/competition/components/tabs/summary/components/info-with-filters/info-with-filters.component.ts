import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GroupFilterComponent } from '@features/competition/components/filters/group/group-filter.component';
import { PhaseFilterComponent } from '@features/competition/components/filters/phase/phase-filter.component';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionInfoComponent } from '../competition-info/competition-info.component';

@Component({
  selector: 'app-info-with-filters',
  templateUrl: './info-with-filters.component.html',
  standalone: true,
  imports: [
    CompetitionInfoComponent,
    PhaseFilterComponent,
    GroupFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoWithFiltersComponent {
  public store = inject(CompetitionStore);
}
