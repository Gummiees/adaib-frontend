import { HttpErrorResponse } from '@angular/common/http';
import { capitalize, getErrorMessage } from './utils';

describe('capitalize', () => {
  it('should capitalize the first letter of the string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should return the same string if it is already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('should return an empty string if the string is empty', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('getErrorMessage', () => {
  it('should return the error message', () => {
    expect(getErrorMessage(new Error('test'))).toBe('test');
  });

  it('should return the default error message from an error without a message', () => {
    expect(getErrorMessage(new Error())).toBe('Failed to load pets');
  });

  it('should return the error message from HTTP error response', () => {
    expect(
      getErrorMessage(new HttpErrorResponse({ error: { message: 'test' } })),
    ).toBe('test');
  });

  it('should return the default error message from an HTTP error with a message', () => {
    expect(getErrorMessage(new HttpErrorResponse({ error: {} }))).toBe(
      'Failed to load pets',
    );
  });

  it('should return the default error message if the error is another type', () => {
    expect(getErrorMessage(123)).toBe('Failed to load pets');
  });
});
