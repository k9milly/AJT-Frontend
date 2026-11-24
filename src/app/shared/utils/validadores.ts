import { AbstractControl, ValidationErrors } from '@angular/forms';

// substitui Validators.required em campos de texto: recusa tambem strings compostas so por espacos ("   "),
// devolvendo o mesmo erro { required: true } pra manter os templates simples
export function textoObrigatorio(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    return { required: true };
  }
  return null;
}

// exige numero inteiro >= 1 quando o campo esta preenchido (campos vazios ficam por conta do Validators.required)
export function inteiroPositivo(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? null : { inteiroPositivo: true };
}

// confere se um filtro de periodo tem data inicial posterior a data final (AAAA-MM-DD)
export function periodoInvalido(dataInicio: string | null | undefined, dataFim: string | null | undefined): boolean {
  return Boolean(dataInicio && dataFim && dataInicio > dataFim);
}
