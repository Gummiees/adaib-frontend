import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NewsHtmlSanitizerService {
  private readonly blockedTags = new Set(['SCRIPT', 'STYLE']);

  private readonly allowedTags = new Set([
    'A',
    'BLOCKQUOTE',
    'BR',
    'DIV',
    'EM',
    'H2',
    'H3',
    'H4',
    'I',
    'IFRAME',
    'IMG',
    'LI',
    'OL',
    'P',
    'STRONG',
    'U',
    'UL',
  ]);

  private readonly allowedAttributes = new Map<string, Set<string>>([
    ['A', new Set(['href', 'target', 'rel', 'title'])],
    ['IMG', new Set(['src', 'alt', 'title', 'loading'])],
    [
      'IFRAME',
      new Set([
        'src',
        'title',
        'width',
        'height',
        'allow',
        'allowfullscreen',
        'frameborder',
        'loading',
      ]),
    ],
  ]);

  sanitize(html: string): string {
    const template = document.createElement('template');
    template.innerHTML = html;
    this.cleanNode(template.content);
    return template.innerHTML;
  }

  imageToHtml(url: string): string | null {
    const normalizedUrl = this.normalizeHttpUrl(url);
    if (!normalizedUrl) {
      return null;
    }

    return `<img src="${this.escapeAttribute(normalizedUrl)}" alt="" loading="lazy">`;
  }

  videoToHtml(url: string): string | null {
    const embedUrl = this.toYoutubeEmbedUrl(url);
    if (!embedUrl) {
      return null;
    }

    return `<iframe src="${this.escapeAttribute(embedUrl)}" title="Video de YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  normalizeLinkUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsedUrl.protocol)) {
        return null;
      }

      return parsedUrl.toString();
    } catch {
      return null;
    }
  }

  private cleanNode(node: Node): void {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }

      if (child.nodeType === Node.TEXT_NODE) {
        return;
      }

      if (!(child instanceof HTMLElement)) {
        child.remove();
        return;
      }

      if (this.blockedTags.has(child.tagName)) {
        child.remove();
        return;
      }

      if (!this.allowedTags.has(child.tagName)) {
        this.cleanNode(child);
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }

      this.cleanAttributes(child);
      this.cleanNode(child);
    });
  }

  private cleanAttributes(element: HTMLElement): void {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const isAllowed = this.allowedAttributes.get(element.tagName)?.has(name);
      if (!isAllowed) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element instanceof HTMLAnchorElement) {
      this.cleanAnchor(element);
    }

    if (element instanceof HTMLImageElement) {
      this.cleanImage(element);
    }

    if (element instanceof HTMLIFrameElement) {
      this.cleanIframe(element);
    }
  }

  private cleanAnchor(anchor: HTMLAnchorElement): void {
    if (!this.isAllowedLink(anchor.href)) {
      anchor.removeAttribute('href');
    }

    if (anchor.href) {
      anchor.rel = 'noopener noreferrer';
      anchor.target = '_blank';
    }
  }

  private cleanImage(image: HTMLImageElement): void {
    if (!this.normalizeHttpUrl(image.src)) {
      image.remove();
      return;
    }

    image.loading = 'lazy';
  }

  private cleanIframe(iframe: HTMLIFrameElement): void {
    if (!this.isAllowedYoutubeEmbed(iframe.src)) {
      iframe.remove();
      return;
    }

    iframe.title = iframe.title || 'Video de YouTube';
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');
  }

  private toYoutubeEmbedUrl(url: string): string | null {
    const normalizedUrl = this.normalizeHttpUrl(url);
    if (!normalizedUrl) {
      return null;
    }

    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = parsedUrl.pathname.split('/').filter(Boolean)[0] ?? null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/').filter(Boolean)[1] ?? null;
      } else {
        videoId = parsedUrl.searchParams.get('v');
      }
    }

    if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  }

  private isAllowedYoutubeEmbed(url: string): boolean {
    const normalizedUrl = this.normalizeHttpUrl(url);
    if (!normalizedUrl) {
      return false;
    }

    const parsedUrl = new URL(normalizedUrl);
    return (
      parsedUrl.protocol === 'https:' &&
      ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(
        parsedUrl.hostname,
      ) &&
      /^\/embed\/[\w-]{11}$/.test(parsedUrl.pathname)
    );
  }

  private isAllowedLink(url: string): boolean {
    if (!url) {
      return false;
    }

    const parsedUrl = new URL(url, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsedUrl.protocol);
  }

  private normalizeHttpUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return null;
      }

      return parsedUrl.toString();
    } catch {
      return null;
    }
  }

  private escapeAttribute(value: string): string {
    return value.replace(/"/g, '&quot;');
  }
}
