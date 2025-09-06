import { Routes } from '@angular/router';
import { NotFoundComponent } from '@features/not-found/not-found.component';

export const teamsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/all/teams.component').then((m) => m.TeamsComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/individual/team.component').then(
        (m) => m.TeamComponent,
      ),
  },
  { path: '**', component: NotFoundComponent },
];
