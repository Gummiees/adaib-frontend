import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Round } from '@shared/models/round';
import { Observable } from 'rxjs';

@Injectable()
export class AdminRoundService {
  private http = inject(HttpClient);

  addRound(round: Round): Observable<number> {
    return this.http.post<number>(`${environment.apiUrl}/Round`, round);
  }

  updateRound(round: Round): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/Round`, round);
  }

  deleteRound(roundId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Round/${roundId}`);
  }
}
