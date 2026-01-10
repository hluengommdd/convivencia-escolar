// Chile (Biobío) — Calendario 2026: feriados legales + recesos escolares (REX 2159 Biobío)
// TZ recomendada para la app: America/Santiago

type Regime = "semestral" | "trimestral";

type NonBusinessReason =
  | "weekend"
  | "legal_holiday_cl"
  | "school_break_biobio";

export type NonBusinessDay = {
  date: string; // YYYY-MM-DD
  reason: NonBusinessReason;
  name?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(ymd: string): Date {
  // Interpreta como fecha local (la app debiera correr en America/Santiago).
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function inRangeInclusive(d: Date, startYMD: string, endYMD: string): boolean {
  const start = parseYMD(startYMD);
  const end = parseYMD(endYMD);
  // normaliza horas
  const dn = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const sn = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const en = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return dn >= sn && dn <= en;
}

/**
 * Computa Domingo de Pascua (calendario gregoriano) — algoritmo estándar.
 * Para 2026 da 2026-04-05.
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Mar, 4=Abr
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Feriados legales de Chile 2026 (lista base).
 * Nota: algunos feriados pueden depender de normativa especial (p. ej. elecciones) o reglas específicas.
 * Ajusta si tu establecimiento requiere algo adicional.
 */
export function legalHolidaysCL2026(): Map<string, string> {
  const year = 2026;
  const easter = easterSunday(year); // 2026-04-05
  const goodFriday = addDays(easter, -2); // 2026-04-03
  const holySaturday = addDays(easter, -1); // 2026-04-04

  const holidays: Array<{ ymd: string; name: string }> = [
    { ymd: "2026-01-01", name: "Año Nuevo" },

    { ymd: toYMD(goodFriday), name: "Viernes Santo" },
    { ymd: toYMD(holySaturday), name: "Sábado Santo" },

    { ymd: "2026-05-01", name: "Día del Trabajo" },
    { ymd: "2026-05-21", name: "Día de las Glorias Navales" },

    // Algunos feriados religiosos/cívicos comunes:
    { ymd: "2026-06-29", name: "San Pedro y San Pablo" },
    { ymd: "2026-07-16", name: "Virgen del Carmen" },
    { ymd: "2026-08-15", name: "Asunción de la Virgen" },

    // Fiestas Patrias:
    { ymd: "2026-09-18", name: "Independencia Nacional" },
    { ymd: "2026-09-19", name: "Glorias del Ejército" },

    { ymd: "2026-10-12", name: "Encuentro de Dos Mundos" },
    { ymd: "2026-10-31", name: "Día Nacional de las Iglesias Evangélicas y Protestantes" },
    { ymd: "2026-11-01", name: "Día de Todos los Santos" },

    { ymd: "2026-12-08", name: "Inmaculada Concepción" },
    { ymd: "2026-12-25", name: "Navidad" },

    // ⚠️ Posibles adicionales según ley/vigencia (ej.: Día Nacional de los Pueblos Indígenas, elecciones)
    // Añádelos aquí si tu política institucional los considera.
  ];

  return new Map(holidays.map((h) => [h.ymd, h.name]));
}

/**
 * Recesos / días libres del Calendario Escolar Regional 2026 Biobío (REX 2159).
 * - Régimen semestral: Vacaciones de invierno 22-jun a 03-jul 2026
 * - Régimen trimestral: Receso 14-sep a 18-sep 2026
 */
export function schoolBreaksBiobio2026(regime: Regime): Array<{ start: string; end: string; name: string }> {
  if (regime === "semestral") {
    return [
      { start: "2026-06-22", end: "2026-07-03", name: "Vacaciones de Invierno (Biobío) - Régimen Semestral" },
    ];
  }
  return [
    { start: "2026-09-14", end: "2026-09-18", name: "Receso (Biobío) - Régimen Trimestral" },
  ];
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay(); // 0 domingo ... 6 sábado
  return day === 0 || day === 6;
}

export function isHolidayCL2026(d: Date): { isHoliday: boolean; name?: string } {
  const ymd = toYMD(d);
  const map = legalHolidaysCL2026();
  const name = map.get(ymd);
  return name ? { isHoliday: true, name } : { isHoliday: false };
}

export function isSchoolBreakBiobio2026(d: Date, regime: Regime): { isBreak: boolean; name?: string } {
  const breaks = schoolBreaksBiobio2026(regime);
  for (const b of breaks) {
    if (inRangeInclusive(d, b.start, b.end)) return { isBreak: true, name: b.name };
  }
  return { isBreak: false };
}

/**
 * "Día hábil" estándar (Chile + calendario escolar Biobío):
 * - Excluye fines de semana
 * - Excluye feriados legales (Chile)
 * - Excluye recesos escolares (Biobío) según régimen
 */
export function isBusinessDayCLBiobio2026(d: Date, regime: Regime): boolean {
  if (isWeekend(d)) return false;
  if (isHolidayCL2026(d).isHoliday) return false;
  if (isSchoolBreakBiobio2026(d, regime).isBreak) return false;
  return true;
}

/**
 * Lista no-hábiles (útil para poblar una tabla "holidays" o para debugging).
 * Genera por rango de fechas.
 */
export function listNonBusinessDays(params: {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  regime: Regime;
}): NonBusinessDay[] {
  const { start, end, regime } = params;
  const out: NonBusinessDay[] = [];
  let cur = parseYMD(start);
  const endD = parseYMD(end);

  while (cur.getTime() <= endD.getTime()) {
    const ymd = toYMD(cur);

    if (isWeekend(cur)) {
      out.push({ date: ymd, reason: "weekend" });
    } else {
      const h = isHolidayCL2026(cur);
      if (h.isHoliday) out.push({ date: ymd, reason: "legal_holiday_cl", name: h.name });

      const b = isSchoolBreakBiobio2026(cur, regime);
      if (b.isBreak) out.push({ date: ymd, reason: "school_break_biobio", name: b.name });
    }

    cur = addDays(cur, 1);
  }
  return out;
}
