import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { Competition, DetailedCompetition } from '../../models/competition';

@Injectable()
export class CompetitionsService {
  private http = inject(HttpClient);

  getAllCompetitions(): Observable<Competition[]> {
    return this.http.get<Competition[]>(
      `${environment.apiUrl}/Competition/all`,
    );
  }

  getCompetitionById(id: number): Observable<DetailedCompetition> {
    return this.http.get<DetailedCompetition>(
      `${environment.apiUrl}/Competition/${id}`,
    );
  }
}
