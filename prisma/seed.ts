import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
        'ade07a952dc602a3514ebeb83ec8aa36:adfa025aaa1e4b1ded169dda56a9df95',
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
