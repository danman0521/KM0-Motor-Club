import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('une filas con ; y renglones con CRLF', () => {
    expect(toCsv([['a', 'b'], ['1', '2']])).toBe('a;b\r\n1;2')
  })

  it('entrecomilla los campos con el separador', () => {
    expect(toCsv([['Rodada; nocturna', 'ok']])).toBe('"Rodada; nocturna";ok')
  })

  it('duplica las comillas internas y entrecomilla', () => {
    expect(toCsv([['dijo "hola"', 'x']])).toBe('"dijo ""hola""";x')
  })

  it('entrecomilla los campos con saltos de línea', () => {
    expect(toCsv([['línea1\nlínea2', 'x']])).toBe('"línea1\nlínea2";x')
  })

  it('deja los campos simples sin comillas', () => {
    expect(toCsv([['Medellín', 'Piloto']])).toBe('Medellín;Piloto')
  })
})
