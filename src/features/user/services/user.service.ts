import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { map, Observable } from 'rxjs';
import { Token } from '../models/token';
import { ApiUser, User, UserRequest } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private httpClient = inject(HttpClient);

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

  refreshToken({
    refreshToken,
    deviceId,
  }: {
    refreshToken: string;
    deviceId: string;
  }): Observable<User> {
    return this.httpClient
      .post<ApiUser>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken,
        deviceId,
      })
      .pipe(map((apiUser) => this.parseUser(apiUser)));
  }

  logout(deviceId: string): Observable<void> {
    return this.httpClient.post<void>(`${environment.apiUrl}/auth/logout`, {
      deviceId,
    });
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
