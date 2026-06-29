import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';
import { News } from '@features/articles/models/news';
import { NewsService } from '@features/articles/services/news.service';

interface AdminNewsState {
  news: News[];
  isLoading: boolean;
  hasError: boolean;
}

@Component({
  selector: 'app-admin-news',
  templateUrl: './admin-news.component.html',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNewsComponent {
  private newsService = inject(NewsService);
  private router = inject(Router);

  public newsState$: Observable<AdminNewsState> = this.newsService
    .getAllNews()
    .pipe(
      map((news) => ({ news, isLoading: false, hasError: false })),
      catchError(() =>
        of({ news: [] as News[], isLoading: false, hasError: true }),
      ),
      startWith({ news: [] as News[], isLoading: true, hasError: false }),
    );

  public onAddNewsClick(): void {
    this.router.navigate(['/admin/noticia']);
  }

  public onEditNewsClick(newsId: number): void {
    this.router.navigate(['/admin/noticia', newsId]);
  }
}
