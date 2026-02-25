/* ==========================================================================
   VORTEX STREAMING - UI & ROUTING (MODULAR UNIFICADO)
   ========================================================================== */

import { state, saveToDisk } from './data.js';

/**
 * Registro de logs (Conexiones, fallos, ventas)
 */
export const logActivity = (type, message) => {
    if (!state.data.logs) state.data.logs = [];
    const newLog = {
        time: new Date().toLocaleTimeString(),
        type: type, 
        msg: message
    };
    state.data.logs.unshift(newLog); 
    if (state.data.logs.length > 15) state.data.logs.pop(); 
    saveToDisk();
};

export const enterSystem = () => {
    if (window.app && window.app.router) {
        window.app.router('market');
    }
};

/**
 * Enrutador principal del sistema.
 */
export const router = (view) => {
    state.view = view;
    if (window.app && window.app.state) window.app.state.view = view;

    const container = document.getElementById('app-content');
    const menu = document.getElementById('side-menu-vortex');
    
    if(!container) return;
    if(menu) menu.classList.remove('active');

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
    else if (view === 'admin') {
        const user = state.currentUser || (window.app.state ? window.app.state.currentUser : null);
        if (user && user.role === 'ADMIN') {
            renderAdmin(container);
        } else {
            if (window.app && window.app.router) {
                window.app.router('login'); 
            }
        }
    }
    else if (view === 'support') {
        const userTickets = (state.data.tickets || []).filter(t => t.user === state.currentUser.email);
        container.innerHTML = `
            <div class="support-view fade-in" style="padding:20px;">
                <h2 style="color:var(--primary); font-family:Orbitron;">CENTRO DE SOPORTE</h2>
                <div class="card" style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; margin-bottom:20px;">
                    <h4 style="margin-bottom:10px;">Enviar nuevo reporte</h4>
                    <input id="tk-subject" placeholder="Asunto (Ej: Falla en Netflix)" style="width:100%; margin-bottom:10px; background:#111; color:white; border:1px solid #333; padding:10px; border-radius:8px;">
                    <textarea id="tk-msg" placeholder="Describe el problema..." style="width:100%; height:80px; background:#111; color:white; border:1px solid #333; padding:10px; border-radius:8px;"></textarea>
                    <button onclick="app.createTicket(document.getElementById('tk-subject').value, document.getElementById('tk-msg').value)" style="background:var(--primary); color:black; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%; margin-top:10px;">ENVIAR TICKET</button>
                </div>

                <h4 style="opacity:0.6; font-family:Orbitron; font-size:12px; margin-top:20px;">MIS TICKETS</h4>
                ${userTickets.length > 0 ? userTickets.map(t => `
                    <div class="ticket-card" style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; margin-top:10px; border-left:4px solid ${t.status === 'Abierto' ? '#ff4d4d' : '#4ade80'};">
                        <div style="display:flex; justify-content:space-between; font-size:10px;"><small>${t.date}</small> <b>${t.status.toUpperCase()}</b></div>
                        <p style="margin:5px 0;"><b>${t.subject}</b></p>
                        <p style="font-size:12px; opacity:0.7;">${t.message}</p>
                        ${t.reply ? `<div style="background:rgba(74,222,128,0.1); padding:10px; border-radius:5px; margin-top:10px; color:#4ade80; font-size:12px;"><b>Respuesta:</b> ${t.reply}</div>` : ''}
                    </div>
                `).join('') : '<p style="opacity:0.5; font-size:11px; margin-top:10px;">No tienes reportes activos.</p>'}
            </div>
        `;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- LÓGICA DE ADMINISTRACIÓN UNIFICADA (NUEVA ESTÉTICA) ---

export const createTicket = (subject, message) => {
    const newTicket = {
        id: Date.now(),
        user: state.currentUser.email,
        subject: subject,
        message: message,
        status: 'Abierto',
        reply: '',
        date: new Date().toLocaleDateString()
    };
    if (!state.data.tickets) state.data.tickets = [];
    state.data.tickets.unshift(newTicket);
    saveToDisk();
    logActivity('INFO', `Nuevo ticket de ${state.currentUser.email}`);
    if (window.app && window.app.router) window.app.router('support');
};

export const quickReply = (ticketId, replyText) => {
    const ticket = state.data.tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.reply = replyText;
        ticket.status = 'Respondido';
        saveToDisk();
        logActivity('INFO', `Ticket #${ticketId} respondido`);
        if (window.app && window.app.router) window.app.router('admin');
        if (window.app?.showToast) window.app.showToast("Respuesta enviada con éxito");
    }
};

export const changeUserPass = (userId) => {
    const user = state.data.users.find(u => u.id === userId);
    if (user) {
        const newPass = prompt(`Nueva clave para ${user.email}:`, user.pass);
        if (newPass) {
            user.pass = newPass;
            saveToDisk();
            logActivity('INFO', `Password actualizada para ${user.email}`);
            if (window.app && window.app.router) window.app.router('admin');
            if (window.app?.showToast) window.app.showToast("Contraseña actualizada");
        }
    }
};

export const toggleUserBan = (userId) => {
    const user = state.data.users.find(u => u.id === userId);
    if (user && user.role !== 'ADMIN') {
        user.status = user.status === 'Activo' ? 'Baneado' : 'Activo';
        saveToDisk();
        logActivity('WARN', `Usuario ${user.email} -> ${user.status}`);
        if (window.app && window.app.router) window.app.router('admin');
        if (window.app?.showToast) window.app.showToast(`Estado de ${user.name}: ${user.status}`);
    }
};

export const editProduct = (category, index) => {
    const item = state.data.catalog[category][index];
    const newPrice = prompt(`Nuevo precio para ${item.name}:`, item.price);
    const newImg = prompt(`URL de la imagen para ${item.name}:`, item.img || '');
    
    if (newPrice !== null) {
        item.price = parseFloat(newPrice);
        item.img = newImg || item.img;
        saveToDisk();
        logActivity('INFO', `Producto ${item.name} editado.`);
        if (window.app && window.app.router) window.app.router('admin'); 
    }
};

export const toggleStock = (category, index) => {
    const item = state.data.catalog[category][index];
    item.status = item.status === 'Disponible' ? 'Agotado' : 'Disponible';
    saveToDisk();
    logActivity('INFO', `${item.name} ahora está ${item.status}`);
    if (window.app && window.app.router) window.app.router('admin'); 
};

export const addService = (category) => {
    const name = prompt(`Nombre del nuevo servicio para ${category.toUpperCase()}:`);
    const price = prompt(`Precio para ${name}:`, "5.00");
    if (name && price) {
        if (!state.data.catalog) state.data.catalog = { streaming: [], gaming: [] };
        if (!state.data.catalog[category]) state.data.catalog[category] = [];
        
        state.data.catalog[category].push({
            name: name.toUpperCase(),
            price: parseFloat(price),
            img: "",
            status: "Disponible"
        });
        
        saveToDisk();
        logActivity('INFO', `Nuevo servicio: ${name}`);
        if (window.app && window.app.router) window.app.router('admin');
        if (window.app?.showToast) window.app.showToast(`${name} agregado`);
    }
};

/**
 * Lógica Nueva Unificada: Renderizado administrativo (ENTERPRISE COMMAND CENTER)
 */
export const renderAdmin = (container) => {
    const { data } = window.app.state; 
    const totalIncome = (data.sales || []).reduce((acc, s) => acc + s.amount, 0).toFixed(2);
    const totalUsers = data.users.length;
    const openTickets = (data.tickets || []).filter(t => t.status === 'Abierto');
    
    // Filtro para próximas expiraciones (Lógica nueva)
    const limit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingExpirations = (data.sales || []).filter(s => new Date(s.exp) < limit);

    container.innerHTML = `
        <div class="animate__animated animate__fadeIn space-y-10" style="padding:20px; color:white;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <h2 style="font-size:24px; font-weight:900; text-transform:uppercase; font-style:italic; letter-spacing:-0.05em; color:white;">ENTERPRISE COMMAND CENTER</h2>
                <div style="display:flex; gap:8px;">
                    <button onclick="app.exportToExcel('users')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:8px 16px; border-radius:12px; font-size:9px; font-weight:900; text-transform:uppercase; color:white; cursor:pointer;">Exp. Usuarios</button>
                    <button onclick="app.exportToExcel('sales')" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:8px 16px; border-radius:12px; font-size:9px; font-weight:900; text-transform:uppercase; color:white; cursor:pointer;">Exp. Ventas</button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:24px; margin-bottom:40px;">
                <div style="background:rgba(255,255,255,0.02); padding:24px; border-radius:24px; border-left:4px solid #10b981; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.1);">
                    <p style="font-size:10px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">Ingresos Totales</p>
                    <p style="font-size:30px; font-weight:900; color:white; margin:0;">$${totalIncome}</p>
                </div>
                <div style="background:rgba(255,255,255,0.02); padding:24px; border-radius:24px; border-left:4px solid #06b6d4; box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.1);">
                    <p style="font-size:10px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">Usuarios</p>
                    <p style="font-size:30px; font-weight:900; color:white; margin:0;">${totalUsers}</p>
                </div>
                <div style="background:rgba(255,255,255,0.02); padding:24px; border-radius:24px; border-left:4px solid #f43f5e; box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.1);">
                    <p style="font-size:10px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px;">Vencimientos</p>
                    <p style="font-size:30px; font-weight:900; color:white; margin:0;">${upcomingExpirations.length}</p>
                </div>
                <div style="background:rgba(0,0,0,0.3); padding:24px; border-radius:24px;">
                    <p style="font-size:10px; font-weight:900; color:var(--primary); text-transform:uppercase; margin-bottom:8px;">Logs de Sistema</p>
                    <div style="font-size:9px; height:35px; overflow:hidden; opacity:0.6; font-family:monospace;">
                        ${(data.logs || []).slice(0,2).map(l => `<div>[${l.time}] ${l.msg}</div>`).join('') || 'SISTEMA OK'}
                    </div>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.01); padding:20px; border-radius:24px; border:1px solid rgba(255,255,255,0.05); margin-bottom:30px;">
                <h4 style="margin-bottom:20px; font-size:12px; font-weight:900; color:var(--primary); text-transform:uppercase;">Control de Cuentas Vortex</h4>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:12px;">
                        <thead><tr style="text-align:left; color:#64748b; font-size:10px; text-transform:uppercase;">
                            <th style="padding:10px 5px;">Usuario</th><th style="padding:10px 5px;">Estado</th><th style="padding:10px 5px;">Acciones</th>
                        </tr></thead>
                        <tbody>
                            ${data.users.map(u => `
                                <tr style="border-top:1px solid rgba(255,255,255,0.03);">
                                    <td style="padding:12px 5px;"><b>${u.email}</b><br><small style="opacity:0.4;">${u.pass}</small></td>
                                    <td style="padding:12px 5px;"><span style="color:${u.status === 'Activo' ? '#10b981' : '#f43f5e'}; font-weight:900; font-size:10px;">${u.status.toUpperCase()}</span></td>
                                    <td style="padding:12px 5px;">
                                        <button onclick="app.changeUserPass(${u.id})" style="background:#334155; color:white; border:none; padding:5px 10px; border-radius:8px; cursor:pointer; font-size:10px;">✎</button>
                                        ${u.role !== 'ADMIN' ? `<button onclick="app.toggleUserBan(${u.id})" style="background:${u.status === 'Activo' ? '#f43f5e' : '#10b981'}; color:black; border:none; padding:5px 10px; border-radius:8px; cursor:pointer; font-weight:bold; margin-left:5px; font-size:9px;">${u.status === 'Activo' ? 'BAN' : 'ALTA'}</button>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px; margin-bottom:30px;">
                <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:24px; border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h4 style="font-size:12px; font-weight:900; color:var(--primary); text-transform:uppercase;">Inventario Activo</h4>
                        <button onclick="app.addService('streaming')" style="background:var(--primary); color:black; border:none; padding:6px 12px; border-radius:10px; font-size:9px; font-weight:900; cursor:pointer;">+ ADD</button>
                    </div>
                    ${['streaming', 'gaming'].map(cat => `
                        <div style="margin-bottom:15px;">
                            <small style="color:#64748b; text-transform:uppercase; font-size:9px; font-weight:900;">${cat}</small>
                            ${(data.catalog[cat] || []).map((item, i) => `
                                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:10px; border-radius:12px; margin-top:5px;">
                                    <div style="font-size:11px;"><b>${item.name}</b> <small style="opacity:0.5;">$${item.price}</small></div>
                                    <div style="display:flex; gap:5px;">
                                        <button onclick="app.toggleStock('${cat}', ${i})" style="background:${item.status === 'Disponible' ? '#10b981' : '#f43f5e'}; color:white; border:none; padding:4px 8px; border-radius:6px; font-size:8px; font-weight:900; cursor:pointer;">${item.status === 'Disponible' ? 'ON' : 'OFF'}</button>
                                        <button onclick="app.editProduct('${cat}', ${i})" style="background:none; border:1px solid rgba(255,255,255,0.1); color:white; padding:4px 8px; border-radius:6px; font-size:8px; cursor:pointer;">EDIT</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>

                <div style="background:rgba(255,255,255,0.02); padding:20px; border-radius:24px; border:1px solid rgba(255,255,255,0.05);">
                    <h4 style="font-size:12px; font-weight:900; color:#f43f5e; text-transform:uppercase; margin-bottom:20px;">Tickets Pendientes (${openTickets.length})</h4>
                    ${openTickets.map(t => `
                        <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:16px; margin-top:10px; border:1px solid rgba(244,63,94,0.1);">
                            <div style="font-size:10px; opacity:0.6; margin-bottom:5px;">${t.user}</div>
                            <p style="font-size:12px; font-weight:bold; margin-bottom:10px;">${t.message}</p>
                            <div style="display:flex; flex-wrap:wrap; gap:5px;">
                                <button onclick="app.quickReply(${t.id}, 'Tu cuenta ha sido reactivada.')" style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid #10b981; font-size:8px; font-weight:900; padding:6px; cursor:pointer; border-radius:8px;">REACTIVAR</button>
                                <button onclick="app.quickReply(${t.id}, 'Mantenimiento en curso.')" style="background:rgba(251,191,36,0.1); color:#fbbf24; border:1px solid #fbbf24; font-size:8px; font-weight:900; padding:6px; cursor:pointer; border-radius:8px;">MANTENIMIENTO</button>
                            </div>
                        </div>
                    `).join('') || '<p style="font-size:11px; opacity:0.4;">No hay tickets pendientes.</p>'}
                </div>
            </div>

            <button onclick="app.router('market')" style="background:linear-gradient(45deg, #0f172a, #1e293b); color:white; border:1px solid rgba(255,255,255,0.1); padding:16px; border-radius:16px; cursor:pointer; font-size:11px; width:100%; font-weight:900; text-transform:uppercase; letter-spacing:0.1em;">Finalizar Sesión Admin</button>
        </div>
    `;
};

/**
 * Control del campo de búsqueda y utilidades de UI
 */
export function toggleSearchField() {
    const sc = document.getElementById('search-input-container');
    if (sc) sc.classList.toggle('active');
}

export function toggleModernMenu() {
    const menu = document.getElementById('side-menu-vortex');
    if (menu) menu.classList.toggle('active');
}

export function toggleUserCard() {
    const card = document.getElementById('user-info-card');
    if (!card) return;
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) {
        loadCurrentUserData();
    }
}

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