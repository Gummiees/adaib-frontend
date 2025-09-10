import { Routes } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { LandingComponent } from '@features/landing/landing.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

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
  { path: '**', component: NotFoundComponent },
];
