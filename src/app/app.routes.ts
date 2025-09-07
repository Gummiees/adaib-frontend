import { Routes } from '@angular/router';
import { CompetitionsService } from '@features/competitions/components/services/competitions.service';
import { LandingComponent } from '@features/landing/landing.component';
import { NotFoundComponent } from '@features/not-found/not-found.component';

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
    loadChildren: () =>
      import('@features/competitions/competitions.routes').then(
        (m) => m.competitionsRoutes,
      ),
    providers: [CompetitionsService],
  },
  { path: '**', component: NotFoundComponent },
];
