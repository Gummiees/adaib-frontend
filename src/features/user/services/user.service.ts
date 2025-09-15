import {
  HttpClient,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Token } from '../models/token';
import { ApiUser, User, UserRequest } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);

  check(): Observable<User | null> {
    return this.httpClient
      .get<ApiUser>(`${environment.apiUrl}/auth/check`)
      .pipe(
        map((apiUser) => this.parseUser(apiUser)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === HttpStatusCode.Unauthorized) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }

  login(userRequest: UserRequest): Observable<User> {
    return this.httpClient
      .post<ApiUser>(`${environment.apiUrl}/auth/login`, userRequest)
      .pipe(
        map((apiUser) => {
          const user = this.parseUser(apiUser);
          return user;
        }),
      );
  }

  logout(): Observable<void> {
    return this.httpClient.post<void>(`${environment.apiUrl}/auth/logout`, {});
  }

  private parseUser(apiUser: ApiUser): User {
    const decodedToken = jwtDecode(apiUser.accessToken) as Token;
    return {
      authToken: apiUser.accessToken,
      refreshToken: apiUser.refreshToken,
      id: decodedToken.sub,
      username:
        decodedToken[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
        ],
      expiresAt: new Date(decodedToken.exp * 1000),
    };
  }
}
