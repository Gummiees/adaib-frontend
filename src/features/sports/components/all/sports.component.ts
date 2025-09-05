import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SportsService } from '@features/sports/services/sports.service';
import { CardComponent } from '@shared/components/card/card.component';
import { Sport } from '../../models/sport';

@Component({
  selector: 'app-sports',
  templateUrl: './sports.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
})
export class SportsComponent {
  public sportsService = inject(SportsService);
  public sports = signal<Sport[]>([]);
  public cards = computed(() =>
    this.sports().map((sport) => ({
      id: sport.id,
      title: sport.name,
      subtitle: sport.description,
      url: 'deportes',
    })),
  );

  constructor() {
    this.sportsService
      .getAllSports()
      .pipe(takeUntilDestroyed())
      .subscribe((sports) => {
        this.sports.set(sports);
      });
  }
}
