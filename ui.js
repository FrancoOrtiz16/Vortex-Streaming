/* ==========================================================================
   VORTEX STREAMING - UI & ROUTING (MODULAR UNIFICADO)
   ========================================================================== */

import { state } from './data.js';

/**
 * Lógica Nueva: Entrada al sistema.
 * Utiliza el objeto global window.app para coordinar la navegación.
 */
export const enterSystem = () => {
    // Redirige al catálogo principal (market) utilizando la referencia global
    if (window.app && window.app.router) {
        window.app.router('market');
    }
};

/**
 * Enrutador principal del sistema.
 * Maneja el renderizado dinámico de vistas manteniendo la estética elite.
 */
export const router = (view) => {
    state.view = view;
    const container = document.getElementById('app-content');
    const menu = document.getElementById('side-menu-vortex');
    
    if(!container) return;
    if(menu) menu.classList.remove('active');

    // Renderizado de categorías específicas (Streaming / Gaming)
    if (['streaming', 'gaming'].includes(view)) {
        const list = state.data.catalog[view] || [];
        container.innerHTML = `<h1 class="fade-in">Catálogo ${view.toUpperCase()}</h1><div class="bento-grid" id="grid"></div>`;
        const grid = document.getElementById('grid');
        
        list.forEach(item => {
            grid.innerHTML += `
                <div class="card vortex-item fade-in" style="opacity: ${item.status === 'Agotado' ? '0.5' : '1'}">
                    <div class="badge">${item.status}</div>
                    <h3 class="title">${item.name}</h3>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    <button class="btn-adquirir" ${item.status === 'Agotado' ? 'disabled' : ''} 
                            onclick="app.registrarCompra('${item.name}', ${item.price}, '${view}')">
                        ${item.status === 'Disponible' ? 'ADQUIRIR' : 'SIN STOCK'}
                    </button>
                </div>`;
        });
    } 
    // Vista Market (Catálogo Principal)
    else if (view === 'market') {
        container.innerHTML = `<h1 class="fade-in">Catálogo Elite</h1><div class="bento-grid" id="grid"></div>`;
        const grid = document.getElementById('grid');
        const category = 'streaming';
        
        // Priorizar datos del catálogo persistente o fallback a servicios predefinidos
        const source = (state.data.catalog && state.data.catalog[category]) 
                       ? state.data.catalog[category] 
                       : (state.services ? state.services[category].map(n => ({ name: n, price: 5.00, status: 'Disponible' })) : []);

        source.forEach(item => {
            const isAgotado = item.status === 'Agotado';
            grid.innerHTML += `
                <div class="card vortex-item fade-in ${isAgotado ? 'agotado' : ''}">
                    <div class="badge">${isAgotado ? 'AGOTADO' : 'VORTEX'}</div>
                    <h3 class="title">${item.name}</h3>
                    <p class="price">$${parseFloat(item.price).toFixed(2)}</p>
                    <button class="btn-adquirir pay-btn btc" ${isAgotado ? 'disabled' : ''} 
                            onclick="app.registrarCompra('${item.name}', ${item.price}, 'streaming')">
                        ${isAgotado ? 'SIN STOCK' : 'ADQUIERE'}
                    </button>
                </div>`;
        });
    }
    // Panel de Administración
    else if (view === 'admin') {
        if (window.app && window.app.renderAdmin) {
            window.app.renderAdmin(container);
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Renderizado administrativo (Exportado para el objeto app)
 */
export const renderAdmin = (container) => {
    // Esta función es consumida por el admin.js o inyectada por el core
    if (window.app && window.app.initAdminPanel) {
        window.app.initAdminPanel(container);
    } else {
        container.innerHTML = `<h1 class="fade-in">Panel de Control</h1><p>Cargando módulos administrativos...</p>`;
    }
};

/**
 * Control del campo de búsqueda
 */
export function toggleSearchField() {
    const sc = document.getElementById('search-input-container');
    if (sc) sc.classList.toggle('active');
}

/**
 * Control del menú lateral
 */
export function toggleModernMenu() {
    const menu = document.getElementById('side-menu-vortex');
    if (menu) menu.classList.toggle('active');
}

/**
 * Control de la tarjeta de usuario
 */
export function toggleUserCard() {
    const card = document.getElementById('user-info-card');
    if (!card) return;
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) {
        loadCurrentUserData();
    }
}

/**
 * Carga de datos del usuario actual en la interfaz
 */
export function loadCurrentUserData() {
    const u = state.currentUser;
    if (u) {
        const userVal = document.getElementById('val-user');
        const passVal = document.getElementById('val-pass');
        if (userVal) userVal.textContent = u.email;
        if (passVal) {
            passVal.setAttribute('data-real-pass', u.pass);
            passVal.textContent = '••••••••';
            passVal.style.color = '#e2e8f0';
        }
    }
}

/**
 * Revelar/Ocultar contraseña en la interfaz
 */
export function revealPass() {
    const ps = document.getElementById('val-pass');
    if (!ps) return;
    const real = ps.getAttribute('data-real-pass');
    if (ps.textContent === '••••••••') {
        ps.textContent = real;
        ps.style.color = '#00f2ff';
    } else {
        ps.textContent = '••••••••';
        ps.style.color = '#e2e8f0';
    }
}