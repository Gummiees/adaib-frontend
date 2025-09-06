import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { Card } from '@shared/components/card/card';
import { CardComponent } from '@shared/components/card/card.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { Observable, map } from 'rxjs';
import { CompetitionsService } from '../services/competitions.service';

@Component({
  selector: 'app-competitions',
  templateUrl: './competitions.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    FullSpinnerComponent,
    CommonModule,
    NotFoundComponent,
  ],
})
export class CompetitionsComponent {
  public competitionsService = inject(CompetitionsService);

  public competitionCards$: Observable<Card[] | null> = this.competitionsService
    .getAllCompetitions()
    .pipe(
      takeUntilDestroyed(),
      map(
        (competitions) =>
          competitions?.map((competition) => ({
            id: competition.id,
            title: competition.name,
            subtitle: competition.description,
          })) ?? [],
      ),
    );
}
