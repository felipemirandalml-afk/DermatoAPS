/**
 * ANATOMY MAP V2 - Jerarquía Anatómica Dermatológica
 * Define relaciones de "es parte de" para expandir la cobertura del motor.
 */

export const ANATOMY_HIERARCHY = {
    // ROSTRO
    "frente": "rostro",
    "mejilla": "rostro",
    "pomulo": "rostro",
    "menton": "rostro",
    "nariz": "rostro",
    "parpado": "rostro",
    "labio": "rostro",
    "peribucal": "rostro",
    "retroauricular": "rostro",
    "face": "rostro",
    
    // TRONCO
    "pecho": "tronco",
    "abdomen": "tronco",
    "espalda": "tronco",
    "lumbosacra": "tronco",
    "hombro": "tronco",
    "trunk": "tronco",
    
    // EXTREMIDADES SUPERIORES
    "axila": "flexuras",
    "brazo": "extremidades",
    "antebrazo": "extremidades",
    "codo": "extensora",
    "fosa cubital": "flexuras",
    "muñeca": "extremidades",
    "dorso manos": "extensora",
    "palma": "palmo-plantar",
    "upper limbs": "extremidades",
    
    // EXTREMIDADES INFERIORES
    "muslo": "extremidades",
    "rodilla": "extensora",
    "pierna": "extremidades",
    "fosa poplitea": "flexuras",
    "tobillo": "extremidades",
    "pie": "extremidades",
    "planta": "palmo-plantar",
    "interdigital": "flexuras",
    "lower limbs": "extremidades",
    
    // ESPECIALES
    "cuero cabelludo": "fotoexpuesta",
    "scalp": "cuero cabelludo",
    "cara": "fotoexpuesta",
    "cuello": "fotoexpuesta",
    "escote": "fotoexpuesta"
};

/**
 * Obtiene todos los ancestros de un término anatómico.
 * @param {string} location - El término específico.
 * @returns {Array} - Lista que incluye el término y sus contenedores.
 */
export function getAnatomyAncestors(location) {
    if (!location) return [];
    const term = location.toLowerCase();
    const result = [term];
    
    let current = term;
    while (ANATOMY_HIERARCHY[current]) {
        current = ANATOMY_HIERARCHY[current];
        if (result.includes(current)) break; // Evitar ciclos
        result.push(current);
    }
    
    return result;
}
