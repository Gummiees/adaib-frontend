import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { CompetitionStatus } from '@shared/models/competition';
import { CompetitionsStore } from '../store/competitions-store';
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
    MatButtonModule,
  ],
})
export class CompetitionsComponent {
  public competitionsStore = inject(CompetitionsStore);
  private router = inject(Router);

  public statusFilter = signal<CompetitionStatus | 'all' | null>(null);
  public seasonFilter = signal<number | null>(null);
  public seasons = computed<{ display: string; value: number }[]>(() => {
    const competitions = this.competitionsStore.competitions();
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
    const competitions = this.competitionsStore.competitions();
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

  public onNotFoundButtonClick = (): void => {
    this.router.navigate(['/competiciones']);
  };

  public onStatusFilterChange(status: CompetitionStatus | 'all' | null): void {
    this.statusFilter.set(status);
  }

  public onSeasonFilterChange(season: number | null): void {
    this.seasonFilter.set(season);
  }
}
