import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { delay, Observable, of } from 'rxjs';
import { User, UserRequest } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);

  login(userRequest: UserRequest): Observable<User> {
    // FIXME: use real values
    return of({
      id: 1,
      email: 'test@test.com',
      authToken: 'test',
      refreshToken: 'test',
      expiresAt: new Date(),
    }).pipe(delay(1000));
    return this.httpClient.post<User>(
      `${environment.apiUrl}/user/login`,
      userRequest,
    );
  }

  logout(): Observable<void> {
    // FIXME: use real values
    return of(undefined).pipe(delay(1000));
    return this.httpClient.post<void>(`${environment.apiUrl}/user/logout`, {});
  }
}
