import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordPage } from './ForgotPasswordPage'

const mocks = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => mocks }))

function renderPage() {
  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mocks.requestPasswordReset.mockReset().mockResolvedValue(undefined)
  })

  it('pide el correo', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(screen.getByText('Escribe tu correo.')).toBeInTheDocument()
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled()
  })

  it('envía el enlace y muestra la confirmación neutra', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Correo'), '  moto@correo.com  ')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith('moto@correo.com')
    expect(await screen.findByText(/te enviamos un enlace para restablecer la contraseña/i)).toBeInTheDocument()
  })
})
