export class User {
  username: string;
  password: string;
}
export class Authorize {
  client_id: string;
  redirect_uri: string;
}
export class ClientDetail {
  clientName: string;
  clientLogo?: string;
}
