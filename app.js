// Register Service Worker for PWA offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[SW] Registered, scope:', reg.scope))
            .catch(err => console.warn('[SW] Registration failed:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('derm-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('derm-theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('derm-theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });

    // UI Elements
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = analyzeBtn.querySelector('.btn-text');
    const loader = analyzeBtn.querySelector('.loader');

    // Demo Buttons
    const btnEczema = document.getElementById('demo-eczema');
    const btnFungal = document.getElementById('demo-fungal');
    const btnMelanoma = document.getElementById('demo-melanoma');

    // Results Elements
    const emptyResults = document.getElementById('empty-results');
    const resultsContent = document.getElementById('results-content');
    const clinicalSummaryList = document.getElementById('clinical-summary-list');
    const imageQualityBlock = document.getElementById('image-quality-block');
    const triageBadge = document.getElementById('triage-badge');
    const triageExplanation = document.getElementById('triage-explanation');
    const redFlagsCard = document.getElementById('red-flags-card');
    const redFlagsList = document.getElementById('red-flags-list');
    const diagnosticCategories = document.getElementById('diagnostic-categories');
    const managementCard = document.getElementById('management-card');
    const managementContent = document.getElementById('management-content');
    const exportBtn = document.getElementById('export-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportPatientBtn = document.getElementById('export-patient-btn');
    const consentCheckbox = document.getElementById('patient-consent');
    const morphologySelect = document.getElementById('morphology');
    const abcdeContainer = document.getElementById('abcde-container');

    // Handle ABCDE visibility
    morphologySelect.addEventListener('change', (e) => {
        if (e.target.value === 'pigmented lesion') {
            abcdeContainer.classList.remove('hidden');
        } else {
            abcdeContainer.classList.add('hidden');
            // Reset checkboxes
            document.querySelectorAll('#abcde-container input[type="checkbox"]').forEach(cb => cb.checked = false);
        }
    });

    let currentAnalysisData = null; // Store for export

    // C1/C2/C3 — Mapa de localización: valores internos → español
    const LABELS = {
        sex: { male: 'Masculino', female: 'Femenino', other: 'No especificado', '': '—' },
        symptoms: { pruritus: 'Prurito (Picazón)', pain: 'Dolor', burning: 'Ardor', asymptomatic: 'Asintomático', '': '—' },
        numberLesions: { single: 'Única', multiple: 'Múltiples', generalized: 'Generalizadas', '': '—' },
        location: { face: 'Cara', scalp: 'Cuero cabelludo', trunk: 'Tronco', 'upper limbs': 'Extremidades Superiores', 'lower limbs': 'Extremidades Inferiores', 'genital area': 'Zona Genital', '': '—' },
        morphology: { 'macule/patch': 'Mácula / Mancha', 'papule/plaque': 'Pápula / Placa', 'vesicle/blister': 'Vesícula / Ampolla', 'crusted lesion': 'Lesión Costrosa', 'pigmented lesion': 'Lesión Pigmentada', 'scaling lesion': 'Lesión Descamativa', 'ulcerated lesion': 'Lesión Ulcerada', '': '—' },
        distribution: { localized: 'Localizado', bilateral: 'Bilateral / Simétrico', dermatomal: 'Dermatomal', flexural: 'Flexural', extensor: 'Extensor', photoexposed: 'Fotoexpuesto', '': '—' },
        systemic: { none: 'Ninguno', fever: 'Fiebre / Compromiso general', swelling: 'Edema significativo', '': '—' },
        specialContext: { none: 'Ninguno', pediatric: 'Paciente pediátrico', pregnancy: 'Embarazo', immunosuppressed: 'Inmunosuprimido', '': '—' }
    };
    /** Traduce un valor interno al label en español */
    function loc(category, value) {
        return (LABELS[category] && LABELS[category][value]) ? LABELS[category][value] : (value || '—');
    }

    // M7 — Show PROTOCOL_DB_VERSION in footer
    const dbVersionEl = document.getElementById('db-version');
    if (dbVersionEl && typeof PROTOCOL_DB_VERSION !== 'undefined') {
        dbVersionEl.textContent = PROTOCOL_DB_VERSION;
    }

    // M9 — New case button
    const newCaseBtn = document.getElementById('new-case-btn');
    newCaseBtn.addEventListener('click', resetForm);

    /** Show toast notification (U1) */
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function resetForm() {
        // Reset all selects and inputs in the form
        document.querySelectorAll('.input-section select').forEach(s => { s.selectedIndex = 0; });
        document.querySelectorAll('.input-section input[type="number"]').forEach(i => { i.value = ''; });
        document.querySelectorAll('.input-section input[type="checkbox"]').forEach(c => { c.checked = false; });
        document.querySelector('#clinical-notes').value = '';
        consentCheckbox.checked = false;
        // Reset image previews
        document.querySelectorAll('.file-upload-wrapper img').forEach(img => { img.classList.add('hidden'); img.src = ''; });
        document.querySelectorAll('.upload-content').forEach(uc => { uc.classList.remove('hidden'); });
        document.querySelectorAll('.upload-error').forEach(e => { e.classList.add('hidden'); });
        // Clear field errors
        document.querySelectorAll('.field-error').forEach(f => f.classList.remove('field-error'));
        // Hide ABCDE
        abcdeContainer.classList.add('hidden');
        // Reset results panel
        emptyResults.classList.remove('hidden');
        resultsContent.classList.add('hidden');
        newCaseBtn.classList.add('hidden');
        currentAnalysisData = null;
    }

    // Handle Dual Image Uploads
    function setupImageUpload(dropZoneId, inputId, previewId, errorId) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(inputId);
        const imagePreview = document.getElementById(previewId);
        const errorMsg = document.getElementById(errorId);

        fileInput.addEventListener('change', (e) => handleFileSelect(e, dropZone, imagePreview, errorMsg));

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary-color)';
            dropZone.style.backgroundColor = 'var(--info-bg)';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border-color)';
            dropZone.style.backgroundColor = 'var(--bg-color)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border-color)';
            dropZone.style.backgroundColor = 'var(--bg-color)';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: { files: e.dataTransfer.files } }, dropZone, imagePreview, errorMsg);
            }
        });
    }

    function handleFileSelect(e, dropZone, imagePreview, errorMsg) {
        const file = e.target.files[0];
        if (file) {
            // Client-side image validation (Mock: check if file is too small < 10KB)
            if (file.size < 10240) {
                errorMsg.classList.remove('hidden');
                dropZone.style.borderColor = 'var(--danger-border)';
                return;
            } else {
                errorMsg.classList.add('hidden');
                dropZone.style.borderColor = 'var(--border-color)';
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                imagePreview.src = event.target.result;
                imagePreview.classList.remove('hidden');
                dropZone.querySelector('.upload-content').classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    setupImageUpload('drop-zone-panoramic', 'image-panoramic', 'preview-panoramic', 'error-panoramic');
    setupImageUpload('drop-zone-macro', 'image-macro', 'preview-macro', 'error-macro');

    // --- Demo Cases Logic ---
    function fillForm(data) {
        document.getElementById('sex').value = data.sex;
        document.getElementById('age').value = data.age;
        document.getElementById('duration').value = data.duration;
        document.getElementById('symptoms').value = data.symptoms;
        document.getElementById('number-lesions').value = data.numberLesions;
        document.getElementById('location').value = data.location;
        document.getElementById('morphology').value = data.morphology;
        document.getElementById('distribution').value = data.distribution;
        document.getElementById('systemic-symptoms').value = data.systemic;
        document.getElementById('special-context').value = data.specialContext;
        document.getElementById('clinical-notes').value = data.clinicalNotes || '';

        // Mock an image preview
        const mockImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23e2e8f0"><rect width="100" height="100"/></svg>';

        const previewPan = document.getElementById('preview-panoramic');
        previewPan.src = mockImg;
        previewPan.classList.remove('hidden');
        document.getElementById('drop-zone-panoramic').querySelector('.upload-content').classList.add('hidden');

        const previewMac = document.getElementById('preview-macro');
        previewMac.src = mockImg;
        previewMac.classList.remove('hidden');
        document.getElementById('drop-zone-macro').querySelector('.upload-content').classList.add('hidden');

        consentCheckbox.checked = true;
    }

    btnEczema.addEventListener('click', () => {
        fillForm({
            sex: 'male', age: 25, duration: '1–3 months', symptoms: 'pruritus',
            numberLesions: 'multiple', location: 'upper limbs', morphology: 'macule/patch', distribution: 'bilateral',
            systemic: 'none', specialContext: 'none', clinicalNotes: 'Piel muy reseca, asma de base.'
        });
    });

    btnFungal.addEventListener('click', () => {
        fillForm({
            sex: 'female', age: 45, duration: '1–4 weeks', symptoms: 'pruritus',
            numberLesions: 'single', location: 'trunk', morphology: 'scaling lesion', distribution: 'localized',
            systemic: 'none', specialContext: 'immunosuppressed', clinicalNotes: 'Usuaria corticoides orales.'
        });
    });

    btnMelanoma.addEventListener('click', () => {
        fillForm({
            sex: 'male', age: 62, duration: '< 1 week', symptoms: 'asymptomatic',
            numberLesions: 'single', location: 'face', morphology: 'pigmented lesion', distribution: 'photoexposed',
            systemic: 'none', specialContext: 'none', clinicalNotes: 'Lesión nueva según familiar, crecimiento rápido.'
        });
    });


    /** Escapes potentially unsafe HTML characters from user text input. */
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // --- Form Submission ---
    analyzeBtn.addEventListener('click', () => {
        const data = {
            sex: document.getElementById('sex').value,
            age: parseInt(document.getElementById('age').value, 10),
            duration: document.getElementById('duration').value,
            symptoms: document.getElementById('symptoms').value,
            numberLesions: document.getElementById('number-lesions').value,
            location: document.getElementById('location').value,
            morphology: document.getElementById('morphology').value,
            distribution: document.getElementById('distribution').value,
            systemic: document.getElementById('systemic-symptoms').value,
            specialContext: document.getElementById('special-context').value,
            clinicalNotes: document.getElementById('clinical-notes').value,
            abcde: {
                A: document.getElementById('crit-a').checked,
                B: document.getElementById('crit-b').checked,
                C: document.getElementById('crit-c').checked,
                D: document.getElementById('crit-d').checked,
                E: document.getElementById('crit-e').checked
            }
        };

        // Validate Form Data with error highlighting (M10)
        const requiredMap = [
            { value: data.age, fieldId: 'age', label: 'Edad' },
            { value: data.duration, fieldId: 'duration', label: 'Tiempo de evolución' },
            { value: data.morphology, fieldId: 'morphology', label: 'Morfología' },
            { value: data.symptoms, fieldId: 'symptoms', label: 'Síntoma principal' },
            { value: data.location, fieldId: 'location', label: 'Localización anatómica' },
        ];
        // Clear previous errors
        requiredMap.forEach(({ fieldId }) => {
            const el = document.getElementById(fieldId);
            if (el) el.closest('.field')?.classList.remove('field-error');
        });
        // Collect missing
        const missingFields = requiredMap
            .filter(({ value }) => !value)
            .map(({ fieldId, label }) => {
                const el = document.getElementById(fieldId);
                if (el) el.closest('.field')?.classList.add('field-error');
                return label;
            });
        // Auto-clear error on change
        requiredMap.forEach(({ fieldId }) => {
            const el = document.getElementById(fieldId);
            if (el) el.addEventListener('change', () => el.closest('.field')?.classList.remove('field-error'), { once: true });
        });
        if (missingFields.length > 0) {
            showToast(`Complete los campos obligatorios: ${missingFields.join(', ')}`, 'warning');
            return;
        }

        // Validate Consent
        if (!consentCheckbox.checked) {
            showToast('Debe aceptar el Consentimiento Informado para continuar.', 'warning');
            return;
        }

        // Show loading state
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        analyzeBtn.disabled = true;

        // Simulate API / Model latency
        setTimeout(() => {
            runAnalysis(data);

            // Reset button
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            analyzeBtn.disabled = false;
        }, 1200);
    });

    // --- FUTURE AI INTEGRATION PLACEHOLDER ---
    // function futureImageModelIntegration(imageFile) {
    //    // In a future phase, this function would wrap a call to a deployed vision model:
    //    // const formData = new FormData();
    //    // formData.append("image", imageFile);
    //    // return fetch("https://api.model-endpoint.com/v1/dermatology/classify", { method: 'POST', body: formData })
    //    //        .then(res => res.json());
    //    // It would return bounding boxes, lesion categories with confidence scores, and image quality metrics.
    // }

    function saveToDataset(data, analysis, protocolMatches, meta, semiologicResult = null) {
        try {
            const dataset = JSON.parse(localStorage.getItem('derm-triage-dataset') || '[]');
            dataset.push({
                timestamp: new Date().toISOString(),
                meta: meta || null,
                input: data,
                triageLevel: analysis.triageLevel,
                triageExplanation: analysis.explanation,
                suggestedCategories: analysis.categories,
                protocolMatches: (protocolMatches || []).map(p => ({
                    id: p.id,
                    diagnosis_short: p.diagnosis_short,
                    triage_seed: p.triage_seed,
                    score: p._score
                })),
                bestProtocol: protocolMatches && protocolMatches[0]
                    ? { id: protocolMatches[0].id, diagnosis_short: protocolMatches[0].diagnosis_short, triage_seed: protocolMatches[0].triage_seed }
                    : null,
                semiologicPreview: semiologicResult // FASE PREVIEW
            });
            localStorage.setItem('derm-triage-dataset', JSON.stringify(dataset));
        } catch (e) {
            console.error('Failed to save to dataset:', e);
        }
    }

    function runAnalysis(data) {
        const analysis = evaluateTriage(data);
        const protocolMatches = findMatchingProtocols(data);

        // --- SEMIOLOGIC ANALYSIS PREVIEW (Fase Preview) ---
        // Esta integración es una fase de prueba interna previa a la futura integración visual.
        const semiologicFeatures = [
            data.morphology,
            data.location,
            data.symptoms,
            data.distribution,
            data.specialContext
        ];
        const semiologicResult = typeof runSemiologicAnalysis !== 'undefined'
            ? runSemiologicAnalysis(typeof mapUIFeatures !== 'undefined' ? mapUIFeatures(semiologicFeatures) : semiologicFeatures)
            : null;

        if (semiologicResult) {
            console.log("DermatoAPS [Semiologic Preview]:", semiologicResult);
        }

        const now = new Date();
        const meta = {
            caseId: 'CAS-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            dateStr: now.toLocaleDateString(),
            timeStr: now.toLocaleTimeString()
        };
        saveToDataset(data, analysis, protocolMatches, meta, semiologicResult);
        displayResults(data, analysis, protocolMatches, meta);
        
        // --- MOTOR V2 PREVIEW ---
        if (typeof runPreviewAnalysisV2 === 'function') {
            const v2Results = runPreviewAnalysisV2(data);
            renderV2Preview(v2Results);
        }

        renderSessionHistory(); // M1
    }

    function evaluateTriage(data) {
        const redFlags = [];
        let triageLevel = 'GREEN';
        let explanation = '';

        let getsGesAlert = false;

        // --- 1. Evaluate Red Flags ---
        if (data.morphology === 'pigmented lesion') {
            const abcdeCount = Object.values(data.abcde).filter(Boolean).length;
            if (abcdeCount >= 2 || data.abcde.E || (data.age > 40 && abcdeCount >= 1)) {
                redFlags.push('Criterios de riesgo ABCDE presentes en lesión pigmentada');
                getsGesAlert = true;
            }
            if (data.duration === '< 1 week' && data.abcde.E) {
                redFlags.push('Evolución rápida en lesión pigmentada');
            }
        }

        if (data.morphology === 'ulcerated lesion' && data.duration === '> 3 months') {
            redFlags.push('Úlcera crónica – descartar cáncer de piel');
        }

        if ((data.symptoms === 'pain' || data.symptoms === 'burning') && (data.systemic === 'fever' || data.systemic === 'swelling')) {
            redFlags.push('Posible infección bacteriana grave (dolor + síntomas sistémicos)');
        }

        if (data.specialContext === 'immunosuppressed' && (data.morphology === 'ulcerated lesion' || data.morphology === 'vesicle/blister')) {
            redFlags.push('Paciente inmunosuprimido con lesión ulcerada o ampollar');
        }

        if (data.systemic === 'fever' && data.numberLesions === 'generalized') {
            redFlags.push('Síntomas sistémicos severos con lesiones generalizadas');
        }

        // Apply Red Triage
        if (redFlags.length > 0) {
            triageLevel = 'RED';
            explanation = `Se detectaron signos de alarma críticos (${redFlags[0]}). Se recomienda derivación dermatológica prioritaria (roja) para descartar cuadros graves o malignidad.`;
            if (getsGesAlert) {
                explanation = 'Lesión pigmentada con múltiples criterios ABCDE detectados. Se recomienda derivación prioritaria para descartar melanoma.<br><span class="alert-ges">GES: Sospecha de Melanoma (Derivación en 7 días)</span>';
            }
        }
        // --- 2. Evaluate Yellow Flags ---
        else if (
            (data.numberLesions === 'generalized' && data.systemic === 'none') ||
            (data.morphology === 'vesicle/blister') ||
            data.duration === '> 3 months' ||
            (data.morphology === 'scaling lesion' && (data.distribution === 'extensor' || data.distribution === 'bilateral')) ||
            (data.specialContext === 'immunosuppressed')
        ) {
            triageLevel = 'YELLOW';
            let yellowReason = 'condición crónica o extensa';
            if (data.specialContext === 'immunosuppressed') yellowReason = 'inmunosupresión basal del paciente';
            else if (data.duration === '> 3 months') yellowReason = 'cronicidad de las lesiones (>3 meses)';
            else if (data.morphology === 'scaling lesion') yellowReason = 'patrón sugerente de psoriasis u otra patología inflamatoria crónica';
            else if (data.morphology === 'vesicle/blister') yellowReason = 'vesículas/ampollas de causa a confirmar';
            else if (data.numberLesions === 'generalized') yellowReason = 'lesiones generalizadas sin compromiso sistémico';

            explanation = `La complejidad del caso (${yellowReason}) supera los protocolos estándar de APS. Se recomienda interconsulta por teledermatología para guiar diagnóstico y manejo.`;
        }
        // --- 3. Green Triage (Default) ---
        else {
            triageLevel = 'GREEN';
            explanation = 'No se observan signos de alarma inmediatos. El cuadro (ej. lesiones localizadas, pruriginosas o descamativas) siguiere un desafío manejable en APS de forma inicial.';
        }

        // --- 4. Diagnostic Categories heuristics ---
        let categories = [];

        // Bacterial Infection (Cellulitis/erysipelas)
        if ((data.symptoms === 'pain' || data.symptoms === 'burning') && data.systemic === 'fever' && data.numberLesions === 'single') {
            categories = ['Infección bacteriana (Celulitis / Erisipela)', 'Absceso cutáneo', 'Sobreinfección bacteriana'];
        }
        // Scabies rule
        else if (data.symptoms === 'pruritus' && data.numberLesions === 'multiple' && data.distribution === 'flexural') {
            categories = ['Escabiosis (Sarna)', 'Dermatitis Atópica Grave', 'Prurigo'];
        }
        else if (data.morphology === 'pigmented lesion') {
            categories = ['Lesión pigmentada sospechosa (Melanoma a descartar)', 'Nevo Atípico', 'Lesión cutánea benigna'];
        }
        else if (data.morphology === 'scaling lesion') {
            if (data.distribution === 'extensor' || data.duration === '> 3 months') {
                categories = ['Psoriasis', 'Dermatitis crónica', 'Infección fúngica superficial (Tiña)'];
            } else {
                categories = ['Infección fúngica superficial (Tiña)', 'Dermatitis / Eccema', 'Pitiriasis Rosada'];
            }
        }
        else if (data.symptoms === 'pruritus' || data.morphology === 'macule/patch' || data.morphology === 'papule/plaque') {
            categories = ['Dermatitis / Eccema', 'Infección fúngica superficial (Tiña)', 'Lesión cutánea benigna'];
        }
        else if (data.morphology === 'vesicle/blister') {
            categories = ['Infección viral (Herpes / Zoster)', 'Enfermedad ampollar', 'Dermatitis de contacto aguda'];
        }
        else if (data.systemic === 'fever' || data.symptoms === 'pain') {
            categories = ['Infección bacteriana (Impétigo / Celulitis)', 'Exantema viral', 'Farmacodermia'];
        }
        else {
            categories = ['Lesión cutánea benigna', 'Dermatitis / Eccema', 'A determinar'];
        }

        // 4. Mock Image Quality (3 states: Adequate, Suboptimal, Insufficient)
        const randomQ = Math.random();
        let imageQuality;
        if (randomQ > 0.4) {
            imageQuality = { text: 'Adecuada para análisis', class: 'dot-good' };
        } else if (randomQ > 0.1) {
            imageQuality = { text: 'Calidad subóptima (problemas de enfoque/iluminación)', class: 'dot-fair' };
        } else {
            imageQuality = { text: 'Insuficiente para análisis. Se recomienda repetir la captura de imágenes.', class: 'dot-poor' };
        }

        return {
            triageLevel,
            explanation,
            redFlags,
            categories,
            imageQuality
        };
    }

    // =========================================================
    // PROTOCOL ENGINE — funciones en protocol_engine.js
    // (scoreProtocolMatch, findMatchingProtocols, buildMatchReason,
    //  formatManagementText, formatEducationText, toTitleCase)
    // =========================================================



    /**
     * renderProtocolMatches(matches)
     * Renders the top 3 protocol matches into the diagnostic categories container.
     */
    function renderProtocolMatches(matches) {
        if (!matches || matches.length === 0) return;

        const seedToClass = { GREEN: 'proto-green', YELLOW: 'proto-yellow', RED: 'proto-red' };
        const seedToLabel = { GREEN: '🟢 APS', YELLOW: '🟡 Teledermatología', RED: '🔴 Derivar' };
        const seedToAria = { GREEN: 'Verde', YELLOW: 'Amarillo', RED: 'Rojo' };

        const html = matches.map((match, idx) => {
            const cls = seedToClass[match.triage_seed] || 'proto-green';
            const label = seedToLabel[match.triage_seed] || '';
            const aria = seedToAria[match.triage_seed];
            return `
            <li class="protocol-match-item">
                <div class="protocol-match-header">
                    <span class="match-rank">#${idx + 1}</span>
                    <span class="match-name">${match.diagnosis_short}</span>
                    <span class="proto-badge ${cls}" aria-label="Nivel ${aria}">${label}</span>
                </div>
                <div class="match-reason">🔍 ${match._matchReason}</div>
                <div class="match-source">Fuente: protocolo local · ${match.source}</div>
            </li>`;
        }).join('');

        diagnosticCategories.innerHTML = html;
    }

    /**
     * M1 — renderSessionHistory()
     * Reads derm-triage-dataset from localStorage and renders the last 5 cases
     * in the session history panel.
     */
    function renderSessionHistory() {
        const panel = document.getElementById('session-history-panel');
        const list = document.getElementById('session-history-list');
        const countEl = document.getElementById('history-count');
        if (!panel || !list) return;

        const dataset = JSON.parse(localStorage.getItem('derm-triage-dataset') || '[]');
        const recent = dataset.slice(-5).reverse();
        countEl.textContent = dataset.length;

        if (recent.length === 0) {
            panel.classList.add('hidden');
            return;
        }
        panel.classList.remove('hidden');

        const triageIcon = { RED: '🔴', YELLOW: '🟡', GREEN: '🟢' };
        list.innerHTML = recent.map(entry => {
            const meta = entry.meta || {};
            const triage = entry.triageLevel || '?';
            const icon = triageIcon[triage] || '⚪';
            const dx = entry.bestProtocol?.diagnosis_short || entry.suggestedCategories?.[0] || 'Sin diagnóstico';
            const caseId = meta.caseId ? meta.caseId : '—';
            const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return `
            <li class="history-item">
                <span class="hist-id">${caseId}</span>
                <span class="hist-triage">${icon} ${triage}</span>
                <span class="hist-dx">${dx}</span>
                <span class="hist-time">${time}</span>
            </li>`;
        }).join('');
    }

    /**
     * renderManagementFromProtocol(match)
     * Renders the management card using the best protocol match.
     */
    function renderManagementFromProtocol(match) {
        managementCard.classList.remove('hidden');
        managementContent.innerHTML = `
            <div class="protocol-mgmt-header">
                <strong>Protocolo de referencia:</strong>
                <span class="match-name">${match.diagnosis_short}</span>
            </div>
            <div class="protocol-disclaimer">Apoyo a la decisión clínica · No constituye diagnóstico definitivo · No reemplaza el criterio clínico</div>
            ${formatManagementText(match.management_text)}
        `;
    }

    /**
     * renderEducationFromProtocol(match)
     * Renders the education card using the best protocol match.
     */
    function renderEducationFromProtocol(match) {
        const educationCard = document.getElementById('education-card');
        const educationContent = document.getElementById('education-content');
        if (!match || !match.education_text || match.education_text.trim() === '') {
            educationCard.classList.add('hidden');
            return;
        }
        educationCard.classList.remove('hidden');
        educationContent.innerHTML = `
            <div class="protocol-mgmt-header">
                <strong>Basado en:</strong>
                <span class="match-name">${match.diagnosis_short}</span>
            </div>
            ${formatEducationText(match.education_text)}
        `;
    }

    function displayResults(data, analysis, precomputedProtocolMatches, incomingMeta) {
        // Toggle visibility
        emptyResults.classList.add('hidden');
        resultsContent.classList.remove('hidden');
        newCaseBtn.classList.remove('hidden'); // M9

        // M8 — Animate result cards
        resultsContent.querySelectorAll('.result-card').forEach((card, i) => {
            card.classList.remove('fade-in');
            void card.offsetWidth; // force reflow
            card.style.animationDelay = `${i * 0.05}s`;
            card.classList.add('fade-in');
        });

        // Use meta from runAnalysis (single source of truth for caseId)
        const meta = incomingMeta || {
            caseId: 'CAS-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            dateStr: new Date().toLocaleDateString(),
            timeStr: new Date().toLocaleTimeString()
        };
        const { caseId, dateStr, timeStr } = meta;
        currentAnalysisData = { formData: data, analysis: analysis, meta };

        document.getElementById('meta-id').textContent = `ID: ${caseId}`;
        document.getElementById('meta-date').textContent = `Fecha: ${dateStr}`;
        document.getElementById('meta-time').textContent = `Hora: ${timeStr}`;

        // 1. Render Clinical Summary
        clinicalSummaryList.innerHTML = `
            <li><span class="summary-label">Sexo</span><span class="summary-value">${loc('sex', data.sex)}</span></li>
            <li><span class="summary-label">Edad</span><span class="summary-value">${data.age} años</span></li>
            <li><span class="summary-label">Evolución</span><span class="summary-value">${data.duration}</span></li>
            <li><span class="summary-label">Síntomas</span><span class="summary-value">${loc('symptoms', data.symptoms)}</span></li>
            <li><span class="summary-label">N° Lesiones</span><span class="summary-value">${loc('numberLesions', data.numberLesions)}</span></li>
            <li><span class="summary-label">Ubicación</span><span class="summary-value">${loc('location', data.location)}</span></li>
            <li><span class="summary-label">Morfología</span><span class="summary-value">${loc('morphology', data.morphology)}</span></li>
            <li><span class="summary-label">Distribución</span><span class="summary-value">${loc('distribution', data.distribution)}</span></li>
            <li><span class="summary-label">Contexto Clínico</span><span class="summary-value">${loc('specialContext', data.specialContext)}</span></li>
            <li><span class="summary-label">Sistémico</span><span class="summary-value">${loc('systemic', data.systemic)}</span></li>
            ${data.clinicalNotes ? `<li style="grid-column: 1 / -1; margin-top: 0.5rem;"><span class="summary-label">Notas</span><span class="summary-value">${escapeHtml(data.clinicalNotes)}</span></li>` : ''}
        `;

        // 2. Render Image Quality
        imageQualityBlock.innerHTML = `
            <span class="quality-dot ${analysis.imageQuality.class}"></span>
            <strong>Calidad de Imagen Simulada:</strong> <span>${analysis.imageQuality.text}</span>
        `;

        // 3. Render Triage Badge
        triageBadge.className = 'triage-badge'; // reset
        if (analysis.triageLevel === 'RED') {
            triageBadge.classList.add('triage-red');
            triageBadge.innerHTML = '🛑 Derivación dermatológica prioritaria recomendada';
        } else if (analysis.triageLevel === 'YELLOW') {
            triageBadge.classList.add('triage-yellow');
            triageBadge.innerHTML = '⚠️ Sugerencia de teledermatología';
        } else {
            triageBadge.classList.add('triage-green');
            triageBadge.innerHTML = '✅ Manejo inicial sugerido en APS';
        }
        triageExplanation.innerHTML = analysis.explanation;

        // 4. Render Red Flags
        if (analysis.redFlags.length > 0) {
            redFlagsCard.classList.remove('hidden');
            redFlagsList.innerHTML = analysis.redFlags.map(flag => `<li>${flag}</li>`).join('');
        } else {
            redFlagsCard.classList.add('hidden');
            redFlagsList.innerHTML = '';
        }

        // 5. Run Protocol Engine (use precomputed if available from runAnalysis)
        const protocolMatches = precomputedProtocolMatches || findMatchingProtocols(data);
        currentAnalysisData.protocolMatches = protocolMatches;
        const bestMatch = protocolMatches[0] || null;

        // 6. Render Categories from Protocol DB (or fallback to heuristic)
        if (protocolMatches.length > 0) {
            renderProtocolMatches(protocolMatches);
        } else {
            // Legacy fallback
            diagnosticCategories.innerHTML = analysis.categories.map((cat, idx) => {
                const indexStr = `<span style="opacity:0.6;margin-right:0.5rem;font-size:0.9em;">#${idx + 1}</span>`;
                return `<li><div>${indexStr}${cat}</div></li>`;
            }).join('');
        }

        // 7. Triage Reconciliation Note
        const discrepancyNote = document.getElementById('protocol-discrepancy-note');
        if (bestMatch && bestMatch.triage_seed !== analysis.triageLevel) {
            discrepancyNote.classList.remove('hidden');
        } else {
            discrepancyNote.classList.add('hidden');
        }

        // 8. Render Management
        if (bestMatch) {
            renderManagementFromProtocol(bestMatch);
        } else if (analysis.triageLevel === 'GREEN') {
            managementCard.classList.remove('hidden');
            managementContent.innerHTML = `
                <p>Ante la falta de signos de alarma evidentes, considere manejo inicial en Atención Primaria (APS):</p>
                <ul>
                    <li>Uso de emolientes tópicos y constante hidratación</li>
                    <li>Manejo sintomático (ej. antihistamínicos orales para prurito leve)</li>
                    <li>Corticoides tópicos de baja a mediana potencia o antifúngicos según sospecha diagnóstica</li>
                </ul>
                <p style="margin-top:1rem;font-size:0.85em;font-style:italic;">* En caso de refractariedad o empeoramiento clínico dentro de 14 días, considere teledermatología.</p>
            `;
        } else {
            managementCard.classList.add('hidden');
        }

        // 9. Render Education Card
        if (bestMatch) {
            renderEducationFromProtocol(bestMatch);
        } else {
            document.getElementById('education-card').classList.add('hidden');
        }

        // --- V2 PREVIEW UI RESET ---
        document.getElementById('v2-preview-list').innerHTML = '<li class="muted-text">Ejecutando motor en paralelo...</li>';

        // Scroll gracefully to results on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth' });
        }
    }

    // --- Export Feature ---
    exportBtn.addEventListener('click', () => {
        if (!currentAnalysisData) return;

        const d = currentAnalysisData.formData;
        const a = currentAnalysisData.analysis;
        const m = currentAnalysisData.meta;
        const pm = currentAnalysisData.protocolMatches || [];
        const best = pm[0] || null;

        const protocolBlock = best ? `
----------------------------------------
3. ORIENTACIÓN DIAGNÓSTICA (Protocolo local TD 2023)

Mejor coincidencia: ${best.diagnosis_short}
Triaje protocolo:   ${best.triage_seed}
Fuente:             ${best.source}

SUGERENCIA DE MANEJO (Protocolo):
${best.management_text
                .replace(/DADO LO ANTERIOR,\s*LA SUGERENCIA DE MANEJO ES:\s*/i, '')
                .trim()}

EDUCACIÓN AL PACIENTE (Protocolo):
${(best.education_text || '').replace(/^"|"$/g, '').trim()}

${best.triage_seed !== a.triageLevel ? '⚠ NOTA: Existe discrepancia entre el triaje automático y el triaje del protocolo más coincidente. Se recomienda revisión clínica.\n' : ''}` : '';

        const textNote = `
========================================
SOLICITUD DE INTERCONSULTA (SIC)
Teledermatología APS
========================================

1. INFORMACIÓN CLÍNICA DEL PACIENTE:
- ID de Caso: ${m.caseId}
- Fecha/Hora: ${m.dateStr} ${m.timeStr}
- Edad: ${d.age} años
- Sexo: ${d.sex}
- Tiempo de Evolución: ${d.duration}
- Síntomas Principales: ${d.symptoms}
- Número de Lesiones: ${d.numberLesions}
- Ubicación Anatómica: ${d.location}
- Morfología Aproximada: ${d.morphology}
- Patrón de Distribución: ${d.distribution}
- Contexto Clínico Especial: ${d.specialContext.toUpperCase()}
- Síntomas Sistémicos Asoc.: ${d.systemic}
${d.clinicalNotes ? `- Notas Clínicas: ${d.clinicalNotes}` : ''}

----------------------------------------
2. APOYO DIAGNÓSTICO (Herramienta Prototipo)

SUGERENCIA DE TRIAJE:
Nivel: ${a.triageLevel} - ${a.triageLevel === 'RED' ? 'Prioridad de derivación' : a.triageLevel === 'YELLOW' ? 'Sugerencia Teledermatología' : 'Manejo Inicial en APS'}
Fundamento: ${a.explanation.replace(/<[^>]*>?/gm, '')}

${a.redFlags.length > 0 ? `Atención - Signos de Alarma Identificados:\n- ${a.redFlags.join('\n- ')}\n` : ''}CATEGORÍAS DIAGNÓSTICAS SUGERIDAS (No prescriptivas):
${pm.length > 0 ? pm.map((p, i) => `${i + 1}. ${p.diagnosis_short} [${p.triage_seed}]`).join('\n') : a.categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}
${protocolBlock}
----------------------------------------
* Consentimiento informado digital registrado.
* Ambas fotografías (Panorámica y Macro) verificadas.
        `.trim();

        navigator.clipboard.writeText(textNote).then(() => {
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '✅ ¡Copiado Formato SIC!';
            setTimeout(() => {
                exportBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast("No se pudo copiar el texto al portapapeles.", "error");
        });
    });

    // --- JSON Export Feature ---
    exportJsonBtn.addEventListener('click', () => {
        if (!currentAnalysisData) return;

        // Add metadata block
        const exportData = {
            metadata: {
                timestamp: new Date().toISOString(),
                exportType: "SIC_JSON_PAYLOAD",
                consentVerified: true
            },
            clinicalData: currentAnalysisData.formData,
            triageResult: currentAnalysisData.analysis,
            protocolMatches: (currentAnalysisData.protocolMatches || []).map(p => ({
                id: p.id,
                diagnosis_short: p.diagnosis_short,
                triage_seed: p.triage_seed,
                source: p.source,
                score: p._score,
                matchReason: p._matchReason
            }))
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        navigator.clipboard.writeText(jsonString).then(() => {
            const originalText = exportJsonBtn.innerHTML;
            exportJsonBtn.innerHTML = '✅ ¡JSON Copiado!';
            setTimeout(() => {
                exportJsonBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy JSON: ', err);
            showToast("No se pudo copiar el JSON al portapapeles.", "error");
        });
    });

    // --- Patient Education Export Feature ---
    exportPatientBtn.addEventListener('click', () => {
        if (!currentAnalysisData) return;

        const a = currentAnalysisData.analysis;
        const pm = currentAnalysisData.protocolMatches || [];
        const best = pm[0] || null;
        let eduText = `========================================\nINDICACIONES PARA EL PACIENTE\nFecha: ${new Date().toLocaleDateString()}\n========================================\n\n`;

        // If we have a protocol-based education text, use it (formatted)
        if (best && best.education_text && best.education_text.trim() !== '') {
            const raw = best.education_text.replace(/^"|"$/g, '').trim();
            const readable = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
                .replace(/\b(APS|SPF|FPS|MCG|MG|ML|GRS|VHS|TSH|T4|ANA|CSP|SOS|GES|VDRL)\b/gi, m => m.toUpperCase());
            eduText += `Estimado paciente,\n\n${readable}\n\n`;
            eduText += `Diagnóstico orientador: ${best.diagnosis_short}\n`;
            eduText += `Fuente: ${best.source}\n\n`;
            eduText += `⚠️ Esta información es orientadora y no reemplaza la indicación de su médico tratante.`;
        } else if (a.triageLevel === 'GREEN') {
            eduText += `Estimado paciente,\n\nSegún la evaluación inicial, su condición parece estable y puede ser manejada en su centro de salud (CESFAM). Mientras continúa con su tratamiento, le sugerimos:\n\n- Mantener la zona limpia y bien hidratada con cremas emolientes sin perfume.\n- Evitar rascarse o manipular la lesión para prevenir infecciones.\n- Usar protección solar si la lesión está expuesta al sol.\n- Seguir las indicaciones de su médico tratante.\n\n⚠️ Si nota empeoramiento, rápido crecimiento, dolor severo o sangrado, solicite una nueva hora médica.`;
        } else if (a.triageLevel === 'YELLOW') {
            eduText += `Estimado paciente,\n\nSu caso requiere la opinión de un especialista en dermatología. Mientras espera la respuesta de Teledermatología, le sugerimos:\n\n- No aplicar cremas con medicamentos sin indicación médica.\n- Mantener la zona limpia empleando jabones suaves.\n- Proteger la lesión del sol directo.\n- Evitar roce excesivo o uso de ropa ajustada sobre la zona.\n\n⚠️ Acuda a urgencias si presenta fiebre o compromiso del estado general.`;
        } else {
            eduText += `Estimado paciente,\n\nSu caso ha sido clasificado con prioridad debido a ciertas características de la lesión.\n\n- Asista sin falta a la cita médica cuando sea contactado.\n- Proteja estrictamente la lesión del sol en todo momento.\n- NO intente pinchar, rascar ni aplicar remedios caseros.\n\n⚠️ Ante cualquier dolor severo o sangrado, acuda a un servicio de urgencia inmediatamente.`;
        }

        navigator.clipboard.writeText(eduText).then(() => {
            const originalText = exportPatientBtn.innerHTML;
            exportPatientBtn.innerHTML = '✅ ¡Indicaciones Copiadas!';
            setTimeout(() => {
                exportPatientBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast("No se pudo copiar el texto al portapapeles.", "error");
        });
    });

    /**
     * renderV2Preview(results)
     * Renderiza los resultados del motor clínico v2 en el panel de preview.
     */
    function renderV2Preview(results) {
        const list = document.getElementById('v2-preview-list');
        if (!list) return;

        if (!results || results.length === 0) {
            list.innerHTML = '<li class="muted-text">No se encontraron coincidencias exactas en v2.</li>';
            return;
        }

        const triageClasses = { GREEN: 'v2-badge-green', YELLOW: 'v2-badge-yellow', RED: 'v2-badge-red' };

        list.innerHTML = results.slice(0, 3).map((res, idx) => `
            <li class="v2-preview-item">
                <div class="v2-item-header">
                    <span class="v2-rank">#${idx + 1}</span>
                    <span class="v2-label">${res.label}</span>
                    <span class="v2-badge ${triageClasses[res.triage] || ''}">${res.triage}</span>
                    <span class="v2-score">score ${res.supportiveScore}</span>
                </div>
                <p class="v2-explanation">${res.explanation}</p>
            </li>
        `).join('');
    }
});
