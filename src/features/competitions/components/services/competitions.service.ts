import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, map, Observable } from 'rxjs';
import { Competition, DetailedCompetition } from '../../models/competition';

@Injectable()
export class CompetitionsService {
  private http = inject(HttpClient);

  getAllCompetitions(): Observable<Competition[]> {
    return this.http
      .get<Competition[]>(`${environment.apiUrl}/Competition/all`)
      .pipe(
        map((competitions) => this.parseCompetitionDates(competitions)),
        delay(1000),
      );
  }

  getCompetitionById(id: number): Observable<DetailedCompetition> {
    return this.http
      .get<DetailedCompetition>(`${environment.apiUrl}/Competition/${id}`)
      .pipe(
        map((competition) => this.parseDetailedCompetitionDates(competition)),
      );
  }

  private parseCompetitionDates(competitions: Competition[]): Competition[] {
    return competitions.map((competition) => ({
      ...competition,
      startDate: competition.startDate ? new Date(competition.startDate) : null,
      endDate: competition.endDate ? new Date(competition.endDate) : null,
    }));
  }

  private parseDetailedCompetitionDates(
    competition: DetailedCompetition,
  ): DetailedCompetition {
    return {
      ...competition,
      startDate: competition.startDate ? new Date(competition.startDate) : null,
      endDate: competition.endDate ? new Date(competition.endDate) : null,
    };
  }
}
