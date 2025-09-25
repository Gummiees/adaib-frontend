import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiCompetition, Competition } from '@shared/models/competition';
import { parseISO } from 'date-fns';
import { map, Observable, of } from 'rxjs';

@Injectable()
export class CompetitionsService {
  private http = inject(HttpClient);

  getAllCompetitions(): Observable<Competition[]> {
    return of([]);
    return this.http
      .get<ApiCompetition[]>(`${environment.apiUrl}/Competition/all`)
      .pipe(map((competitions) => this.parseCompetitionDates(competitions)));
  }

  private parseCompetitionDates(competitions: ApiCompetition[]): Competition[] {
    return competitions.map((competition) => ({
      ...competition,
      startDate: competition.startDate ? parseISO(competition.startDate) : null,
      endDate: competition.endDate ? parseISO(competition.endDate) : null,
    }));
  }
}
