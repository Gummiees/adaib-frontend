import { Routes } from '@angular/router';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { TeamsService } from '@features/teams/services/teams.service';

export const competitionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/all/competitions.component').then(
        (m) => m.CompetitionsComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/individual/competition.component').then(
        (m) => m.CompetitionComponent,
      ),
  },
  {
    path: ':id/equipos',
    loadChildren: () =>
      import('@features/teams/teams.routes').then((m) => m.teamsRoutes),
    providers: [TeamsService],
  },
  { path: '**', component: NotFoundComponent },
];
