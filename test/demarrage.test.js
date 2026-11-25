const { lireCreneau } = require('../dist/regles')

test('lit un créneau UTC valide', () => {
  const { debut, fin } = lireCreneau('2030-10-15T09:00:00Z', '2030-10-15T10:00:00Z')
  expect(fin.getTime() - debut.getTime()).toBe(3_600_000)
})
