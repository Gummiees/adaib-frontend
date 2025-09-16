import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Team } from '@shared/models/team';
import { Observable } from 'rxjs';

@Injectable()
export class AdminTeamsService {
  private http = inject(HttpClient);

  getAllTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${environment.apiUrl}/Team/all`);
  }

  addTeam(team: Team): Observable<number> {
    return this.http.post<number>(`${environment.apiUrl}/Team`, team);
  }

  updateTeam(team: Team): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/Team`, team);
  }

  deleteTeam(teamId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Team/${teamId}`);
  }
}
