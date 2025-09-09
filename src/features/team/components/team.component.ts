import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '@features/team/services/team.service';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { BehaviorSubject, catchError, of, switchMap, tap } from 'rxjs';

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

  private reloadTrigger = new BehaviorSubject<void>(undefined);
  public failedToLoadTeam = signal(false);
  public isLoading = signal(false);
  public team = toSignal(
    this.reloadTrigger.pipe(
      takeUntilDestroyed(),
      switchMap(() => {
        const id = this.activatedRoute.snapshot.params['teamId'];

        if (!id) {
          this.isLoading.set(false);
          return of(null);
        }

        const parsedId = Number(id);
        if (isNaN(parsedId)) {
          this.isLoading.set(false);
          return of(null);
        }

        this.isLoading.set(true);
        this.failedToLoadTeam.set(false);
        return this.teamService.getTeamById(parsedId).pipe(
          tap(() => {
            this.isLoading.set(false);
          }),
          catchError(() => {
            this.failedToLoadTeam.set(true);
            this.isLoading.set(false);
            return of(null);
          }),
        );
      }),
    ),
    { initialValue: null },
  );

  public onNotFoundButtonClick(): void {
    const competitionId = this.activatedRoute.snapshot.params['id'];
    this.router.navigate(['/competiciones', competitionId]);
  }

  public reloadTeam(): void {
    this.failedToLoadTeam.set(false);
    this.isLoading.set(true);
    this.reloadTrigger.next();
  }
}
