/**
 * PROTOCOL ENGINE V2 - Motor de Decisión Clínica Estructurado
 * Este motor procesa protocolos v2 y genera sugerencias basadas en lógica semiológica.
 * Versión: 2.0.0
 * Fecha: 2026-03-10
 */

import { PROTOCOLS_V2 } from '../data/protocols.v2.js';

/**
 * Valida que un protocolo tenga la estructura mínima requerida para el motor v2.
 * @param {Object} protocol - El objeto de protocolo a validar.
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateProtocolV2Shape(protocol) {
    const errors = [];
    const requiredFields = ['id', 'label', 'category', 'triage', 'match', 'apsManagement'];

    requiredFields.forEach(field => {
        if (!protocol[field]) errors.push(`Campo ausente: ${field}`);
    });

    if (protocol.match) {
        if (!protocol.match.required) errors.push('Falta match.required');
        if (!protocol.match.supportive) errors.push('Falta match.supportive');
        if (!protocol.match.exclusions) errors.push('Falta match.exclusions');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida una lista completa de protocolos.
 * @param {Array} protocols - Lista de protocolos.
 */
export function validateProtocolsV2(protocols) {
    return protocols.map(p => ({
        id: p.id,
        ...validateProtocolV2Shape(p)
    }));
}

/**
 * Evalúa si la entrada clínica cumple con los criterios mínimos obligatorios (REQUIRED).
 * @param {Object} protocol - Protocolo v2.
 * @param {Object} input - Entrada clínica del usuario.
 */
export function matchesRequiredCriteria(protocol, input) {
    const req = protocol.match.required;
    
    // Validar morfología (debe coincidir al menos una si el protocolo la exige)
    const hasMorphology = req.morphology.length === 0 || 
        req.morphology.some(m => input.morphology.includes(m));

    // Validar localización (debe coincidir al menos una si el protocolo la exige)
    const hasLocation = req.location.length === 0 || 
        req.location.some(l => input.location.includes(l));

    return hasMorphology && hasLocation;
}

/**
 * Verifica si existen criterios de exclusión activos.
 * @param {Object} protocol - Protocolo v2.
 * @param {Object} input - Entrada clínica del usuario.
 */
export function hasExclusion(protocol, input) {
    const exclusions = protocol.match.exclusions || [];

    for (const exc of exclusions) {
        // Exclusión por Red Flags o Síntomas específicos
        if (input.redFlags.includes(exc) || input.symptoms.includes(exc)) return true;

        // Regla especial: abcde_2_or_more
        if (exc === "abcde_2_or_more" && (input.abcdeCount || 0) >= 2) return true;
        
        // Regla especial: systemic_symptoms
        if (exc === "systemic_symptoms" && input.redFlags.includes("fever")) return true;
    }

    return false;
}

/**
 * Calcula un puntaje de apoyo basado en criterios no obligatorios pero sugerentes.
 * @param {Object} protocol - Protocolo v2.
 * @param {Object} input - Entrada clínica del usuario.
 */
export function computeSupportiveScore(protocol, input) {
    let score = 0;
    const supportive = protocol.match.supportive;

    // Coincidencia de síntomas
    if (supportive.symptoms) {
        supportive.symptoms.forEach(s => {
            if (input.symptoms.includes(s)) score += 1;
        });
    }

    // Coincidencia de duración
    if (supportive.duration && supportive.duration.includes(input.duration)) {
        score += 1;
    }

    return score;
}

/**
 * Genera una explicación textual del por qué se seleccionó el protocolo.
 */
export function buildProtocolExplanation(protocol, input) {
    const parts = [];
    
    if (matchesRequiredCriteria(protocol, input)) {
        parts.push("Coincide en morfología y localización requerida.");
    }

    const score = computeSupportiveScore(protocol, input);
    if (score > 0) {
        parts.push(`Suma ${score} punto(s) de apoyo por síntomas o duración compatible.`);
    }

    if (!hasExclusion(protocol, input)) {
        parts.push("Sin exclusiones clínicas activas.");
    }

    return parts.join(" ");
}

/**
 * Función principal que ejecuta el análisis v2.
 * @param {Object} clinicalInput - Datos clínicos capturados.
 */
export function runProtocolEngineV2(clinicalInput) {
    // Normalizar entrada con valores por defecto
    const input = {
        morphology: [],
        location: [],
        symptoms: [],
        duration: "",
        redFlags: [],
        specialContexts: [],
        abcdeCount: 0,
        ...clinicalInput
    };

    // 1. Validar catálogo de protocolos
    const validProtocols = PROTOCOLS_V2.filter(p => validateProtocolV2Shape(p).isValid);

    // 2. Procesar y filtrar
    const results = validProtocols
        .map(protocol => {
            const isMatch = matchesRequiredCriteria(protocol, input);
            const isExcluded = hasExclusion(protocol, input);

            if (!isMatch || isExcluded) return null;

            const score = computeSupportiveScore(protocol, input);

            return {
                protocolId: protocol.id,
                label: protocol.label,
                category: protocol.category,
                matched: true,
                supportiveScore: score,
                triage: protocol.triage.default,
                explanation: buildProtocolExplanation(protocol, input)
            };
        })
        .filter(res => res !== null) // Eliminar los que no hicieron match o fueron excluidos
        .sort((a, b) => b.supportiveScore - a.supportiveScore); // Ordenar por score

    return results;
}

/* 
// EJEMPLO DE USO MANUAL (NO INVASIVO):
const testCase = {
    morphology: ["papulas", "pustulas"],
    location: ["rostro"],
    symptoms: ["seborrea"],
    duration: "cronico"
};
const results = runProtocolEngineV2(testCase);
console.log("Resultados Motor V2:", results);
*/
