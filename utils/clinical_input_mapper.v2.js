/**
 * CLINICAL INPUT MAPPER V2 - Capa de Normalización Clínica
 * Normaliza entradas crudas (español, plurales, sinónimos) a vocabulario canónico v2.
 * Versión: 2.0.0
 * Fecha: 2026-03-10
 */

// Diccionario de morfologías: entrada -> canónico
const MORPHOLOGY_MAP = {
    "papula": "papulas",
    "papulas": "papulas",
    "pustula": "pustulas",
    "pustulas": "pustulas",
    "comedon": "comedones",
    "comedones": "comedones",
    "eczema": "eczema",
    "eccema": "eczema",
    "placa": "placas eritematosas",
    "placas": "placas eritematosas",
    "eritema": "placas eritematosas",
    "xerosis": "xerosis",
    "macula": "maculas hipopigmentadas",
    "maculas": "maculas hipopigmentadas",
    "hipopigmentada": "maculas hipopigmentadas",
    "hipopigmentadas": "maculas hipopigmentadas",
    "hiperpigmentada": "maculas hiperpigmentadas",
    "hiperpigmentadas": "maculas hiperpigmentadas",
    "descamacion": "fina descamacion",
    "escama": "fina descamacion",
    "escamas": "fina descamacion",
    "escama gruesa": "escama blanquecina gruesa"
};

// Diccionario de localizaciones: entrada -> canónico
const LOCATION_MAP = {
    "cara": "rostro",
    "facial": "rostro",
    "rostro": "rostro",
    "flexuras": "flexuras",
    "pliegues": "flexuras",
    "tronco": "tronco",
    "hombros": "hombros",
    "cuello": "cuello",
    "fotoexpuesto": "zonas fotoexpuestas",
    "fotoexpuestas": "zonas fotoexpuestas",
    "manos": "dorso manos",
    "dorso manos": "dorso manos",
    "codo": "codos",
    "codos": "codos",
    "rodilla": "rodillas",
    "rodillas": "rodillas",
    "cuero cabelludo": "cuero cabelludo"
};

// Diccionario de síntomas: entrada -> canónico
const SYMPTOMS_MAP = {
    "picazon": "prurito intenso",
    "prurito": "prurito intenso",
    "pica": "prurito intenso",
    "leve prurito": "leve prurito",
    "prurito ocasional": "prurito ocasional",
    "dolor": "dolor al roce",
    "ardor": "dolor al roce",
    "seborrea": "seborrea"
};

// Diccionario de duración: entrada -> canónico
const DURATION_MAP = {
    "agudo": "agudo",
    "cronico": "cronico",
    "crónico": "cronico",
    "recurrente": "recurrente",
    "semanas": "semanas",
    "meses": "meses"
};

/**
 * Normaliza una entrada clínica cruda a formato canónico v2.
 * @param {Object} rawInput - Datos clínicos heterogéneos.
 * @returns {Object} - Objeto normalizado.
 */
export function normalizeClinicalInputV2(rawInput) {
    const normalizeList = (list, mapper) => {
        if (!Array.isArray(list)) return [];
        return [...new Set(list.map(item => mapper[item.toLowerCase()] || item))];
    };

    const normalizeValue = (val, mapper) => {
        if (!val) return "";
        return mapper[val.toLowerCase()] || val;
    };

    return {
        morphology: normalizeList(rawInput.morphology, MORPHOLOGY_MAP),
        location: normalizeList(rawInput.location, LOCATION_MAP),
        symptoms: normalizeList(rawInput.symptoms, SYMPTOMS_MAP),
        duration: normalizeValue(rawInput.duration, DURATION_MAP),
        redFlags: Array.isArray(rawInput.redFlags) ? rawInput.redFlags : [],
        specialContexts: Array.isArray(rawInput.specialContexts) ? rawInput.specialContexts : [],
        abcdeCount: typeof rawInput.abcdeCount === 'number' ? rawInput.abcdeCount : 0
    };
}
