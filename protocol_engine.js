/**
 * protocol_engine.js
 * Motor de coincidencia de protocolos clínicos dermatológicos.
 * Depende de: protocol_db.js (PROTOCOL_DB, PROTOCOL_DB_VERSION)
 *
 * Funciones exportadas como globales (sin módulos ES6):
 *   scoreProtocolMatch(protocol, formData) -> number
 *   findMatchingProtocols(formData)        -> Array
 *   buildMatchReason(protocol, formData)   -> string
 *   formatManagementText(rawText)          -> string (HTML)
 *   formatEducationText(rawText)           -> string (HTML)
 *   toTitleCase(str)                       -> string
 */

// =========================================================
// SCORING ENGINE
// =========================================================

/**
 * scoreProtocolMatch(protocol, formData)
 * Assigns a numeric relevance score to a protocol entry given the current form data.
 */
function scoreProtocolMatch(protocol, data) {
    let score = 0;
    const tags = protocol.tags;
    const m = data.morphology || '';
    const sym = data.symptoms || '';
    const loc = data.location || '';
    const dist = data.distribution || '';
    const dur = data.duration || '';
    const num = data.numberLesions || '';
    const ctx = data.specialContext || '';

    // --- Morphology-based rules ---
    if (m === 'scaling lesion') {
        if (tags.some(t => ['psoriasis', 'descamacion', 'pitiriasis', 'eccema', 'seborreica', 'numular', 'hipostatico'].includes(t))) score += 4;
        if (loc === 'lower limbs' && tags.includes('onicomicosis')) score += 2;
    }
    if (m === 'papule/plaque') {
        if (tags.some(t => ['acne', 'rosacea', 'foliculitis', 'psoriasis', 'liquen'].includes(t))) score += 3;
    }
    if (m === 'macule/patch') {
        if (tags.some(t => ['vitiligo', 'melasma', 'pitiriasis', 'manchas', 'hipopigmentacion', 'hiperpigmentacion'].includes(t))) score += 3;
        if (tags.some(t => ['dermatitis', 'atopica', 'eczema', 'eccema'].includes(t))) score += 2;
    }
    if (m === 'vesicle/blister') {
        if (tags.some(t => ['dishidrosis', 'vesiculas', 'ampollas'].includes(t))) score += 4;
    }
    if (m === 'pigmented lesion') {
        if (tags.some(t => ['lesion pigmentada', 'queratosis actinica', 'cancer de piel'].includes(t))) score += 5;
        const abcdeCount = Object.values(data.abcde || {}).filter(Boolean).length;
        if (abcdeCount >= 2) score += 3;
    }
    if (m === 'ulcerated lesion') {
        if (tags.some(t => ['queratosis actinica', 'cancer de piel', 'derivar'].includes(t))) score += 4;
    }
    if (m === 'crusted lesion') {
        if (tags.some(t => ['foliculitis', 'acne', 'queratosis actinica'].includes(t))) score += 2;
    }

    // --- Location-based rules ---
    if (loc === 'face') {
        if (tags.some(t => ['acne', 'rosacea', 'rostro', 'facial', 'melasma', 'seborreica', 'dermatitis'].includes(t))) score += 3;
    }
    if (loc === 'scalp') {
        if (tags.some(t => ['cuero cabelludo', 'alopecia', 'seborreica', 'psoriasis'].includes(t))) score += 3;
    }
    if (loc === 'lower limbs') {
        if (tags.some(t => ['hipostatico', 'numular', 'piernas', 'onicomicosis', 'insuficiencia venosa'].includes(t))) score += 2;
    }
    if (loc === 'upper limbs') {
        if (tags.some(t => ['dishidrosis', 'palmas', 'eccema', 'liquen'].includes(t))) score += 2;
    }

    // --- Distribution-based rules ---
    if (dist === 'flexural') {
        if (tags.some(t => ['atopica', 'dermatitis', 'eccema', 'liquen', 'hidradenitis'].includes(t))) score += 2;
    }
    if (dist === 'extensor') { if (tags.includes('psoriasis')) score += 2; }
    if (dist === 'dermatomal') {
        // S2: Herpes Zóster sigue un patrón dermatomal unilateral
        if (tags.some(t => ['herpes', 'zoster', 'vesiculas', 'ampollas', 'dolor'].includes(t))) score += 5;
    }
    if (dist === 'photoexposed') {
        if (tags.some(t => ['queratosis actinica', 'melasma', 'fotoproteccion', 'fitodermatosis'].includes(t))) score += 2;
    }
    if (dist === 'bilateral') {
        if (tags.some(t => ['vitiligo', 'psoriasis', 'eccema', 'dishidrosis', 'dermatitis'].includes(t))) score += 1;
    }

    // --- Symptoms-based rules ---
    if (sym === 'pruritus') {
        if (tags.some(t => ['prurito', 'atopica', 'eccema', 'urticaria', 'contacto', 'liquen', 'dishidrosis', 'fitodermatosis'].includes(t))) score += 2;
    }
    if (sym === 'pain' || sym === 'burning') {
        if (tags.some(t => ['hidradenitis', 'foliculitis', 'queratosis actinica'].includes(t))) score += 1;
    }
    if (sym === 'asymptomatic') {
        if (tags.some(t => ['vitiligo', 'melasma', 'acantosis nigricans', 'pitiriasis'].includes(t))) score += 2;
    }

    // --- Duration-based rules ---
    if (dur === '> 3 months') {
        if (tags.some(t => ['cronico', 'psoriasis', 'vitiligo', 'liquen', 'onicomicosis', 'hidradenitis', 'alopecia'].includes(t))) score += 2;
    }
    if (dur === '< 1 week' || dur === '1–4 weeks') {
        if (tags.some(t => ['urticaria aguda', 'contacto', 'fitodermatosis', 'dermatitis medicamentosa'].includes(t))) score += 2;
    }

    // --- Special context ---
    if (ctx === 'immunosuppressed') {
        if (tags.some(t => ['hongos', 'onicomicosis', 'pitiriasis', 'dermatitis'].includes(t))) score += 2;
    }
    if (ctx === 'pediatric') {
        if (tags.some(t => ['atopica', 'dermatitis', 'pediatrico'].includes(t))) score += 3;
    }
    if (ctx === 'pregnancy') {
        // S4: En embarazo preferir protocolos de baja potencia / seguros
        if (tags.some(t => ['atopica', 'humectacion', 'hidrocortisona', 'dermatitis', 'prurito'].includes(t))) score += 2;
        // Penalizar protocolos con medicamentos contraindicados en embarazo
        if (tags.some(t => ['isotretinoina', 'doxiciclina', 'terbinafina', 'metronidazol'].includes(t))) score -= 3;
    }

    // --- Number of lesions ---
    if (num === 'generalized') {
        if (tags.some(t => ['generalizado', 'urticaria', 'psoriasis', 'pitiriasis', 'vitiligo'].includes(t))) score += 2;
    }
    if (num === 'single') {
        if (tags.some(t => ['verruga', 'queratosis actinica', 'localizado'].includes(t))) score += 1;
    }

    // --- Clinical notes keywords ---
    const notes = (data.clinicalNotes || '').toLowerCase();
    if (notes.includes('uñas') || notes.includes('onicomicosis')) {
        if (tags.includes('onicomicosis')) score += 3;
    }
    if (notes.includes('pelo') || notes.includes('caída') || notes.includes('alopecia')) {
        if (tags.includes('alopecia')) score += 3;
    }

    // --- S1: Penalización por edad en acné ---
    if (data.age && data.age > 40) {
        if (tags.includes('acne')) score -= 2;
    }

    return score;
}

/**
 * findMatchingProtocols(formData)
 * Returns top 3 protocol objects with their score and a brief match reason.
 */
function findMatchingProtocols(data) {
    if (typeof PROTOCOL_DB === 'undefined' || !Array.isArray(PROTOCOL_DB)) return [];

    const scored = PROTOCOL_DB.map(protocol => ({
        protocol,
        score: scoreProtocolMatch(protocol, data)
    }));

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).filter(item => item.score >= 3);

    return top3.map(item => ({
        ...item.protocol,
        _score: item.score,
        _matchReason: buildMatchReason(item.protocol, data)
    }));
}

/**
 * buildMatchReason(protocol, formData)
 * Returns a short human-readable sentence explaining why this protocol matched.
 */
function buildMatchReason(protocol, data) {
    const tags = protocol.tags;
    const reasons = [];

    // Uses word-level equality, not substring matching
    const tagHasWord = (phrase) => {
        if (!phrase) return false;
        const words = phrase.toLowerCase().split(/[\/\s]+/).filter(w => w.length > 3);
        return tags.some(tag => {
            const tagWords = tag.split(/\s+/);
            return words.some(w => tagWords.includes(w) || tag === w);
        });
    };

    if (tagHasWord(data.morphology)) reasons.push('morfología compatible');
    if (tagHasWord(data.location)) reasons.push('ubicación relacionada');
    if (tagHasWord(data.symptoms)) reasons.push('síntomas compatibles');
    if (tagHasWord(data.distribution)) reasons.push('patrón de distribución coincidente');

    if (reasons.length === 0) reasons.push('asociación clínica por contexto');
    return reasons.slice(0, 2).join(', ');
}

/**
 * normalizeClinicalInput(input)
 * Devuelve una copia normalizada del input clínico usando la taxonomía.
 */
function normalizeClinicalInput(input) {
    if (!input || typeof DermTaxonomy === 'undefined') return input;

    // Crear una copia para evitar mutaciones accidentales
    const normalized = { ...input };

    if (normalized.morphology) normalized.morphology = DermTaxonomy.normalizeTerm(normalized.morphology);
    if (normalized.location) normalized.location = DermTaxonomy.normalizeTerm(normalized.location);
    if (normalized.symptoms) normalized.symptoms = DermTaxonomy.normalizeTerm(normalized.symptoms);
    if (normalized.distribution) normalized.distribution = DermTaxonomy.normalizeTerm(normalized.distribution);

    return normalized;
}

/**
 * normalizeFeatureList(list)
 * Normaliza una lista de características clínicas (features).
 * Preparación para motor semiológico futuro.
 */
function normalizeFeatureList(list) {
    if (!list || !Array.isArray(list) || typeof DermTaxonomy === 'undefined') return list || [];
    return list
        .map(item => DermTaxonomy.normalizeTerm(item))
        .filter(Boolean);
}

/**
 * normalizeDiagnosisRecord(record)
 * Normaliza un registro de diagnóstico del dataset APS.
 * Preparación para motor semiológico futuro.
 */
function normalizeDiagnosisRecord(record) {
    if (!record || typeof DermTaxonomy === 'undefined') return record;

    return {
        ...record,
        id: DermTaxonomy.normalizeTerm(record.id),
        aliases: normalizeFeatureList(record.aliases),
        key_features: normalizeFeatureList(record.key_features)
    };
}

/**
 * detectSyndrome(features)
 * Detecta el síndrome dermatológico más probable usando las features clínicas.
 * Esta función será usada en una futura capa de análisis semiológico.
 */
function detectSyndrome(features) {
    if (!features || !Array.isArray(features) || typeof DIAGNOSIS_DATASET === 'undefined') {
        return { syndrome: null, score: 0 };
    }

    const normalizedInput = normalizeFeatureList(features);
    if (normalizedInput.length === 0) return { syndrome: null, score: 0 };

    const syndromeScores = {};

    DIAGNOSIS_DATASET.forEach(diag => {
        const normalizedDiag = normalizeDiagnosisRecord(diag);
        let matchCount = 0;

        normalizedInput.forEach(feature => {
            if (normalizedDiag.key_features.includes(feature)) {
                matchCount++;
            }
        });

        if (matchCount > 0) {
            const currentScore = syndromeScores[diag.syndrome] || 0;
            syndromeScores[diag.syndrome] = currentScore + matchCount;
        }
    });

    let bestSyndrome = null;
    let maxScore = 0;

    for (const syndrome in syndromeScores) {
        if (syndromeScores[syndrome] > maxScore) {
            maxScore = syndromeScores[syndrome];
            bestSyndrome = syndrome;
        }
    }

    return {
        syndrome: bestSyndrome,
        score: maxScore
    };
}

// =========================================================
// TEXT FORMATTING UTILITIES
// =========================================================

/**
 * toTitleCase(str)
 * Converts ALL-CAPS clinical text to readable sentence case.
 * Order: lowercase → restore abbreviations → capitalize first letter.
 */
function toTitleCase(str) {
    return str
        .toLowerCase()
        .replace(/\b(aps|spf|fps|npp|rcv|mcg|mg|ml|grs|vhs|tsh|t4|ana|csp|sos|ges|vdrl|ldr|upc|pcr|itb|sic|imo|td)\b/gi,
            abbr => abbr.toUpperCase())
        .replace(/^(.)/, c => c.toUpperCase());
}

/**
 * formatManagementText(rawText)
 * Converts numbered all-caps protocol text into readable HTML list.
 */
function formatManagementText(raw) {
    if (!raw) return '';
    const lines = raw
        .replace(/DADO LO ANTERIOR,\s*LA SUGERENCIA DE MANEJO ES:\s*/i, '')
        .split(/(?=\d+\.[-–]?\s)/)
        .map(s => s.trim())
        .filter(Boolean);

    if (lines.length <= 1) {
        return `<p>${toTitleCase(raw.replace(/DADO LO ANTERIOR,\s*LA SUGERENCIA DE MANEJO ES:\s*/i, '').trim())}</p>`;
    }

    const items = lines.map(line => {
        const clean = line.replace(/^\d+\.[-–]?\s*/, '').trim();
        return `<li>${toTitleCase(clean)}</li>`;
    }).join('');

    return `<ol class="protocol-management-list">${items}</ol>`;
}

/**
 * formatEducationText(rawText)
 * Converts all-caps educational text to readable HTML paragraphs.
 */
function formatEducationText(raw) {
    if (!raw) return '';
    const clean = raw.replace(/^"\s*|\s*"$/g, '').trim();
    const paragraphs = clean.split(/\n{1,}/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) {
        return `<p>${toTitleCase(clean)}</p>`;
    }
    return paragraphs.map(p => `<p>${toTitleCase(p)}</p>`).join('');
}
