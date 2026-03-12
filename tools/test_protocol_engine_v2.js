/**
 * SMOKE TEST - PROTOCOL ENGINE V2
 * Script de validación manual para el nuevo motor clínico v2.
 * Ejecución sugerida: node tools/test_protocol_engine_v2.js
 */

import { runProtocolEngineV2 } from '../engine/protocol_engine.v2.js';

const TEST_CASES = [
    {
        name: "1. Acné (Morfología: papulas, Localización: rostro)",
        input: {
            morphology: ["papula", "pustula"],
            location: ["facial"],
            symptoms: ["seborrea"],
            duration: "crónico"
        },
        expectedId: "acne_inflamatorio_leve"
    },
    {
        name: "2. Dermatitis Atópica (Distribución: pliegues/flexuras, Síntomas: picazon)",
        input: {
            morphology: ["eccema"],
            location: ["pliegues"],
            symptoms: ["picazon"],
            duration: "recurrente"
        },
        expectedId: "dermatitis_atopica_leve"
    },
    {
        name: "3. Pitiriasis Versicolor (Morfología: macula, Distribución: tronco)",
        input: {
            morphology: ["macula", "descamacion"],
            location: ["tronco"],
            duration: "meses"
        },
        expectedId: "pitiriasis_versicolor"
    },
    {
        name: "4. Queratosis Actínica (Superficie: áspera, Distribución: fotoexpuesta)",
        input: {
            morphology: ["áspera"],
            location: ["cara"],
            duration: "cronico"
        },
        expectedId: "queratosis_actinica"
    },
    {
        name: "5. Psoriasis (Morfología: placa, Superficie: escamosa, Distribución: codos)",
        input: {
            morphology: ["placa", "escamosa"],
            location: ["codos"],
            duration: "cronico"
        },
        expectedId: "psoriasis_vulgar_leve"
    },
    {
        name: "6. Exclusión por Red Flags (Eritrodermia)",
        input: {
            morphology: ["eccema"],
            location: ["pliegues"],
            redFlags: ["eritrodermia"]
        },
        expectedId: null 
    },
    {
        name: "7. Sin Match Claro (Entrada Desconocida)",
        input: {
            morphology: ["ronchas"],
            location: ["pies"]
        },
        expectedId: null
    },
    {
        name: "8. Jerarquía Anatómica (Entrada: frente -> Match: rostro)",
        input: {
            morphology: ["papula", "pustula"],
            location: ["frente"],
            duration: "cronico"
        },
        expectedId: "acne_inflamatorio_leve"
    },
    {
        name: "9. Rosácea (Eritema persistente en rostro)",
        input: {
            morphology: ["placa"], // Mapeado desde eritema
            surfaceFeatures: ["exudativa"],
            location: ["mejilla"],
            symptoms: ["ardor"]
        },
        expectedId: "rosacea_eritemato_telangiectasica"
    },
    {
        name: "10. Escabiosis (Pápulas costrosas generalizadas)",
        input: {
            morphology: ["papula"],
            surfaceFeatures: ["costrosa"],
            distribution: ["generalizada"],
            symptoms: ["prurito nocturno"]
        },
        expectedId: "escabiosis_adulto"
    },
    {
        name: "Caso 11: Tiña Corporis (Tronco)",
        input: { morphology: ["placa"], surfaceFeatures: ["descamativa"], location: ["trunk"] },
        expectedId: "tinea_corporis"
    },
    {
        name: "Caso 12: Rosácea con Riesgo Ocular (Blindaje Proactivo)",
        input: { 
            morphology: ["placa"], 
            surfaceFeatures: ["exudativa"], 
            location: ["face"], 
            clinicalNotes: "Presenta lagrimeo y sensación de cuerpo extraño en ojo derecho." 
        },
        expectedId: "rosacea_eritemato_telangiectasica"
    },
    {
        name: "Caso 13: Escabiosis con Contacto Familiar (Blindaje Proactivo)",
        input: { 
            morphology: ["papula"], 
            surfaceFeatures: ["costrosa"], 
            location: ["flexural"], 
            clinicalNotes: "Su pareja tiene síntomas similares en las manos." 
        },
        expectedId: "escabiosis_adulto"
    }
];

function runTests() {
    console.log("====================================================");
    console.log("  DERMATO-APS: TEST PROTOCOL ENGINE V2");
    console.log("====================================================\n");

    let passed = 0;
    let failed = 0;

    TEST_CASES.forEach((test, index) => {
        console.log(`CASE ${index + 1}: ${test.name}`);
        console.log("Input:", JSON.stringify(test.input, null, 2));

        const results = runProtocolEngineV2(test.input);

        if (results.length === 0) {
            console.log("Result: [!] NO MATCH FOUND");
            if (test.expectedId === null) {
                console.log("Status: OK (Exclusión/Falta de match esperada)");
                passed++;
            } else {
                console.log(`Status: FAILED (Expected: ${test.expectedId})`);
                failed++;
            }
        } else {
            console.log("Top Results:");
            results.slice(0, 2).forEach((res, i) => {
                console.log(`  [${i + 1}] ID: ${res.protocolId}`);
                console.log(`      Score: ${res.supportiveScore}`);
                console.log(`      Triage: ${res.triage}`);
                console.log(`      Explicación: ${res.explanation}`);
            });

            const topResult = results[0];
            if (test.expectedId && topResult.protocolId === test.expectedId) {
                console.log("Status: OK (Match correcto)");
                passed++;
            } else if (test.expectedId === null) {
                console.log("Status: WARNING (Expected NO MATCH but found results)");
                failed++;
            } else {
                console.log(`Status: FAILED (Expected: ${test.expectedId}, Got: ${topResult.protocolId})`);
                failed++;
            }
        }
        console.log("----------------------------------------------------\n");
    });

    console.log("====================================================");
    console.log(`  RESUMEN: ${passed} PASADOS | ${failed} FALLADOS`);
    console.log("====================================================");
}

// Ejecutar pruebas
runTests();
