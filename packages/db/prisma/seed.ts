import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import prisma from "../src/index";

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed não pode rodar em produção — ele apaga todos os dados.");
}

const SEED_PASSWORD = "Senha@123";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function startOfThisWeek() {
  const date = new Date();
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekDateAt(daysFromMonday: number, hours: number, minutes: number) {
  const date = startOfThisWeek();
  date.setDate(date.getDate() + daysFromMonday);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

async function createSeedUser(params: { name: string; email: string; avatarColor: string; phone: string }) {
  const password = await hashPassword(SEED_PASSWORD);
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: params.name,
      email: params.email,
      emailVerified: true,
      avatarColor: params.avatarColor,
      phone: params.phone,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: params.email,
          providerId: "credential",
          password,
        },
      },
    },
  });
  return user;
}

async function main() {
  await prisma.$transaction([
    prisma.gratitudeEntry.deleteMany(),
    prisma.prayerRequest.deleteMany(),
    prisma.calendarEvent.deleteMany(),
    prisma.maintenanceItem.deleteMany(),
    prisma.task.deleteMany(),
    prisma.shoppingItem.deleteMany(),
    prisma.pantryItem.deleteMany(),
    prisma.bill.deleteMany(),
    prisma.contribution.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.budgetCategory.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.member.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.rateLimit.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const jv = await createSeedUser({
    name: "João Vitor Nunes",
    email: "joaovitor@familianunes.dev",
    avatarColor: "#5878a8",
    phone: "11987654321",
  });
  const sn = await createSeedUser({
    name: "Sara Nunes",
    email: "sara@familianunes.dev",
    avatarColor: "#c0764f",
    phone: "11976543210",
  });
  const en = await createSeedUser({
    name: "Eliza Nunes",
    email: "eliza@familianunes.dev",
    avatarColor: "#c79a3e",
    phone: "11965432109",
  });

  const family = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name: "Família Nunes",
      slug: "familia-nunes",
      createdAt: new Date(),
    },
  });

  await prisma.member.createMany({
    data: [
      { organizationId: family.id, userId: jv.id, role: "owner" },
      { organizationId: family.id, userId: sn.id, role: "member" },
      { organizationId: family.id, userId: en.id, role: "member" },
    ].map((m) => ({ ...m, id: randomUUID(), createdAt: new Date() })),
  });

  // Finanças
  const categories = await Promise.all(
    [
      { name: "Mercado", monthlyLimit: "2000" },
      { name: "Moradia", monthlyLimit: "2200" },
      { name: "Contas da casa", monthlyLimit: "800" },
      { name: "Transporte", monthlyLimit: "700" },
      { name: "Lazer", monthlyLimit: "600" },
      { name: "Saúde", monthlyLimit: "500" },
    ].map((c) => prisma.budgetCategory.create({ data: { ...c, familyId: family.id } })),
  );
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  await prisma.transaction.createMany({
    data: [
      { description: "Salário — João Vitor", amount: "6200", type: "INCOME" as const, date: daysFromNow(-3), createdById: jv.id },
      { description: "Supermercado", amount: "284.60", type: "EXPENSE" as const, date: daysFromNow(-2), categoryId: categoryByName.Mercado, createdById: sn.id },
      { description: "Salário — Sara", amount: "3600", type: "INCOME" as const, date: daysFromNow(-7), createdById: sn.id },
      { description: "Farmácia", amount: "78.30", type: "EXPENSE" as const, date: daysFromNow(-4), categoryId: categoryByName.Saúde, createdById: sn.id },
      { description: "Posto de combustível", amount: "200", type: "EXPENSE" as const, date: daysFromNow(-5), categoryId: categoryByName.Transporte, createdById: jv.id },
      { description: "Restaurante", amount: "146.90", type: "EXPENSE" as const, date: daysFromNow(-6), categoryId: categoryByName.Lazer, createdById: jv.id },
    ].map((t) => ({ ...t, familyId: family.id })),
  });

  await prisma.contribution.createMany({
    data: [
      { type: "TITHE" as const, amount: "980", date: daysFromNow(-7), createdById: jv.id },
      { type: "OFFERING" as const, amount: "100", date: daysFromNow(-7), createdById: jv.id },
      { type: "MISSIONS" as const, amount: "50", date: daysFromNow(-7), createdById: jv.id },
    ].map((c) => ({ ...c, familyId: family.id })),
  });

  await prisma.bill.createMany({
    data: [
      { name: "Energia elétrica", amount: "312.40", dueDate: daysFromNow(4) },
      { name: "Internet", amount: "119.90", dueDate: daysFromNow(7) },
      { name: "Condomínio", amount: "680", dueDate: daysFromNow(9) },
      { name: "Escola — Eliza", amount: "940", dueDate: daysFromNow(14) },
      { name: "Cartão de crédito", amount: "1430", dueDate: daysFromNow(19) },
    ].map((b) => ({ ...b, familyId: family.id })),
  });

  // Despensa
  await Promise.all(
    [
      { name: "Arroz", quantity: "5 kg", category: "Grãos", level: "OK" as const },
      { name: "Feijão", quantity: "0 un", category: "Grãos", level: "OUT" as const },
      { name: "Óleo de soja", quantity: "1 un", category: "Básicos", level: "LOW" as const },
      { name: "Açúcar", quantity: "2 kg", category: "Básicos", level: "OK" as const },
      { name: "Café", quantity: "1 pacote", category: "Básicos", level: "LOW" as const },
      { name: "Macarrão", quantity: "4 pct", category: "Massas", level: "OK" as const },
      { name: "Sal", quantity: "1 kg", category: "Básicos", level: "OK" as const },
      { name: "Papel higiênico", quantity: "2 rolos", category: "Limpeza", level: "LOW" as const },
      { name: "Leite", quantity: "6 cx", category: "Laticínios", level: "OK" as const },
      { name: "Ovos", quantity: "12 un", category: "Básicos", level: "OK" as const },
    ].map((p) => prisma.pantryItem.create({ data: { ...p, familyId: family.id } })),
  );

  // Compras
  const comprasRaw = [
    {
      cat: "Hortifrúti",
      itens: [
        { n: "Banana prata", q: "1 cacho", done: false },
        { n: "Tomate", q: "1 kg", done: false },
        { n: "Alface", q: "2 un", done: true },
        { n: "Maçã", q: "6 un", done: false },
        { n: "Cenoura", q: "500 g", done: false },
      ],
    },
    {
      cat: "Laticínios",
      itens: [
        { n: "Leite integral", q: "6 cx", done: false },
        { n: "Queijo mussarela", q: "300 g", done: false },
        { n: "Iogurte natural", q: "4 un", done: true },
        { n: "Manteiga", q: "1 un", done: false },
      ],
    },
    {
      cat: "Limpeza",
      itens: [
        { n: "Detergente", q: "3 un", done: false },
        { n: "Sabão em pó", q: "1 cx", done: false },
        { n: "Amaciante", q: "1 un", done: true },
      ],
    },
    {
      cat: "Padaria",
      itens: [
        { n: "Pão de forma", q: "2 un", done: false },
        { n: "Bolacha água e sal", q: "2 pct", done: false },
      ],
    },
  ];

  await prisma.shoppingItem.createMany({
    data: comprasRaw.flatMap((grupo) =>
      grupo.itens.map((item) => ({
        familyId: family.id,
        name: item.n,
        quantity: item.q,
        category: grupo.cat,
        checked: item.done,
      })),
    ),
  });

  // Tarefas
  const tarefasColRaw = [
    {
      status: "TODO" as const,
      cards: [
        { t: "Consertar a torneira da cozinha", local: "Cozinha", ini: jv.id },
        { t: "Trocar lâmpada do corredor", local: "Corredor", ini: jv.id },
        { t: "Limpar a garagem", local: "Garagem", ini: null },
      ],
    },
    {
      status: "IN_PROGRESS" as const,
      cards: [
        { t: "Organizar o guarda-roupa", local: "Quarto", ini: sn.id },
        { t: "Montar a prateleira nova", local: "Escritório", ini: jv.id },
      ],
    },
    {
      status: "DONE" as const,
      cards: [
        { t: "Arrumar a estante de livros", local: "Sala", ini: en.id },
        { t: "Regar as plantas", local: "Varanda", ini: en.id },
      ],
    },
  ];

  await prisma.task.createMany({
    data: tarefasColRaw.flatMap((coluna) =>
      coluna.cards.map((card, index) => ({
        familyId: family.id,
        title: card.t,
        room: card.local,
        status: coluna.status,
        position: index,
        assignedToId: card.ini,
      })),
    ),
  });

  // Manutenção
  await prisma.maintenanceItem.createMany({
    data: [
      { title: "Limpeza do ar-condicionado", type: "Climatização", frequency: "QUARTERLY" as const, nextDueAt: daysFromNow(7) },
      { title: "Calibrar os pneus", type: "Carro", frequency: "MONTHLY" as const, nextDueAt: daysFromNow(9) },
      { title: "Trocar filtro do purificador", type: "Cozinha", frequency: "SEMIANNUAL" as const, nextDueAt: daysFromNow(24) },
      { title: "Trocar pilha do detector de fumaça", type: "Segurança", frequency: "ANNUAL" as const, nextDueAt: daysFromNow(29) },
      { title: "Revisão do carro", type: "Carro", frequency: "SEMIANNUAL" as const, nextDueAt: daysFromNow(42) },
      { title: "Dedetização", type: "Casa", frequency: "ANNUAL" as const, nextDueAt: daysFromNow(81) },
    ].map((m) => ({ ...m, familyId: family.id })),
  });

  // Calendário — semana atual
  const semanaRaw = [
    { dia: 0, eventos: [{ h: "07:00", t: "Escola — Eliza", cat: "Escola" }, { h: "19:00", t: "Jantar em família", cat: "Casa" }] },
    { dia: 1, eventos: [{ h: "08:00", t: "Academia — Sara", cat: "Saúde" }, { h: "14:00", t: "Reunião — João V.", cat: "Trabalho" }] },
    { dia: 2, eventos: [{ h: "07:00", t: "Escola — Eliza", cat: "Escola" }, { h: "16:00", t: "Médico — Eliza", cat: "Saúde" }, { h: "19:30", t: "Célula em casa", cat: "Fé" }] },
    { dia: 3, eventos: [{ h: "09:00", t: "Pagar as contas", cat: "Casa" }, { h: "20:00", t: "Cinema", cat: "Lazer" }] },
    { dia: 4, eventos: [{ h: "07:00", t: "Escola — Eliza", cat: "Escola" }, { h: "18:00", t: "Feira", cat: "Casa" }] },
    { dia: 5, eventos: [{ h: "10:00", t: "Faxina geral", cat: "Casa" }, { h: "15:00", t: "Futebol — João V.", cat: "Lazer" }] },
    { dia: 6, eventos: [{ h: "09:00", t: "Culto", cat: "Fé" }, { h: "12:00", t: "Almoço da vó", cat: "Casa" }, { h: "18:00", t: "Culto da noite", cat: "Fé" }] },
  ];

  await prisma.calendarEvent.createMany({
    data: semanaRaw.flatMap((dia) =>
      dia.eventos.map((evento) => {
        const [h, m] = evento.h.split(":").map(Number);
        return {
          familyId: family.id,
          title: evento.t,
          startsAt: weekDateAt(dia.dia, h ?? 0, m ?? 0),
          category: evento.cat,
        };
      }),
    ),
  });

  // Oração
  await prisma.prayerRequest.createMany({
    data: [
      { text: "Pela saúde da vovó Cida", authorId: sn.id, status: "PRAYING" as const, createdAt: daysFromNow(-2) },
      { text: "Pela viagem missionária da igreja", authorId: jv.id, status: "PRAYING" as const, createdAt: daysFromNow(-3) },
      { text: "Provisão para o tratamento do tio Paulo", authorId: sn.id, status: "PRAYING" as const, createdAt: daysFromNow(-5) },
      { text: "Pela prova final da Eliza", authorId: en.id, status: "ANSWERED" as const, createdAt: daysFromNow(-7) },
      { text: "Sabedoria nas decisões da família", authorId: jv.id, status: "PRAYING" as const, createdAt: daysFromNow(-7) },
      { text: "Pelo novo emprego do João", authorId: sn.id, status: "ANSWERED" as const, createdAt: daysFromNow(-14) },
    ].map((p) => ({ ...p, familyId: family.id })),
  });

  // Gratidão
  await prisma.gratitudeEntry.createMany({
    data: [
      { text: "Pela mesa farta e o almoço de domingo em família", authorId: en.id, date: daysFromNow(0) },
      { text: "Pela recuperação da saúde da Sara", authorId: jv.id, date: daysFromNow(-2) },
      { text: "Por um lar onde podemos servir uns aos outros", authorId: sn.id, date: daysFromNow(-3) },
      { text: "Pela comunhão do nosso pequeno grupo", authorId: jv.id, date: daysFromNow(-4) },
      { text: "Pelo jardim que floresceu nesta primavera", authorId: en.id, date: daysFromNow(-5) },
    ].map((g) => ({ ...g, familyId: family.id })),
  });

  console.log(`Seed concluído. Família "${family.name}" (${family.id}) com 3 membros.`);
  console.log(`Login de teste: ${jv.email} / ${sn.email} / ${en.email} — senha: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
