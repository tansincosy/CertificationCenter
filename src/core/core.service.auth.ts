import OAuth2Server, {
  Client,
  Falsey,
  InvalidTokenError,
  PasswordModel,
  RefreshToken,
  RefreshTokenModel,
  Token,
  User,
} from 'oauth2-server';
export class CoreModelService implements PasswordModel, RefreshTokenModel {}
