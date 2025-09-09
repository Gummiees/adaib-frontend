import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '@features/team/services/team.service';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { DetailedTeam } from '@shared/models/team';
import { catchError, map, Observable, of, startWith } from 'rxjs';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundComponent, CommonModule, FullSpinnerComponent],
})
export class TeamComponent {
  private activatedRoute = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private router = inject(Router);

  public teamWithLoading$ = this.getTeam();

  public onNotFoundButtonClick(): void {
    const competitionId = this.activatedRoute.snapshot.params['id'];
    this.router.navigate(['/competiciones', competitionId]);
  }

  private getTeam(): Observable<{
    team: DetailedTeam | null;
    isLoading: boolean;
  }> {
    const id = this.activatedRoute.snapshot.params['teamId'];

    if (!id) {
      return of({ team: null, isLoading: false });
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return of({ team: null, isLoading: false });
    }

    return this.teamService.getTeamById(parsedId).pipe(
      takeUntilDestroyed(),
      map((team) => ({ team, isLoading: false })),
      startWith({ team: null, isLoading: true }),
      catchError(() => of({ team: null, isLoading: false })),
    );
  }
}
