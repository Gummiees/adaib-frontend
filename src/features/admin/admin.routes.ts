import { Routes } from '@angular/router';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { AdminCompetitionService } from './features/competition/services/admin-competition.service';
import { AdminMatchService } from './features/match/services/admin-match.service';
import { AdminTeamsService } from './features/teams/services/admin-teams.service';
import { AdminTeamsStore } from './features/teams/store/admin-teams-store';

export const adminRoutes: Routes = [
  {
    path: 'equipos',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/list/admin-teams.component'
      ).then((m) => m.AdminTeamsComponent),
    providers: [AdminTeamsStore, AdminTeamsService],
  },
  {
    path: 'equipo',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/team-form/team-form.component'
      ).then((m) => m.TeamFormComponent),
    providers: [AdminTeamsStore, AdminTeamsService],
  },
  {
    path: 'equipo/:id',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/team-form/team-form.component'
      ).then((m) => m.TeamFormComponent),
    providers: [AdminTeamsStore, AdminTeamsService],
  },
  {
    path: 'competicion',
    loadComponent: () =>
      import(
        '@features/admin/features/competition/components/competition-form.component'
      ).then((m) => m.CompetitionFormComponent),
    providers: [
      CompetitionsStore,
      CompetitionsService,
      AdminCompetitionService,
    ],
  },
  {
    path: 'competicion/:id',
    loadComponent: () =>
      import(
        '@features/admin/features/competition/components/competition-form.component'
      ).then((m) => m.CompetitionFormComponent),
    providers: [
      CompetitionsStore,
      CompetitionsService,
      AdminCompetitionService,
    ],
  },
  {
    path: 'competicion/:id/partido',
    loadComponent: () =>
      import(
        '@features/admin/features/match/components/match-form.component'
      ).then((m) => m.MatchFormComponent),
    providers: [
      CompetitionsService,
      CompetitionsStore,
      AdminMatchService,
      AdminTeamsService,
      AdminTeamsStore,
    ],
  },
  {
    path: 'competicion/:id/partido/:matchId',
    loadComponent: () =>
      import(
        '@features/admin/features/match/components/match-form.component'
      ).then((m) => m.MatchFormComponent),
    providers: [
      CompetitionsService,
      CompetitionsStore,
      AdminMatchService,
      AdminTeamsService,
      AdminTeamsStore,
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
