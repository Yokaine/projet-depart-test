import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app'

async function demarrer() {
  const application = await NestFactory.create(AppModule)
  application.enableShutdownHooks()
  await application.listen(process.env.PORT ?? 3000, '0.0.0.0')
}

void demarrer().catch(() => {
  console.error('Démarrage impossible. Vérifiez PORT et la connexion PostgreSQL.')
  process.exit(1)
})
