import {
  BadRequestException, Body, ConflictException, Controller, Delete, Get,
  HttpCode, Module, NotFoundException, Param, ParseIntPipe, Post,
  ServiceUnavailableException, Query,
} from '@nestjs/common'
import { Database } from './database'
import { lireCreneau, seChevauchent } from './regles'

function verifierIdentifiant(id: unknown): asserts id is number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new BadRequestException('Identifiant invalide')
  }
}

@Controller()
export class Api {
  constructor(private readonly db: Database) {}

  @Get('health')
  async sante() {
    try {
      await this.db.pool.query('SELECT 1')
      return { status: 'ok' }
    } catch {
      throw new ServiceUnavailableException('Base indisponible')
    }
  }

  @Get('salles')
  async salles() {
    return (await this.db.pool.query('SELECT id, nom FROM salles ORDER BY id')).rows
  }

    @Get('salles/disponibles')
  async sallesDisponibles(@Query('debut') debut?: unknown, @Query('fin') fin?: unknown) {
    const creneau = lireCreneau(debut, fin)

    const lignes = (await this.db.pool.query<{ id: number, nom: string, debut: Date | null, fin: Date | null }>(`
      SELECT s.id, s.nom, r.debut, r.fin
      FROM salles s
      LEFT JOIN reservations r ON r.salle_id = s.id
      ORDER BY s.id
    `)).rows

    const salles = new Map<number, { id: number, nom: string, reservations: { debut: Date, fin: Date }[] }>()
    for (const ligne of lignes) {
      if (!salles.has(ligne.id)) salles.set(ligne.id, { id: ligne.id, nom: ligne.nom, reservations: [] })
      if (ligne.debut && ligne.fin) salles.get(ligne.id)!.reservations.push({ debut: ligne.debut, fin: ligne.fin })
    }

    return [...salles.values()]
      .filter(salle => !salle.reservations.some(reservation => seChevauchent(reservation, creneau)))
      .map(({ id, nom }) => ({ id, nom }))
  }

  @Post('salles')
  async creerSalle(@Body() corps: { nom?: unknown }) {
    const nom = typeof corps?.nom === 'string' ? corps.nom.trim() : ''
    if (!nom || nom.length > 100) throw new BadRequestException('Nom attendu, de 1 à 100 caractères')
    const resultat = await this.db.pool.query('INSERT INTO salles (nom) VALUES ($1) RETURNING id, nom', [nom])
    return resultat.rows[0]
  }

  @Delete('salles/:id')
  @HttpCode(204)
  async supprimerSalle(@Param('id', ParseIntPipe) id: number) {
    verifierIdentifiant(id)
    try {
      const resultat = await this.db.pool.query('DELETE FROM salles WHERE id = $1', [id])
      if (!resultat.rowCount) throw new NotFoundException('Salle introuvable')
    } catch (erreur) {
      if ((erreur as { code?: string }).code === '23503') {
        throw new ConflictException('Cette salle a encore des réservations')
      }
      throw erreur
    }
  }

  @Get('reservations')
  async reservations() {
    return (await this.db.pool.query('SELECT * FROM reservations ORDER BY id')).rows
  }

  @Post('reservations')
  async reserver(@Body() corps: { salleId?: unknown, debut?: unknown, fin?: unknown }) {
    const salleId = corps?.salleId
    verifierIdentifiant(salleId)
    const creneau = lireCreneau(corps?.debut, corps?.fin)
    const client = await this.db.pool.connect()
    try {
      await client.query('BEGIN')
      const salle = await client.query('SELECT id FROM salles WHERE id = $1 FOR UPDATE', [salleId])
      if (!salle.rowCount) throw new NotFoundException('Salle introuvable')
      const reservations = await client.query<{ debut: Date, fin: Date }>(
        'SELECT debut, fin FROM reservations WHERE salle_id = $1', [salleId],
      )
      if (reservations.rows.some(reservation => seChevauchent(reservation, creneau))) {
        throw new ConflictException('Cette salle est déjà réservée sur ce créneau')
      }
      const resultat = await client.query(
        'INSERT INTO reservations (salle_id, debut, fin) VALUES ($1, $2, $3) RETURNING *',
        [salleId, creneau.debut, creneau.fin],
      )
      await client.query('COMMIT')
      return resultat.rows[0]
    } catch (erreur) {
      await client.query('ROLLBACK')
      throw erreur
    } finally {
      client.release()
    }
  }

  @Delete('reservations/:id')
  @HttpCode(204)
  async annuler(@Param('id', ParseIntPipe) id: number) {
    verifierIdentifiant(id)
    const resultat = await this.db.pool.query('DELETE FROM reservations WHERE id = $1', [id])
    if (!resultat.rowCount) throw new NotFoundException('Réservation introuvable')
  }
}

@Module({ controllers: [Api], providers: [Database] })
export class AppModule {}
