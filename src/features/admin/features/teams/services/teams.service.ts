import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Team } from '@shared/models/team';
import { Observable } from 'rxjs';

@Injectable()
export class TeamsService {
  private http = inject(HttpClient);

  getAllTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${environment.apiUrl}/Team/all`);
  }

  addTeam(team: Team): Observable<Team> {
    return this.http.post<Team>(`${environment.apiUrl}/Team`, team);
  }

  updateTeam(team: Team): Observable<Team> {
    return this.http.put<Team>(`${environment.apiUrl}/Team`, team);
  }

  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Team/${id}`);
  }
}
