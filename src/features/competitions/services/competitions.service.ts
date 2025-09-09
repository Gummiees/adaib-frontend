import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Competition } from '@shared/models/competition';
import { map, Observable } from 'rxjs';

@Injectable()
export class CompetitionsService {
  private http = inject(HttpClient);

  getAllCompetitions(): Observable<Competition[]> {
    return this.http
      .get<Competition[]>(`${environment.apiUrl}/Competition/all`)
      .pipe(map((competitions) => this.parseCompetitionDates(competitions)));
  }

  private parseCompetitionDates(competitions: Competition[]): Competition[] {
    return competitions.map((competition) => ({
      ...competition,
      startDate: competition.startDate ? new Date(competition.startDate) : null,
      endDate: competition.endDate ? new Date(competition.endDate) : null,
    }));
  }
}
