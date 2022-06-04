import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('main');
  await prisma.oAuthClientDetails.create({
    data: {
      clientSecret: 'clientSecret',
      authorizedGrantTypes: 'password,refresh_token',
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
