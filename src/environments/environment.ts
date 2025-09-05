import { provideStoreDevtools } from '@ngrx/store-devtools';

export const environment = {
  apiUrl: 'http://localhost:5194/api',
  isProduction: false,
  providers: [provideStoreDevtools({ maxAge: 25 })],
};
