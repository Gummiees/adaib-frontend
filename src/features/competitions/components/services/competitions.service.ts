import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, Observable, of, throwError } from 'rxjs';
import { Competition } from '../../models/competition';

@Injectable()
export class CompetitionsService {
  private http = inject(HttpClient);
  private fakeCompetitions: Competition[] = [
    {
      id: 1,
      name: 'Competition 1',
      description: 'Description 1',
      imageUrl: 'https://via.placeholder.com/150',
      visible: true,
      status: 'NotStarted',
    },
    {
      id: 2,
      name: 'Competition 2',
      description: 'Description 2',
      imageUrl: 'https://via.placeholder.com/150',
      visible: true,
      status: 'OnGoing',
      startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
    {
      id: 3,
      name: 'Competition 3',
      description: 'Description 3',
      imageUrl: 'https://via.placeholder.com/150',
      visible: true,
      status: 'Finished',
      startDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      endDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    },
  ];

  getAllCompetitions(): Observable<Competition[]> {
    // FIXME: use real values
    return of(this.fakeCompetitions).pipe(delay(1000));

    return this.http.get<Competition[]>(
      `${environment.apiUrl}/Competition/all`,
    );
  }

  getCompetitionById(id: number): Observable<Competition> {
    // FIXME: use real values
    const competition = this.fakeCompetitions.find(
      (competition) => competition.id === id,
    );
    if (!competition) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: HttpStatusCode.NotFound,
            error: 'Competition not found',
          }),
      ).pipe(delay(1000));
    }
    return of(competition).pipe(delay(1000));

    return this.http.get<Competition>(
      `${environment.apiUrl}/Competition/${id}`,
    );
  }
}
