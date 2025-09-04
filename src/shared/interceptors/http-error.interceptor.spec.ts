import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Dispatcher } from '@ngrx/signals/events';
import { snackbarEvent } from '@shared/stores/snackbar/snackbar-events';
import { firstValueFrom } from 'rxjs';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('HttpErrorInterceptor', () => {
  let httpTesting: HttpTestingController;
  let httpClient: HttpClient;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    dispatcher = TestBed.inject(Dispatcher);
    jest.spyOn(dispatcher, 'dispatch');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should not show snackbar for successful requests', async () => {
    const responseData = { id: 1, name: 'test' };
    const requestPromise = firstValueFrom(httpClient.get('/test'));

    const req = httpTesting.expectOne({ method: 'GET', url: '/test' });
    req.flush(responseData);

    const response = await requestPromise;

    expect(response).toEqual(responseData);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should show server error message for 500 errors', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/test'));
    const req = httpTesting.expectOne({ method: 'GET', url: '/test' });
    req.error(new ProgressEvent('Server Error'), {
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      snackbarEvent.show({
        message: 'Server error. Please try again later.',
        type: 'error',
      }),
    );
  });

  it('should show custom error message for 400 errors', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/test'));
    const req = httpTesting.expectOne({ method: 'GET', url: '/test' });
    req.flush(
      { message: 'Invalid request parameters' },
      {
        status: 400,
        statusText: 'Bad Request',
      },
    );

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      snackbarEvent.show({
        message: 'Invalid request parameters',
        type: 'error',
      }),
    );
  });

  it('should show default message for 400 errors without custom message', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/test'));

    const req = httpTesting.expectOne({ method: 'GET', url: '/test' });
    req.flush(
      {},
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      snackbarEvent.show({
        message: 'Something went wrong',
        type: 'error',
      }),
    );
  });

  it('should not show snackbar for Not Found errors', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/test'));

    const req = httpTesting.expectOne({ method: 'GET', url: '/test' });
    req.error(new ProgressEvent('Not Found'), {
      status: HttpStatusCode.NotFound,
      statusText: 'Not Found',
    });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should handle error without error.error.message property', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/test'));

    const req = httpTesting.expectOne({ method: 'GET', url: '/test' });
    req.flush('Plain string error', {
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      snackbarEvent.show({
        message: 'Something went wrong',
        type: 'error',
      }),
    );
  });
});
