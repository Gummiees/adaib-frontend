import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';
import { News } from '../../models/news';
import { NewsHtmlSanitizerService } from '../../services/news-html-sanitizer.service';
import { NewsService } from '../../services/news.service';

interface NewsFeedItem extends News {
  safeContent: SafeHtml;
}

interface NewsListState {
  news: NewsFeedItem[];
  isLoading: boolean;
  hasError: boolean;
}

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatButtonModule],
})
export class ArticlesComponent {
  private activatedRoute = inject(ActivatedRoute);
  private newsService = inject(NewsService);
  private newsHtmlSanitizer = inject(NewsHtmlSanitizerService);
  private sanitizer = inject(DomSanitizer);

  public readonly isEventPage = this.activatedRoute.snapshot.data['eventPage'] === true;
  public readonly eventFlag = this.isEventPage ? 1 : 0;
  public readonly pageTitle = this.isEventPage
    ? 'Semana del deporte de empresas'
    : 'Noticias';
  public readonly pageKicker = this.isEventPage
    ? ''
    : 'Actualidad ADAIB';
  public readonly pageDescription = this.isEventPage
    ? 'Toda la información publicada sobre la Semana del Deporte de Empresas.'
    : 'Comunicados, novedades de competición y vida deportiva de la asociación.';
  public readonly pageLogo = this.isEventPage
    ? 'assets/logo/TEXT_HOR_LOGO_SEMANA_DEPORTES_EMPRESAS.png'
    : null;

  public newsState$: Observable<NewsListState> = this.newsService
    .getNewsByEvent(this.eventFlag)
    .pipe(
      map((news) => ({
        news: news.map((item) => this.toFeedItem(item)),
        isLoading: false,
        hasError: false,
      })),
      catchError(() => of({ news: [], isLoading: false, hasError: true })),
      startWith({ news: [], isLoading: true, hasError: false }),
    );

  public getPreviewText(news: News): string {
    const template = document.createElement('template');
    template.innerHTML = this.newsHtmlSanitizer.sanitize(news.content);
    return (template.content.textContent || '').trim();
  }

  public getPreviewImage(news: News): string | null {
    const template = document.createElement('template');
    template.innerHTML = this.newsHtmlSanitizer.sanitize(news.content);
    return template.content.querySelector('img')?.getAttribute('src') ?? null;
  }

  private toFeedItem(news: News): NewsFeedItem {
    const sanitizedContent = this.newsHtmlSanitizer.sanitize(news.content);
    return {
      ...news,
      // Trust boundary is the local allowlist sanitizer above.
      safeContent: this.sanitizer.bypassSecurityTrustHtml(sanitizedContent),
    };
  }
}
