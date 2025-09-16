import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ApiFormGroup } from '@shared/models/group';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGroupService {
  private http = inject(HttpClient);

  addGroup(group: ApiFormGroup): Observable<number> {
    return this.http.post<number>(`${environment.apiUrl}/Group`, group);
  }

  updateGroup(group: ApiFormGroup): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/Group`, group);
  }

  deleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Group/${groupId}`);
  }
}
