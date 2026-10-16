/** Escapa un campo: lo entrecomilla si contiene el separador, comillas o saltos de línea. */
function escapeField(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes(delimiter) || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convierte filas (la primera es la cabecera) en texto CSV. Usa `;` como
 * separador para que Excel en español lo abra en columnas directamente.
 */
export function toCsv(rows: string[][], delimiter = ';'): string {
  return rows.map((row) => row.map((cell) => escapeField(cell ?? '', delimiter)).join(delimiter)).join('\r\n')
}

/** Descarga el CSV en el navegador, con BOM para que Excel lea bien los acentos. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
