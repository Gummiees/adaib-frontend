import { Routes } from '@angular/router';
import { TeamsService } from '@features/admin/features/teams/services/teams.service';
import { AdminTeamsStore } from '@features/admin/features/teams/store/admin-teams-store';
import { CompetitionService } from '@features/competition/services/competition.service';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { LandingComponent } from '@features/landing/landing.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { AdminGuard } from '@shared/guards/admin.guard';
import { AnonymousGuard } from '@shared/guards/anonymous.guard';

export const routes: Routes = [
  { path: 'inicio', component: LandingComponent },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  {
    path: 'noticias',
    loadComponent: () =>
      import('@features/articles/components/all/articles.component').then(
        (m) => m.ArticlesComponent,
      ),
  },
  {
    path: 'noticias/:id',
    loadComponent: () =>
      import('@features/articles/components/individual/article.component').then(
        (m) => m.ArticleComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@features/user/components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    canActivate: [AnonymousGuard],
  },
  {
    path: 'competiciones',
    loadComponent: () =>
      import('@features/competitions/components/competitions.component').then(
        (m) => m.CompetitionsComponent,
      ),
    providers: [CompetitionsService, CompetitionsStore],
  },
  {
    path: 'competiciones/:id',
    loadComponent: () =>
      import('@features/competition/components/competition.component').then(
        (m) => m.CompetitionComponent,
      ),
    providers: [CompetitionService, CompetitionStore],
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('@features/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [AdminGuard],
    providers: [AdminTeamsStore, TeamsService],
  },
  { path: '**', component: NotFoundComponent },
];
