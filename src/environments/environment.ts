import { provideStoreDevtools } from '@ngrx/store-devtools';

export const environment = {
  apiUrl: '',
  providers: [provideStoreDevtools({ maxAge: 25 })],
};
