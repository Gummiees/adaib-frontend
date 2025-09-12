import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { Group } from '@shared/models/group';
import { Phase } from '@shared/models/phase';
import { Team } from '@shared/models/team';
import { InfoWithFiltersComponent } from './components/info-with-filters/info-with-filters.component';
import { PhaseResultsComponent } from './components/phase-results/phase-results.component';
import { PhaseSummaryComponent } from './components/phase-summary/phase-summary.component';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  standalone: true,
  imports: [
    CommonModule,
    InfoWithFiltersComponent,
    NotFoundComponent,
    MatButtonModule,
    PhaseSummaryComponent,
    PhaseResultsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  private router = inject(Router);
  public store = inject(CompetitionStore);

  public onTeamClicked(team: Team): void {
    this.router.navigate(['/competiciones', this.store.competition()!.id], {
      queryParams: { tab: 'equipos', equipo: team.id.toString() },
    });
  }

  public onPhaseMoreInfoClicked(): void {
    this.router.navigate(['/competiciones', this.store.competition()!.id], {
      queryParams: { tab: 'resultados' },
    });
  }

  public onMoreInfoClicked(): void {
    this.router.navigate(['/competiciones', this.store.competition()!.id], {
      queryParams: { tab: 'resultados' },
    });
  }

  public getPhase(phase: Phase | 'all'): Phase | null {
    if (phase === 'all') {
      return null;
    }
    return phase;
  }

  public getGroup(group: Group | 'all'): Group | null {
    if (group === 'all') {
      return null;
    }
    return group;
  }
}
