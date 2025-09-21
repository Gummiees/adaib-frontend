import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { FormApiMatch } from '@shared/models/match';
import { Observable } from 'rxjs';

@Injectable()
export class AdminMatchService {
  private http = inject(HttpClient);

  addMatch({
    competitionId,
    phaseId,
    groupId,
    match,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    match: FormApiMatch;
  }): Observable<number> {
    return this.http.post<number>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Group/${groupId}/Match`,
      this.matchToJson(match),
    );
  }

  updateMatch({
    competitionId,
    phaseId,
    groupId,
    match,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    match: FormApiMatch;
  }): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Group/${groupId}/Match`,
      this.matchToJson(match),
    );
  }

  deleteMatch({
    competitionId,
    phaseId,
    groupId,
    matchId,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
    matchId: number;
  }): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Group/${groupId}/Match/${matchId}`,
    );
  }

  private matchToJson(match: FormApiMatch): string {
    return JSON.stringify(match);
  }
}
