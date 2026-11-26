const { seChevauchent } = require('../dist/regles')

describe('seChevauchent', () => {
  test('détecte un chevauchement partiel', () => {
    const premier = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T10:00:00Z') }
    const second = { debut: new Date('2030-10-15T09:30:00Z'), fin: new Date('2030-10-15T10:30:00Z') }

    const resultat = seChevauchent(premier, second)

    expect(resultat).toBe(true)
  })

  test('deux créneaux séparés ne se chevauchent pas', () => {
    const premier = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T10:00:00Z') }
    const second = { debut: new Date('2030-10-15T11:00:00Z'), fin: new Date('2030-10-15T12:00:00Z') }

    const resultat = seChevauchent(premier, second)

    expect(resultat).toBe(false)
  })

  test('un créneau qui commence quand l’autre finit ne chevauche pas', () => {
    const premier = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T10:00:00Z') }
    const second = { debut: new Date('2030-10-15T10:00:00Z'), fin: new Date('2030-10-15T11:00:00Z') }

    const resultat = seChevauchent(premier, second)

    expect(resultat).toBe(false)
  })

  test('un créneau entièrement inclus dans un autre chevauche', () => {
    const premier = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T12:00:00Z') }
    const second = { debut: new Date('2030-10-15T10:00:00Z'), fin: new Date('2030-10-15T11:00:00Z') }

    const resultat = seChevauchent(premier, second)

    expect(resultat).toBe(true)
  })

  test('deux créneaux identiques chevauchent', () => {
    const premier = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T10:00:00Z') }
    const second = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T10:00:00Z') }

    const resultat = seChevauchent(premier, second)

    expect(resultat).toBe(true)
  })

  test('inverser l’ordre des créneaux ne change pas le résultat', () => {
    const premier = { debut: new Date('2030-10-15T09:00:00Z'), fin: new Date('2030-10-15T10:00:00Z') }
    const second = { debut: new Date('2030-10-15T09:30:00Z'), fin: new Date('2030-10-15T10:30:00Z') }

    expect(seChevauchent(premier, second)).toBe(seChevauchent(second, premier))
  })
})