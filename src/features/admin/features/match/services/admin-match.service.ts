import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiMatch } from '@shared/models/match';
import { Observable } from 'rxjs';

@Injectable()
export class AdminMatchService {
  private http = inject(HttpClient);

  addMatch(match: ApiMatch): Observable<number> {
    return this.http.post<number>(
      `${environment.apiUrl}/Match`,
      this.matchToJson(match),
    );
  }

  updateMatch(match: ApiMatch): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/Match`,
      this.matchToJson(match),
    );
  }

  deleteMatch(matchId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Match/${matchId}`);
  }

  private matchToJson(match: ApiMatch): string {
    return JSON.stringify({
      ...match,
      date: match.date ? match.date.toISOString() : null,
    });
  }
}
