/* ==========================================================================
   VORTEX STREAMING - UI & ROUTING (MODULAR UNIFICADO)
   ========================================================================== */

import { state, saveToDisk } from './data.js';

/**
 * Registro de logs (Conexiones, fallos, ventas)
 * Mantiene un límite de 15 entradas para optimizar el almacenamiento.
 */
export const logActivity = (type, message) => {
    if (!state.data.logs) state.data.logs = [];
    const newLog = {
        time: new Date().toLocaleTimeString(),
        type: type, // 'SALE', 'WARN', 'INFO'
        msg: message
    };
    state.data.logs.unshift(newLog); // El más nuevo arriba
    if (state.data.logs.length > 15) state.data.logs.pop(); 
    saveToDisk();
};

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
    // Guardamos la vista actual en el estado
    state.view = view;
    if (window.app && window.app.state) window.app.state.view = view;

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
    // Panel de Administración con Validación de Seguridad
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
    // Centro de Soporte (Vista de Usuario)
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

// --- LÓGICA DE ADMINISTRACIÓN UNIFICADA ---

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
 * Lógica Nueva Unificada: Renderizado administrativo (COMMAND CENTER)
 */
export const renderAdmin = (container) => {
    // Usamos una protección (data.tickets || []) para evitar el error de 'undefined'
    const { data } = window.app.state; 
    const totalSales = (data.sales || []).reduce((acc, s) => acc + s.amount, 0).toFixed(2);
    const totalUsers = data.users.length;
    const openTickets = (data.tickets || []).filter(t => t.status === 'Abierto');

    container.innerHTML = `
        <div class="admin-dashboard fade-in" style="padding:20px; color:white;">
            <h2 style="color:var(--primary); font-family:Orbitron; margin-bottom:20px;">VORTEX COMMAND CENTER</h2>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; margin-bottom:25px;">
                <div class="card" style="background:rgba(0,242,255,0.1); border:1px solid var(--primary); padding:15px; border-radius:10px; text-align:center;">
                    <small>VENTAS TOTALES</small><h3 style="margin:5px 0; font-family:Orbitron;">$${totalSales}</h3>
                </div>
                <div class="card" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; text-align:center;">
                    <small>USUARIOS TOTALES</small><h3 style="margin:5px 0; font-family:Orbitron;">${totalUsers}</h3>
                </div>
                <div class="card" style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px;">
                    <small style="color:var(--primary)">MONITOR LOGS</small>
                    <div style="font-size:9px; height:40px; overflow-y:auto; margin-top:5px; font-family: monospace;">
                        ${(data.logs || []).slice(0,3).map(l => `<div>[${l.time}] ${l.msg}</div>`).join('') || 'Esperando...'}
                    </div>
                </div>
            </div>

            <div class="card" style="background:rgba(255,255,255,0.02); padding:15px; border-radius:10px; margin-bottom:25px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="margin-bottom:10px; font-size:12px; font-family:Orbitron;">GESTIÓN DE USUARIOS</h4>
                <table style="width:100%; font-size:11px; text-align:left;">
                    <tr style="opacity:0.5;"><th>Email</th><th>Password</th><th>Acciones</th></tr>
                    ${data.users.map(u => `
                        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 5px 0;">${u.email}</td><td>${u.pass}</td>
                            <td>
                                <button onclick="app.changeUserPass(${u.id})" style="background:#555; color:white; border:none; padding:3px 7px; border-radius:3px; cursor:pointer;">LLAVE</button>
                                ${u.role !== 'ADMIN' ? `<button onclick="app.toggleUserBan(${u.id})" style="background:${u.status === 'Activo' ? '#ff4d4d' : '#4ade80'}; color:black; border:none; padding:3px 7px; border-radius:3px; cursor:pointer; font-weight:bold; margin-left:5px;">${u.status === 'Activo' ? 'BAN' : 'ALTA'}</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <div class="card" style="background:rgba(255,255,255,0.02); padding:15px; border-radius:10px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h4 style="font-size:12px; font-family:Orbitron;">INVENTARIO Y STOCK</h4>
                    <button onclick="app.addService('streaming')" style="background:var(--primary); color:black; border:none; padding:5px 10px; border-radius:5px; font-size:10px; font-weight:bold; cursor:pointer;">+ PRODUCTO</button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                    ${['streaming', 'gaming'].map(cat => `
                        <div>
                            <small style="opacity:0.5; text-transform:uppercase; color:var(--primary);">${cat}</small>
                            ${(data.catalog[cat] || []).map((item, i) => `
                                <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; margin-top:5px; border: 1px solid rgba(255,255,255,0.03);">
                                    <img src="${item.img || ''}" style="width:25px; height:25px; background:#333; border-radius:4px; object-fit: cover;">
                                    <div style="flex:1; font-size:11px;"><b>${item.name}</b></div>
                                    <button onclick="app.toggleStock('${cat}', ${i})" style="background:${item.status === 'Disponible' ? '#4ade80' : '#ff4d4d'}; color:black; border:none; padding:4px 8px; border-radius:4px; font-size:9px; font-weight:bold; cursor:pointer;">${item.status === 'Disponible' ? 'ACTIVO' : 'OFF'}</button>
                                    <button onclick="app.editProduct('${cat}', ${i})" style="background:none; border:1px solid #777; color:white; padding:4px; border-radius:4px; font-size:9px; cursor:pointer;">✎</button>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card" style="margin-top:25px; background:rgba(255,255,255,0.02); padding:15px; border-radius:10px; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="font-size:12px; color:#ff4d4d; font-family:Orbitron;">BANDEJA DE SOPORTE (${openTickets.length})</h4>
                ${openTickets.map(t => `
                    <div style="background:rgba(0,0,0,0.2); padding:12px; border-radius:8px; margin-top:10px; border: 1px solid rgba(255,255,255,0.03);">
                        <div style="font-size:11px; opacity:0.6;">Usuario: ${t.user} | Asunto: ${t.subject}</div>
                        <p style="font-size:13px; margin:5px 0;">${t.message}</p>
                        <div style="display:flex; gap:5px; margin-top:10px;">
                            <button onclick="app.quickReply(${t.id}, 'Tu cuenta ha sido reactivada. Por favor revisa.')" style="background:#222; color:#4ade80; border:1px solid #4ade80; font-size:10px; padding:5px; cursor:pointer; border-radius:4px;">REACTIVADA</button>
                            <button onclick="app.quickReply(${t.id}, 'Revisa tu correo, te enviamos las nuevas credenciales.')" style="background:#222; color:#00f2ff; border:1px solid #00f2ff; font-size:10px; padding:5px; cursor:pointer; border-radius:4px;">REVISAR CORREO</button>
                            <button onclick="app.quickReply(${t.id}, 'Estamos en mantenimiento, en breve se solucionará.')" style="background:#222; color:#fbbf24; border:1px solid #fbbf24; font-size:10px; padding:5px; cursor:pointer; border-radius:4px;">MANTENIMIENTO</button>
                        </div>
                    </div>
                `).join('') || '<p style="font-size:11px; opacity:0.4; padding:10px;">No hay tickets pendientes.</p>'}
            </div>

            <button onclick="app.router('market')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; cursor: pointer; font-size: 12px; margin-top: 20px; width: 100%; font-weight: bold;">SALIR AL CATÁLOGO</button>
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