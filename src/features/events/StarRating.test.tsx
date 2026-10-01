import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('muestra cinco estrellas y marca la calificación actual', () => {
    render(<StarRating value={3} onChange={vi.fn()} />)

    const stars = screen.getAllByRole('radio')
    expect(stars).toHaveLength(5)
    expect(screen.getByRole('radio', { name: '3 estrellas' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '4 estrellas' })).not.toBeChecked()
  })

  it('sin calificación no marca ninguna', () => {
    render(<StarRating value={null} onChange={vi.fn()} />)
    for (const star of screen.getAllByRole('radio')) expect(star).not.toBeChecked()
  })

  it('avisa la estrella elegida', async () => {
    const onChange = vi.fn()
    render(<StarRating value={null} onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: '4 estrellas' }))
    await userEvent.click(screen.getByRole('radio', { name: '1 estrella' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 4)
    expect(onChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('deshabilitado no avisa', async () => {
    const onChange = vi.fn()
    render(<StarRating value={2} onChange={onChange} disabled />)

    await userEvent.click(screen.getByRole('radio', { name: '5 estrellas' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
