import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Competition } from '@shared/models/competition';
import { Observable } from 'rxjs';

@Injectable()
export class AdminCompetitionService {
  private http = inject(HttpClient);

  addCompetition(competition: Competition): Observable<number> {
    return this.http.post<number>(
      `${environment.apiUrl}/Competition`,
      this.competitionToJson(competition),
    );
  }

  updateCompetition(competition: Competition): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/Competition`,
      this.competitionToJson(competition),
    );
  }

  private competitionToJson(competition: Competition): string {
    return JSON.stringify({
      ...competition,
      startDate: competition.startDate
        ? competition.startDate.toISOString()
        : null,
      endDate: competition.endDate ? competition.endDate.toISOString() : null,
    });
  }
}
