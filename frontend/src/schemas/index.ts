import { z } from 'zod';
import { ALLOWED_DOMAIN } from '../config';
import { CARRERAS } from '../config';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Ingrese un correo electrónico válido')
    .refine(
      (email) => email.endsWith(ALLOWED_DOMAIN) || email.endsWith('@gmail.com'),
      { message: `El correo debe terminar en ${ALLOWED_DOMAIN} o ser @gmail.com` }
    ),
});

export const jobFormSchema = z
  .object({
    ruc: z
      .string()
      .length(11, 'El RUC debe tener exactamente 11 dígitos')
      .regex(/^\d+$/, 'El RUC debe contener solo números'),
    title: z
      .string()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(200, 'El título no puede exceder 200 caracteres'),
    description: z.string().max(2000, 'La descripción no puede exceder 2000 caracteres').optional(),
    carrera_destino: z.enum(CARRERAS as unknown as [string, ...string[]], {
      errorMap: () => ({ message: 'Seleccione una carrera destino válida' }),
    }),
    salario_min: z
      .number({ invalid_type_error: 'Ingrese un número válido' })
      .positive('El salario mínimo debe ser positivo'),
    salario_max: z
      .number({ invalid_type_error: 'Ingrese un número válido' })
      .positive('El salario máximo debe ser positivo'),
    requisitos: z
      .string()
      .min(10, 'Describa al menos 10 caracteres sobre los requisitos')
      .max(1000, 'Los requisitos no pueden exceder 1000 caracteres'),
  })
  .refine((data) => data.salario_max >= data.salario_min, {
    message: 'El salario máximo debe ser mayor o igual al salario mínimo',
    path: ['salario_max'],
  });

export type JobFormData = z.infer<typeof jobFormSchema>;
