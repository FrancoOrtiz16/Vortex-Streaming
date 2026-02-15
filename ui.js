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
    // Panel de Administración (Command Center Unificado)
    else if (view === 'admin') {
        renderAdmin(container);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Lógica Nueva Unificada: Renderizado administrativo (COMMAND CENTER)
 * Integra el Monitor de Actividad, Widget de ventas y Editor de Servicios.
 */
export const renderAdmin = (container) => {
    const { data } = window.app.state;
    
    container.innerHTML = `
        <div class="admin-dashboard fade-in" style="padding: 20px; color: white; font-family: sans-serif;">
            <h2 style="color: #00f2ff; font-family: 'Orbitron', sans-serif; margin-bottom: 20px;">COMMAND CENTER</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px; margin-bottom: 30px;">
                <div class="card" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,242,255,0.3); padding: 20px; border-radius: 15px;">
                    <h3 style="font-size: 12px; color: #00f2ff; margin-bottom: 15px; font-family: 'Orbitron';">MONITOR DE ACTIVIDAD</h3>
                    <div style="max-height: 180px; overflow-y: auto; font-family: monospace; font-size: 11px;">
                        ${(data.logs || []).map(l => `
                            <div style="margin-bottom: 8px; border-left: 2px solid ${l.type === 'WARN' ? '#ff4d4d' : '#4ade80'}; padding-left: 10px;">
                                <span style="opacity: 0.5;">[${l.time}]</span> <b>${l.type}:</b> ${l.msg}
                            </div>
                        `).join('') || '<div style="opacity:0.5;">Esperando datos...</div>'}
                    </div>
                </div>
                <div class="card" style="background: #00f2ff; color: black; padding: 20px; border-radius: 15px; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                    <p style="font-size: 10px; font-weight: bold; margin: 0;">ÚLTIMA VENTA</p>
                    <h2 style="margin: 10px 0; font-family: 'Orbitron';">$${data.sales && data.sales.length ? data.sales[data.sales.length-1].amount.toFixed(2) : '0.00'}</h2>
                    <small style="font-weight: bold; opacity: 0.7;">${data.sales && data.sales.length ? data.sales[data.sales.length-1].service : 'No hay ventas'}</small>
                </div>
            </div>

            <div class="card" style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 14px; font-family: 'Orbitron';">INVENTARIO DE PRODUCTOS</h3>
                    <div>
                        <button onclick="app.addService('streaming')" style="background: #00f2ff; border:none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor:pointer;">+ STREAMING</button>
                        <button onclick="app.addService('gaming')" style="background: #a855f7; color:white; border:none; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor:pointer; margin-left: 10px;">+ GAMING</button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${['streaming', 'gaming'].map(cat => `
                        <div>
                            <h4 style="font-size: 11px; opacity: 0.5; text-transform: uppercase; margin-bottom: 15px; color: #00f2ff;">${cat}</h4>
                            ${(data.catalog[cat] || []).map((item, i) => `
                                <div style="display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; margin-bottom: 10px; gap: 10px; border: 1px solid rgba(255,255,255,0.03);">
                                    <img src="${item.img || 'https://via.placeholder.com/40'}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; background: #222;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 13px; font-weight: bold;">${item.name}</div>
                                        <div style="font-size: 11px; color: #4ade80;">$${item.price.toFixed(2)}</div>
                                    </div>
                                    <div style="display: flex; gap: 5px;">
                                        <button onclick="app.editProduct('${cat}', ${i})" style="background:none; border: 1px solid #00f2ff; color: #00f2ff; font-size: 9px; padding: 4px 8px; cursor:pointer; border-radius: 4px; font-weight: bold;">EDITAR</button>
                                        <button onclick="app.toggleStock('${cat}', ${i})" style="background:${item.status === 'Disponible' ? '#4ade80' : '#ff4d4d'}; color: black; border:none; font-size: 9px; padding: 4px 8px; cursor:pointer; border-radius: 4px; font-weight:bold;">${item.status === 'Disponible' ? 'ACTIVO' : 'OFF'}</button>
                                        <button onclick="app.deleteService('${cat}', ${i})" style="background:none; border:none; color: #ff4d4d; font-size: 18px; cursor:pointer; font-weight:bold; line-height: 1;">&times;</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <button onclick="app.router('market')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; cursor: pointer; font-size: 12px; margin-top: 20px; width: 100%; font-weight: bold;">SALIR AL CATÁLOGO</button>
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