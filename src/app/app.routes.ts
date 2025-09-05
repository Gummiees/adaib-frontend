import { Routes } from '@angular/router';
import { LandingComponent } from '@features/landing/landing.component';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { SportDetailsResolverService } from '@features/sports/services/sport-resolver.service';

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
    path: 'deportes',
    loadComponent: () =>
      import('@features/sports/components/all/sports.component').then(
        (m) => m.SportsComponent,
      ),
  },
  {
    path: 'deportes/:id',
    loadComponent: () =>
      import('@features/sports/components/individual/sport.component').then(
        (m) => m.SportComponent,
      ),
    resolve: {
      sport: SportDetailsResolverService,
    },
  },
  { path: '**', component: NotFoundComponent },
];
