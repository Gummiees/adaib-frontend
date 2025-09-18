import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiFormGroup } from '@shared/models/group';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGroupService {
  private http = inject(HttpClient);

  addGroup({
    competitionId,
    phaseId,
    group,
  }: {
    competitionId: number;
    phaseId: number;
    group: ApiFormGroup;
  }): Observable<number> {
    return this.http.post<number>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Group`,
      group,
    );
  }

  updateGroup({
    competitionId,
    phaseId,
    group,
  }: {
    competitionId: number;
    phaseId: number;
    group: ApiFormGroup;
  }): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Group`,
      group,
    );
  }

  deleteGroup({
    competitionId,
    phaseId,
    groupId,
  }: {
    competitionId: number;
    phaseId: number;
    groupId: number;
  }): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/Competition/${competitionId}/Phase/${phaseId}/Group/${groupId}`,
    );
  }
}
