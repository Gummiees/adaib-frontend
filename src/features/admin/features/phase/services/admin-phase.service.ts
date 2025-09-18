import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiPhase } from '@shared/models/phase';
import { Observable } from 'rxjs';

@Injectable()
export class AdminPhaseService {
  private http = inject(HttpClient);

  addPhase({
    competitionId,
    phase,
  }: {
    competitionId: number;
    phase: ApiPhase;
  }): Observable<number> {
    return this.http.post<number>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase`,
      phase,
    );
  }

  updatePhase({
    competitionId,
    phase,
  }: {
    competitionId: number;
    phase: ApiPhase;
  }): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase`,
      phase,
    );
  }

  deletePhase({
    competitionId,
    phaseId,
  }: {
    competitionId: number;
    phaseId: number;
  }): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}`,
    );
  }
}
