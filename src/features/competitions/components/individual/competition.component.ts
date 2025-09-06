import { CommonModule } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { catchError, map, Observable, of, startWith, throwError } from 'rxjs';
import { Competition } from '../../models/competition';
import { CompetitionsService } from '../services/competitions.service';

@Component({
  selector: 'app-competition',
  templateUrl: './competition.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NotFoundComponent, FullSpinnerComponent],
})
export class CompetitionComponent {
  private activatedRoute = inject(ActivatedRoute);
  private competitionService = inject(CompetitionsService);

  public competitionWithLoading$ = this.getCompetition();

  private getCompetition(): Observable<{
    competition: Competition | null;
    isLoading: boolean;
  }> {
    const id = this.activatedRoute.snapshot.params['id'];

    if (!id) {
      return of({ competition: null, isLoading: false });
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return of({ competition: null, isLoading: false });
    }

    return this.competitionService.getCompetitionById(parsedId).pipe(
      takeUntilDestroyed(),
      map((competition) => ({ competition, isLoading: false })),
      startWith({ competition: null, isLoading: true }),
      catchError((error) => {
        if (error.status === HttpStatusCode.NotFound) {
          return of({ competition: null, isLoading: false });
        }
        return throwError(() => error);
      }),
    );
  }
}
