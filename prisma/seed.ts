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
