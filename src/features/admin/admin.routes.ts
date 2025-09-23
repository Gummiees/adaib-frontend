import { Routes } from '@angular/router';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { AdminCompetitionService } from './features/competition/services/admin-competition.service';
import { AdminGroupService } from './features/group/services/admin-group.service';
import { AdminMatchService } from './features/match/services/admin-match.service';
import { MatchFormDataService } from './features/match/services/match-form-data.service';
import { MatchFormRouteService } from './features/match/services/match-form-route.service';
import { MatchFormService } from './features/match/services/match-form.service';
import { AdminPhaseService } from './features/phase/services/admin-phase.service';
import { AdminRoundService } from './features/round/services/admin-round.service';
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
    data: { title: 'Gestión de Equipos' },
  },
  {
    path: 'equipo',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/team-form/team-form.component'
      ).then((m) => m.TeamFormComponent),
    providers: [AdminTeamsStore, AdminTeamsService],
    data: { title: 'Crear Equipo' },
  },
  {
    path: 'equipo/:id',
    loadComponent: () =>
      import(
        '@features/admin/features/teams/components/team-form/team-form.component'
      ).then((m) => m.TeamFormComponent),
    providers: [AdminTeamsStore, AdminTeamsService],
    data: { title: 'Editar Equipo' },
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
    data: { title: 'Crear Competición' },
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
    data: { title: 'Editar Competición' },
  },
  {
    path: 'competicion/:id/fase',
    loadComponent: () =>
      import(
        '@features/admin/features/phase/components/phase-form.component'
      ).then((m) => m.PhaseFormComponent),
    providers: [CompetitionsService, CompetitionsStore, AdminPhaseService],
    data: { title: 'Crear Fase' },
  },
  {
    path: 'competicion/:id/fase/:phaseId',
    loadComponent: () =>
      import(
        '@features/admin/features/phase/components/phase-form.component'
      ).then((m) => m.PhaseFormComponent),
    providers: [CompetitionsService, CompetitionsStore, AdminPhaseService],
    data: { title: 'Editar Fase' },
  },
  {
    path: 'competicion/:id/grupo',
    loadComponent: () =>
      import(
        '@features/admin/features/group/components/group-form.component'
      ).then((m) => m.GroupFormComponent),
    providers: [
      CompetitionsService,
      CompetitionsStore,
      AdminGroupService,
      AdminTeamsService,
      AdminTeamsStore,
    ],
    data: { title: 'Crear Grupo' },
  },
  {
    path: 'competicion/:id/grupo/:groupId',
    loadComponent: () =>
      import(
        '@features/admin/features/group/components/group-form.component'
      ).then((m) => m.GroupFormComponent),
    providers: [
      CompetitionsService,
      CompetitionsStore,
      AdminGroupService,
      AdminTeamsService,
      AdminTeamsStore,
    ],
    data: { title: 'Editar Grupo' },
  },
  {
    path: 'competicion/:id/jornada',
    loadComponent: () =>
      import(
        '@features/admin/features/round/components/round-form.component'
      ).then((m) => m.RoundFormComponent),
    providers: [CompetitionsService, CompetitionsStore, AdminRoundService],
    data: { title: 'Crear Jornada' },
  },
  {
    path: 'competicion/:id/jornada/:roundId',
    loadComponent: () =>
      import(
        '@features/admin/features/round/components/round-form.component'
      ).then((m) => m.RoundFormComponent),
    providers: [CompetitionsService, CompetitionsStore, AdminRoundService],
    data: { title: 'Editar Jornada' },
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
      MatchFormService,
      MatchFormRouteService,
      MatchFormDataService,
    ],
    data: { title: 'Crear Partido' },
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
      MatchFormService,
      MatchFormRouteService,
      MatchFormDataService,
    ],
    data: { title: 'Editar Partido' },
  },
  {
    path: '',
    redirectTo: 'equipos',
    pathMatch: 'full',
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: { title: 'Página No Encontrada' },
  },
];
