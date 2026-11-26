process.env.DATABASE_URL ??= 'postgresql://cours:cours@localhost:5433/reservations_test'

const request = require('supertest')
const { Pool } = require('pg')
const { Test } = require('@nestjs/testing')
const { AppModule } = require('../dist/app')

describe('GET /salles/disponibles (E2E)', () => {
  let app
  let pool

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = module.createNestApplication()
    await app.init()
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  })

  beforeEach(async () => {

    await pool.query('TRUNCATE reservations, salles RESTART IDENTITY CASCADE')
  })

  afterAll(async () => {
    await pool.end()
    await app.close()
  })

  test('parcours complet : créer deux salles, réserver, chercher, annuler', async () => {
    const salleA = (await request(app.getHttpServer()).post('/salles').send({ nom: 'Salle A' })).body
    const salleB = (await request(app.getHttpServer()).post('/salles').send({ nom: 'Salle B' })).body

    const reservation = (await request(app.getHttpServer())
      .post('/reservations')
      .send({ salleId: salleA.id, debut: '2030-10-15T09:00:00Z', fin: '2030-10-15T10:00:00Z' })).body

    const reponse = await request(app.getHttpServer())
      .get('/salles/disponibles')
      .query({ debut: '2030-10-15T09:00:00Z', fin: '2030-10-15T10:00:00Z' })
    expect(reponse.status).toBe(200)
    expect(reponse.body.map(s => s.id)).toEqual([salleB.id])

    await request(app.getHttpServer()).delete(`/reservations/${reservation.id}`)

    const apresAnnulation = await request(app.getHttpServer())
      .get('/salles/disponibles')
      .query({ debut: '2030-10-15T09:00:00Z', fin: '2030-10-15T10:00:00Z' })
    expect(apresAnnulation.body.map(s => s.id).sort()).toEqual([salleA.id, salleB.id].sort())
  })

  test('une réservation qui finit à 9h ne bloque pas une recherche à partir de 9h', async () => {
    const salle = (await request(app.getHttpServer()).post('/salles').send({ nom: 'Salle C' })).body
    await request(app.getHttpServer())
      .post('/reservations')
      .send({ salleId: salle.id, debut: '2030-10-15T08:00:00Z', fin: '2030-10-15T09:00:00Z' })

    const reponse = await request(app.getHttpServer())
      .get('/salles/disponibles')
      .query({ debut: '2030-10-15T09:00:00Z', fin: '2030-10-15T10:00:00Z' })

    expect(reponse.body.map(s => s.id)).toEqual([salle.id])
  })

  test('renvoie [] si aucune salle n’est disponible', async () => {
    const salle = (await request(app.getHttpServer()).post('/salles').send({ nom: 'Salle D' })).body
    await request(app.getHttpServer())
      .post('/reservations')
      .send({ salleId: salle.id, debut: '2030-10-15T09:00:00Z', fin: '2030-10-15T10:00:00Z' })

    const reponse = await request(app.getHttpServer())
      .get('/salles/disponibles')
      .query({ debut: '2030-10-15T09:00:00Z', fin: '2030-10-15T10:00:00Z' })

    expect(reponse.status).toBe(200)
    expect(reponse.body).toEqual([])
  })

  test('renvoie 400 si une date est absente ou invalide', async () => {
    expect((await request(app.getHttpServer()).get('/salles/disponibles')).status).toBe(400)
    expect((await request(app.getHttpServer())
      .get('/salles/disponibles').query({ debut: 'pas-une-date', fin: '2030-10-15T10:00:00Z' })).status).toBe(400)
    expect((await request(app.getHttpServer())
      .get('/salles/disponibles').query({ debut: '2030-10-15T10:00:00Z', fin: '2030-10-15T09:00:00Z' })).status).toBe(400)
  })
})