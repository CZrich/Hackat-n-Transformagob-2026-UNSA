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
      .number({ invalid_type_error: 'Ingrese un número de salario mínimo válido' })
      .positive('El salario mínimo debe ser mayor a cero'),
    salario_max: z
      .number({ invalid_type_error: 'Ingrese un número de salario máximo válido' })
      .positive('El salario máximo debe ser mayor a cero'),
    requisitos: z
      .string()
      .min(10, 'Describa al menos 10 caracteres sobre los requisitos')
      .max(1000, 'Los requisitos no pueden exceder 1000 caracteres'),
    competencias: z
      .array(z.string())
      .min(1, 'Debe registrar al menos 1 competencia técnica (tag)'),
    vacantes: z
      .number({ invalid_type_error: 'Ingrese un número de vacantes válido' })
      .int('Debe ser un número entero')
      .min(1, 'Debe haber al menos 1 vacante'),
    fecha_inicio: z.string().min(1, 'Ingrese la fecha de inicio de la convocatoria'),
    fecha_cierre: z.string().min(1, 'Ingrese la fecha de cierre de la convocatoria'),
    lugar: z.string().min(5, 'Ingrese el lugar de trabajo (mínimo 5 caracteres)'),
    funciones: z.string().min(10, 'Describa al menos 10 caracteres sobre las funciones principales'),
    informacion_adicional: z.string().optional(),
    horario: z.string().optional(),
  })
  .refine((data) => data.salario_max >= data.salario_min, {
    message: 'El salario máximo debe ser mayor o igual al salario mínimo',
    path: ['salario_max'],
  });

export type JobFormData = z.infer<typeof jobFormSchema>;

