import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, Observable, of, throwError } from 'rxjs';
import { fakeTeams } from '../../../fakes/fakes';
import { DetailedTeam, Team } from '../models/team';

@Injectable()
export class TeamsService {
  private httpClient = inject(HttpClient);

  getAllTeams(): Observable<Team[]> {
    // FIXME: use real values
    return of(fakeTeams).pipe(delay(1000));
    return this.httpClient.get<Team[]>(`${environment.apiUrl}/Team/all`);
  }

  getTeamById(id: number): Observable<DetailedTeam> {
    // FIXME: use real values
    const team = fakeTeams.find((team) => team.id === id);
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

    return this.httpClient.get<DetailedTeam>(
      `${environment.apiUrl}/Team/${id}`,
    );
  }
}
