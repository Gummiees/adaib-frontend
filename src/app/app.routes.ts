import { Routes } from '@angular/router';
import { LandingComponent } from '@features/landing/landing.component';
import { NotFoundComponent } from '@features/not-found/not-found.component';
import { SportsService } from '@features/sports/services/sports.service';

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
    loadChildren: () =>
      import('@features/sports/sports.routes').then((m) => m.sportsRoutes),
    providers: [SportsService],
  },
  { path: '**', component: NotFoundComponent },
];
