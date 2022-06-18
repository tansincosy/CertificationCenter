import { OAuthClientDetails } from '@prisma/client';
let tokenSave = [];
let oAuthApprovals = [];
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
        authorizedGrantTypes: 'password,refresh_token,authorization_code',
        webServerRedirectUri: 'http://127.0.0.1:3000/call',
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
          authorizedGrantTypes: 'password,refresh_token,authorization_code',
          webServerRedirectUri: 'http://127.0.0.1:3000/call',
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
  oAuthApprovals: {
    create({ data }) {
      oAuthApprovals.push(data);
      return {
        id: 'test-oAuthApprovals-id',
      };
    },
    delete({ where: { code } }) {
      oAuthApprovals = oAuthApprovals.filter((item) => item.code !== code);
      return {
        id: 'test-oAuthApprovals-id',
      };
    },
    findFirst({ where: { code } }) {
      const oAuthApproval = oAuthApprovals.find((item) => item.code === code);
      if (oAuthApproval) {
        oAuthApproval.userId = 'test-user-id';
        oAuthApproval.OAuthClientDetails = {
          clientSecret: clientSecret,
          webServerRedirectUri: 'http://127.0.0.1:3000/call',
          id: 'test-client-id',
          authorizedGrantTypes: 'password,refresh_token,authorization_code',
          accessTokenValidity: 1800,
          refreshTokenValidity: 3600,
        };
        console.log('oAuthApprovals', oAuthApprovals);
        return oAuthApproval;
      }
      return null;
    },
  },
};
