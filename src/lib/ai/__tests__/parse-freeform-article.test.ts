import { describe, it, expect } from 'vitest'
import { parseFreeformArticle } from '../parse-freeform-article'

describe('parseFreeformArticle — separação de veículo do nome (regressão real)', () => {
  it('"### Nome (Veículo)" vira { name: "Nome", outlet: "Veículo" } — nunca deixa o parêntese no nome', () => {
    const body = [
      '# Globo Esporte | "Manchete"',
      '',
      'Abertura da matéria.',
      '',
      '## Debate na Imprensa',
      '',
      '### Fabrizio Romano (The Athletic)',
      '',
      '> "O pré-contrato já era esperado."',
      '',
      '### Paulo Vinícius Coelho (UOL)',
      '',
      '> "Historicamente, o clube se destacou por reunir grandes nomes."',
    ].join('\n')

    const { blocks } = parseFreeformArticle(body)
    const debateBlock = blocks.find((b) => b.type === 'debate')
    expect(debateBlock).toBeDefined()
    if (debateBlock?.type !== 'debate') throw new Error('unreachable')

    expect(debateBlock.entries).toHaveLength(2)
    expect(debateBlock.entries[0]).toMatchObject({ name: 'Fabrizio Romano', outlet: 'The Athletic' })
    expect(debateBlock.entries[1]).toMatchObject({ name: 'Paulo Vinícius Coelho', outlet: 'UOL' })
    // A regressão real: iniciais calculadas a partir do nome cru "Fabrizio Romano (The Athletic)"
    // davam "F(" em vez de "FR" — garante que o nome usado pelo avatar já vem limpo.
    for (const entry of debateBlock.entries) {
      expect(entry.name).not.toContain('(')
    }
  })

  it('nome sem veículo continua funcionando normalmente (outlet null)', () => {
    const body = ['## Debate na Imprensa', '', '### Jamie Carragher', '', '> "Grande atuação."'].join('\n')
    const { blocks } = parseFreeformArticle(body)
    const debateBlock = blocks.find((b) => b.type === 'debate')
    if (debateBlock?.type !== 'debate') throw new Error('unreachable')
    expect(debateBlock.entries[0]).toMatchObject({ name: 'Jamie Carragher', outlet: null })
  })
})
