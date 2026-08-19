import type { TransferSuggestion } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Coins, Heart, BookOpen, Info } from 'lucide-react'

export function TransferSuggestionCard({ suggestion }: { suggestion: TransferSuggestion }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-tight">{suggestion.playerName}</p>
            <p className="text-sm text-muted-foreground">
              {suggestion.position} · {suggestion.age} anos · {suggestion.nationality}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {suggestion.viabilityScore}/10
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{suggestion.currentClub}</span>
          <span className="font-medium">{suggestion.transferFeeEstimate}</span>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>{suggestion.narrativeJustification}</p>
          </div>
          <div className="flex gap-2">
            <Coins className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>{suggestion.financialJustification}</p>
          </div>
          <div className="flex gap-2">
            <Heart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>{suggestion.personalJustification}</p>
          </div>
          {suggestion.realLifeDataAvailable && (
            <div className="flex gap-2 text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">{suggestion.marketContext}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
