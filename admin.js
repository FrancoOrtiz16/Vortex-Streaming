/* ==========================================================================
   VORTEX STREAMING - ADMIN PANEL (MODULAR UNIFICADO)
   ========================================================================== */

import { state, saveToDisk } from './data.js';

// --- CONFIGURACIÓN Y HEARTBEAT (LÓGICA NUEVA INTEGRADA) ---
const STREAM_SERVER_URL = "https://vortex-streaming-psi.vercel.app"; 

export async function checkServerStatus() {
    const statusElement = document.getElementById('val-server') || document.getElementById('server-status-val');
    if (!statusElement) return "OFFLINE";

    try {
        // Implementación de Lógica Nueva: HEAD request para eficiencia
        await fetch(STREAM_SERVER_URL, { 
            method: 'HEAD', 
            // mode: 'no-cors' se usa para evitar bloqueos si el servidor no tiene CORS habilitado
            mode: 'no-cors',
            cache: 'no-cache' 
        });
        
        statusElement.textContent = "ONLINE";
        statusElement.style.color = "#00ffcc";
        statusElement.className = "text-3xl font-black status-online animate-pulse"; 
        return "ONLINE";
    } catch (error) {
        statusElement.textContent = "OFFLINE";
        statusElement.style.color = "#ff4d4d";
        statusElement.className = "text-3xl font-black status-offline";
        console.error("Alerta: El servidor de streaming no responde.");
        return "OFFLINE";
    }
}

// Intervalo global de monitoreo
setInterval(checkServerStatus, 30000);

/**
 * Registro de logs
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

// --- GESTIÓN DE RENOVACIONES (LÓGICA NUEVA INTEGRADA) ---

export function renderRenewalsPanel(salesOrUsers) {
    const container = document.getElementById('vortex-renewals-list') || document.getElementById('renovations-list');
    if (!container) return;

    const today = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    const sales = state.data.sales || [];
    const expiring = sales.filter(s => {
        const expDate = new Date(s.exp).getTime();
        return expDate <= (today + sevenDaysInMs);
    });

    if (expiring.length > 0) {
        container.innerHTML = `<h3 style="font-size:14px; color:#f43f5e; margin-bottom:10px;">ACCIONES REQUERIDAS (RENOVACIONES)</h3>` + 
        expiring.map(s => `
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 mb-3" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); padding:10px; border-radius:10px;">
                <div>
                    <p class="text-xs font-bold text-white" style="font-size:12px; font-weight:bold;">${s.client}</p>
                    <p class="text-[10px] text-red-400 font-black uppercase" style="font-size:10px; color:#f87171; font-weight:900;">${s.service} - VENCE: ${s.exp}</p>
                </div>
                <button onclick="app.notifyUser('${s.client}')" class="bg-red-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase" style="background:#f43f5e; color:white; border:none; padding:5px 10px; border-radius:5px; font-size:10px; font-weight:bold; cursor:pointer;">NOTIFICAR</button>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div style="padding:10px; opacity:0.5; font-size:11px;">No hay renovaciones urgentes.</div>';
    }
}

// --- GESTIÓN DE TICKETS Y SOPORTE ---

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
        logActivity('INFO', `Ticket #${ticketId} responded`);
        if (window.app && window.app.router) window.app.router('admin');
        if (window.app?.showToast) window.app.showToast("Respuesta enviada con éxito");
    }
};

// --- GESTIÓN DE USUARIOS ---

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

// --- GESTIÓN DE STOCK Y CATÁLOGO ---

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
        if (window.app?.showToast) window.app.showToast(`${name} agregado al catálogo`);
    }
};

export const deleteService = (category, index) => {
    if (confirm("¿Seguro que quieres eliminar este servicio?")) {
        const item = state.data.catalog[category][index];
        logActivity('WARN', `Servicio eliminado: ${item.name}`);
        state.data.catalog[category].splice(index, 1);
        saveToDisk();
        if (window.app && window.app.router) window.app.router('admin');
    }
};

// --- LÓGICA DE KPIs Y DASHBOARD (UNIFICADA CON LÓGICA NUEVA) ---

export function calculateKPIs(data) {
    const sales = data.sales || [];
    const users = data.users || [];
    
    // Implementación de Lógica Nueva: Reducción y filtrado optimizado
    const stats = {
        totalIncome: sales.reduce((acc, s) => acc + s.amount, 0).toFixed(2),
        totalUsers: users.length,
        upcomingExp: sales.filter(s => {
            const expDate = new Date(s.exp).getTime();
            const limit = Date.now() + 7 * 24 * 60 * 60 * 1000;
            return expDate < limit;
        }).length
    };

    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).textContent = val; };
    
    setVal('val-usuarios', stats.totalUsers);
    setVal('total-users', stats.totalUsers);
    setVal('val-ingresos', `$${stats.totalIncome}`);
    setVal('total-income', `$${stats.totalIncome}`);
    setVal('val-exp', stats.upcomingExp);
    setVal('kpi-expiraciones', stats.upcomingExp);
}

// Inicialización del Panel (Lógica Nueva + Inicial)
export function initAdminPanel(data) {
    checkServerStatus();
    calculateKPIs(data);
    renderRenewalsPanel(data.sales);
}

export function notifyUser(clientName) {
    console.log("Notificando a cliente:", clientName);
    if (window.app?.showToast) {
        window.app.showToast(`Recordatorio enviado a ${clientName}`);
    } else {
        alert(`Recordatorio de pago enviado con éxito a ${clientName}.`);
    }
}

export function renderAdmin(container) {
    if (!container) return;
    const data = state.data;
    const adminName = state.currentUser?.name || "Administrador";

    container.innerHTML = `
        <div class="admin-view space-y-6 fade-in" style="padding:20px; color:white;">
            
            <div class="animate__animated animate__fadeInDown mb-6">
                <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                    <span class="w-1 h-8 bg-cyan-500 rounded-full" style="display:inline-block; width:4px; height:32px; background:#06b6d4; border-radius:10px; margin-right:12px;"></span>
                    Bienvenido, ${adminName}
                </h1>
                <p class="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black ml-4" style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:0.3em; font-weight:900; margin-left:16px;">
                    Sistema de Control de Operaciones
                </p>
            </div>

            <div class="animate__animated animate__fadeIn space-y-10">
                <div class="flex justify-between items-center" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 class="text-3xl font-black uppercase italic tracking-tighter text-white" style="font-size:24px; font-weight:900; text-transform:uppercase; font-style:italic; color:white; font-family:Orbitron;">
                        ENTERPRISE COMMAND CENTER
                    </h2>
                    <div class="flex gap-2" style="display:flex; gap:8px;">
                        <button onclick="app.exportToExcel('users')" class="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-cyan-500/20 text-white transition" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:8px 16px; border-radius:12px; font-size:9px; font-weight:900; text-transform:uppercase; color:white; cursor:pointer;">Exp. Usuarios</button>
                        <button onclick="app.exportToExcel('sales')" class="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-cyan-500/20 text-white transition" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:8px 16px; border-radius:12px; font-size:9px; font-weight:900; text-transform:uppercase; color:white; cursor:pointer;">Exp. Ventas</button>
                    </div>
                </div>

                <div style="font-size:10px; background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:20px; border:1px solid rgba(0,242,255,0.2); width:fit-content; margin-bottom:20px;">
                    SERVER: <span id="val-server" style="font-weight:bold;">COMPROBANDO...</span>
                </div>
            </div>
            
            <div style="display:flex; gap:15px; margin:20px 0;">
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; flex:1;">
                    <small>INGRESOS TOTALES</small>
                    <div id="total-income" style="font-size:20px; color:#4ade80; font-weight:bold;">$0.00</div>
                </div>
                <div class="stat-box" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; flex:1;">
                    <small>USUARIOS</small>
                    <div id="total-users" style="font-size:20px; font-weight:bold;">0</div>
                </div>
                <div class="stat-box" style="background:rgba(0,242,255,0.1); padding:15px; border-radius:12px; flex:1; border:1px solid var(--primary);">
                    <small>VENCIMIENTOS</small>
                    <div id="val-exp" style="font-size:20px; color:var(--primary); font-weight:bold;">0</div>
                </div>
            </div>

            <h3 style="margin-top:20px; font-size:14px; color:#00f2ff;">MONITOR DE ACTIVIDAD</h3>
            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; font-family:monospace; font-size:11px; margin-bottom:20px; border-left:3px solid #00f2ff;">
                ${(data.logs || []).length > 0 ? data.logs.map(l => `
                    <div style="margin-bottom:4px;">
                        <span style="color:rgba(255,255,255,0.4)">[${l.time}]</span> 
                        <span style="color:${l.type === 'SALE' ? '#4ade80' : l.type === 'WARN' ? '#f43f5e' : '#00f2ff'}">${l.type}</span>: ${l.msg}
                    </div>
                `).join('') : '<span style="opacity:0.5;">Esperando actividad...</span>'}
            </div>

            <div id="vortex-renewals-list" style="margin-bottom:30px;"></div>

            <h3 style="margin-top:30px; font-size:14px; color:var(--primary); font-family:Orbitron;">BANDEJA DE SOPORTE</h3>
            <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:10px; margin-bottom:30px;">
                ${(data.tickets || []).length > 0 ? data.tickets.map(t => `
                    <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:10px; font-size:12px;">
                        <div style="display:flex; justify-content:space-between;">
                            <b>${t.subject} <small style="opacity:0.5;">(${t.user})</small></b>
                            <span style="color:${t.status === 'Abierto' ? '#ff4d4d' : '#4ade80'}">${t.status.toUpperCase()}</span>
                        </div>
                        <p style="margin:5px 0; opacity:0.8;">${t.message}</p>
                        ${t.status === 'Abierto' ? `
                            <button onclick="const r = prompt('Respuesta:'); if(r) app.quickReply(${t.id}, r)" style="background:var(--primary); color:black; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:10px;">RESPONDER</button>
                        ` : `<div style="color:#4ade80; font-size:10px;">R: ${t.reply}</div>`}
                    </div>
                `).join('') : '<div style="padding:10px; opacity:0.5; font-size:11px;">No hay reportes pendientes.</div>'}
            </div>

            <h3 style="margin-top:30px; font-size:14px; color:var(--primary);">CONTROL DE USUARIOS</h3>
            <table style="width:100%; border-collapse:collapse; background:rgba(0,0,0,0.2); border-radius:10px; margin-bottom:30px;">
                <tr style="text-align:left; opacity:0.6; font-size:12px;">
                    <th style="padding:10px;">Usuario</th>
                    <th style="padding:10px;">Estado</th>
                    <th style="padding:10px;">Acciones</th>
                </tr>
                <tbody id="vortex-user-body">
                ${data.users.map(u => `
                    <tr style="border-top:1px solid rgba(255,255,255,0.05);">
                        <td style="padding:10px;">${u.email}</td>
                        <td style="padding:10px;"><span style="color:${u.status === 'Activo' ? '#4ade80' : '#ff4d4d'}">${u.status}</span></td>
                        <td style="padding:10px;">
                            <button onclick="app.changeUserPass(${u.id})" style="background:#555; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">LLAVE</button>
                            ${u.role !== 'ADMIN' ? `
                                <button onclick="app.toggleUserBan(${u.id})" 
                                        style="background:${u.status === 'Activo' ? '#ff4d4d' : '#4ade80'}; color:black; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">
                                    ${u.status === 'Activo' ? 'BAN' : 'ALTA'}
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
                </tbody>
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
                        ${(data.catalog?.streaming || []).map((s, i) => `
                            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:5px; font-size:12px;">
                                <span onclick="app.editProduct('streaming', ${i})" style="cursor:pointer;" title="Editar Precio/Imagen">${s.name} - <b>$${s.price}</b></span>
                                <div>
                                    <button onclick="app.toggleStock('streaming', ${i})" style="background:none; border:1px solid ${s.status === 'Disponible' ? '#4ade80' : '#f43f5e'}; color:white; font-size:9px; cursor:pointer; padding:2px 5px; border-radius:4px;">${s.status}</button>
                                    <button onclick="app.deleteService('streaming', ${i})" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold; margin-left:5px;">×</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div>
                        <h4 style="font-size:12px; opacity:0.5; margin-bottom:10px;">GAMING</h4>
                        ${(data.catalog?.gaming || []).map((g, i) => `
                            <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:5px; font-size:12px;">
                                <span onclick="app.editProduct('gaming', ${i})" style="cursor:pointer;" title="Editar Precio/Imagen">${g.name} - <b>$${g.price}</b></span>
                                <div>
                                    <button onclick="app.toggleStock('gaming', ${i})" style="background:none; border:1px solid ${g.status === 'Disponible' ? '#4ade80' : '#f43f5e'}; color:white; font-size:9px; cursor:pointer; padding:2px 5px; border-radius:4px;">${g.status}</button>
                                    <button onclick="app.deleteService('gaming', ${i})" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold; margin-left:5px;">×</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    initAdminPanel(data);
}