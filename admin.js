/* ==========================================================================
   VORTEX STREAMING - ADMIN PANEL (MODULAR UNIFICADO)
   ========================================================================== */

import { app } from './app.js';

/**
 * Cambia el estado (Baneado/Activo) de un usuario
 */
export function updateUserStatus(userId, newStatus) {
    const user = app.state.data.users.find(u => u.id === userId);
    if (user && user.role !== 'ADMIN') {
        user.status = newStatus;
        app.saveToDisk();
        app.renderAdmin(document.getElementById('app-content'));
        app.showToast(`Estado de ${user.name}: ${newStatus}`);
    }
}

/**
 * Modifica la contraseña de un usuario desde el panel
 */
export function changeUserPass(userId) {
    const user = app.state.data.users.find(u => u.id === userId);
    if (user) {
        const newPass = prompt(`Nueva clave para ${user.email}:`, user.pass);
        if (newPass) {
            user.pass = newPass;
            app.saveToDisk();
            app.renderAdmin(document.getElementById('app-content'));
            app.showToast("Contraseña actualizada");
        }
    }
}

/**
 * Agrega un nuevo servicio al catálogo (Streaming o Gaming)
 */
export function addService(category) {
    const name = prompt(`Nombre del nuevo servicio para ${category.toUpperCase()}:`);
    const price = prompt(`Precio para ${name}:`, "5.00");
    if (name && price) {
        if (!app.state.data.catalog) app.state.data.catalog = { streaming: [], gaming: [] };
        if (!app.state.data.catalog[category]) app.state.data.catalog[category] = [];
        
        app.state.data.catalog[category].push({
            name: name.toUpperCase(),
            price: parseFloat(price),
            status: 'Disponible'
        });
        
        app.saveToDisk();
        app.renderAdmin(document.getElementById('app-content'));
        app.showToast(`${name} agregado al catálogo`);
    }
}

/**
 * Alterna entre Disponible y Agotado
 */
export function toggleServiceStatus(category, index) {
    const item = app.state.data.catalog[category][index];
    item.status = item.status === 'Disponible' ? 'Agotado' : 'Disponible';
    app.saveToDisk();
    app.renderAdmin(document.getElementById('app-content'));
}

/**
 * Elimina un servicio del catálogo
 */
export function deleteService(category, index) {
    if (confirm("¿Seguro que quieres eliminar este servicio?")) {
        app.state.data.catalog[category].splice(index, 1);
        app.saveToDisk();
        app.renderAdmin(document.getElementById('app-content'));
    }
}

/**
 * Renderiza la interfaz completa del Dashboard Administrativo
 */
export function renderAdmin(container) {
    if (!container) return;
    const data = app.state.data;
    const totalSales = data.sales.reduce((acc, s) => acc + s.amount, 0).toFixed(2);
    const totalUsers = data.users.length;

    container.innerHTML = `
        <div class="admin-view fade-in" style="padding:20px; color:white;">
            <h2 style="color:var(--primary); font-family:Orbitron;">DASHBOARD VORTEX</h2>
            
            <div style="display:flex; gap:15px; margin:20px 0;">
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; flex:1;">
                    <small>VENTAS TOTALES</small>
                    <div style="font-size:20px; color:#4ade80;">$${totalSales}</div>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; flex:1;">
                    <small>USUARIOS</small>
                    <div style="font-size:20px;">${totalUsers}</div>
                </div>
            </div>

            <h3 style="margin-top:30px; font-size:14px; color:var(--primary);">CONTROL DE USUARIOS</h3>
            <table style="width:100%; border-collapse:collapse; background:rgba(0,0,0,0.2); border-radius:10px; margin-bottom:30px;">
                <tr style="text-align:left; opacity:0.6; font-size:12px;">
                    <th style="padding:10px;">Usuario</th>
                    <th style="padding:10px;">Estado</th>
                    <th style="padding:10px;">Acciones</th>
                </tr>
                ${data.users.map(u => `
                    <tr style="border-top:1px solid rgba(255,255,255,0.05);">
                        <td style="padding:10px;">${u.email}</td>
                        <td style="padding:10px;"><span style="color:${u.status === 'Activo' ? '#4ade80' : '#ff4d4d'}">${u.status}</span></td>
                        <td style="padding:10px;">
                            <button onclick="app.changeUserPass(${u.id})" style="background:#555; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">LLAVE</button>
                            ${u.role !== 'ADMIN' ? `
                                <button onclick="app.updateUserStatus(${u.id}, '${u.status === 'Activo' ? 'Baneado' : 'Activo'}')" 
                                        style="background:${u.status === 'Activo' ? '#ff4d4d' : '#4ade80'}; color:black; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">
                                    ${u.status === 'Activo' ? 'BAN' : 'ALTA'}
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
            </table>

            <div class="card" style="background:rgba(255,255,255,0.02); padding:20px; border-radius:15px; border:1px solid rgba(0,242,255,0.2); margin-top:30px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="font-size:14px; color:var(--primary);">INVENTARIO DE SERVICIOS</h3>
                    <div>
                        <button onclick="app.addService('streaming')" style="background:var(--primary); color:black; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:11px;">+ STREAMING</button>
                        <button onclick="app.addService('gaming')" style="background:#a855f7; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:11px; margin-left:10px;">+ GAMING</button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <div>
                        <h4 style="font-size:12px; opacity:0.5; margin-bottom:10px;">STREAMING</h4>
                        ${(app.state.data.catalog?.streaming || []).map((s, i) => `
                            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:5px; font-size:12px;">
                                <span>${s.name} - <b>$${s.price}</b></span>
                                <div>
                                    <button onclick="app.toggleServiceStatus('streaming', ${i})" style="background:none; border:1px solid ${s.status === 'Disponible' ? '#4ade80' : '#f43f5e'}; color:white; font-size:9px; cursor:pointer; padding:2px 5px; border-radius:4px;">${s.status}</button>
                                    <button onclick="app.deleteService('streaming', ${i})" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold; margin-left:5px;">×</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div>
                        <h4 style="font-size:12px; opacity:0.5; margin-bottom:10px;">GAMING</h4>
                        ${(app.state.data.catalog?.gaming || []).map((g, i) => `
                            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:5px; font-size:12px;">
                                <span>${g.name} - <b>$${g.price}</b></span>
                                <div>
                                    <button onclick="app.toggleServiceStatus('gaming', ${i})" style="background:none; border:1px solid ${g.status === 'Disponible' ? '#4ade80' : '#f43f5e'}; color:white; font-size:9px; cursor:pointer; padding:2px 5px; border-radius:4px;">${g.status}</button>
                                    <button onclick="app.deleteService('gaming', ${i})" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold; margin-left:5px;">×</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}