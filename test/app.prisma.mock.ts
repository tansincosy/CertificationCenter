import { OAuthClientDetails } from '@prisma/client';
let tokenSave = [];
export const clientId = 'test-client-id',
  clientSecret = 'test-client-secret';

export const PrismaValue = {
  oAuthClientDetails: {
    findFirst({ where: { id } }): Partial<OAuthClientDetails> {
      if (id !== clientId) {
        return null;
      }
      return {
        id: clientId,
        clientSecret,
        authorizedGrantTypes: 'password,refresh_token',
        webServerRedirectUri: 'http://www.baidu.com?call',
        scope: 'test:read,test:write',
        accessTokenValidity: 1800,
        refreshTokenValidity: 3600,
      };
    },
  },
  user: {
    findFirst({ where: { username } }) {
      if (username !== 'username') {
        return null;
      }
      return {
        username: 'username',
        password: 'password',
        id: 'user-test-id',
        enable: 1,
        isLocked: 0,
      };
    },
  },
  oAuthToken: {
    create({ data }) {
      tokenSave.push(data);
      return {
        id: 'test-token-id',
      };
    },
    findFirst({ where: { refreshToken, tokenId } }) {
      let tokenDB = null;
      if (refreshToken) {
        tokenDB = tokenSave.find((item) => item.refreshToken === refreshToken);
      }
      if (tokenId) {
        tokenDB = tokenSave.find((item) => item.tokenId === tokenId);
      }

      if (!tokenDB) {
        return null;
      }
      return {
        refreshToken: tokenDB.refreshToken,
        username: tokenDB.username,
        token: tokenDB.token,
        OAuthClientDetails: {
          id: clientId,
          clientSecret: clientSecret,
          authorizedGrantTypes: 'password,refresh_token',
          webServerRedirectUri: 'http://www.baidu.com?call',
          scope: 'test:read,test:write',
          accessTokenValidity: 1800,
          refreshTokenValidity: 3600,
        },
      };
    },
    deleteMany({ where: { tokenId, refreshToken } }) {
      if (tokenId) {
        tokenSave = tokenSave.filter((item) => item.tokenId !== tokenId);
      }
      if (refreshToken) {
        tokenSave = tokenSave.filter(
          (item) => item.refreshToken !== refreshToken,
        );
      }
      return true;
    },
  },
};
