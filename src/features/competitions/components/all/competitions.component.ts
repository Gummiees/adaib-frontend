import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { catchError, of } from 'rxjs';
import { CompetitionStatus } from '../../models/competition';
import { CompetitionsService } from '../services/competitions.service';
import { CompetitionCardComponent } from './competition-card/competition-card.component';

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

  public allCompetitions = toSignal(
    this.competitionsService.getAllCompetitions().pipe(
      takeUntilDestroyed(),
      catchError(() => of([])),
    ),
    { initialValue: null },
  );

  public statusFilter = signal<CompetitionStatus | 'all' | null>(null);
  public seasonFilter = signal<number | null>(null);
  public seasons = computed<{ display: string; value: number }[]>(() => {
    const competitions = this.allCompetitions();
    if (!competitions) {
      return [];
    }

    const startingYears = [
      ...new Set(
        competitions
          .filter((competition) => !!competition.startDate)
          .map((competition) => competition.startDate!.getFullYear()),
      ),
    ];

    return startingYears.map((year) => ({
      display: `${year} - ${year + 1}`,
      value: year,
    }));
  });

  public filteredCompetitions = computed(() => {
    const competitions = this.allCompetitions();
    const filter = this.statusFilter();
    const seasonFilter = this.seasonFilter();

    if (!competitions) {
      return null;
    }

    return competitions.filter(
      (competition) =>
        (filter === 'all' ||
          filter === null ||
          competition.status === filter) &&
        (seasonFilter === null ||
          competition.startDate?.getFullYear() === seasonFilter ||
          competition.endDate?.getFullYear() === seasonFilter),
    );
  });

  public onStatusFilterChange(status: CompetitionStatus | 'all' | null): void {
    this.statusFilter.set(status);
  }

  public onSeasonFilterChange(season: number | null): void {
    this.seasonFilter.set(season);
  }
}
