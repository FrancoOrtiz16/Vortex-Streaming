/* ==========================================================================
   VORTEX STREAMING - DATA & STATE (MODULAR UNIFICADO)
   ========================================================================== */

/**
 * Estado Global del Sistema
 * Se unifica la estructura de la Lógica Nueva con la robustez inicial.
 */
export const state = {
    view: 'login',
    currentUser: null,
    isRegisterMode: false, // Control de interfaz para Auth
    // Lógica Nueva: Metadatos del sistema
    adminStats: {
        income: 9.50,
        serverStatus: "ONLINE"
    },
    data: (function() {
        const defaultData = {
            users: [
                { id: 1, name: "Admin Principal", email: "admin", pass: "admin", role: "ADMIN", status: "Activo" },
                { id: 2, name: "Juan Perez", email: "juan@mail.com", pass: "123", role: "USER", status: "Activo" }
            ],
            // Lógica Nueva: Ventas actualizadas con fechas de expiración (exp)
            sales: [
                { id: 501, client: "Juan Perez", service: "Netflix 4K", amount: 5.50, date: "2026-02-12", exp: "2024-03-08", type: "streaming" },
                { id: 502, client: "Carlos Ruiz", service: "Disney+", amount: 4.00, date: "2026-02-12", exp: "2024-02-12", type: "streaming" }
            ],
            logs: [], // Lógica Nueva: Para el monitor en tiempo real y auditoría
            catalog: {
                streaming: [
                    { name: "NETFLIX", price: 5.00, status: "Disponible" },
                    { name: "DISNEY+", price: 5.00, status: "Disponible" }
                ],
                gaming: [
                    { name: "FREE FIRE", price: 5.00, status: "Disponible" }
                ]
            },
            tickets: [] // <--- Lógica Nueva: Almacén de reportes integrado y asegurado
        };
        
        // Intento de recuperación desde almacenamiento local (Persistencia)
        const saved = localStorage.getItem('vortex_v3_data');
        if (!saved) return defaultData;

        try {
            const parsed = JSON.parse(saved);
            
            // --- VALIDACIONES DE INFRAESTRUCTURA PARA INTEGRIDAD ---
            if (!parsed.users || parsed.users.length === 0) return defaultData;
            
            // Asegurar que el administrador de emergencia siempre exista por seguridad
            const adminExists = parsed.users.some(u => u.email === 'admin');
            if (!adminExists) parsed.users.push(defaultData.users[0]);
            
            // Asegurar integridad de catálogo y las nuevas ramas de datos
            if (!parsed.catalog) parsed.catalog = defaultData.catalog;
            if (!parsed.logs) parsed.logs = []; // Garantiza que el monitor tenga donde escribir
            if (!parsed.tickets) parsed.tickets = []; // <--- Lógica Nueva: Garantiza que el almacén de reportes exista tras la carga
            
            // Lógica Nueva: Asegurar que las ventas existentes tengan el campo exp si se cargan de disco
            if (parsed.sales) {
                parsed.sales = parsed.sales.map((sale, index) => ({
                    ...sale,
                    exp: sale.exp || (index % 2 === 0 ? "2024-03-08" : "2024-02-12")
                }));
            }

            return parsed;
        } catch (e) {
            console.error("Vortex Data Error: Fallo en parsing, restaurando valores de fábrica.");
            return defaultData;
        }
    })(),

    // Servicios base para generación de vistas y fallbacks
    services: {
        streaming: ["NETFLIX", "DISNEY+", "MAX", "Crunchyroll", "PARAMOUNT+", "VIX", "CANVA PRO", "Spotify", "Prime Video", "CapCut Pro"],
        gaming: ["Free Fire", "Roblox", "Valorant", "Mobile Legends", "Genshin Impact"]
    }
};

// Lógica Nueva: Alias para compatibilidad con cálculos externos de ventas
export const salesData = state.data.sales;
export const adminStats = state.adminStats;

/**
 * Lógica Nueva: Persistencia en disco local.
 * Serializa exclusivamente la rama 'data' del estado para mantener la ligereza.
 */
export const saveToDisk = () => {
    try {
        localStorage.setItem('vortex_v3_data', JSON.stringify(state.data));
    } catch (e) {
        console.error("Vortex Critical Error: No se pudo guardar en disco.", e);
    }
};