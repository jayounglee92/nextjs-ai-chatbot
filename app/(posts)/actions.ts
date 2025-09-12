'use server'

import { generateText } from 'ai'
import { myProvider } from '@/lib/ai/providers'

export async function generateAISummary({
  content,
}: {
  content: string
}) {
  const { text: summary } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
      - 주어진 내용을 200자이상 500자 이상 최소 3문장으로 요약하세요
      - 내용의 핵심을 간결하고 명확하게 전달하세요
      - 자연스러운 한국어로 작성하세요
      - 불필요한 수식어나 반복을 피하세요
      - '다'로 끝나는 완전한 문장으로 마무리하세요
      `,
    prompt: content,
  })

  return summary
}
