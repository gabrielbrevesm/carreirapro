import ReactMarkdown from 'react-markdown'
import type { Article } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Camera, ThumbsUp, Repeat2 } from 'lucide-react'
import { parseFreeformArticle, type FreeformBlock } from '@/lib/ai/parse-freeform-article'
import { OutletBadge } from '@/components/article/OutletBadge'
import { PlayerAvatar } from '@/components/shared/PlayerAvatar'
import { EditorialPhoto } from '@/components/article/EditorialPhoto'
import { ArticlePlayerButton } from '@/components/article/ArticlePlayerButton'

const OUTCOME_STYLES = {
  win: 'text-green-700 dark:text-green-400',
  loss: 'text-red-700 dark:text-red-400',
  draw: 'text-amber-700 dark:text-amber-400',
}

const OUTCOME_ICON = { win: '✅', loss: '❌', draw: '🤝' }

const DOT_COLORS = {
  red: 'bg-red-500',
  gray: 'bg-zinc-400',
  green: 'bg-green-500',
}

const PROSE_CLASSES = 'prose prose-sm md:prose-base max-w-none dark:prose-invert prose-blockquote:not-italic prose-blockquote:border-primary/40'

export function ArticleRenderer({ article }: { article: Article }) {
  const sections = article.sections
  const freeform = sections ? null : parseFreeformArticle(article.body)
  const outletLabel = sections?.outletLabel ?? freeform?.outletLabel ?? null

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-3">
        <div className="max-w-sm mx-auto">
          <EditorialPhoto article={article} />
        </div>

        {outletLabel && <OutletBadge label={outletLabel} className="text-sm px-2.5 py-1" />}
        <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">{article.headline}</h1>
        {article.subheadline && <p className="text-lg text-muted-foreground">{article.subheadline}</p>}

        <ArticlePlayerButton article={article} />

        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>{new Date(article.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
          {article.competition && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline">{article.competition}</Badge>
            </>
          )}
          {article.season && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span>{article.season}</span>
            </>
          )}
        </div>
      </header>

      <Separator />

      {sections ? <StructuredSections sections={sections} /> : freeform && <FreeformSections blocks={freeform.blocks} />}
    </article>
  )
}

function FreeformSections({ blocks }: { blocks: FreeformBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'intro') {
          return (
            <section key={i} className={PROSE_CLASSES}>
              <ReactMarkdown>{block.content}</ReactMarkdown>
            </section>
          )
        }

        if (block.type === 'section') {
          return (
            <section key={i} className="space-y-2">
              <h2 className="text-lg font-bold tracking-tight">{block.heading}</h2>
              <div className={PROSE_CLASSES}>
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            </section>
          )
        }

        if (block.type === 'debate') {
          if (block.entries.length === 0) return null
          return (
            <section key={i} className="space-y-3">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{block.heading}</h2>
              <div className="grid gap-3">
                {block.entries.map((entry, ei) => (
                  <div key={ei} className="border rounded-lg p-4 space-y-1.5">
                    <span className="font-semibold text-sm">{entry.name}</span>
                    {entry.quotes.map((q, qi) => (
                      <p key={qi} className="text-sm italic border-l-2 pl-3 text-muted-foreground">
                        &ldquo;{q}&rdquo;
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (block.type === 'social') {
          if (block.entries.length === 0) return null
          return (
            <section key={i} className="space-y-3">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{block.heading}</h2>
              <div className="space-y-3">
                {block.entries.map((entry, ei) => (
                  <div key={ei} className="border rounded-xl p-4 space-y-2 bg-card">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                        {entry.name[0]}
                      </div>
                      <p className="text-sm font-medium">{entry.name}</p>
                    </div>
                    {entry.quotes.map((q, qi) => (
                      <p key={qi} className="text-sm">
                        {q}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )
        }

        // editorial
        return (
          <section key={i} className="bg-primary/5 rounded-xl p-5 space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Editorial{block.author ? ` — ${block.author}` : ''}
            </h2>
            <div className={PROSE_CLASSES}>
              <ReactMarkdown>{block.content}</ReactMarkdown>
            </div>
          </section>
        )
      })}
    </>
  )
}

function StructuredSections({ sections }: { sections: NonNullable<Article['sections']> }) {
  const resultsByCompetition = new Map<string, typeof sections.recentResults>()
  for (const r of sections.recentResults ?? []) {
    const list = resultsByCompetition.get(r.competition) ?? []
    list.push(r)
    resultsByCompetition.set(r.competition, list)
  }

  return (
    <>
      {sections.main && (
        <section className={`${PROSE_CLASSES} whitespace-pre-line`}>
          <ReactMarkdown>{sections.main}</ReactMarkdown>
        </section>
      )}

      {resultsByCompetition.size > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Últimos resultados</h2>
          {Array.from(resultsByCompetition.entries()).map(([competition, results]) => (
            <div key={competition} className="space-y-1.5">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <span>{results![0].competitionIcon}</span> {competition}
              </p>
              <ul className="space-y-1">
                {results!.map((r, i) => (
                  <li key={i} className={`text-sm flex items-center gap-2 ${OUTCOME_STYLES[r.outcome]}`}>
                    <span>{OUTCOME_ICON[r.outcome]}</span>
                    <span className="text-foreground">{r.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {sections.standingsContext && (
        <section className={`${PROSE_CLASSES} whitespace-pre-line`}>
          <ReactMarkdown>{sections.standingsContext}</ReactMarkdown>
        </section>
      )}

      {sections.playerAnalysis && (
        <section className="bg-muted/50 rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Raio-x do elenco</h2>
          <div className={`${PROSE_CLASSES} whitespace-pre-line`}>
            <ReactMarkdown>{sections.playerAnalysis}</ReactMarkdown>
          </div>
        </section>
      )}

      {sections.upcomingFixtures && sections.upcomingFixtures.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Próximos jogos</h2>
          <div className="space-y-3">
            {sections.upcomingFixtures.map((fixture, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${DOT_COLORS[fixture.dot]}`} />
                <div>
                  <p className="font-semibold text-sm">{fixture.opponent}</p>
                  <p className="text-sm text-muted-foreground">{fixture.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.pressDebate && sections.pressDebate.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Debate na imprensa</h2>
          <div className="grid gap-3">
            {sections.pressDebate.map((block, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{block.name}</span>
                  {block.outlet && <OutletBadge label={block.outlet} className="text-[10px] px-1.5 py-0.5" />}
                </div>
                {block.quotes.map((q, qi) => (
                  <p key={qi} className="text-sm italic border-l-2 pl-3 text-muted-foreground">
                    &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.socialMedia && sections.socialMedia.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Redes Sociais</h2>
          <div className="space-y-3">
            {sections.socialMedia.map((post, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {post.accountType === 'player' ? (
                      <PlayerAvatar name={post.displayName} className="w-8 h-8" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                        {post.displayName[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex items-center gap-1.5">
                      {post.countryCode && (
                        <span className="text-[9px] font-bold text-muted-foreground border rounded px-1 py-0.5 shrink-0">{post.countryCode}</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{post.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{post.handle}</p>
                      </div>
                    </div>
                  </div>
                  {post.platform === 'twitter' ? (
                    <MessageCircle className="w-4 h-4 text-sky-500 shrink-0" />
                  ) : (
                    <Camera className="w-4 h-4 text-pink-500 shrink-0" />
                  )}
                </div>
                {post.replyTo && <p className="text-xs text-muted-foreground">em resposta a {post.replyTo}</p>}
                <p className="text-sm">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {post.likes?.toLocaleString('pt-BR')}
                  </span>
                  {!!post.retweets && (
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3 h-3" />
                      {post.retweets.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.backstage && (
        <section className="border-l-4 border-primary/30 pl-4 space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Bastidores</h2>
          <div className={PROSE_CLASSES}>
            <ReactMarkdown>{sections.backstage}</ReactMarkdown>
          </div>
        </section>
      )}

      {sections.editorial && (
        <section className="bg-primary/5 rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Editorial — {sections.editorial.authorName}</h2>
          {sections.editorial.quotes.map((q, i) => (
            <p key={i} className="text-sm italic">
              &ldquo;{q}&rdquo;
            </p>
          ))}
          {sections.editorial.closingQuestion && <p className="text-sm font-semibold pt-2">{sections.editorial.closingQuestion}</p>}
        </section>
      )}
    </>
  )
}
