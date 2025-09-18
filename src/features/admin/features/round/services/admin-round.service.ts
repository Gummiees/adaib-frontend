import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Round } from '@shared/models/round';
import { Observable } from 'rxjs';

@Injectable()
export class AdminRoundService {
  private http = inject(HttpClient);

  addRound({
    competitionId,
    phaseId,
    round,
  }: {
    competitionId: number;
    phaseId: number;
    round: Round;
  }): Observable<number> {
    return this.http.post<number>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Round`,
      round,
    );
  }

  updateRound({
    competitionId,
    phaseId,
    round,
  }: {
    competitionId: number;
    phaseId: number;
    round: Round;
  }): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Round`,
      round,
    );
  }

  deleteRound({
    competitionId,
    phaseId,
    roundId,
  }: {
    competitionId: number;
    phaseId: number;
    roundId: number;
  }): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Round/${roundId}`,
    );
  }
}
