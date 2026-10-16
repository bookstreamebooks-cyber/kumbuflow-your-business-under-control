import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

export const EXPENSE_CATEGORIES = ['Renda', 'Salários', 'Transporte', 'Energia e água', 'Comunicações', 'Impostos', 'Manutenção', 'Outros'] as const

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['amount', 'date', 'category', 'notes'],
  properties: {
    amount: { type: ['number', 'null'], description: 'Montante em Kz' },
    date: { type: ['string', 'null'], description: 'Data AAAA-MM-DD' },
    category: { type: 'string', enum: [...EXPENSE_CATEGORIES] },
    notes: { type: 'string', description: 'Descrição curta em português' },
  },
}

export const parseExpense = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().trim().min(3).max(500), today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY']
    if (!key) throw new Error('O assistente não está configurado.')
    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        stream: true,
        store: false,
        reasoning: { effort: 'low' },
        instructions: `Extrai uma despesa de um pequeno negócio em Angola. Hoje é ${data.today} (Africa/Luanda). Converte datas relativas ("ontem", "segunda") para AAAA-MM-DD. Montantes em Kz; "15 mil" = 15000. Se não houver montante ou data, usa null. Escolhe a categoria mais adequada.`,
        input: [{ role: 'user', content: data.text }],
        text: { format: { type: 'json_schema', name: 'expense', strict: true, schema } },
      }),
    })
    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error('Muitos pedidos ao assistente. Aguarda um momento e tenta de novo.')
      if (res.status === 402) throw new Error('Os créditos de IA esgotaram. Preenche o formulário manualmente.')
      throw new Error('O assistente não conseguiu interpretar a despesa.')
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = '', out = '', refused = false
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n'); buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const p = line.slice(5).trim(); if (!p || p === '[DONE]') continue
        try {
          const ev = JSON.parse(p)
          if (ev.type === 'response.output_text.delta') out += ev.delta
          if (ev.type === 'response.refusal.delta') refused = true
        } catch { /* partial */ }
      }
    }
    if (refused || !out) throw new Error('O assistente não conseguiu interpretar a despesa.')
    const r = JSON.parse(out) as { amount: number | null; date: string | null; category: string; notes: string }
    return { amount: r.amount && r.amount > 0 ? r.amount : null, date: r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null, category: r.category, notes: r.notes.slice(0, 1000) }
  })
