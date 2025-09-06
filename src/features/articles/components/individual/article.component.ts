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
import { ActivatedRoute } from '@angular/router';
import { articles } from '@features/articles/content/articles';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { map, Observable, of, startWith } from 'rxjs';
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

  public articleWithLoading$ = this.getArticle();

  constructor() {
    // Test subscription to see if observable works
    this.articleWithLoading$.subscribe({
      next: (result) => console.log('Article observable emitted:', result),
      error: (error) => console.log('Article observable error:', error),
    });
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
      startWith({ article: null, safeContent: null, isLoading: true }),
    );
  }
}
