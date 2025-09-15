export interface Token {
  sub: number;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  exp: number;
  iss: string;
  aud: string;
}
