/**
 * ENGINE V2 BRIDGE
 * Actúa como puente entre la UI legacy y el nuevo motor clínico v2.
 * Expone runPreviewAnalysisV2 al ámbito global.
 */

import { runProtocolEngineV2 } from '../engine/protocol_engine.v2.js';
import { normalizeClinicalInputV2 } from '../utils/clinical_input_mapper.v2.js';
import { getAnatomyAncestors } from '../data/anatomy_map.v2.js';

// Exponer utilidades para la UI legacy
window.getAnatomyAncestors = getAnatomyAncestors;

/**
 * Ejecuta el análisis en paralelo usando el motor v2.
 * @param {Object} rawInput - Datos crudos del formulario legacy.
 * @returns {Array} - Resultados procesados por el motor v2.
 */
window.runPreviewAnalysisV2 = function(rawInput) {
    // 1. Adapter Mínimo: Solo consolidamos campos que no existen directamente en la UI legacy
    const adaptedInput = {
        ...rawInput,
        redFlags: [],
        abcdeCount: 0
    };

    // --- BLINDAJE CLÍNICO (Análisis Proactivo de Notas) ---
    const notes = (rawInput.clinicalNotes || "").toLowerCase();
    
    // 1. Riesgo Ocular (Rosácea / Infecciones)
    const ocularKeywords = ["ojo", "vision", "visión", "lagrimeo", "parpado", "párpado", "ocular"];
    if (ocularKeywords.some(kw => notes.includes(kw))) {
        adaptedInput.redFlags.push("riesgo_ocular_detectado");
    }

    // 2. Escabiosis Familiar / Contactos
    const scabiesKeywords = ["familia", "contacto", "contagiado", "casa", "pareja", "hijo"];
    if (scabiesKeywords.some(kw => notes.includes(kw))) {
        adaptedInput.redFlags.push("posible_brote_familiar");
    }

    // Mapeo de Red Flags sistémicos de la UI legacy
    if (rawInput.systemic && rawInput.systemic !== 'none') {
        adaptedInput.redFlags.push(rawInput.systemic);
    }

    // Mapeo de criterios ABCDE
    if (rawInput.abcde) {
        adaptedInput.abcdeCount = Object.values(rawInput.abcde).filter(Boolean).length;
        if (adaptedInput.abcdeCount >= 2) {
            adaptedInput.redFlags.push("abcde_2_or_more");
        }
    }

    // 2. Ejecutar motor V2 (confiando en la normalización interna del motor)
    try {
        const results = runProtocolEngineV2(adaptedInput);
        return results || [];
    } catch (error) {
        console.error("DermatoAPS [V2 Bridge Error]: Falló la ejecución del motor clínico v2.", error);
        return [];
    }
};

console.log("DermatoAPS [V2 Bridge]: Cargado exitosamente.");
