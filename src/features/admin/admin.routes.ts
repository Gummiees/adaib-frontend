import { Routes } from '@angular/router';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { AdminCompetitionService } from './features/competition/services/admin-competition.service';

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
    path: 'competiciones/add',
    loadComponent: () =>
      import(
        '@features/admin/features/competition/components/add/add-competition.component'
      ).then((m) => m.AddCompetitionComponent),
    providers: [
      CompetitionsStore,
      CompetitionsService,
      AdminCompetitionService,
    ],
  },
  {
    path: 'competiciones/:id',
    loadComponent: () =>
      import(
        '@features/admin/features/competition/components/update/update-competition.component'
      ).then((m) => m.UpdateCompetitionComponent),
    providers: [
      CompetitionsStore,
      CompetitionsService,
      AdminCompetitionService,
    ],
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
