document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker
    /* 
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered!'))
                .catch(err => console.log('SW registration failed: ', err));
        });
    }
    */
    // TEMPORARY: Unregister SW for testing
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }

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

        // Validate Form Data 
        if (!data.age || !data.duration || !data.morphology) {
            alert('Por favor complete al menos la Edad, el Tiempo de evolución y la Morfología para continuar.');
            return;
        }

        // Validate Consent
        if (!consentCheckbox.checked) {
            alert('Debe aceptar el Consentimiento Informado para continuar con el análisis.');
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

    function saveToDataset(data, analysis) {
        try {
            const dataset = JSON.parse(localStorage.getItem('derm-triage-dataset') || '[]');
            dataset.push({
                timestamp: new Date().toISOString(),
                input: data,
                triageLevel: analysis.triageLevel,
                triageExplanation: analysis.explanation,
                suggestedCategories: analysis.categories
            });
            localStorage.setItem('derm-triage-dataset', JSON.stringify(dataset));
        } catch (e) {
            console.error('Failed to save to dataset:', e);
        }
    }

    function runAnalysis(data) {
        const analysis = evaluateTriage(data);
        saveToDataset(data, analysis);
        displayResults(data, analysis);
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
    // PROTOCOL ENGINE — Basado en PROTOCOL_DB (protocol_db.js)
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
        const id = protocol.id;

        // --- Morphology-based rules ---
        if (m === 'scaling lesion') {
            // Psoriasis / Pitiriasis / Eccema / Dermatitis seborreica
            if (tags.some(t => ['psoriasis', 'descamacion', 'pitiriasis', 'eccema', 'seborreica', 'numular', 'hipostatico'].includes(t))) score += 4;
            // Onicomicosis if nails
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
        if (dist === 'extensor') {
            if (tags.includes('psoriasis')) score += 2;
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

        // --- Number of lesions ---
        if (num === 'generalized') {
            if (tags.some(t => ['generalizado', 'urticaria', 'psoriasis', 'pitiriasis', 'vitiligo'].includes(t))) score += 2;
        }
        if (num === 'single') {
            if (tags.some(t => ['verruga', 'queratosis actinica', 'localizado'].includes(t))) score += 1;
        }

        // Nail involvement note in clinical notes
        const notes = (data.clinicalNotes || '').toLowerCase();
        if (notes.includes('uñas') || notes.includes('onicomicosis')) {
            if (tags.includes('onicomicosis')) score += 3;
        }
        if (notes.includes('pelo') || notes.includes('caída') || notes.includes('alopecia')) {
            if (tags.includes('alopecia')) score += 3;
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
        const top3 = scored.slice(0, 3).filter(item => item.score > 0);

        return top3.map(item => ({
            ...item.protocol,
            _score: item.score,
            _matchReason: buildMatchReason(item.protocol, data)
        }));
    }

    function buildMatchReason(protocol, data) {
        const tags = protocol.tags;
        const reasons = [];
        if (data.morphology && tags.some(t => data.morphology.toLowerCase().split(/[\/\s]/).some(w => t.includes(w)))) {
            reasons.push(`morfología compatible`);
        }
        if (data.location && tags.some(t => data.location.toLowerCase().split(/[\s]/).some(w => t.includes(w)))) {
            reasons.push(`ubicación relacionada`);
        }
        if (data.symptoms && tags.some(t => t.includes(data.symptoms.toLowerCase()))) {
            reasons.push(`síntomas compatibles`);
        }
        if (data.distribution && tags.some(t => t.includes(data.distribution.toLowerCase()))) {
            reasons.push(`patrón de distribución coincidente`);
        }
        if (reasons.length === 0) reasons.push('asociación clínica por contexto');
        return reasons.slice(0, 2).join(', ');
    }

    /**
     * formatManagementText(rawText)
     * Converts numbered all-caps protocol text into readable HTML.
     */
    function formatManagementText(raw) {
        if (!raw) return '';
        // Split by numbered steps like "1.- " or "2.-" or "3."
        const lines = raw
            .replace(/DADO LO ANTERIOR,\s*LA SUGERENCIA DE MANEJO ES:\s*/i, '')
            .split(/(?=\d+\.[-–]?\s)/)
            .map(s => s.trim())
            .filter(Boolean);

        if (lines.length <= 1) {
            // No numbered structure — wrap as paragraph
            return `<p>${toTitleCase(raw.replace(/DADO LO ANTERIOR,\s*LA SUGERENCIA DE MANEJO ES:\s*/i, '').trim())}</p>`;
        }

        const items = lines.map(line => {
            // Strip leading number+dash and convert to sentence case
            const clean = line.replace(/^\d+\.[-–]?\s*/, '').trim();
            return `<li>${toTitleCase(clean)}</li>`;
        }).join('');

        return `<ol class="protocol-management-list">${items}</ol>`;
    }

    /**
     * formatEducationText(rawText)
     * Converts all-caps educational text to readable paragraphs.
     */
    function formatEducationText(raw) {
        if (!raw) return '';
        const clean = raw
            .replace(/^"\s*|\s*"$/g, '') // remove surrounding quotes
            .trim();
        // Split into paragraphs by double-newline or numbered lines
        const paragraphs = clean.split(/\n{1,}/).map(p => p.trim()).filter(Boolean);
        if (paragraphs.length <= 1) {
            return `<p>${toTitleCase(clean)}</p>`;
        }
        return paragraphs.map(p => `<p>${toTitleCase(p)}</p>`).join('');
    }

    /** Simple title-case converter for Spanish all-caps clinical text */
    function toTitleCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
            // Fix common abbreviations that should stay uppercase
            .replace(/\b(aps|spf|fps|mcg|mg|ml|grs|vhs|tsh|t4|ana|csp|sos|ges|vdrl|ldr)\b/gi, m => m.toUpperCase())
            .replace(/\b([A-ZÁÉÍÓÚÜÑ]{2,})\b/g, m => m.charAt(0) + m.slice(1).toLowerCase());
    }

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

    function displayResults(data, analysis) {
        // Toggle visibility
        emptyResults.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        // Generate Metadata
        const oldData = currentAnalysisData?.meta;
        const caseId = oldData ? oldData.caseId : 'CAS-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const now = new Date();
        const dateStr = oldData ? oldData.dateStr : now.toLocaleDateString();
        const timeStr = oldData ? oldData.timeStr : now.toLocaleTimeString();
        currentAnalysisData = { formData: data, analysis: analysis, meta: { caseId, dateStr, timeStr } };

        document.getElementById('meta-id').textContent = `ID: ${caseId}`;
        document.getElementById('meta-date').textContent = `Fecha: ${dateStr}`;
        document.getElementById('meta-time').textContent = `Hora: ${timeStr}`;

        // 1. Render Clinical Summary
        clinicalSummaryList.innerHTML = `
            <li><span class="summary-label">Sexo</span><span class="summary-value" style="text-transform: capitalize;">${data.sex}</span></li>
            <li><span class="summary-label">Edad</span><span class="summary-value">${data.age} años</span></li>
            <li><span class="summary-label">Evolución</span><span class="summary-value">${data.duration}</span></li>
            <li><span class="summary-label">Síntomas</span><span class="summary-value" style="text-transform: capitalize;">${data.symptoms}</span></li>
            <li><span class="summary-label">N° Lesiones</span><span class="summary-value" style="text-transform: capitalize;">${data.numberLesions}</span></li>
            <li><span class="summary-label">Ubicación</span><span class="summary-value" style="text-transform: capitalize;">${data.location}</span></li>
            <li><span class="summary-label">Morfología</span><span class="summary-value" style="text-transform: capitalize;">${data.morphology}</span></li>
            <li><span class="summary-label">Distribución</span><span class="summary-value" style="text-transform: capitalize;">${data.distribution}</span></li>
            <li><span class="summary-label">Contexto Clínico</span><span class="summary-value" style="text-transform: capitalize;">${data.specialContext}</span></li>
            <li><span class="summary-label">Sistémico</span><span class="summary-value" style="text-transform: capitalize;">${data.systemic}</span></li>
            ${data.clinicalNotes ? `<li style="grid-column: 1 / -1; margin-top: 0.5rem;"><span class="summary-label">Notas</span><span class="summary-value">${data.clinicalNotes}</span></li>` : ''}
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

        // 5. Run Protocol Engine
        const protocolMatches = findMatchingProtocols(data);
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
            alert("No se pudo copiar el texto al portapapeles. Ve la consola para detalles.");
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
                consentVerfied: true
            },
            clinicalData: currentAnalysisData.formData,
            triageResult: currentAnalysisData.analysis
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
            alert("No se pudo copiar el JSON al portapapeles.");
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
            alert("No se pudo copiar el texto al portapapeles.");
        });
    });
});
