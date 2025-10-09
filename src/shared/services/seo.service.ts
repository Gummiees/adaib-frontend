import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  structuredData?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class SEOService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly baseTitle = 'ADAIB';
  private readonly baseDescription =
    'Asociación Deportistas Aficionados De Las Illes Balears - Competiciones, equipos, resultados y noticias.';
  private readonly baseUrl = 'https://adaib.com';
  private readonly defaultImage =
    '/assets/logo/full/transparent/white-letters/1280.webp';

  public init(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        map((route) => ({
          title:
            route.snapshot.data['title'] || route.snapshot.data['pageTitle'],
          seo: route.snapshot.data['seo'] || {},
        })),
      )
      .subscribe(({ title, seo }) => {
        if (title || seo.title) {
          this.updateSEOData({
            title: seo.title || title,
            description: seo.description || this.baseDescription,
            keywords: seo.keywords,
            image: seo.image || this.defaultImage,
            type: seo.type || 'website',
            ...seo,
          });
        } else {
          this.setDefaultSEO();
        }
      });
  }

  public updateSEOData(data: Partial<SEOData>): void {
    // Update title
    const fullTitle = data.title
      ? `${data.title} | ${this.baseTitle}`
      : this.baseTitle;
    this.title.setTitle(fullTitle);

    // Get current URL
    const currentUrl = `${this.baseUrl}${this.router.url}`;

    // Update basic meta tags
    this.updateMetaTag('description', data.description || this.baseDescription);
    this.updateMetaTag(
      'keywords',
      data.keywords ||
        'baloncesto, competiciones, equipos, deportes, ADAIB, basketball, torneos, Illes Balears, Baleares',
    );
    this.updateMetaTag('author', data.author || 'ADAIB');

    // Update Open Graph tags
    this.updateMetaTag('og:title', fullTitle, 'property');
    this.updateMetaTag(
      'og:description',
      data.description || this.baseDescription,
      'property',
    );
    this.updateMetaTag('og:image', data.image || this.defaultImage, 'property');
    this.updateMetaTag('og:url', data.url || currentUrl, 'property');
    this.updateMetaTag('og:type', data.type || 'website', 'property');
    this.updateMetaTag('og:site_name', this.baseTitle, 'property');
    this.updateMetaTag('og:locale', 'es_ES', 'property');

    // Update Twitter Card tags
    this.updateMetaTag('twitter:card', 'summary_large_image', 'name');
    this.updateMetaTag('twitter:title', fullTitle, 'name');
    this.updateMetaTag(
      'twitter:description',
      data.description || this.baseDescription,
      'name',
    );
    this.updateMetaTag(
      'twitter:image',
      data.image || this.defaultImage,
      'name',
    );

    // Article specific meta tags
    if (data.type === 'article') {
      this.updateMetaTag('article:author', data.author || 'ADAIB', 'property');
      if (data.publishedTime) {
        this.updateMetaTag(
          'article:published_time',
          data.publishedTime,
          'property',
        );
      }
      if (data.modifiedTime) {
        this.updateMetaTag(
          'article:modified_time',
          data.modifiedTime,
          'property',
        );
      }
      if (data.section) {
        this.updateMetaTag('article:section', data.section, 'property');
      }
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach((tag) => {
          this.addMetaTag('article:tag', tag, 'property');
        });
      }
    }

    // Add structured data if provided
    if (data.structuredData) {
      this.addStructuredData(data.structuredData);
    }
  }

  public setDynamicSEO(data: SEOData): void {
    this.updateSEOData(data);
  }

  public setDefaultSEO(): void {
    this.updateSEOData({
      title: '',
      description: this.baseDescription,
      type: 'website',
    });
  }

  private updateMetaTag(
    name: string,
    content: string,
    attribute: 'name' | 'property' = 'name',
  ): void {
    if (content) {
      this.meta.updateTag({ [attribute]: name, content });
    }
  }

  private addMetaTag(
    name: string,
    content: string,
    attribute: 'name' | 'property' = 'name',
  ): void {
    if (content) {
      this.meta.addTag({ [attribute]: name, content });
    }
  }

  private addStructuredData(data: Record<string, unknown>): void {
    // Remove existing structured data
    const existingScript = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // Utility methods for generating structured data
  public generateOrganizationSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'SportsOrganization',
      name: 'ADAIB - Asociación Deportistas Aficionados De Las Illes Balears',
      description: this.baseDescription,
      url: this.baseUrl,
      email: 'fran@adaib.com',
      phone: '+34625556874',
      logo: `${this.baseUrl}${this.defaultImage}`,
      sameAs: [
        // Add your social media URLs here
        // 'https://facebook.com/adaib',
        // 'https://twitter.com/adaib',
        // 'https://instagram.com/adaib'
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'ES',
        // Add specific address details here
      },
      sport: 'Basketball',
    };
  }

  public generateArticleSchema(article: {
    title: string;
    content: string;
    imageUrl: string;
    id: number;
    author: string;
  }): Record<string, unknown> {
    const currentUrl = `${this.baseUrl}/noticias/${article.id}`;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: this.extractDescription(article.content),
      image: article.imageUrl,
      url: currentUrl,
      author: {
        '@type': 'Organization',
        name: article.author,
      },
      publisher: {
        '@type': 'Organization',
        name: article.author,
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}${this.defaultImage}`,
        },
      },
      datePublished: new Date().toISOString(), // You might want to add actual dates to your articles
      dateModified: new Date().toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': currentUrl,
      },
    };
  }

  public generateSportsEventSchema(competition: {
    name: string;
    description?: string | null;
    sportName: string;
    startDate?: Date | null;
    endDate?: Date | null;
    status: string;
    teams?: { name: string }[];
  }): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: competition.name,
      description:
        competition.description || `Competición de ${competition.sportName}`,
      sport: competition.sportName,
      startDate: competition.startDate,
      endDate: competition.endDate,
      eventStatus: this.mapCompetitionStatus(competition.status),
      organizer: {
        '@type': 'SportsOrganization',
        name: 'ADAIB - Asociación Deportistas Aficionados De Las Illes Balears',
      },
      location: {
        '@type': 'Place',
        name: 'Instalaciones ADAIB',
        // Add specific venue information
      },
      competitor:
        competition.teams?.map((team) => ({
          '@type': 'SportsTeam',
          name: team.name,
        })) || [],
    };
  }

  public extractDescription(content: string): string {
    // Extract first paragraph or first 160 characters from HTML content
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    return text.substring(0, 160).trim() + (text.length > 160 ? '...' : '');
  }

  private mapCompetitionStatus(status: string): string {
    switch (status) {
      case 'NotStarted':
        return 'https://schema.org/EventScheduled';
      case 'Ongoing':
        return 'https://schema.org/EventScheduled';
      case 'Finished':
        return 'https://schema.org/EventCompleted';
      default:
        return 'https://schema.org/EventScheduled';
    }
  }
}
