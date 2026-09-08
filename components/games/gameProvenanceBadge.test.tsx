import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import GameProvenanceBadge from './gameProvenanceBadge'

afterEach(cleanup)

describe('GameProvenanceBadge', () => {
  it('masque les provenances qui ne peuvent pas être déterminées', () => {
    const { container } = render(<GameProvenanceBadge provenance="unverified" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('signale clairement un contenu communautaire', () => {
    render(<GameProvenanceBadge provenance="community" />)

    expect(screen.getByText('Contenu communautaire')).toBeInTheDocument()
  })
})
