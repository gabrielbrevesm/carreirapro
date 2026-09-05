const CONTACT_EXAMPLES = [
  {
    avatarUrl: '/characters/presidente.png',
    label: 'Presidente do Clube',
    time: '21:48',
    message: 'Vi a repercussão da virada por 6 a 4. Segue assim que a torcida enche o estádio de novo. 👏',
  },
  {
    avatarUrl: '/characters/diretor_esportivo.png',
    label: 'Diretor Esportivo',
    time: '09:12',
    message: 'Aquele volante que rolou no mercado europeu apareceu nos meus radares de novo. Quer que eu puxe os números antes da janela fechar?',
  },
  {
    avatarUrl: '/characters/departamento_medico.png',
    label: 'Departamento Médico',
    time: '14:30',
    message: 'Exame de imagem do lateral saiu limpo. Libera pro treino de amanhã sem restrição nenhuma.',
  },
]

export function ContactsShowcase() {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-3">
      {CONTACT_EXAMPLES.map((c, i) => (
        <div
          key={c.label}
          className={`rounded-2xl border border-[#12151A]/10 bg-white p-4 shadow-md ${
            i === 1 ? '-rotate-1' : i === 2 ? 'rotate-1' : 'rotate-0'
          } transition-transform duration-300 hover:rotate-0`}
        >
          <div className="flex items-center gap-2.5">
            <img src={c.avatarUrl} alt={c.label} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.label}</p>
            </div>
            <span className="shrink-0 text-[11px] text-[#12151A]/40">{c.time}</span>
          </div>
          <div className="mt-3 rounded-2xl rounded-tl-sm bg-[#F4F5F2] px-3.5 py-3">
            <p className="text-sm leading-relaxed text-[#12151A]/80">{c.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
