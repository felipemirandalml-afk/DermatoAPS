/**
 * PROTOCOLS V2 - Base Clínica Estructurada
 * Esta es una refactorización de PROTOCOL_DB para un modelo clínico más granular y expandible.
 * Versión: 2.0.0
 * Fecha de revisión: 2026-03-10
 */

export const PROTOCOLS_V2 = [
  {
    id: "acne_inflamatorio_leve",
    label: "Acné inflamatorio leve",
    category: "inflammatory",

    triage: {
      default: "GREEN",
      escalationRules: [
        { condition: "pustulas abundantes o nodulos", target: "YELLOW" }
      ]
    },

    match: {
      required: {
        morphology: ["comedones", "papulas", "pustulas"],
        location: ["rostro"]
      },

      supportive: {
        symptoms: ["seborrea"],
        duration: ["cronico"]
      },

      exclusions: ["nodulos", "quistes", "cicatrices profundas"]
    },

    redFlags: [],

    apsManagement: {
      generalMeasures: [
        "No apretar lesiones",
        "No consumir en exceso lácteos y sus derivados",
        "No dejar el pelo en rostro",
        "Uso de jabones que tiendan a disminuir la seborrea facial mañana y noche"
      ],
      drugs: [
        "Protección solar en gel o fluido SPF 30 o 50 (mañana, mediodía y cada 2h al sol)",
        "Adapaleno 0,1% gel o crema: Aplicar en la noche capa fina, evitar párpados (comenzar noche por medio)"
      ],
      followUp: "Control por Teledermatología en 3 meses"
    },

    patientEducation: [
      "Explicar la importancia del autocuidado y la constancia en el tratamiento.",
      "Mencionar que no se tiene la cura total, pero con rigor mejoran significativamente las lesiones."
    ],

    referral: {
      telederm: true,
      specialist: false,
      urgency: false
    },

    evidence: {
      source: "PROTOCOLOS TD 2023",
      version: "TD2023-v1.0",
      reviewedAt: "2026-03-10"
    }
  },

  {
    id: "dermatitis_atopica_leve",
    label: "Dermatitis atópica",
    category: "inflammatory",

    triage: {
      default: "GREEN",
      escalationRules: [
        { condition: "eritrodermia o infeccion secundaria", target: "RED" }
      ]
    },

    match: {
      required: {
        morphology: ["eczema", "placas eritematosas", "xerosis"],
        location: ["flexuras", "rostro (en lactantes)", "dorso manos"]
      },

      supportive: {
        symptoms: ["prurito intenso"],
        duration: ["recurrente", "cronico"]
      },

      exclusions: ["eritrodermia", "fiebre", "infeccion secundaria"]
    },

    redFlags: ["eritrodermia", "fiebre", "pustulas sobre brote (eccema herpético)"],

    apsManagement: {
      generalMeasures: [
        "Baños cortos (menos de 3 minutos) con agua tibia",
        "Uso mínimo de jabón (solo axilas, genitales y pies)",
        "Ropa de algodón, evitar lana y fibras sintéticas",
        "Evitar suavizantes de ropa y perfumes"
      ],
      drugs: [
        "Hidrocortisona 1% crema: 2 veces al día por 7 días en lesiones",
        "Lubricación diaria con crema humectante neutra (vaselina sólida, Nivea tapa azul o similar)",
        "Antihistamínicos si hay prurito (Hidroxicina jarabe según peso o clorfenamina)"
      ],
      followUp: "Control por Teledermatología en 1 mes"
    },

    patientEducation: [
      "Informar que es un cuadro crónico con reactivaciones periódicas.",
      "Las medidas generales de higiene son la base para evitar brotes severos."
    ],

    referral: {
      telederm: true,
      specialist: false,
      urgency: false
    },

    evidence: {
      source: "PROTOCOLOS TD 2023",
      version: "TD2023-v1.0",
      reviewedAt: "2026-03-10"
    }
  },

  {
    id: "pitiriasis_versicolor",
    label: "Pitiriasis versicolor",
    category: "infectious",

    triage: {
      default: "GREEN",
      escalationRules: []
    },

    match: {
      required: {
        morphology: ["maculas hipopigmentadas", "maculas hiperpigmentadas", "fina descamacion"],
        location: ["tronco", "hombros", "cuello"]
      },

      supportive: {
        symptoms: ["leve prurito"],
        duration: ["semanas", "meses"]
      },

      exclusions: []
    },

    redFlags: [],

    apsManagement: {
      generalMeasures: [
        "Mantener zonas secas",
        "Evitar uso de aceites corporales"
      ],
      drugs: [
        "Ketoconazol shampoo 2%: Jabonar zonas afectadas a diario, dejar espuma 3-5 min por 2 semanas",
        "Fluconazol 150 mg: 1 comprimido a la semana por 4 semanas (si no hay contraindicaciones)"
      ],
      followUp: "Reevaluar en 1 mes"
    },

    patientEducation: [
      "La descamación mejora rápido, pero las manchas persisten varios meses tras curar la infección.",
      "Es una condición recurrente gatillada por calor y humedad."
    ],

    referral: {
      telederm: true,
      specialist: false,
      urgency: false
    },

    evidence: {
      source: "PROTOCOLOS TD 2023",
      version: "TD2023-v1.0",
      reviewedAt: "2026-03-10"
    }
  },

  {
    id: "queratosis_actinica",
    label: "Queratosis actínica",
    category: "neoplastic",

    triage: {
      default: "RED",
      escalationRules: []
    },

    match: {
      required: {
        morphology: ["lesion eritematosa", "superficie aspera/lija", "escama adherente"],
        location: ["zonas fotoexpuestas", "cara", "cuero cabelludo (alopecicos)", "dorso manos"]
      },

      supportive: {
        symptoms: ["dolor al roce", "sangrado ocasional"],
        duration: ["cronico"]
      },

      exclusions: ["induracion", "crecimiento rapido", "ulceracion"]
    },

    redFlags: ["induracion", "crecimiento rapido", "ulceracion (sospecha de carcinoma espinocelular)"],

    apsManagement: {
      generalMeasures: [
        "Uso estricto de fotoprotección",
        "Evitar exposición solar en horas de mayor radiación"
      ],
      drugs: [
        "Filtro solar SPF 50+ cada 3-4 horas"
      ],
      followUp: "Derivación prioritaria a especialista"
    },

    patientEducation: [
      "Es una lesión premaligna por daño solar acumulado.",
      "Requiere eliminación por parte del dermatólogo (crioterapia o cirugía)."
    ],

    referral: {
      telederm: false,
      specialist: true,
      urgency: true
    },

    evidence: {
      source: "PROTOCOLOS TD 2023",
      version: "TD2023-v1.0",
      reviewedAt: "2026-03-10"
    }
  },

  {
    id: "psoriasis_vulgar_leve",
    label: "Psoriasis vulgar leve",
    category: "inflammatory",

    triage: {
      default: "YELLOW",
      escalationRules: [
        { condition: "compromiso >10% superficie corporal", target: "RED" }
      ]
    },

    match: {
      required: {
        morphology: ["placas eritematosas", "escama blanquecina gruesa"],
        location: ["codos", "rodillas", "zona lumbosacra", "cuero cabelludo"]
      },

      supportive: {
        symptoms: ["prurito ocasional"],
        duration: ["cronico"]
      },

      exclusions: ["artritis", "compromiso ungueal severo", "eritrodermia"]
    },

    redFlags: ["artritis (dolor articular)", "compromiso ungueal severo", "eritrodermia"],

    apsManagement: {
      generalMeasures: [
        "Humectación profunda constante",
        "Manejo del estrés",
        "Evitar el rascado (fenómeno de Koebner)"
      ],
      drugs: [
        "Clobetasol 0.05% ungüento: 2 veces al día por 10-14 días en placas localizadas",
        "Vaselina solid para humectación diaria",
        "Levocetirizina 5mg si hay prurito intenso"
      ],
      followUp: "Control por Teledermatología en 3 meses"
    },

    patientEducation: [
      "Enfermedad crónica y recurrente, no contagiosa.",
      "El control metabólico y evitar alcohol/tabaco ayudan al manejo del cuadro."
    ],

    referral: {
      telederm: true,
      specialist: false,
      urgency: false
    },

    evidence: {
      source: "PROTOCOLOS TD 2023",
      version: "TD2023-v1.0",
      reviewedAt: "2026-03-10"
    }
  }
];
