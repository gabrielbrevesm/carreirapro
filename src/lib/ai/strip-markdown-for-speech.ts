// Converte o markdown da matéria em texto corrido natural pra narração — remove marcações que
// soariam estranhas se lidas literalmente (#, >, **, ###) mas preserva o conteúdo textual.
export function stripMarkdownForSpeech(body: string): string {
  return body
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^-{3,}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
