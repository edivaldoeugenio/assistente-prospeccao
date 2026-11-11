import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Cria (ou mantém) uma conta inicial a partir das variáveis de ambiente:
 *   SEED_USER_EMAIL, SEED_USER_PASSWORD, SEED_USER_NAME (opcional)
 * A conta é marcada para trocar a senha no primeiro login.
 */
async function main() {
  const email = process.env.SEED_USER_EMAIL
  const password = process.env.SEED_USER_PASSWORD
  const name = process.env.SEED_USER_NAME || 'Administrador'

  if (!email || !password) {
    console.log('SEED_USER_EMAIL/SEED_USER_PASSWORD não definidos — seed ignorado.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, mustChangePassword: true },
  })

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      userName: name,
      userEmail: email,
      userServices: 'Criação de sites, Landing pages, E-commerce',
    },
  })

  console.log(`Seed concluído para ${email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
