import { Routes } from '@angular/router';
import { NotFoundComponent } from '@features/not-found/not-found.component';

export const teamsRoutes: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./components/individual/team.component').then(
        (m) => m.TeamComponent,
      ),
  },
  { path: '**', component: NotFoundComponent },
];
