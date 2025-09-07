import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { CompetitionCardComponent } from '../competition-card/competition-card.component';
import { CompetitionsService } from '../services/competitions.service';

@Component({
  selector: 'app-competitions',
  templateUrl: './competitions.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FullSpinnerComponent,
    CommonModule,
    NotFoundComponent,
    CompetitionCardComponent,
  ],
})
export class CompetitionsComponent {
  public competitionsService = inject(CompetitionsService);

  public competitions$ = this.competitionsService
    .getAllCompetitions()
    .pipe(takeUntilDestroyed());
}
