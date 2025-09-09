import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { DetailedTeam } from '@shared/models/team';
import { Observable } from 'rxjs';

@Injectable()
export class TeamService {
  private httpClient = inject(HttpClient);

  getTeamById(id: number): Observable<DetailedTeam> {
    return this.httpClient.get<DetailedTeam>(
      `${environment.apiUrl}/Team/${id}`,
    );
  }
}
