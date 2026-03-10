/**
 * SMOKE TEST - PROTOCOL ENGINE V2
 * Script de validación manual para el nuevo motor clínico v2.
 * Ejecución sugerida: node tools/test_protocol_engine_v2.js
 */

import { runProtocolEngineV2 } from '../engine/protocol_engine.v2.js';

const TEST_CASES = [
    {
        name: "1. Acné Inflamatorio Leve (Match Perfecto)",
        input: {
            morphology: ["papulas", "pustulas"],
            location: ["rostro"],
            symptoms: ["seborrea"],
            duration: "cronico"
        },
        expectedId: "acne_inflamatorio_leve"
    },
    {
        name: "2. Dermatitis Atópica (Match por Flexuras)",
        input: {
            morphology: ["eczema", "placas eritematosas"],
            location: ["flexuras"],
            symptoms: ["prurito intenso"],
            duration: "recurrente"
        },
        expectedId: "dermatitis_atopica_leve"
    },
    {
        name: "3. Pitiriasis Versicolor (Infeccioso)",
        input: {
            morphology: ["maculas hipopigmentadas"],
            location: ["tronco"],
            symptoms: ["leve prurito"],
            duration: "meses"
        },
        expectedId: "pitiriasis_versicolor"
    },
    {
        name: "4. Queratosis Actínica (Riesgo/Neoplásico)",
        input: {
            morphology: ["lesion eritematosa", "superficie aspera/lija"],
            location: ["zonas fotoexpuestas", "cara"],
            symptoms: ["dolor al roce"],
            duration: "cronico"
        },
        expectedId: "queratosis_actinica"
    },
    {
        name: "5. Psoriasis (Codos/Rodillas)",
        input: {
            morphology: ["placas eritematosas", "escama blanquecina gruesa"],
            location: ["codos", "rodillas"],
            duration: "cronico"
        },
        expectedId: "psoriasis_vulgar_leve"
    },
    {
        name: "6. Exclusión por Red Flags (Dermatitis Atópica con Eritrodermia)",
        input: {
            morphology: ["eczema"],
            location: ["flexuras"],
            redFlags: ["eritrodermia"] // Esto debería excluir el protocolo de dermatitis leve si está mal configurado o mostrar cómo el motor descarta
        },
        expectedId: null // Esperamos que se excluya o se maneje de forma distinta
    },
    {
        name: "7. Sin Match Claro (Morfología desconocida)",
        input: {
            morphology: ["pustulas gigantes"],
            location: ["pies"],
            symptoms: ["dolor severo"]
        },
        expectedId: null
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
