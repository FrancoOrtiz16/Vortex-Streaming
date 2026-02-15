/* ==========================================================================
   VORTEX STREAMING - UI & ROUTING (MODULAR UNIFICADO)
   ========================================================================== */

import { state } from './data.js';

/**
 * Lógica Nueva: Entrada al sistema.
 * Utiliza el objeto global window.app para coordinar la navegación.
 */
export const enterSystem = () => {
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
        renderAdmin(container);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Lógica Nueva Unificada: Renderizado administrativo
 * Integra el Monitor de Sistema y el Editor de Servicios con Imágenes.
 */
export const renderAdmin = (container) => {
    const { data } = window.app.state;
    
    container.innerHTML = `
        <div class="admin-grid fade-in" style="display: flex; flex-direction: column; gap: 20px; padding: 20px; color: white;">
            
            <div class="card" style="background: rgba(0,0,0,0.4); border: 1px solid #00f2ff; padding: 15px; border-radius: 12px;">
                <h3 style="font-size: 12px; color: #00f2ff; margin-bottom: 10px; font-family: Orbitron;">MONITOR DE SISTEMA</h3>
                <div style="max-height: 150px; overflow-y: auto; font-family: monospace; font-size: 11px;">
                    ${(data.logs || []).map(l => `
                        <div style="margin-bottom: 5px; border-left: 2px solid ${l.type === 'WARN' ? '#ff4d4d' : '#00f2ff'}; padding-left: 8px;">
                            <span style="opacity: 0.5;">[${l.time}]</span> <b>${l.type}:</b> ${l.msg}
                        </div>
                    `).join('') || '<div style="opacity:0.5;">Esperando actividad...</div>'}
                </div>
            </div>

            <div class="card" style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <h3 style="margin-bottom: 15px; font-family: Orbitron; font-size: 14px;">EDITOR DE SERVICIOS</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    ${['streaming', 'gaming'].map(cat => `
                        <div>
                            <h4 style="font-size: 10px; opacity: 0.6; text-transform: uppercase; margin-bottom: 10px; color: var(--primary);">${cat}</h4>
                            ${(data.catalog[cat] || []).map((item, i) => `
                                <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.03);">
                                    <img src="${item.img || 'https://via.placeholder.com/40'}" style="width: 30px; height: 30px; border-radius: 4px; object-fit: cover; background: #222;">
                                    <div style="flex: 1; font-size: 11px;"><b>${item.name}</b><br><span style="color: #4ade80;">$${item.price}</span></div>
                                    <button onclick="app.editProduct('${cat}', ${i})" style="background: none; border: 1px solid #00f2ff; color: #00f2ff; font-size: 9px; padding: 3px 6px; cursor: pointer; border-radius: 4px; font-weight: bold;">EDITAR</button>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>

            <button onclick="app.router('market')" style="background: #333; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 12px;">SALIR DEL PANEL</button>
        </div>
    `;
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