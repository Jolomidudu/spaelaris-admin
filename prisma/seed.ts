import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

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
  const ownerPassword = process.env.OWNER_INITIAL_PASSWORD;
  const passwordHash = ownerPassword
    ? await bcrypt.hash(ownerPassword, 12)
    : undefined;

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

  const staff = [
    {
      email: 'nneka@spaelaris.com',
      firstName: 'Nneka',
      lastName: 'Adeyemi',
      role: UserRole.THERAPIST,
      locationSlug: 'lagos',
      bio: 'Senior massage therapist specialising in deep tissue and sports massage.',
      serviceSlugs: ['deep-tissue-massage'],
    },
    {
      email: 'ifeoma@spaelaris.com',
      firstName: 'Ifeoma',
      lastName: 'Chukwu',
      role: UserRole.THERAPIST,
      locationSlug: 'lagos',
      bio: 'Wellness therapist specialising in aromatherapy and restorative treatments.',
      serviceSlugs: ['aromatherapy'],
    },
    {
      email: 'daniel@spaelaris.com',
      firstName: 'Daniel',
      lastName: 'Okoro',
      role: UserRole.THERAPIST,
      locationSlug: 'abuja',
      bio: 'Massage therapist specialising in Swedish massage and reflexology.',
      serviceSlugs: ['deep-tissue-massage'],
    },
  ];

  for (const member of staff) {
    const location = createdLocations.find((item) => item.slug === member.locationSlug);
    if (!location) {
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        status: UserStatus.ACTIVE,
      },
    });

    const profile = await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {
        locationId: location.id,
        bio: member.bio,
        isBookable: true,
      },
      create: {
        userId: user.id,
        locationId: location.id,
        bio: member.bio,
        isBookable: true,
      },
    });

    for (const serviceSlug of member.serviceSlugs) {
      const service = await prisma.service.findUnique({ where: { slug: serviceSlug } });
      if (!service) {
        continue;
      }

      await prisma.therapistService.upsert({
        where: {
          staffProfileId_serviceId: {
            staffProfileId: profile.id,
            serviceId: service.id,
          },
        },
        update: {},
        create: {
          staffProfileId: profile.id,
          serviceId: service.id,
        },
      });
    }
  }

  await prisma.user.upsert({
    where: { email: 'owner@spaelaris.com' },
    update: passwordHash
      ? { passwordHash, status: UserStatus.ACTIVE }
      : {},
    create: {
      email: 'owner@spaelaris.com',
      firstName: 'Spaelaris',
      lastName: 'Owner',
      role: UserRole.OWNER,
      status: passwordHash ? UserStatus.ACTIVE : UserStatus.INVITED,
      passwordHash,
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
