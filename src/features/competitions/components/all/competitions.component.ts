import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
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
    MatSelectModule,
    MatFormFieldModule,
  ],
})
export class CompetitionsComponent {
  public competitionsService = inject(CompetitionsService);

  public competitions$ = this.competitionsService
    .getAllCompetitions()
    .pipe(takeUntilDestroyed());
}
