import { provideStoreDevtools } from '@ngrx/store-devtools';

export const environment = {
  apiUrl: 'https://my-json-server.typicode.com/Feverup/fever_pets_data',
  providers: [provideStoreDevtools({ maxAge: 25 })],
};
