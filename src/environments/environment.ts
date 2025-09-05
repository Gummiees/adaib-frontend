import { provideStoreDevtools } from '@ngrx/store-devtools';

export const environment = {
  apiUrl: '',
  isProduction: false,
  providers: [provideStoreDevtools({ maxAge: 25 })],
};
