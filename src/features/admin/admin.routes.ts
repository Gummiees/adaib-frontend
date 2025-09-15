import { Routes } from '@angular/router';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

export const adminRoutes: Routes = [
  {
    path: 'teams',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/list/admin-teams.component'
      ).then((m) => m.AdminTeamsComponent),
  },
  {
    path: 'teams/add',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/add/add-team.component'
      ).then((m) => m.AddTeamComponent),
  },
  {
    path: 'teams/:id',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/update/update-team.component'
      ).then((m) => m.UpdateTeamComponent),
  },
  {
    path: '',
    redirectTo: 'teams',
    pathMatch: 'full',
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
