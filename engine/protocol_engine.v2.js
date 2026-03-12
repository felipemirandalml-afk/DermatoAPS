/**
 * PROTOCOL ENGINE V2 - Motor de Decisión Clínica Estructurado
 * Este motor procesa protocolos v2 y genera sugerencias basadas en lógica semiológica.
 * Versión: 2.1.0
 * Fecha: 2026-03-11
 */

import { PROTOCOLS_V2 } from '../data/protocols.v2.js';
import { normalizeClinicalInputV2 } from '../utils/clinical_input_mapper.v2.js';
import { getAnatomyAncestors } from '../data/anatomy_map.v2.js';

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
 * Prioriza la nueva ontología (primaryMorphology, surfaceFeatures, distribution) si está presente.
 * @param {Object} protocol - Protocolo v2.
 * @param {Object} input - Entrada clínica del usuario (ya normalizada).
 */
export function matchesRequiredCriteria(protocol, input) {
    const req = protocol.match.required;
    
    // Verificamos si el protocolo ya usa la nueva ontología extendida
    const hasExtendedOntology = req.primaryMorphology || req.surfaceFeatures || req.distribution;

    if (hasExtendedOntology) {
        // 1. Validación de Morfología Primaria
        if (req.primaryMorphology && req.primaryMorphology.length > 0) {
            if (!req.primaryMorphology.some(val => input.primaryMorphology.includes(val))) return false;
        }
        
        // 2. Validación de Características de Superficie
        if (req.surfaceFeatures && req.surfaceFeatures.length > 0) {
            if (!req.surfaceFeatures.some(val => input.surfaceFeatures.includes(val))) return false;
        }
        
        // 3. Validación de Distribución (Con soporte para Jerarquía Anatómica)
        if (req.distribution && req.distribution.length > 0) {
            // Expandimos las localizaciones del input usando el Mapa Anatómico Jerárquico
            const expandedDistribution = [...new Set(input.distribution.flatMap(d => getAnatomyAncestors(d)))];
            if (!req.distribution.some(val => expandedDistribution.includes(val))) return false;
        }
        
        return true;
    }

    // Fallback: Lógica legacy para protocolos no migrados
    const hasMorphology = !req.morphology || req.morphology.length === 0 || 
        req.morphology.some(m => input.morphology.includes(m));

    // Expandimos también para el modo legacy por robustez
    const expandedLegacyLocation = [...new Set(input.location.flatMap(l => getAnatomyAncestors(l)))];
    const hasLocation = !req.location || req.location.length === 0 || 
        req.location.some(l => expandedLegacyLocation.includes(l));

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
 * @param {Object} protocol - Protocolo v2.
 * @param {Object} input - Entrada clínica normalizada.
 */
export function buildProtocolExplanation(protocol, input) {
    const parts = [];
    const req = protocol.match.required;
    const hasExtendedOntology = req.primaryMorphology || req.surfaceFeatures || req.distribution;

    if (hasExtendedOntology) {
        parts.push("Coincidencia clínica de alta precisión (Ontología v2).");
    } else {
        parts.push("Coincide en morfología y localización (Modo compatibilidad).");
    }

    const score = computeSupportiveScore(protocol, input);
    if (score > 0) {
        parts.push(`Suma ${score} punto(s) de evidencia adicional.`);
    }

    if (hasExclusion(protocol, input)) {
        parts.push("¡Exclusión detectada!");
    } else {
        parts.push("Sin exclusiones clínicas activas.");
    }

    return parts.join(" ");
}

/**
 * Función principal que ejecuta el análisis v2.
 * @param {Object} clinicalInput - Datos clínicos capturados (pueden ser heterogéneos).
 */
export function runProtocolEngineV2(clinicalInput) {
    // 1. Normalizar entrada clínica (Capa de robustez v2)
    const input = normalizeClinicalInputV2(clinicalInput);

    // 2. Validar catálogo de protocolos
    const validProtocols = PROTOCOLS_V2.filter(p => validateProtocolV2Shape(p).isValid);

    // 3. Procesar y filtrar con lógica prioritaria
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
        .filter(res => res !== null) 
        .sort((a, b) => b.supportiveScore - a.supportiveScore); 

    return results;
}
