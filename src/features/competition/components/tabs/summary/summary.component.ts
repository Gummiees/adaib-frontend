import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Params, Router } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { InfoWithFiltersComponent } from './components/info-with-filters/info-with-filters.component';
import { SummaryResultsComponent } from './components/results/summary-results.component';
import { summaryEvents } from './store/summary-events';
import { SummaryStore } from './store/summary-store';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  standalone: true,
  imports: [
    CommonModule,
    SummaryResultsComponent,
    InfoWithFiltersComponent,
    NotFoundComponent,
    MatButtonModule,
  ],
  providers: [SummaryStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  private router = inject(Router);
  public store = inject(SummaryStore);
  private dispatcher = inject(Dispatcher);

  public competition = input.required<DetailedCompetition>();

  private initialPhase = computed<Phase | null>(() => {
    return (
      this.competition().phases.find(
        (phase) => phase.groups.flatMap((group) => group.matches).length > 0,
      ) ?? null
    );
  });
  private initialGroup = computed<Group | null>(() => {
    const phase = this.initialPhase();
    return phase?.groups.find((group) => group.matches.length > 0) ?? null;
  });

  constructor() {
    effect(() => {
      const initialPhase = this.initialPhase();
      const initialGroup = this.initialGroup();
      if (initialPhase) {
        this.dispatcher.dispatch(summaryEvents.phaseChange(initialPhase));
      }
      if (initialGroup) {
        this.dispatcher.dispatch(summaryEvents.groupChange(initialGroup));
      }
    });
  }

  public availablePhases = computed<Phase[]>(() => {
    return [
      ...new Set(this.competition().phases.filter((phase) => phase.groups)),
    ];
  });

  public onMatchTeamClicked(team: Team) {
    this.router.navigate(['/competiciones', this.competition().id], {
      queryParams: { tab: 'equipos', equipo: team.id.toString() },
    });
  }

  public onPhaseMoreInfoClicked() {
    const queryParams: Params = { tab: 'resultados' };
    const phaseFilter = this.store.phase();
    if (phaseFilter) {
      queryParams['fase'] = phaseFilter.id.toString();
    }
    this.router.navigate(['/competiciones', this.competition().id], {
      queryParams,
    });
  }

  public onMoreInfoClicked() {
    const queryParams: Params = { tab: 'resultados' };
    const phaseFilter = this.store.phase();
    const groupFilter = this.store.group();
    if (phaseFilter) {
      queryParams['fase'] = phaseFilter.id.toString();
    }
    if (groupFilter !== 'all') {
      queryParams['grupo'] = groupFilter.id.toString();
    }
    this.router.navigate(['/competiciones', this.competition().id], {
      queryParams,
    });
  }

  public getGroup(group: Group | 'all'): Group | null {
    if (group === 'all') {
      return null;
    }
    return group;
  }
}
