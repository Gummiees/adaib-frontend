import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  SecurityContext,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { articles } from '@features/articles/content/articles';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { SEOService } from '@shared/services/seo.service';
import { TitleService } from '@shared/services/title.service';
import { map, Observable, of, startWith, tap } from 'rxjs';
import { Article } from '../../models/article';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NotFoundComponent, FullSpinnerComponent],
})
export class ArticleComponent {
  private activatedRoute = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private titleService = inject(TitleService);
  private seoService = inject(SEOService);
  public articleWithLoading$ = this.getArticle();

  public onNotFoundButtonClick(): void {
    this.router.navigate(['/noticias']);
  }

  private getArticle(): Observable<{
    article: Article | null;
    safeContent: SafeHtml | null;
    isLoading: boolean;
  }> {
    const id = this.activatedRoute.snapshot.params['id'];

    if (!id) {
      return of({ article: null, safeContent: null, isLoading: false });
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return of({ article: null, safeContent: null, isLoading: false });
    }

    // Simulate async loading for consistency with other components
    return of(null).pipe(
      takeUntilDestroyed(),
      map(() => {
        const article =
          articles.find((article) => article.id === parsedId) ?? null;
        const safeContent = article
          ? (this.sanitizer.sanitize(
              SecurityContext.HTML,
              article.content,
            ) as SafeHtml)
          : null;
        return { article, safeContent, isLoading: false };
      }),
      tap(({ article }) => {
        if (article) {
          this.titleService.setDynamicTitle(article.title);

          // Update SEO for the article
          const description = this.seoService.extractDescription(
            article.content,
          );
          this.seoService.setDynamicSEO({
            title: article.title,
            description: description,
            keywords: `${article.title}, noticias, baloncesto, ADAIB, Illes Balears, deportes`,
            image: article.imageUrl,
            type: 'article',
            author:
              'ADAIB - Asociación Deportistas Aficionados De Las Illes Balears',
            publishedTime: article.publishDate.toISOString(),
            section: 'Deportes',
            tags: ['baloncesto', 'ADAIB', 'deportes'],
            structuredData: this.seoService.generateArticleSchema(article),
          });
        }
      }),
      startWith({ article: null, safeContent: null, isLoading: true }),
    );
  }
}
