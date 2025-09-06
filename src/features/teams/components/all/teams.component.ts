import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { Card } from '@shared/components/card/card';
import { CardComponent } from '@shared/components/card/card.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { Observable, map } from 'rxjs';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    FullSpinnerComponent,
    CommonModule,
    NotFoundComponent,
  ],
})
export class TeamsComponent {
  public teamsService = inject(TeamsService);

  public teamCards$: Observable<Card[] | null> = this.teamsService
    .getAllTeams()
    .pipe(
      takeUntilDestroyed(),
      map(
        (teams) =>
          teams?.map((team) => ({
            id: team.id,
            title: team.name,
            subtitle: team.description,
          })) ?? [],
      ),
    );
}
