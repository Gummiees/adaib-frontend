import { CommonModule } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { catchError, map, Observable, of, startWith, throwError } from 'rxjs';
import { DetailedTeam } from '../../models/team';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundComponent, CommonModule, FullSpinnerComponent],
})
export class TeamComponent {
  private activatedRoute = inject(ActivatedRoute);
  private teamsService = inject(TeamsService);

  public teamWithLoading$ = this.getTeam();

  private getTeam(): Observable<{
    team: DetailedTeam | null;
    isLoading: boolean;
  }> {
    const id = this.activatedRoute.snapshot.params['id'];

    if (!id) {
      return of({ team: null, isLoading: false });
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return of({ team: null, isLoading: false });
    }

    return this.teamsService.getTeamById(parsedId).pipe(
      takeUntilDestroyed(),
      map((team) => ({ team, isLoading: false })),
      startWith({ team: null, isLoading: true }),
      catchError((error) => {
        if (error.status === HttpStatusCode.NotFound) {
          return of({ team: null, isLoading: false });
        }
        return throwError(() => error);
      }),
    );
  }
}
