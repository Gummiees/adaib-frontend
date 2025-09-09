import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamsComponent } from '@features/competition/components/tabs/teams/teams.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedCompetition } from '@shared/models/competition';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CompetitionService } from '../services/competition.service';
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
  private activatedRoute = inject(ActivatedRoute);
  private competitionService = inject(CompetitionService);
  private router = inject(Router);

  private reloadTrigger = new BehaviorSubject<void>(undefined);
  public failedToLoadCompetition = signal(false);
  public isLoading = signal(false);
  public competition = toSignal(
    this.reloadTrigger.pipe(
      takeUntilDestroyed(),
      switchMap(() => {
        this.isLoading.set(true);
        this.failedToLoadCompetition.set(false);
        return this.getCompetition().pipe(
          tap(() => {
            this.isLoading.set(false);
          }),
          catchError(() => {
            this.failedToLoadCompetition.set(true);
            this.isLoading.set(false);
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null },
  );

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
    this.failedToLoadCompetition.set(false);
    this.isLoading.set(true);
    this.reloadTrigger.next();
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

  private getCompetition(): Observable<DetailedCompetition | null> {
    const id = this.activatedRoute.snapshot.params['id'];

    if (!id) {
      return of(null);
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return of(null);
    }

    return this.competitionService.getCompetitionById(parsedId);
  }
}
