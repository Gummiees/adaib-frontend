import { Routes } from '@angular/router';
import { CompetitionsService } from '@features/competitions/components/services/competitions.service';
import { NotFoundComponent } from '@features/not-found/not-found.component';

export const sportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/all/sports.component').then(
        (m) => m.SportsComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/individual/sport.component').then(
        (m) => m.SportComponent,
      ),
  },
  {
    path: ':id/competiciones',
    loadChildren: () =>
      import('@features/competitions/competitions.routes').then(
        (m) => m.competitionsRoutes,
      ),
    providers: [CompetitionsService],
  },
  { path: '**', component: NotFoundComponent },
];
