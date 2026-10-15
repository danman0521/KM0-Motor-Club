import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordPage } from './ResetPasswordPage'

const mocks = vi.hoisted(() => ({ updatePassword: vi.fn(), exitRecovery: vi.fn() }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => mocks }))

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    mocks.updatePassword.mockReset().mockResolvedValue(undefined)
    mocks.exitRecovery.mockReset()
  })

  it('exige al menos 6 caracteres', async () => {
    render(<ResetPasswordPage />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), '123')
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(screen.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument()
    expect(mocks.updatePassword).not.toHaveBeenCalled()
  })

  it('exige que las dos contraseñas coincidan', async () => {
    render(<ResetPasswordPage />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'secreta1')
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'secreta2')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(mocks.updatePassword).not.toHaveBeenCalled()
  })

  it('guarda la contraseña y muestra el éxito', async () => {
    render(<ResetPasswordPage />)
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'secreta1')
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'secreta1')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(mocks.updatePassword).toHaveBeenCalledWith('secreta1')
    expect(await screen.findByText('Tu contraseña se actualizó. Ya puedes seguir usando tu cuenta.')).toBeInTheDocument()
  })
})
