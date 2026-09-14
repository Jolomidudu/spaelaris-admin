import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const locations = [
  {
    name: 'Spaelaris Lagos',
    slug: 'lagos',
    address: 'Lagos, Nigeria',
    city: 'Lagos',
  },
  {
    name: 'Spaelaris Abuja',
    slug: 'abuja',
    address: 'Abuja, Nigeria',
    city: 'Abuja',
  },
];

const services = [
  {
    name: 'Deep Tissue Massage',
    slug: 'deep-tissue-massage',
    durationMinutes: 60,
    priceKobo: 4500000,
  },
  {
    name: 'Glow Facial',
    slug: 'glow-facial',
    durationMinutes: 45,
    priceKobo: 3500000,
  },
  {
    name: 'Aromatherapy',
    slug: 'aromatherapy',
    durationMinutes: 60,
    priceKobo: 4000000,
  },
];

async function main() {
  const category = await prisma.serviceCategory.upsert({
    where: { slug: 'signature-treatments' },
    update: {},
    create: {
      name: 'Signature Treatments',
      slug: 'signature-treatments',
      description: 'Spaelaris core wellness and beauty treatments.',
    },
  });

  const createdLocations = [];
  for (const location of locations) {
    createdLocations.push(
      await prisma.location.upsert({
        where: { slug: location.slug },
        update: location,
        create: location,
      }),
    );
  }

  for (const location of createdLocations) {
    await prisma.room.upsert({
      where: {
        locationId_name: {
          locationId: location.id,
          name: 'Treatment Room 1',
        },
      },
      update: {},
      create: {
        locationId: location.id,
        name: 'Treatment Room 1',
        description: 'Standard private treatment room.',
      },
    });
  }

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        ...service,
        categoryId: category.id,
      },
      create: {
        ...service,
        categoryId: category.id,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: 'owner@spaelaris.com' },
    update: {},
    create: {
      email: 'owner@spaelaris.com',
      firstName: 'Spaelaris',
      lastName: 'Owner',
      role: UserRole.OWNER,
      status: UserStatus.INVITED,
    },
  });

  console.log('Spaelaris seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
