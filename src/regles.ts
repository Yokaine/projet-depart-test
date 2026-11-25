import { BadRequestException } from '@nestjs/common'

export function lireCreneau(debut: unknown, fin: unknown) {
  const format = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
  const lireDate = (valeur: unknown) => {
    if (typeof valeur !== 'string' || !format.test(valeur)) {
      throw new BadRequestException('Date UTC attendue, par exemple 2030-10-15T09:00:00Z')
    }
    const date = new Date(valeur)
    const normalisee = valeur.includes('.') ? valeur : valeur.replace('Z', '.000Z')
    if (!Number.isFinite(date.getTime()) || date.toISOString() !== normalisee || date.getUTCFullYear() === 0) {
      throw new BadRequestException('Date invalide')
    }
    return date
  }

  const debutDate = lireDate(debut)
  const finDate = lireDate(fin)
  if (finDate <= debutDate) {
    throw new BadRequestException('La fin doit être après le début')
  }
  return { debut: debutDate, fin: finDate }
}

export function seChevauchent(
  premier: { debut: Date, fin: Date },
  second: { debut: Date, fin: Date },
) {
  return premier.debut < second.fin && second.debut < premier.fin
}
