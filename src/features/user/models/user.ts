export interface User {
  id: number;
  username: string;
  authToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserRequest extends UserLogin {
  deviceId: string;
}

export interface ApiUser {
  accessToken: string;
  refreshToken: string;
}
