/**
 * SMOKE TEST - PROTOCOL ENGINE V2
 * Script de validación manual para el nuevo motor clínico v2.
 * Ejecución sugerida: node tools/test_protocol_engine_v2.js
 */

import { runProtocolEngineV2 } from '../engine/protocol_engine.v2.js';

const TEST_CASES = [
    {
        name: "1. Acné (Entrada Cruda: papula, facial, crónico)",
        input: {
            morphology: ["papula", "pustula"],
            location: ["facial"],
            symptoms: ["seborrea"],
            duration: "crónico"
        },
        expectedId: "acne_inflamatorio_leve"
    },
    {
        name: "2. Dermatitis Atópica (Entrada Cruda: eccema, pliegues, picazon)",
        input: {
            morphology: ["eccema"],
            location: ["pliegues"],
            symptoms: ["picazon"],
            duration: "recurrente"
        },
        expectedId: "dermatitis_atopica_leve"
    },
    {
        name: "3. Pitiriasis Versicolor (Entrada Cruda: macula, hipopigmentada)",
        input: {
            morphology: ["macula", "hipopigmentada"],
            location: ["tronco"],
            duration: "meses"
        },
        expectedId: "pitiriasis_versicolor"
    },
    {
        name: "4. Queratosis Actínica (Entrada Cruda: cara, ardor)",
        input: {
            morphology: ["lesion eritematosa"],
            location: ["cara"],
            symptoms: ["ardor"],
            duration: "cronico"
        },
        expectedId: "queratosis_actinica"
    },
    {
        name: "5. Psoriasis (Entrada Cruda: codo, rodilla, placa, escama)",
        input: {
            morphology: ["placa", "escama"],
            location: ["codo", "rodilla"],
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
