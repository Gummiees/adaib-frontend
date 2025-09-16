import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiPhase } from '@shared/models/phase';
import { Observable } from 'rxjs';

@Injectable()
export class AdminPhaseService {
  private http = inject(HttpClient);

  addPhase(phase: ApiPhase): Observable<number> {
    return this.http.post<number>(`${environment.apiUrl}/Phase`, phase);
  }

  updatePhase(phase: ApiPhase): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/Phase`, phase);
  }

  deletePhase(phaseId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Phase/${phaseId}`);
  }
}
