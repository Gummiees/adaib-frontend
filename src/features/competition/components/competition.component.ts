import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamsComponent } from '@features/competition/components/tabs/teams/teams.component';
import { Dispatcher } from '@ngrx/signals/events';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { map } from 'rxjs';
import { getCompetitionEvent } from '../store/competition-events';
import { CompetitionStore } from '../store/competition-store';
import { ResultsComponent } from './tabs/results/results.component';

@Component({
  selector: 'app-competition',
  templateUrl: './competition.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NotFoundComponent,
    FullSpinnerComponent,
    TeamsComponent,
    MatTabsModule,
    ResultsComponent,
  ],
})
export class CompetitionComponent {
  public competitionStore = inject(CompetitionStore);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private dispatcher = inject(Dispatcher);

  constructor() {
    this.getCompetition();
  }

  // Get the current tab from query parameters
  public currentTab = toSignal(
    this.activatedRoute.queryParams.pipe(
      takeUntilDestroyed(),
      map((params) => {
        const tab = params['tab'];
        switch (tab) {
          case 'clasificacion':
            return 1;
          case 'resultados':
            return 2;
          case 'equipos':
            return 3;
          default:
            return 0; // Default to Resumen tab
        }
      }),
    ),
    { initialValue: 0 },
  );

  public onNotFoundButtonClick = (): void => {
    this.router.navigate(['/competiciones']);
  };

  public reloadCompetition(): void {
    this.getCompetition();
  }

  public onTabChange(index: number): void {
    const competitionId = this.activatedRoute.snapshot.params['id'];
    const baseUrl = `/competiciones/${competitionId}`;

    let queryParams: { tab?: string } = {};

    switch (index) {
      case 0:
        // No query parameter for Resumen tab
        break;
      case 1:
        queryParams = { tab: 'clasificacion' };
        break;
      case 2:
        queryParams = { tab: 'resultados' };
        break;
      case 3:
        queryParams = { tab: 'equipos' };
        break;
    }

    this.router.navigate([baseUrl], { queryParams });
  }

  private getCompetition(): void {
    const id = this.activatedRoute.snapshot.params['id'];

    if (!id) {
      return;
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return;
    }

    if (this.competitionStore.competition()?.id === parsedId) {
      return;
    }

    this.dispatcher.dispatch(getCompetitionEvent(parsedId));
  }
}
