/**
 * SEO Utility functions for ADAIB
 */

export class SEOUtils {
  /**
   * Generate canonical URL for a given path
   */
  static generateCanonicalUrl(
    path: string,
    baseUrl = 'https://adaib.com',
  ): string {
    // Remove leading slash if present and ensure proper formatting
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * Generate Open Graph image URL with fallback
   */
  static generateImageUrl(
    imageUrl?: string | null,
    baseUrl = 'https://adaib.com',
  ): string {
    if (imageUrl) {
      // If it's already a full URL, return as is
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      // If it's a relative path, make it absolute
      return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    }
    // Fallback to default logo
    return `${baseUrl}/assets/logo/full/transparent/white-letters/1280.webp`;
  }

  /**
   * Clean and truncate text for meta descriptions
   */
  static cleanTextForMeta(text: string, maxLength = 160): string {
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '');
    // Remove extra whitespace
    const normalizedText = cleanText.replace(/\s+/g, ' ').trim();
    // Truncate if necessary
    if (normalizedText.length <= maxLength) {
      return normalizedText;
    }
    return normalizedText.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate keywords from text content
   */
  static generateKeywordsFromContent(
    content: string,
    baseKeywords: string[] = [],
  ): string {
    const baseKeywordsArray = [
      'ADAIB',
      'baloncesto',
      'Illes Balears',
      'Baleares',
      'deportes',
      ...baseKeywords,
    ];

    // Extract meaningful words from content (basic implementation)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5); // Take first 5 meaningful words

    return [...baseKeywordsArray, ...words].join(', ');
  }

  /**
   * Validate and format publication date
   */
  static formatPublicationDate(date?: Date | string): string {
    if (!date) {
      return new Date().toISOString();
    }

    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }

    return date.toISOString();
  }

  /**
   * Generate breadcrumb structured data
   */
  static generateBreadcrumbSchema(
    breadcrumbs: { name: string; url: string }[],
  ): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Generate FAQ schema for common questions
   */
  static generateFAQSchema(
    faqs: { question: string; answer: string }[],
  ): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }
}
