import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { SEOService } from '@shared/services/seo.service';
import { TitleService } from '@shared/services/title.service';
import { catchError, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { News } from '../../models/news';
import { NewsHtmlSanitizerService } from '../../services/news-html-sanitizer.service';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NotFoundComponent, FullSpinnerComponent],
})
export class ArticleComponent {
  private activatedRoute = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private newsHtmlSanitizer = inject(NewsHtmlSanitizerService);
  private newsService = inject(NewsService);
  private router = inject(Router);
  private titleService = inject(TitleService);
  private seoService = inject(SEOService);
  public articleWithLoading$ = this.getArticle();

  public onNotFoundButtonClick(): void {
    this.router.navigate(['/noticias']);
  }

  private getArticle(): Observable<{
    article: News | null;
    safeContent: SafeHtml | null;
    isLoading: boolean;
  }> {
    return this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(),
      switchMap((params) => {
        const id = params.get('id');
        const parsedId = Number(id);
        if (!id || isNaN(parsedId)) {
          return of({ article: null, safeContent: null, isLoading: false });
        }

        return this.newsService.getNews(parsedId).pipe(
          map((article) => {
            const sanitizedContent = this.newsHtmlSanitizer.sanitize(
              article.content,
            );
            return {
              article,
              // The app trusts only the allowlisted output produced above.
              safeContent:
                this.sanitizer.bypassSecurityTrustHtml(sanitizedContent),
              isLoading: false,
            };
          }),
          catchError(() =>
            of({ article: null, safeContent: null, isLoading: false }),
          ),
          startWith({ article: null, safeContent: null, isLoading: true }),
        );
      }),
      tap(({ article }) => {
        if (article) {
          this.titleService.setDynamicTitle(article.title);

          const description = this.seoService.extractDescription(
            article.content,
          );
          this.seoService.setDynamicSEO({
            title: article.title,
            description: description,
            keywords: `${article.title}, noticias, baloncesto, ADAIB, Illes Balears, deportes`,
            type: 'article',
            section: 'Deportes',
            tags: ['baloncesto', 'ADAIB', 'deportes'],
          });
        }
      }),
    );
  }
}
