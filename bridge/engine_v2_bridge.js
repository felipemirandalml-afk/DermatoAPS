/**
 * ENGINE V2 BRIDGE
 * Actúa como puente entre la UI legacy y el nuevo motor clínico v2.
 * Expone runPreviewAnalysisV2 al ámbito global.
 */

import { runProtocolEngineV2 } from '../engine/protocol_engine.v2.js';
import { normalizeClinicalInputV2 } from '../utils/clinical_input_mapper.v2.js';

/**
 * Ejecuta el análisis en paralelo usando el motor v2.
 * @param {Object} rawInput - Datos crudos del formulario legacy.
 * @returns {Array} - Resultados procesados por el motor v2.
 */
window.runPreviewAnalysisV2 = function(rawInput) {
    // 1. Adapter: Convertir estructura de UI legacy a estructura esperada por Mapper V2
    // La UI legacy usa valores únicos, V2 prefiere arrays para mayor granularidad futura.
    const adaptedInput = {
        morphology: rawInput.morphology ? [rawInput.morphology] : [],
        location: rawInput.location ? [rawInput.location] : [],
        symptoms: rawInput.symptoms ? [rawInput.symptoms] : [],
        duration: rawInput.duration || "",
        redFlags: [],
        specialContexts: rawInput.specialContext ? [rawInput.specialContext] : [],
        abcdeCount: 0
    };

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

    // 2. Ejecutar motor V2 (que internamente llama al normalizador)
    try {
        const results = runProtocolEngineV2(adaptedInput);
        return results;
    } catch (error) {
        console.error("DermatoAPS [V2 Bridge Error]:", error);
        return [];
    }
};

console.log("DermatoAPS [V2 Bridge]: Cargado exitosamente.");
