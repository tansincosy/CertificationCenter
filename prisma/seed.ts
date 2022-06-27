import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * TODO: 添加初始用户名和密码，通过加密工具脚本设置？
 */
async function main() {
  await prisma.oAuthClientDetails.create({
    data: {
      clientSecret: 'clientSecret',
      authorizedGrantTypes: 'password,refresh_token,authorization_code',
    },
  });
  await prisma.user.create({
    data: {
      username: 'admin',
      password:
        '1b91866a777792059c30228523fe59bc2a6f752e3d0179e7d8d8c9147ed58d826a0cf9649ae1672e0af5d3ec318550a3a60bcda086f74ff4d3257ce57bffa178',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
