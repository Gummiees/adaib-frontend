import { HttpErrorResponse } from '@angular/common/http';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getErrorMessage(error: unknown) {
  let errorMessage = 'Failed to load pets';
  if (error instanceof HttpErrorResponse && error.error.message) {
    errorMessage = error.error.message;
  } else if (error instanceof Error && error.message) {
    errorMessage = error.message;
  }
  return errorMessage;
}
