import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Home Cleaning", slug: "home-cleaning", description: "House cleaning, deep cleaning, move-out cleaning", icon: "sparkles" },
  { name: "Handyman & Repairs", slug: "handyman", description: "Furniture assembly, plumbing, electrical, general repairs", icon: "wrench" },
  { name: "Moving & Delivery", slug: "moving-delivery", description: "Packing, moving help, furniture delivery, junk removal", icon: "truck" },
  { name: "Grocery & Shopping", slug: "grocery-shopping", description: "Grocery delivery, personal shopping, errands", icon: "shopping-cart" },
  { name: "Dog Walking & Pet Care", slug: "pet-care", description: "Dog walking, pet sitting, boarding, grooming", icon: "paw-print" },
  { name: "Yard Work & Gardening", slug: "yard-work", description: "Lawn mowing, leaf removal, gardening, snow shoveling", icon: "flower-2" },
  { name: "Tutoring & Lessons", slug: "tutoring", description: "Academic tutoring, music lessons, language coaching", icon: "book-open" },
  { name: "Tech Support", slug: "tech-support", description: "Computer repair, WiFi setup, software help, device setup", icon: "monitor" },
  { name: "Design & Creative", slug: "design-creative", description: "Graphic design, logo design, photo editing, video editing", icon: "palette" },
  { name: "Photography", slug: "photography", description: "Event photography, portrait shoots, product photos", icon: "camera" },
  { name: "Event Help", slug: "event-help", description: "Bartending, catering, event setup, DJ services", icon: "music" },
  { name: "Fitness & Wellness", slug: "fitness-wellness", description: "Personal training, yoga, massage therapy", icon: "dumbbell" },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.job.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create categories
  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }
  console.log(`Created ${categories.length} categories`);

  // Create a demo user (for local dev without Clerk)
  const demoUser = await prisma.user.create({
    data: {
      clerkId: "demo-user-1",
      email: "alex@example.com",
      name: "Alex Rivera",
      bio: "Homeowner and busy professional who needs help with tasks around the house.",
    },
  });

  const tasker1 = await prisma.user.create({
    data: {
      clerkId: "demo-tasker-1",
      email: "jordan@example.com",
      name: "Jordan Chen",
      bio: "Experienced handyman and cleaner. 5+ years of experience. Licensed and insured.",
    },
  });

  const tasker2 = await prisma.user.create({
    data: {
      clerkId: "demo-tasker-2",
      email: "sam@example.com",
      name: "Sam Patel",
      bio: "Dog lover and gardener. Available weekends and evenings.",
    },
  });

  const tasker3 = await prisma.user.create({
    data: {
      clerkId: "demo-tasker-3",
      email: "taylor@example.com",
      name: "Taylor Kim",
      bio: "Professional photographer and graphic designer. Fast turnaround.",
    },
  });

  console.log("Created demo users");

  const cleaningCat = await prisma.category.findUnique({ where: { slug: "home-cleaning" } });
  const handymanCat = await prisma.category.findUnique({ where: { slug: "handyman" } });
  const petCat = await prisma.category.findUnique({ where: { slug: "pet-care" } });
  const yardCat = await prisma.category.findUnique({ where: { slug: "yard-work" } });
  const photographyCat = await prisma.category.findUnique({ where: { slug: "photography" } });
  const tutoringCat = await prisma.category.findUnique({ where: { slug: "tutoring" } });
  const movingCat = await prisma.category.findUnique({ where: { slug: "moving-delivery" } });
  const designCat = await prisma.category.findUnique({ where: { slug: "design-creative" } });
  const techCat = await prisma.category.findUnique({ where: { slug: "tech-support" } });

  // Create sample jobs
  const jobs = [
    {
      title: "Deep clean my 2-bedroom apartment",
      description: "Need a thorough deep clean of my 2BR/1BA apartment in downtown. Need someone who can bring their own supplies. About 900 sq ft. Looking for someone this weekend.",
      budgetMin: 80,
      budgetMax: 150,
      location: "Downtown, Austin TX",
      categoryId: cleaningCat!.id,
      posterId: demoUser.id,
      urgent: true,
      status: "open",
    },
    {
      title: "IKEA furniture assembly — 3 pieces",
      description: "Bought a new desk, bookshelf, and nightstand from IKEA. Need someone to assemble them. All pieces are in boxes, tools needed. Should take 3-4 hours.",
      budgetMin: 60,
      budgetMax: 100,
      location: "South Congress, Austin TX",
      categoryId: handymanCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Dog walking — 30 min walks, Mon-Fri",
      description: "Need someone to walk my golden retriever, Charlie, for 30 minutes each weekday around noon. He's friendly and well-behaved. Must be comfortable with large dogs.",
      budgetMin: 15,
      budgetMax: 25,
      location: "Hyde Park, Austin TX",
      isRemote: false,
      categoryId: petCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Lawn mowing + leaf cleanup",
      description: "Front and back yard need mowing. About 1/4 acre total. Also need leaf cleanup. You bring your own mower and blower. Can be done any day this week.",
      budgetMin: 40,
      budgetMax: 75,
      location: "Round Rock, TX",
      categoryId: yardCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Product photography for my Etsy shop",
      description: "Need 20 product photos of handmade ceramic mugs for my Etsy store. Need clean white background shots + some lifestyle shots. I can provide the space and props.",
      budgetMin: 100,
      budgetMax: 200,
      location: "East Austin, TX",
      isRemote: false,
      categoryId: photographyCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Logo design for my food blog",
      description: "Starting a food blog called 'Tasty Thymes' and need a logo. Looking for something modern, warm, and food-related. Would like to see portfolio first. Full commercial rights needed.",
      budgetMin: 50,
      budgetMax: 150,
      isRemote: true,
      categoryId: designCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Help move a couch into my apartment",
      description: "Need 2 strong people to help move a large sectional couch from my truck into my 2nd floor apartment. No elevator. Should take about 30 minutes. Will pay $20/person.",
      budgetMin: 20,
      budgetMax: 40,
      location: "North Loop, Austin TX",
      categoryId: movingCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "French tutor for beginner (10 sessions)",
      description: "Looking for a French tutor for 10 one-hour sessions. Complete beginner. Want to learn conversational French for an upcoming trip to Paris. Can do online or in-person.",
      budgetMin: 30,
      budgetMax: 50,
      location: "Austin, TX",
      isRemote: true,
      categoryId: tutoringCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Fix my WiFi — keeps dropping",
      description: "My home WiFi keeps dropping every 10-15 minutes. I've restarted the router. Need someone who knows networking to diagnose and fix. Google Fiber ISP.",
      budgetMin: 30,
      budgetMax: 60,
      location: "Mueller, Austin TX",
      categoryId: techCat!.id,
      posterId: demoUser.id,
      status: "open",
    },
    {
      title: "Grocery delivery — HEB order",
      description: "Need someone to pick up my HEB grocery order (about 15 items, already picked out online) and deliver to my apartment. I'll pay for the groceries + your fee. Need it by 5pm today.",
      budgetMin: 10,
      budgetMax: 20,
      location: "Zilker, Austin TX",
      categoryId: cleaningCat!.id,
      posterId: demoUser.id,
      urgent: true,
      status: "open",
    },
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }
  console.log(`Created ${jobs.length} sample jobs`);

  // Create some sample bids
  const sampleJobs = await prisma.job.findMany({ take: 5 });

  if (sampleJobs[0]) {
    await prisma.bid.create({
      data: {
        jobId: sampleJobs[0].id,
        bidderId: tasker1.id,
        amount: 120,
        description: "I've been cleaning professionally for 5 years. I bring eco-friendly supplies and a HEPA vacuum. Available Saturday morning.",
        timeline: "This Saturday, 9am",
      },
    });
  }

  if (sampleJobs[1]) {
    await prisma.bid.create({
      data: {
        jobId: sampleJobs[1].id,
        bidderId: tasker1.id,
        amount: 85,
        description: "I've assembled over 50 IKEA pieces. I bring my own power tools and can finish all 3 pieces in about 3 hours.",
        timeline: "Tomorrow or Wednesday evening",
      },
    });
  }

  if (sampleJobs[2]) {
    await prisma.bid.create({
      data: {
        jobId: sampleJobs[2].id,
        bidderId: tasker2.id,
        amount: 18,
        description: "I love golden retrievers! I'm available weekdays at noon. I've been walking dogs for 3 years and am pet CPR certified.",
        timeline: "Mon-Fri at 12pm, starting next week",
      },
    });
  }

  if (sampleJobs[3]) {
    await prisma.bid.create({
      data: {
        jobId: sampleJobs[3].id,
        bidderId: tasker2.id,
        amount: 55,
        description: "I have a zero-turn mower and a commercial-grade blower. Can do it tomorrow morning. I maintain 15+ lawns in Round Rock.",
        timeline: "Tomorrow, 8am",
      },
    });
  }

  if (sampleJobs[4]) {
    await prisma.bid.create({
      data: {
        jobId: sampleJobs[4].id,
        bidderId: tasker3.id,
        amount: 150,
        description: "Professional product photographer. I specialize in ceramics and food photography. Check out my portfolio at taylorkimphoto.com. I can shoot this weekend.",
        timeline: "This Saturday, flexible timing",
      },
    });
  }

  console.log("Created sample bids");
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
