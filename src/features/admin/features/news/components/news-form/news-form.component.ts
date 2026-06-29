import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { News } from '@features/articles/models/news';
import { NewsHtmlSanitizerService } from '@features/articles/services/news-html-sanitizer.service';
import { NewsService } from '@features/articles/services/news.service';
import { DeleteDialogComponent } from '@shared/components/delete-dialog/delete-dialog.component';
import { FullSpinnerComponent } from '@shared/components/full-spinner/full-spinner.component';
import { firstValueFrom, map, startWith } from 'rxjs';

type TextWrapTag = 'strong' | 'em' | 'u' | 'h2' | 'h3' | 'blockquote';

@Component({
  selector: 'app-news-form',
  templateUrl: './news-form.component.html',
  styleUrl: './news-form.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    RouterLink,
    ReactiveFormsModule,
    FullSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFormComponent {
  @ViewChild('contentTextarea') private contentTextarea?: ElementRef<HTMLTextAreaElement>;

  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private newsHtmlSanitizer = inject(NewsHtmlSanitizerService);
  private newsService = inject(NewsService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private snackBar = inject(MatSnackBar);

  private news = signal<News | null>(null);
  private isLoadingResponse = signal(false);
  private notFound = signal(false);

  public readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    subtitle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    event: new FormControl(false, { nonNullable: true }),
    mediaUrl: new FormControl('', { nonNullable: true }),
  });

  private previewValue = toSignal(
    this.form.controls.content.valueChanges.pipe(
      startWith(this.form.controls.content.value),
      map((content) => this.toSafeHtml(content)),
    ),
    { initialValue: this.toSafeHtml('') },
  );

  public isEditMode = computed(() => !!this.news()?.id);
  public isLoading = computed(() => this.isLoadingResponse());
  public shouldShowNotFound = computed(() => this.notFound());
  public previewHtml = computed(() => this.previewValue());

  public get pageTitle(): string {
    return this.isEditMode() ? 'Editar noticia' : 'Crear noticia';
  }

  public get submitButtonText(): string {
    return this.isEditMode() ? 'Actualizar' : 'Publicar';
  }

  public get title(): FormControl {
    return this.form.controls.title;
  }

  public get subtitle(): FormControl {
    return this.form.controls.subtitle;
  }

  public get content(): FormControl {
    return this.form.controls.content;
  }

  constructor() {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const id = Number(params.get('id'));
        if (!params.get('id')) {
          this.resetComponentState();
          return;
        }

        if (isNaN(id)) {
          this.notFound.set(true);
          return;
        }

        this.loadNews(id);
      });
  }

  public async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const news = this.formToNews();
    if (!news.content.trim()) {
      this.snackBar.open('El contenido no puede estar vacío', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    if (this.isEditMode()) {
      await this.handleUpdateNews(news);
    } else {
      await this.handleAddNews(news);
    }
  }

  public insertImageUrl(): void {
    this.insertMedia((url) => this.newsHtmlSanitizer.imageToHtml(url));
  }

  public insertVideoUrl(): void {
    this.insertMedia((url) => this.newsHtmlSanitizer.videoToHtml(url));
  }

  public wrapSelection(tag: TextWrapTag): void {
    const placeholderByTag: Record<TextWrapTag, string> = {
      strong: 'texto en negrita',
      em: 'texto en cursiva',
      u: 'texto subrayado',
      h2: 'Título de sección',
      h3: 'Subtítulo',
      blockquote: 'Texto destacado',
    };

    this.insertAroundSelection(
      `<${tag}>`,
      `</${tag}>`,
      placeholderByTag[tag],
      ['h2', 'h3', 'blockquote'].includes(tag),
    );
  }

  public insertParagraph(): void {
    this.insertAroundSelection('<p>', '</p>', 'Nuevo párrafo', true);
  }

  public insertList(type: 'ul' | 'ol'): void {
    const textarea = this.contentTextarea?.nativeElement;
    const selectedText = textarea
      ? this.form.controls.content.value.slice(
          textarea.selectionStart,
          textarea.selectionEnd,
        )
      : '';

    const items = selectedText
      ? selectedText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : ['Primer punto', 'Segundo punto'];

    const html = `<${type}>\n${items.map((item) => `  <li>${this.escapeHtml(item)}</li>`).join('\n')}\n</${type}>`;
    this.replaceSelection(html, true);
  }

  public insertLink(): void {
    const url = this.form.controls.mediaUrl.value.trim();
    const normalizedUrl = this.newsHtmlSanitizer.normalizeLinkUrl(url);
    if (!normalizedUrl) {
      this.snackBar.open('Introduce una URL de enlace válida', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const selectedText = this.getSelectedText() || 'Texto del enlace';
    this.replaceSelection(
      `<a href="${this.escapeAttribute(normalizedUrl)}">${this.escapeHtml(selectedText)}</a>`,
      false,
    );
    this.form.controls.mediaUrl.reset('');
  }

  public async onDelete(): Promise<void> {
    const news = this.news();
    if (!news) {
      return;
    }

    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      data: {
        title: 'Eliminar noticia',
        text: 'Se eliminará la noticia publicada. Esta acción no se puede deshacer.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onConfirmDelete(news.id);
      }
    });
  }

  public onCreateNew(): void {
    if (!this.form.pristine) {
      this.snackBar.open('Hay cambios sin guardar en el formulario', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.resetComponentState();
    this.router.navigate(['/admin/noticia']);
  }

  private async loadNews(id: number): Promise<void> {
    this.isLoadingResponse.set(true);
    this.notFound.set(false);
    try {
      const news = await firstValueFrom(this.newsService.getNews(id));
      this.news.set(news);
      this.form.patchValue({
        title: news.title,
        subtitle: news.subtitle ?? '',
        content: this.newsHtmlSanitizer.sanitize(news.content),
        event: news.event === 1,
        mediaUrl: '',
      });
      this.form.markAsPristine();
    } catch (error) {
      console.error(error);
      this.notFound.set(true);
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private formToNews(): News {
    return {
      id: this.news()?.id ?? 0,
      title: this.form.controls.title.value.trim(),
      subtitle: this.parseEmptyStringToNull(this.form.controls.subtitle.value),
      content: this.newsHtmlSanitizer.sanitize(
        this.form.controls.content.value,
      ),
      event: this.form.controls.event.value ? 1 : 0,
    };
  }

  private insertMedia(toHtml: (url: string) => string | null): void {
    const html = toHtml(this.form.controls.mediaUrl.value.trim());
    if (!html) {
      this.snackBar.open('La URL no es válida o no está permitida', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.replaceSelection(html, true);
    this.form.controls.mediaUrl.reset('');
  }

  private insertAroundSelection(
    prefix: string,
    suffix: string,
    placeholder: string,
    isBlock = false,
  ): void {
    const selectedText = this.getSelectedText();
    this.replaceSelection(
      `${prefix}${this.escapeHtml(selectedText || placeholder)}${suffix}`,
      isBlock,
    );
  }

  private replaceSelection(html: string, isBlock = true): void {
    const textarea = this.contentTextarea?.nativeElement;
    const currentContent = this.form.controls.content.value;

    if (!textarea) {
      const separator = isBlock && currentContent ? '\n' : '';
      this.form.controls.content.setValue(`${currentContent}${separator}${html}`);
      this.form.controls.content.markAsDirty();
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const separatorBefore = isBlock && start > 0 && currentContent[start - 1] !== '\n' ? '\n' : '';
    const separatorAfter = isBlock && end < currentContent.length && currentContent[end] !== '\n' ? '\n' : '';
    const nextContent = `${currentContent.slice(0, start)}${separatorBefore}${html}${separatorAfter}${currentContent.slice(end)}`;

    this.form.controls.content.setValue(nextContent);
    this.form.controls.content.markAsDirty();

    queueMicrotask(() => {
      textarea.focus();
      const nextCursorPosition = start + separatorBefore.length + html.length;
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  private getSelectedText(): string {
    const textarea = this.contentTextarea?.nativeElement;
    if (!textarea) {
      return '';
    }

    return this.form.controls.content.value.slice(
      textarea.selectionStart,
      textarea.selectionEnd,
    );
  }

  private escapeHtml(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  private escapeAttribute(value: string): string {
    return value.replace(/"/g, '&quot;');
  }

  private async handleAddNews(news: News): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      const newsId = await firstValueFrom(this.newsService.addNews(news));
      const newNews = { ...news, id: newsId };
      this.news.set(newNews);
      this.form.markAsPristine();
      this.snackBar.open('Noticia publicada correctamente', 'Cerrar', {
        duration: 3000,
      });
      this.router.navigate(['/admin/noticia', newsId], { replaceUrl: true });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al publicar la noticia', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async handleUpdateNews(news: News): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.newsService.updateNews(news));
      this.news.set(news);
      this.form.markAsPristine();
      this.snackBar.open('Noticia actualizada correctamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al actualizar la noticia', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private async onConfirmDelete(newsId: number): Promise<void> {
    this.isLoadingResponse.set(true);
    try {
      await firstValueFrom(this.newsService.deleteNews(newsId));
      this.router.navigate(['/admin/noticias']);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Hubo un error al eliminar la noticia', 'Cerrar');
    } finally {
      this.isLoadingResponse.set(false);
    }
  }

  private toSafeHtml(content: string): SafeHtml {
    const sanitizedContent = this.newsHtmlSanitizer.sanitize(content);
    // Trust boundary is the local allowlist sanitizer above.
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedContent);
  }

  private parseEmptyStringToNull(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private resetComponentState(): void {
    this.news.set(null);
    this.notFound.set(false);
    this.form.reset({
      title: '',
      subtitle: '',
      content: '',
      event: false,
      mediaUrl: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
