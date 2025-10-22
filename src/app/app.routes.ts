import { Routes } from '@angular/router';
import { CompetitionService } from '@features/competition/services/competition.service';
import { CompetitionStore } from '@features/competition/store/competition-store';
import { CompetitionsService } from '@features/competitions/services/competitions.service';
import { CompetitionsStore } from '@features/competitions/store/competitions-store';
import { LandingComponent } from '@features/landing/landing.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';
import { AdminGuard } from '@shared/guards/admin.guard';
import { AnonymousGuard } from '@shared/guards/anonymous.guard';

export const routes: Routes = [
  {
    path: 'inicio',
    component: LandingComponent,
    data: {
      title: 'Inicio',
      seo: {
        description:
          'ADAIB - Asociación Deportistas Aficionados De Las Illes Balears. Descubre nuestras competiciones de baloncesto, equipos y últimas noticias.',
        keywords:
          'ADAIB, baloncesto, Illes Balears, Baleares, deportistas aficionados, inicio',
        type: 'website',
      },
    },
  },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  {
    path: 'contacto',
    loadComponent: () =>
      import('@features/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
    data: {
      title: 'Contacto',
      seo: {
        description:
          'Ponte en contacto con ADAIB. Información de contacto y ubicación para consultas sobre baloncesto en las Illes Balears.',
        keywords:
          'contacto, ADAIB, información, Illes Balears, baloncesto, consultas',
        type: 'website',
      },
    },
  },
  {
    path: 'historia',
    loadComponent: () =>
      import('@features/history/history.component').then(
        (m) => m.HistoryComponent,
      ),
    data: {
      title: 'Historia',
      seo: {
        description:
          'Historia de ADAIB. Descubre la historia de la asociación de deportistas aficionados de las Illes Balears.',
        keywords: 'historia, ADAIB, historia, Illes Balears, baloncesto',
        type: 'website',
      },
    },
  },
  {
    path: 'noticias',
    loadComponent: () =>
      import('@features/articles/components/all/articles.component').then(
        (m) => m.ArticlesComponent,
      ),
    data: {
      title: 'Noticias',
      seo: {
        description:
          'Últimas noticias del baloncesto en las Illes Balears. Mantente informado sobre competiciones, equipos y eventos de ADAIB.',
        keywords:
          'noticias, baloncesto, ADAIB, Illes Balears, actualidad, deportes',
        type: 'website',
      },
    },
  },
  {
    path: 'noticias/:id',
    loadComponent: () =>
      import('@features/articles/components/individual/article.component').then(
        (m) => m.ArticleComponent,
      ),
    data: {
      title: 'Noticia',
      seo: {
        type: 'article',
        section: 'Deportes',
      },
    },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@features/user/components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    canActivate: [AnonymousGuard],
    data: { title: 'Iniciar Sesión' },
  },
  {
    path: 'competiciones',
    loadComponent: () =>
      import('@features/competitions/components/competitions.component').then(
        (m) => m.CompetitionsComponent,
      ),
    providers: [CompetitionsService, CompetitionsStore],
    data: {
      title: 'Competiciones',
      seo: {
        description:
          'Todas las competiciones de baloncesto de ADAIB en las Illes Balears. Consulta torneos, ligas y campeonatos activos.',
        keywords:
          'competiciones, torneos, ligas, baloncesto, ADAIB, Illes Balears, campeonatos',
        type: 'website',
      },
    },
  },
  {
    path: 'competiciones/:id',
    loadComponent: () =>
      import('@features/competition/components/competition.component').then(
        (m) => m.CompetitionComponent,
      ),
    providers: [CompetitionService, CompetitionStore],
    data: {
      title: 'Competición',
      seo: {
        type: 'website',
      },
    },
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('@features/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [AdminGuard],
    data: {
      title: 'Administración',
      seo: {
        description:
          'Panel de administración de ADAIB para gestión de competiciones, equipos y contenido.',
        keywords: 'administración, gestión, ADAIB, panel, competiciones',
        type: 'website',
      },
    },
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: {
      title: 'Página No Encontrada',
      seo: {
        description:
          'La página que buscas no existe. Regresa a ADAIB para explorar nuestras competiciones y noticias de baloncesto.',
        keywords: 'error 404, página no encontrada, ADAIB',
        type: 'website',
      },
    },
  },
];
