import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  color: string
}

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    amber: 'border-amber-500/25 text-amber-300',
    sky: 'border-sky-500/25 text-sky-300',
    emerald: 'border-emerald-500/25 text-emerald-300',
    red: 'border-red-500/25 text-red-300',
    zinc: 'border-zinc-700 text-zinc-300'
  }
  const iconBgMap: Record<string, string> = {
    amber: 'bg-amber-500/10',
    sky: 'bg-sky-500/10',
    emerald: 'bg-emerald-500/10',
    red: 'bg-red-500/10',
    zinc: 'bg-zinc-800'
  }

  return (
    <div
      className={`rounded-2xl border bg-[#121212] p-4 ${colorMap[color] ?? ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            iconBgMap[color] ?? ''
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
