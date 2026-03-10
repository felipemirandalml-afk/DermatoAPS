/**
 * derm_taxonomy.js
 * Definición de la taxonomía dermatológica clínica para normalización de datos.
 */

window.DermTaxonomy = {
    data: {
        primary_lesions: [
            "macula", "papula", "placa", "nodulo", "tumor", "quiste", "habon", "vesicula", "ampolla", "pustula", "comedon", "vegetacion"
        ],
        secondary_lesions: [
            "escama", "costra", "erosion", "ulcera", "excoriacion", "fisura", "cicatriz", "atrofia", "liquenificacion", "escara"
        ],
        symptoms: [
            "prurito", "dolor", "ardor", "escozor", "parestesia"
        ],
        distributions: [
            "localizado", "generalizado", "simetrico", "asimetrico", "unilateral", "bilateral", "dermatomal", "zosteriforme",
            "lineal", "reticulado", "anular", "arciforme", "numular", "serpiginoso", "agrupado", "disperso", "confluente",
            "flexor", "extensor", "intertriginoso", "fotoexpuesto", "seborreico", "blashkoide", "herpetiforme", "acral"
        ],
        locations: [
            "cara", "cuero_cabelludo", "tronco", "extremidades", "palmas", "plantas", "pliegues", "genital", "mucosa", "uña"
        ],
        temporal_patterns: [
            "agudo", "subagudo", "cronico", "recurrente", "progresivo", "episodico"
        ],
        dermatologic_syndromes: [
            "eritemato_descamativo", "papular_pruriginoso", "vesiculo_ampollar", "pustuloso", "urticarial", "exantematico",
            "pigmentado", "nodular", "ulcerativo", "tumoral", "anexial"
        ]
    },

    /**
     * Normaliza un término: minúsculas y espacios a underscores.
     * @param {string} term 
     * @returns {string}
     */
    normalizeTerm: function (term) {
        if (!term) return "";
        return term.toLowerCase().trim().replace(/\s+/g, "_");
    },

    /**
     * Verifica si una categoría taxonómica contiene un valor específico.
     * @param {string} category 
     * @param {string} value 
     * @returns {boolean}
     */
    taxonomyHas: function (category, value) {
        if (!category || !value || !this.data[category]) return false;
        const normalized = this.normalizeTerm(value);
        return this.data[category].includes(normalized);
    },

    /**
     * Busca a qué categoría pertenece un valor.
     * @param {string} value 
     * @returns {string|null}
     */
    getTaxonomyCategory: function (value) {
        if (!value) return null;
        const normalized = this.normalizeTerm(value);
        for (const category in this.data) {
            if (this.data[category].includes(normalized)) {
                return category;
            }
        }
        return null;
    }
};
