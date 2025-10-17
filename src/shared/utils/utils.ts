import { HttpErrorResponse } from '@angular/common/http';
import { DetailedMatch, MatchStatus } from '@shared/models/match';
import { Classification } from '../models/classification';

export const imageUrlRegex =
  '^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w%.-]*)*(?:\\.(jpg|jpeg|png|gif|bmp|webp|svg))?(?:\\?[\\w%&=.:-]*)*(?:#[\\w%-]*)?$';
export const urlRegex =
  '^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w%.-]*)*/?(?:\\?[\\w%&=.:-]*)*(?:#[\\w%-]*)?$';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getErrorMessage(error: unknown): string {
  let errorMessage = 'Failed to load data';
  if (error instanceof HttpErrorResponse) {
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.title) {
      errorMessage = error.error.title;
    }
  } else if (error instanceof Error && error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
}

export function sortMatches(matches: DetailedMatch[]): DetailedMatch[] {
  return [...matches].sort((a, b) => {
    if (a.status === 'OnGoing' && b.status !== 'OnGoing') {
      return -1;
    }
    if (a.status !== 'OnGoing' && b.status === 'OnGoing') {
      return 1;
    }

    const statusGroupFinished: MatchStatus[] = ['Finished', 'Rest', 'NoShow'];
    if (
      statusGroupFinished.includes(a.status) &&
      !statusGroupFinished.includes(b.status)
    ) {
      return -1;
    }
    if (
      !statusGroupFinished.includes(a.status) &&
      statusGroupFinished.includes(b.status)
    ) {
      return 1;
    }

    if (a.status === 'NotStarted' && b.status !== 'NotStarted') {
      return -1;
    }
    if (a.status !== 'NotStarted' && b.status === 'NotStarted') {
      return 1;
    }

    if (a.status === 'Rest' && b.status !== 'Rest') {
      return -1;
    }
    if (a.status !== 'Rest' && b.status === 'Rest') {
      return 1;
    }

    if (a.status === 'Cancelled' && b.status !== 'Cancelled') {
      return -1;
    }
    if (a.status !== 'Cancelled' && b.status === 'Cancelled') {
      return 1;
    }

    if (a.date && !b.date) return 1;
    if (!a.date && b.date) return -1;
    if (a.date && b.date) return b.date.getTime() - a.date.getTime();
    return 0;
  });
}

export function sortMatchesByDateOldestToNewest(
  matches: DetailedMatch[],
): DetailedMatch[] {
  return [...matches].sort((a, b) => {
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    if (a.date && b.date) return a.date.getTime() - b.date.getTime();
    return 0;
  });
}

export function sortClassification(
  classification: Classification[],
): Classification[] {
  return [...classification].sort((a, b) => a.position - b.position);
}
