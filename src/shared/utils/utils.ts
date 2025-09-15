import { HttpErrorResponse } from '@angular/common/http';
import { DetailedMatch, MatchStatus } from '@shared/models/match';
import { Classification } from '../models/classification';

export const imageUrlRegex =
  '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getErrorMessage(error: unknown): string {
  let errorMessage = 'Failed to load data';
  if (error instanceof HttpErrorResponse) {
    if (error.error.message) {
      errorMessage = error.error.message;
    } else if (error.error.title) {
      errorMessage = error.error.title;
    }
  } else if (error instanceof Error && error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
}

export function sortMatches(matches: DetailedMatch[]): DetailedMatch[] {
  return [...matches].sort((a, b) => {
    if (a.status === 'Ongoing' && b.status !== 'Ongoing') {
      return -1;
    }
    if (a.status !== 'Ongoing' && b.status === 'Ongoing') {
      return 1;
    }

    if (a.status === 'Ongoing' && b.status === 'Ongoing') {
      if (a.date && !b.date) return 1;
      if (!a.date && b.date) return -1;
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return 0;
    }

    const statusGroup1: MatchStatus[] = ['NotStarted', 'Rest'];
    const statusGroup2: MatchStatus[] = ['NotStarted', 'Rest'];

    if (statusGroup1.includes(a.status) && statusGroup2.includes(b.status)) {
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return 0;
    }

    if (a.status === 'Finished' && b.status === 'Finished') {
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return 0;
    }

    if (a.status === 'Cancelled' && b.status === 'Cancelled') {
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      if (a.date && b.date) return b.date.getTime() - a.date.getTime();
      return 0;
    }

    const aTime = a.date
      ? a.date.getTime() - (b.date?.getTime() ?? 0)
      : -Infinity;
    const bTime = b.date
      ? b.date.getTime() - (a.date?.getTime() ?? 0)
      : -Infinity;
    return bTime - aTime;
  });
}

export function sortClassification(
  classification: Classification[],
): Classification[] {
  return [...classification].sort((a, b) => b.points - a.points);
}
