import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, Observable, of, throwError } from 'rxjs';
import { Team } from '../models/team';

@Injectable()
export class TeamsService {
  private httpClient = inject(HttpClient);
  private fakeTeams: Team[] = [
    {
      id: 1,
      name: 'Team 1',
      description: 'Description 1',
      imageUrl: 'https://via.placeholder.com/150',
      visible: true,
    },
    {
      id: 2,
      name: 'Team 2',
      description: 'Description 2',
      imageUrl: 'https://via.placeholder.com/150',
      visible: true,
    },
  ];

  getAllTeams(): Observable<Team[]> {
    // FIXME: use real values
    return of(this.fakeTeams).pipe(delay(1000));

    return this.httpClient.get<Team[]>(`${environment.apiUrl}/Team/all`);
  }

  getTeamById(id: number): Observable<Team> {
    // FIXME: use real values
    const team = this.fakeTeams.find((team) => team.id === id);
    if (!team) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: HttpStatusCode.NotFound,
            error: 'Team not found',
          }),
      ).pipe(delay(1000));
    }
    return of(team).pipe(delay(1000));

    return this.httpClient.get<Team>(`${environment.apiUrl}/Team/${id}`);
  }
}
