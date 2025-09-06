export interface User {
  id: number;
  email: string;
  authToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface UserRequest {
  email: string;
  password: string;
}
