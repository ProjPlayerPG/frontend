import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GlossaryDefinition from '@/components/glossary/glossaryDefinition'

describe('GlossaryDefinition', () => {
  afterEach(cleanup)

  it('préserve les sauts de ligne simples et sépare les paragraphes', () => {
    const { container } = render(
      <GlossaryDefinition text={'Introduction\n- Premier point\n- Deuxième point\n\nConclusion'} />,
    )
    const paragraphs = container.querySelectorAll('p')

    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toHaveClass('whitespace-pre-line')
    expect(paragraphs[0].textContent).toBe('Introduction\n- Premier point\n- Deuxième point')
    expect(paragraphs[1]).toHaveTextContent('Conclusion')
  })

  it('reconnaît également les paragraphes saisis avec des retours Windows', () => {
    const { container } = render(
      <GlossaryDefinition text={'Premier paragraphe\r\n\r\nSecond paragraphe'} />,
    )

    expect(container.querySelectorAll('p')).toHaveLength(2)
  })
})
