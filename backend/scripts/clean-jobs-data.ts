import * as fs from 'fs';
import * as path from 'path';

// Interfaz del estándar al que queremos llegar
interface StandardJob {
  id: string;
  empresa: string;
  titulo_oferta: string;
  carreras_solicitadas: string;
  requisitos: string;
  funciones: string;
  beneficios: string;
  experiencia: string;
  lugar: string;
  horario: string;
  vacantes: number;
  contacto: string;
  raw_text: string; // Guardamos el texto por si se requiere revisión manual
}

function main() {
  const dataPath = path.join(__dirname, '../../raw-emails-extracted.json');
  console.log(`Leyendo datos crudos desde: ${dataPath}`);
  
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Total de correos iniciales: ${rawData.length}`);

  const cleanedJobs: StandardJob[] = [];
  let discardedCount = 0;

  for (const email of rawData) {
    const secciones = email.secciones || {};
    const keys = Object.keys(secciones);
    
    // Convertir todo a un solo texto para busquedas rápidas y validación
    const fullText = keys.map(k => `${k}\n${secciones[k]}`).join('\n');
    const upperText = fullText.toUpperCase();

    // 1. FILTRO DE CALIDAD (Descartar correos basura, charlas, spam)
    const isJobOffer = upperText.includes('REQUISITO') || upperText.includes('FUNCIONES') || upperText.includes('VACANTE') || upperText.includes('PERFIL');
    const isCharlaOrWebinar = upperText.includes('CHARLA INFORMATIVA') || upperText.includes('WEBINAR') || upperText.includes('TALLER GRATUITO');

    if (!isJobOffer || isCharlaOrWebinar) {
      discardedCount++;
      continue;
    }

    // Función de ayuda para buscar el mejor match de una lista de posibles nombres de sección
    const extractField = (possibleKeywords: string[]): string => {
      // Búsqueda directa en las llaves (keys)
      for (const kw of possibleKeywords) {
        const exactKey = keys.find(k => k.toUpperCase() === kw.toUpperCase());
        if (exactKey) return secciones[exactKey];
        
        const partialKey = keys.find(k => k.toUpperCase().includes(kw.toUpperCase()));
        if (partialKey) {
            // A veces el valor está dentro de la misma llave (ej: "EMPRESA: MI EMPRESA")
            const valInKey = partialKey.substring(partialKey.toUpperCase().indexOf(kw.toUpperCase()) + kw.length).replace(/^[:\s]+/, '').trim();
            const valInSection = secciones[partialKey]?.trim();
            if (valInKey && !valInSection) return valInKey;
            if (valInSection) return valInSection;
        }
      }
      return '';
    };

    // 2. EXTRACCIÓN INTELIGENTE DE CAMPOS

    // --- EMPRESA ---
    let empresa = extractField(['EMPRESA', 'RAZÓN SOCIAL', 'NOMBRE DE LA EMPRESA', 'ORGANIZACIÓN']);
    if (!empresa) {
        // Buscar patrón en texto crudo
        const match = upperText.match(/EMPRESA:\s*([^\n]+)/);
        if (match) empresa = match[1].trim();
    }

    // --- TÍTULO DE OFERTA ---
    // A veces está en el "Asunto" (metadatos)
    let titulo = email.metadatos?.asunto?.replace(/CONVOCATORIA LABORAL\s*-\s*/i, '').trim() || '';
    if (!titulo || titulo.length > 80 || titulo.toUpperCase().includes('CONVOCATORIA')) {
        let altTitulo = extractField(['TÍTULO DE LA OFERTA', 'PUESTO', 'CARGO', 'SE REQUIERE', 'SOLICITA']);
        if (altTitulo) titulo = altTitulo;
    }

    // --- CARRERAS ---
    let carreras = extractField(['CARRERA', 'ESPECIALIDADES', 'PROFESIÓN', 'DIRIGIDO A']);
    
    // --- REQUISITOS ---
    let requisitos = extractField(['REQUISITOS', 'PERFIL', 'CONOCIMIENTOS']);
    
    // --- FUNCIONES ---
    let funciones = extractField(['FUNCIONES', 'RESPONSABILIDADES', 'ACTIVIDADES']);
    
    // --- BENEFICIOS ---
    let beneficios = extractField(['BENEFICIOS', 'OFRECEMOS', 'CONDICIONES']);
    
    // --- EXPERIENCIA ---
    let experiencia = extractField(['EXPERIENCIA']);
    
    // --- LUGAR ---
    let lugar = extractField(['LUGAR', 'UBICACIÓN', 'SEDE', 'ZONA DE TRABAJO']);
    
    // --- HORARIO ---
    let horario = extractField(['HORARIO', 'JORNADA', 'TIEMPO']);
    
    // --- CONTACTO / CV ---
    let contacto = extractField(['CORREO', 'ENVIAR CV', 'CONTACTO', 'POSTULAR']);
    if (!contacto) {
        const mailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (mailMatch && !mailMatch[0].includes('udeeg')) {
            contacto = mailMatch[0];
        }
    }

    // --- VACANTES ---
    let vacantesText = extractField(['VACANTES', 'CANTIDAD']);
    let vacantes = 1;
    if (vacantesText) {
        const numMatch = vacantesText.match(/\d+/);
        if (numMatch) vacantes = parseInt(numMatch[0], 10);
    }

    // 3. SEGUNDO FILTRO DE CALIDAD (Validación estricta de estructura)
    // Si no pudimos encontrar ni Empresa, ni Título, ni Requisitos, es un correo irrecuperable de forma automatizada.
    if (!empresa && !titulo && !requisitos) {
        discardedCount++;
        continue;
    }

    // Limpieza final de campos
    const cleanStr = (s: string) => s ? s.replace(/\s+/g, ' ').trim() : 'No especificado';

    cleanedJobs.push({
      id: email.id,
      empresa: empresa || 'Empresa Confidencial',
      titulo_oferta: titulo || 'Oferta Laboral',
      carreras_solicitadas: cleanStr(carreras),
      requisitos: cleanStr(requisitos),
      funciones: cleanStr(funciones),
      beneficios: cleanStr(beneficios),
      experiencia: cleanStr(experiencia),
      lugar: cleanStr(lugar),
      horario: cleanStr(horario),
      vacantes: vacantes,
      contacto: cleanStr(contacto),
      raw_text: email.id // Opcional, o mantener parte del texto
    });
  }

  console.log(`\n--- RESULTADOS DE LA LIMPIEZA ---`);
  console.log(`Total analizados: ${rawData.length}`);
  console.log(`Correos útiles (estructurados): ${cleanedJobs.length}`);
  console.log(`Correos descartados (basura/sin formato): ${discardedCount}`);

  const outPath = path.join(__dirname, '../../cleaned-jobs.json');
  fs.writeFileSync(outPath, JSON.stringify(cleanedJobs, null, 2), 'utf-8');
  console.log(`\nDatos limpios y estandarizados guardados en: ${outPath}`);
}

main();
