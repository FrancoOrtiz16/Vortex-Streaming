/* ==========================================================================
   VORTEX STREAMING - DATA & STATE (MODULAR UNIFICADO)
   ========================================================================== */

// Exportamos el estado con la estructura de la Lógica Nueva
export const state = {
    view: 'login',
    currentUser: null,
    isRegisterMode: false,
    data: (function() {
        const defaultData = {
            users: [
                { id: 1, name: "Admin Principal", email: "admin", pass: "admin", role: "ADMIN", status: "Activo" },
                { id: 2, name: "Juan Perez", email: "juan@mail.com", pass: "123", role: "USER", status: "Activo" }
            ],
            sales: [
                { id: 101, client: "Admin Principal", service: "NETFLIX 4K", amount: 5.50, date: "2026-02-12", type: "streaming" }
            ],
            logs: [], // Campo requerido por la nueva lógica
            catalog: {
                streaming: [
                    { name: "NETFLIX", price: 5.00, status: "Disponible" },
                    { name: "DISNEY+", price: 5.00, status: "Disponible" }
                ],
                gaming: [
                    { name: "FREE FIRE", price: 5.00, status: "Disponible" }
                ]
            }
        };
        
        const saved = localStorage.getItem('vortex_v3_data');
        if (!saved) return defaultData;

        try {
            const parsed = JSON.parse(saved);
            
            // Verificaciones de integridad para no dañar la infraestructura
            if (!parsed.users || parsed.users.length === 0) return defaultData;
            
            // Asegurar que el administrador siempre exista
            const adminExists = parsed.users.some(u => u.email === 'admin');
            if (!adminExists) parsed.users.push(defaultData.users[0]);
            
            // Asegurar existencia de catálogo y logs
            if (!parsed.catalog) parsed.catalog = defaultData.catalog;
            if (!parsed.logs) parsed.logs = [];
            
            return parsed;
        } catch (e) {
            console.error("Vortex Data Error: Restaurando default por seguridad.");
            return defaultData;
        }
    })(),
    // Mantenemos la lista de servicios iniciales para mapeos rápidos
    services: {
        streaming: ["NETFLIX", "DISNEY+", "MAX", "Crunchyroll", "PARAMOUNT+", "VIX", "CANVA PRO", "Spotify", "Prime Video", "CapCut Pro"],
        gaming: ["Free Fire", "Roblox", "Valorant", "Mobile Legends", "Genshin Impact"]
    }
};

/**
 * Persistencia en disco local
 * Exportada individualmente según la Lógica Nueva
 */
export const saveToDisk = () => {
    localStorage.setItem('vortex_v3_data', JSON.stringify(state.data));
};