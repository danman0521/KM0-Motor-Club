import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'

const signUp = vi.fn()
const resendConfirmation = vi.fn()

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({ session: null, loading: false, signUp, resendConfirmation }),
}))

function renderPage() {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  // Con llaves: si beforeEach devuelve una función, Vitest la ejecuta como limpieza
  beforeEach(() => {
    signUp.mockReset()
  })

  it('valida los campos obligatorios antes de enviar', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Escribe tu nombre completo.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu correo.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña debe tener al menos 6 caracteres.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('rechaza un correo con formato inválido', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
    await userEvent.type(screen.getByLabelText('Correo'), 'no-es-correo')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta1')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('El correo no es válido.')).toBeInTheDocument()
    expect(signUp).not.toHaveBeenCalled()
  })

  it('registra con los datos recortados', async () => {
    signUp.mockResolvedValue({ needsConfirmation: false })
    renderPage()

    await userEvent.type(screen.getByLabelText('Nombre completo'), ' Ana Pérez ')
    await userEvent.type(screen.getByLabelText('Apodo (opcional)'), 'La Loba')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@ejemplo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta1')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(signUp).toHaveBeenCalledWith({
      email: 'ana@ejemplo.com',
      password: 'secreta1',
      fullName: 'Ana Pérez',
      nickname: 'La Loba',
    })
  })

  it('si hay que confirmar el correo, muestra esa pantalla y permite reenviar', async () => {
    signUp.mockResolvedValue({ needsConfirmation: true })
    resendConfirmation.mockResolvedValue(undefined)
    renderPage()

    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@ejemplo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta1')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Revisa tu correo')).toBeInTheDocument()
    expect(screen.getByText('ana@ejemplo.com')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre completo')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reenviar correo' }))
    expect(resendConfirmation).toHaveBeenCalledWith('ana@ejemplo.com')
    expect(await screen.findByRole('button', { name: 'Correo reenviado' })).toBeDisabled()
  })

  it('muestra un mensaje claro si el correo ya está registrado', async () => {
    signUp.mockRejectedValue(new Error('User already registered'))
    renderPage()

    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Pérez')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@ejemplo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta1')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una cuenta con ese correo.')
  })
})
