import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';
import { News } from '../articles/models/news';
import { NewsService } from '../articles/services/news.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatButtonModule],
  host: {
    class: 'landing-page',
  },
})
export class LandingComponent {
  private newsService = inject(NewsService);

  // Place the real Excel file at adaib-frontend/public/inscribir_equipo.xlsx.
  public readonly registrationFileUrl = '/inscribir_equipo.xlsx';

  public latestNews$: Observable<News[]> = this.newsService.getNewsByEvent(0).pipe(
    map((news) => news.slice(0, 3)),
    catchError(() => of([] as News[])),
    startWith([] as News[]),
  );
}
