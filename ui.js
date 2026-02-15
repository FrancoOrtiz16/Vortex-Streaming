/* ==========================================================================
   VORTEX STREAMING - UI & ROUTING (MODULAR UNIFICADO)
   ========================================================================== */

import { app } from './app.js';

/**
 * Lógica Nueva: Entrada al sistema
 */
export const enterSystem = () => {
    // Redirige al catálogo principal (market)
    app.router('market'); 
};

/**
 * Enrutador principal del sistema
 */
export function router(view) {
    app.state.view = view;
    const container = document.getElementById('app-content');
    const menu = document.getElementById('side-menu-vortex');
    
    if(!container) return;
    if(menu) menu.classList.remove('active');

    if (['streaming', 'gaming'].includes(view)) {
        const list = app.state.data.catalog[view] || [];
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
    else if (view === 'market') {
        container.innerHTML = `<h1 class="fade-in">Catálogo Elite</h1><div class="bento-grid" id="grid"></div>`;
        const grid = document.getElementById('grid');
        const category = 'streaming';
        const source = (app.state.data.catalog && app.state.data.catalog[category]) 
                       ? app.state.data.catalog[category] 
                       : app.state.services[category].map(n => ({ name: n, price: 5.00, status: 'Disponible' }));

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
    else if (view === 'admin') {
        // Llama a la función de renderizado administrativo desde app
        app.renderAdmin(container);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
    const u = app.state.currentUser;
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