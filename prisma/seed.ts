import { PrismaClient, Priority, TimerMode, GoalType, GoalMetric } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const user = await prisma.user.upsert({
    where: { email: "demo@notedo.app" },
    update: {},
    create: {
      email: "demo@notedo.app",
      name: "Usuário Demo",
    },
  });

  console.log(`✓ User: ${user.email}`);

  await prisma.subject.deleteMany({ where: { userId: user.id } });

  const subjectsData = [
    { name: "Cálculo I", color: "#a78bfa", priority: Priority.HIGH, progress: 62, tags: ["faculdade", "exatas"] },
    { name: "Algoritmos", color: "#60a5fa", priority: Priority.HIGH, progress: 78, tags: ["programação"] },
    { name: "Inglês", color: "#34d399", priority: Priority.MEDIUM, progress: 40, tags: ["idiomas"] },
    { name: "Filosofia", color: "#fbbf24", priority: Priority.LOW, progress: 18, tags: ["humanas"] },
  ];

  const subjects = await Promise.all(
    subjectsData.map((s) =>
      prisma.subject.create({
        data: { ...s, userId: user.id },
      })
    )
  );
  console.log(`✓ ${subjects.length} subjects`);

  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.goal.createMany({
    data: [
      { userId: user.id, type: GoalType.DAILY, metric: GoalMetric.HOURS, target: 4, label: "Meta diária" },
      { userId: user.id, type: GoalType.WEEKLY, metric: GoalMetric.HOURS, target: 25, label: "Meta semanal" },
      { userId: user.id, type: GoalType.WEEKLY, metric: GoalMetric.SESSIONS, target: 30, label: "Sessões da semana" },
    ],
  });
  console.log("✓ 3 goals");

  const now = new Date();
  const sessions = [];
  for (let i = 0; i < 30; i++) {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const daysAgo = Math.floor(Math.random() * 14);
    const startedAt = new Date(now);
    startedAt.setDate(startedAt.getDate() - daysAgo);
    startedAt.setHours(8 + Math.floor(Math.random() * 12));
    const durationSeconds = (15 + Math.floor(Math.random() * 75)) * 60;
    const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    sessions.push({
      userId: user.id,
      subjectId: subject.id,
      mode: [TimerMode.POMODORO, TimerMode.FREE, TimerMode.CUSTOM][
        Math.floor(Math.random() * 3)
      ],
      startedAt,
      endedAt,
      durationSeconds,
      focusScore: 60 + Math.floor(Math.random() * 40),
    });
  }
  await prisma.studySession.createMany({ data: sessions });
  console.log(`✓ ${sessions.length} study sessions`);

  await prisma.review.deleteMany({ where: { userId: user.id } });
  const calc = subjects.find((s) => s.name === "Cálculo I");
  const algo = subjects.find((s) => s.name === "Algoritmos");
  const ontem = new Date(now);
  ontem.setDate(ontem.getDate() - 1);
  const hoje = new Date(now);
  hoje.setHours(9, 0, 0, 0);
  const daqui3 = new Date(now);
  daqui3.setDate(daqui3.getDate() + 3);
  await prisma.review.createMany({
    data: [
      {
        userId: user.id,
        subjectId: calc?.id,
        title: "Limites e continuidade",
        scheduledAt: ontem,
        interval: 1,
        ease: 2.5,
        status: "PENDING",
      },
      {
        userId: user.id,
        subjectId: algo?.id,
        title: "Big-O e complexidade",
        scheduledAt: hoje,
        interval: 2,
        ease: 2.5,
        status: "PENDING",
      },
      {
        userId: user.id,
        subjectId: calc?.id,
        title: "Derivadas básicas",
        scheduledAt: daqui3,
        interval: 4,
        ease: 2.5,
        status: "PENDING",
      },
    ],
  });
  console.log("✓ 3 reviews");

  await prisma.flashcard.deleteMany({ where: { userId: user.id } });
  const flashcards = [
    { deck: "Cálculo I", front: "Derivada de sen(x)", back: "cos(x)" },
    { deck: "Cálculo I", front: "Derivada de cos(x)", back: "-sen(x)" },
    { deck: "Cálculo I", front: "Derivada de e^x", back: "e^x" },
    { deck: "Cálculo I", front: "Derivada de ln(x)", back: "1/x" },
    { deck: "Cálculo I", front: "Regra do produto", back: "(fg)' = f'g + fg'" },
    { deck: "Cálculo I", front: "Regra da cadeia", back: "(f∘g)'(x) = f'(g(x))·g'(x)" },
    { deck: "Algoritmos", front: "Complexidade do bubble sort", back: "O(n²)" },
    { deck: "Algoritmos", front: "Complexidade do merge sort", back: "O(n log n)" },
    { deck: "Algoritmos", front: "Estrutura LIFO", back: "Pilha (Stack)" },
    { deck: "Algoritmos", front: "Estrutura FIFO", back: "Fila (Queue)" },
    { deck: "Algoritmos", front: "Big-O do acesso a array", back: "O(1)" },
    { deck: "Algoritmos", front: "Busca binária requer", back: "array ordenado" },
  ];
  const cardsData = flashcards.map((f, i) => {
    const daysOffset = Math.floor(Math.random() * 7) - 3;
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + daysOffset);
    return {
      userId: user.id,
      front: f.front,
      back: f.back,
      deck: f.deck,
      ease: 2.5,
      interval: i % 3 === 0 ? 1 : 3,
      nextReview,
    };
  });
  await prisma.flashcard.createMany({ data: cardsData });
  console.log(`✓ ${cardsData.length} flashcards`);

  console.log("\n✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
