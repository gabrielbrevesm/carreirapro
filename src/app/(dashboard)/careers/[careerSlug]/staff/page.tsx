'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCareer } from '@/lib/mock/use-career'
import { useMockData } from '@/lib/mock/store'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Camera, Loader2, Save, Trophy, User } from 'lucide-react'
import { toast } from 'sonner'

export default function CareerStaffPage({ params }: { params: Promise<{ careerSlug: string }> }) {
  const { careerSlug } = use(params)
  const { career, isLoading, notFound } = useCareer(careerSlug)
  const { updateCareerProfile } = useMockData()

  const [photoUploading, setPhotoUploading] = useState(false)
  const [playingStyle, setPlayingStyle] = useState<string | null>(null)
  const [preferredFormation, setPreferredFormation] = useState<string | null>(null)
  const [personalTastes, setPersonalTastes] = useState<string | null>(null)
  const [careerMilestones, setCareerMilestones] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!career) return
    setPlayingStyle(career.playingStyle)
    setPreferredFormation(career.preferredFormation)
    setPersonalTastes(career.personalTastes)
    setCareerMilestones(career.careerMilestones)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career?.id])

  if (isLoading) return <LoadingSpinner label="Carregando..." />
  if (notFound || !career) {
    return (
      <EmptyState
        icon={User}
        title="Carreira não encontrada"
        action={
          <Button asChild>
            <Link href="/careers">Voltar para carreiras</Link>
          </Button>
        }
      />
    )
  }

  const handlePhotoFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setPhotoUploading(true)
      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, category: 'managers' }),
        })
        if (!res.ok) throw new Error('upload failed')
        const data = (await res.json()) as { url: string }
        const result = await updateCareerProfile(career.id, { managerPhotoUrl: data.url })
        if (!result.ok) throw new Error('save failed')
        toast.success('Foto do técnico atualizada.')
      } catch {
        toast.error('Não foi possível atualizar a foto. Tente de novo.')
      } finally {
        setPhotoUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const result = await updateCareerProfile(career.id, {
      playingStyle: playingStyle?.trim() || null,
      preferredFormation: preferredFormation?.trim() || null,
      personalTastes: personalTastes?.trim() || null,
      careerMilestones: careerMilestones?.trim() || null,
    })
    setSaving(false)
    if (result.ok) toast.success('Perfil do técnico salvo — a IA já vai usar isso nas próximas matérias.')
    else toast.error('Não foi possível salvar. Tente de novo.')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2 shrink-0">
          <Link href={`/careers/${career.slug}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="font-bold text-lg leading-tight truncate">Técnico</h1>
          <p className="text-sm text-muted-foreground truncate">
            {career.managerName} · {career.clubName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
          <CardDescription>
            {career.managerType === 'real'
              ? 'Técnico real — você pode trocar a foto encontrada automaticamente por uma sua, se preferir.'
              : 'Técnico fictício — envie ou troque a foto de referência usada nas imagens geradas.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
            {career.managerPhotoUrl ? (
              <img src={career.managerPhotoUrl} alt={career.managerName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
            {photoUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{career.managerName}</p>
              <Badge variant={career.managerType === 'real' ? 'default' : 'secondary'}>
                {career.managerType === 'real' ? 'Real' : 'Fictício'}
              </Badge>
            </div>
            <label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoFile(file)
                  e.target.value = ''
                }}
              />
              <span className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors">
                <Camera className="w-3.5 h-3.5" />
                {career.managerPhotoUrl ? 'Trocar foto' : 'Enviar foto'}
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil pessoal</CardTitle>
          <CardDescription>
            Tudo opcional — quanto mais você contar, mais rica fica a voz do técnico nas matérias. A IA usa isso como
            contexto real, nunca como enfeite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="playingStyle">Estilo de jogo</Label>
            <Textarea
              id="playingStyle"
              rows={2}
              placeholder="Ex: posse de bola curta, pressão alta, prioriza reconstruir jogadas pelo lado direito"
              value={playingStyle ?? ''}
              onChange={(e) => setPlayingStyle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferredFormation">Formação preferida</Label>
            <Textarea
              id="preferredFormation"
              rows={1}
              placeholder="Ex: 4-3-3 com os pontas invertidos"
              value={preferredFormation ?? ''}
              onChange={(e) => setPreferredFormation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personalTastes">Gostos pessoais</Label>
            <Textarea
              id="personalTastes"
              rows={2}
              placeholder="Ex: gosta de citar frases de outros técnicos, fã declarado de um clube diferente, sempre elogia a categoria de base"
              value={personalTastes ?? ''}
              onChange={(e) => setPersonalTastes(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="careerMilestones">Marcos importantes na carreira</Label>
            <Textarea
              id="careerMilestones"
              rows={2}
              placeholder="Ex: já foi campeão nacional em outro clube, veio de uma demissão polêmica, é a primeira experiência no exterior"
              value={careerMilestones ?? ''}
              onChange={(e) => setCareerMilestones(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full gap-2">
        <Link href={`/careers/${career.slug}`}>
          <Trophy className="w-4 h-4" /> Voltar para a carreira
        </Link>
      </Button>
    </div>
  )
}
