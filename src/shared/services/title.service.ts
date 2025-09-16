import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly baseTitle = 'Basket Web';

  public init(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        map(
          (route) =>
            route.snapshot.data['title'] || route.snapshot.data['pageTitle'],
        ),
      )
      .subscribe((routeTitle: string | undefined) => {
        if (routeTitle) {
          this.setTitle(routeTitle);
        } else {
          this.setDefaultTitle();
        }
      });
  }

  public setTitle(title: string): void {
    this.title.setTitle(`${title} | ${this.baseTitle}`);
  }

  public setDefaultTitle(): void {
    this.title.setTitle(this.baseTitle);
  }

  public setDynamicTitle(title: string): void {
    this.setTitle(title);
  }
}
