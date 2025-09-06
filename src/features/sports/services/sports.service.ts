import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, Observable, of, throwError } from 'rxjs';
import { Sport } from '../models/sport';

@Injectable()
export class SportsService {
  private httpClient = inject(HttpClient);
  private fakeSports: Sport[] = [
    {
      id: 1,
      name: 'Sport 1',
      description: 'Description 1',
      visible: true,
    },
  ];

  getAllSports(): Observable<Sport[]> {
    // FIXME: use real values
    return of(this.fakeSports).pipe(delay(1000));

    return this.httpClient.get<Sport[]>(`${environment.apiUrl}/Sport/all`);
  }

  getSportById(id: number): Observable<Sport> {
    // FIXME: use real values
    const sport = this.fakeSports.find((sport) => sport.id === id);
    if (!sport) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: HttpStatusCode.NotFound,
            error: 'Sport not found',
          }),
      ).pipe(delay(1000));
    }
    return of(sport).pipe(delay(1000));

    return this.httpClient.get<Sport>(`${environment.apiUrl}/Sport/${id}`);
  }
}
