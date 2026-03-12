import { ANATOMY_HIERARCHY } from '../data/anatomy_map.v2.js';

// Diccionario de morfologías primarias: entrada -> canónico
const PRIMARY_MORPHOLOGY_MAP = {
    "macula": "macula",
    "maculas": "macula",
    "papula": "papula",
    "papulas": "papula",
    "placa": "placa",
    "placas": "placa",
    "pustula": "pustula",
    "pustulas": "pustula",
    "nodulo": "nodulo",
    "nodulos": "nodulo",
    "costra": "costra",
    "costras": "costra",
    "ulcera": "ulcera",
    "ulceras": "ulcera",
    "eccema": "placa",
    "eczema": "placa",
    "áspera": "papula",
    "aspera": "papula",
    "lesion eritematosa": "placa"
};

// Diccionario de características de superficie: entrada -> canónico
const SURFACE_FEATURES_MAP = {
    "escamosa": "escamosa",
    "escamas": "escamosa",
    "con escamas": "escamosa",
    "descamativa": "descamativa",
    "fina descamacion": "descamativa",
    "descamacion": "descamativa",
    "eccema": "descamativa",
    "eczema": "descamativa",
    "costrosa": "costrosa",
    "con costras": "costrosa",
    "queratosica": "queratosica",
    "queratósica": "queratosica",
    "aspera": "queratosica",
    "áspera": "queratosica",
    "exudativa": "exudativa",
    "liquenificada": "liquenificada",
    "pustula": "pustulosa",
    "pustulas": "pustulosa",
    "pustulosa": "pustulosa"
};

// Diccionario de distribución: entrada -> canónico
const DISTRIBUTION_MAP = {
    "rostro": ["rostro", "fotoexpuesta"],
    "cara": ["rostro", "fotoexpuesta"],
    "facial": ["rostro", "fotoexpuesta"],
    "face": ["rostro", "fotoexpuesta"],
    "scalp": "cuero cabelludo",
    "cuero cabelludo": "cuero cabelludo",
    "trunk": "tronco",
    "tronco": "tronco",
    "upper limbs": "extremidades",
    "lower limbs": "extremidades",
    "genital area": "zona genital",
    "flexural": "flexural",
    "pliegue": "flexural",
    "pliegues": "flexural",
    "flexura": "flexural",
    "flexuras": "flexural",
    "fotoexpuesta": "fotoexpuesta",
    "fotoexpuestas": "fotoexpuesta",
    "zonas fotoexpuestas": "fotoexpuesta",
    "localizada": "localizada",
    "generalizada": "generalizada"
};

// Diccionarios legacy para compatibilidad
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
    "escamas": "fina descamacion"
};

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

const DURATION_MAP = {
    "agudo": "agudo",
    "cronico": "cronico",
    "crónico": "cronico",
    "recurrente": "recurrente",
    "semanas": "semanas",
    "meses": "meses"
};

/**
 * Normaliza una entrada clínica cruda a formato canónico v2, incluyendo la nueva ontología.
 * Soporta entradas singulares (UI legacy) y plurales (V2).
 * @param {Object} rawInput - Datos clínicos heterogéneos.
 * @returns {Object} - Objeto normalizado con campos extendidos.
 */
export function normalizeClinicalInputV2(rawInput) {
    /**
     * Convierte una entrada (string o array) en un array normalizado y único.
     */
    const normalizeToArray = (input, mapper) => {
        if (!input) return [];
        const list = Array.isArray(input) ? input : [input];
        return [...new Set(list.flatMap(item => {
            if (typeof item !== 'string') return [];
            const mapped = mapper[item.toLowerCase()];
            return mapped ? (Array.isArray(mapped) ? mapped : [mapped]) : [item];
        }))];
    };

    const normalizeValue = (val, mapper) => {
        if (!val || typeof val !== 'string') return "";
        return mapper[val.toLowerCase()] || val;
    };

    // Unificar fuentes de entrada (soporte para singular de la UI legacy y plural de v2)
    const morphology = rawInput.morphology || [];
    const surface = rawInput.surfaceFeatures || morphology;
    const location = rawInput.location || [];
    const distribution = rawInput.distribution || location;
    const specialContexts = rawInput.specialContexts || rawInput.specialContext || [];

    const normalized = {
        // --- Ontología v2 (Filtrado estricto a tokens conocidos) ---
        primaryMorphology: normalizeToArray(morphology, PRIMARY_MORPHOLOGY_MAP)
            .filter(term => PRIMARY_MORPHOLOGY_MAP[term.toLowerCase()]),
            
        surfaceFeatures: normalizeToArray(surface, SURFACE_FEATURES_MAP)
            .filter(term => SURFACE_FEATURES_MAP[term.toLowerCase()]),
            
        distribution: normalizeToArray(distribution, DISTRIBUTION_MAP)
            .filter(term => {
                const lower = term.toLowerCase();
                return DISTRIBUTION_MAP[lower] !== undefined || ANATOMY_HIERARCHY[lower] !== undefined;
            }),

        // --- Campos Legacy (Consistencia) ---
        morphology: normalizeToArray(morphology, MORPHOLOGY_MAP),
        location: normalizeToArray(location, LOCATION_MAP),
        symptoms: normalizeToArray(rawInput.symptoms, SYMPTOMS_MAP),
        duration: normalizeValue(rawInput.duration, DURATION_MAP),
        
        redFlags: Array.isArray(rawInput.redFlags) ? rawInput.redFlags : (rawInput.redFlags ? [rawInput.redFlags] : []),
        specialContexts: normalizeToArray(specialContexts, {}), // Solo normaliza a array sin mapping por ahora
        abcdeCount: typeof rawInput.abcdeCount === 'number' ? rawInput.abcdeCount : 0
    };

    return normalized;
}
