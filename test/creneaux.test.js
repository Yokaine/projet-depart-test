const { lireCreneau } = require('../dist/regles')

describe('lireCreneau', () => {
  test('lit un créneau UTC valide et renvoie des objets Date', () => {
    const { debut, fin } = lireCreneau('2030-10-15T09:00:00Z', '2030-10-15T10:00:00Z')

    expect(debut).toBeInstanceOf(Date)
    expect(fin).toBeInstanceOf(Date)
    expect(fin.getTime() - debut.getTime()).toBe(3_600_000)
  })

  test('rejette une date de début manquante', () => {
    expect(() => lireCreneau(undefined, '2030-10-15T10:00:00Z')).toThrow()
  })

  test('rejette un format de date invalide', () => {
    expect(() => lireCreneau('15/10/2030 09:00', '2030-10-15T10:00:00Z')).toThrow()
  })

  test('rejette une fin égale au début', () => {
    expect(() => lireCreneau('2030-10-15T09:00:00Z', '2030-10-15T09:00:00Z')).toThrow()
  })

  test('rejette une fin avant le début', () => {
    expect(() => lireCreneau('2030-10-15T10:00:00Z', '2030-10-15T09:00:00Z')).toThrow()
  })
})