import {
  ChangeDetectionStrategy,
  Component,
  inject,
  SecurityContext,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { articles } from '@features/articles/content/articles';
import { NotFoundComponent } from '@features/not-found/not-found.component';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotFoundComponent],
})
export class ArticleComponent {
  private sanitizer = inject(DomSanitizer);

  article = articles.find(
    (article) => article.id === inject(ActivatedRoute).snapshot.params['id'],
  );

  safeContent: SafeHtml = this.sanitizer.sanitize(
    SecurityContext.HTML,
    this.article?.content ?? null,
  ) as SafeHtml;
}
