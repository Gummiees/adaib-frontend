import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { Sport } from '../models/sport';

@Injectable({
  providedIn: 'root',
})
export class SportsService {
  private httpClient = inject(HttpClient);

  getAllSports(): Observable<Sport[]> {
    return this.httpClient.get<Sport[]>(`${environment.apiUrl}/Sport/all`);
  }

  getSportById(id: number): Observable<Sport> {
    return this.httpClient.get<Sport>(`${environment.apiUrl}/Sport/${id}`);
  }
}
