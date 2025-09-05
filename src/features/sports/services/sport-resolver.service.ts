import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { firstValueFrom, map, take } from 'rxjs';
import { Sport } from '../models/sport';
import { SportsService } from './sports.service';

@Injectable({
  providedIn: 'root',
})
export class SportDetailsResolverService
  implements Resolve<Promise<Sport | null>>
{
  private sportsService = inject(SportsService);
  async resolve(route: ActivatedRouteSnapshot): Promise<Sport | null> {
    const id = route.paramMap.get('id');

    if (!id) {
      return null;
    }

    const parsedId = Number(id);
    if (isNaN(parsedId)) {
      return null;
    }

    return firstValueFrom(
      this.sportsService.getSportById(parsedId).pipe(
        map((sport) => sport),
        take(1),
      ),
    );
  }
}
