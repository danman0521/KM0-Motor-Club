import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommentForm } from './CommentForm'

describe('CommentForm', () => {
  it('no envía un comentario vacío o solo con espacios', async () => {
    const onSubmit = vi.fn()
    render(<CommentForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Tu comentario'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(screen.getByText('Escribe tu comentario.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía el texto recortado y limpia la caja', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CommentForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Tu comentario'), '  Gran rodada  ')
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(onSubmit).toHaveBeenCalledWith('Gran rodada')
    expect(screen.getByLabelText('Tu comentario')).toHaveValue('')
  })

  it('si falla muestra el error y conserva lo escrito', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    render(<CommentForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Tu comentario'), 'Gran rodada')
    await userEvent.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar')
    expect(screen.getByLabelText('Tu comentario')).toHaveValue('Gran rodada')
  })
})
