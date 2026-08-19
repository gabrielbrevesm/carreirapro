'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ImagePlus, Loader2, Search, X } from 'lucide-react'
import { useMockData } from '@/lib/mock/store'
import type { SquadAnalysis } from '@/types'

export function SquadUploader({ careerId, onAnalyzed }: { careerId: string; onAnalyzed: (analysis: SquadAnalysis) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { analyzeSquad } = useMockData()
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [budget, setBudget] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = (file: File | null) => {
    setPhoto(file)
    if (file) setPreview(URL.createObjectURL(file))
    else setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photo) return
    setLoading(true)

    const result = await analyzeSquad(careerId, preview ?? photo.name, budget || undefined, context || undefined)
    setLoading(false)
    if (result.ok) {
      onAnalyzed(result.analysis)
      handleFile(null)
      setBudget('')
      setContext('')
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Foto do elenco</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Prévia do elenco" className="max-h-40 mx-auto rounded-md object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFile(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/90 hover:bg-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Screenshot da tela de elenco do EA FC</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento disponível (opcional)</Label>
            <Input id="budget" placeholder="ex: €25M" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Contexto adicional (opcional)</Label>
            <Textarea
              id="context"
              placeholder="Ex: preciso de um lateral rápido, já tenho zaga resolvida..."
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!photo || loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? 'Analisando elenco...' : 'Analisar elenco'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
