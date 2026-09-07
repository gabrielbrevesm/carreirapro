import type { Journalist } from '../types'
import { BRAZIL_JOURNALISTS } from './brazil'
import { ENGLAND_JOURNALISTS } from './england'
import { FRANCE_JOURNALISTS } from './france'
import { ITALY_JOURNALISTS } from './italy'
import { PORTUGAL_JOURNALISTS } from './portugal'
import { SAUDI_ARABIA_JOURNALISTS } from './saudi-arabia'
import { ARGENTINA_JOURNALISTS } from './argentina'
import { USA_JOURNALISTS } from './usa'
import { SPAIN_JOURNALISTS } from './spain'
import { TURKEY_JOURNALISTS } from './turkey'
import { GERMANY_JOURNALISTS } from './germany'

// Base editorial completa (seções 4–14 do brief) — adicionar um jornalista novo é só somar uma
// entrada no arquivo do país certo (ou criar um país novo) e importar aqui.
export const JOURNALISTS: Journalist[] = [
  ...BRAZIL_JOURNALISTS,
  ...ENGLAND_JOURNALISTS,
  ...FRANCE_JOURNALISTS,
  ...ITALY_JOURNALISTS,
  ...PORTUGAL_JOURNALISTS,
  ...SAUDI_ARABIA_JOURNALISTS,
  ...ARGENTINA_JOURNALISTS,
  ...USA_JOURNALISTS,
  ...SPAIN_JOURNALISTS,
  ...TURKEY_JOURNALISTS,
  ...GERMANY_JOURNALISTS,
]

const JOURNALISTS_BY_ID = new Map(JOURNALISTS.map((j) => [j.id, j]))

export function getJournalist(id: string): Journalist | null {
  return JOURNALISTS_BY_ID.get(id) ?? null
}

export function activeJournalists(): Journalist[] {
  return JOURNALISTS.filter((j) => j.active)
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/["'.]/g, '')
    .trim()
}

// Acha um jornalista curado pelo nome (usado pra saber se já temos foto sincronizada antes de
// cair na busca ao vivo — ver /api/pundits/photo).
export function findJournalistByName(name: string): Journalist | null {
  const target = normalizeName(name)
  return JOURNALISTS.find((j) => normalizeName(j.name) === target || normalizeName(j.name).includes(target)) ?? null
}
