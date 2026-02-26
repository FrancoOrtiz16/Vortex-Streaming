/* ==========================================================================
   VORTEX STREAMING - CORE V3.2 (MODULAR CONSOLIDADO + LÓGICA DE SERVICIOS)
   ========================================================================== */

import { state, saveToDisk } from './data.js';
import * as auth from './auth.js';
import * as ui from './ui.js';
import * as admin from './admin.js';

// 1. Creamos el objeto vacío primero
export const app = {};

// 2. Lo asignamos a window INMEDIATAMENTE para evitar errores de referencia circular
window.app = app;

// 3. Llenamos el objeto con todas las funciones manteniendo la infraestructura robusta
Object.assign(app, {
    // --- Estado y Persistencia ---
    state,
    saveToDisk,

    // [LÓGICA NUEVA: ESTADO DE SERVICIOS INICIALIZADO EN EL STATE]
    // Se integra en el state global para que persista y sea reactivo en la UI
    servicios: [
        { id: 1, name: 'Netflix', price: 5.50, logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
        { id: 2, name: 'Disney+', price: 4.00, logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
        { id: 3, name: 'Max', price: 3.80, logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg' },
        { id: 4, name: 'Crunchyroll', price: 3.00, logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.svg', highlight: true },
        { id: 5, name: 'Paramount+', price: 2.50, logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg' }
    ],

    // [LÓGICA NUEVA: FUNCIÓN DE ACTUALIZACIÓN DE LOGOS]
    updateServiceLogo: function(id, newLogo) {
        this.servicios = this.servicios.map(s => s.id === id ? { ...s, logo: newLogo } : s);
        // Sincronizamos con el estado de datos para persistencia
        if (this.state.data) {
            this.state.data.servicios = this.servicios;
            this.saveToDisk();
        }
        // Forzamos re-render del market si estamos en esa vista para ver el cambio
        if (this.state.view === 'market') this.router('market');
        console.log(`Logo actualizado para servicio ID: ${id}`);
    },

    // --- Autenticación y Navegación (Lógica Unificada Integrada) ---
    handleAuth: auth.handleAuth,
    logout: auth.logout,
    toggleAuthMode: auth.toggleAuthMode,
    
    // [LÓGICA NUEVA: SETVIEW / DASHBOARD]
    setView: function(viewName) {
        this.router(viewName);
    },

    router: ui.router, 
    renderAdmin: ui.renderAdmin, 
    enterSystem: ui.enterSystem,

    // --- Funciones Administrativas (Lógica Nueva Integrada) ---
    ...admin,

    // [LÓGICA NUEVA: HEARTBEAT INTEGRADA]
    checkHeartbeat: async function() {
        const statusVal = document.getElementById('server-status-val');
        try {
            await fetch('https://vortex-streaming-psi.vercel.app', { method: 'HEAD', mode: 'no-cors' });
            if (statusVal) {
                statusVal.innerText = 'ONLINE';
                statusVal.style.color = '#10b981';
            }
        } catch (e) {
            if (statusVal) {
                statusVal.innerText = 'OFFLINE';
                statusVal.style.color = '#ef4444';
            }
        }
    },

    // --- Lógica de Compras y Notificaciones (Infraestructura Inicial) ---
    registrarCompra(nombreProducto, precio, tipo) {
        const activeUser = this.state.currentUser;
        if (!activeUser) {
            this.showToast("Debes iniciar sesión para realizar una compra.");
            return;
        }

        const nuevaVenta = {
            id: Date.now(),
            client: activeUser.name, 
            service: nombreProducto, 
            amount: parseFloat(precio), 
            type: tipo, 
            date: new Date().toISOString().split('T')[0] 
        };

        if (!this.state.data.sales) this.state.data.sales = [];
        this.state.data.sales.push(nuevaVenta);
        
        if (this.logActivity) {
            this.logActivity('SALE', `Venta: ${nombreProducto} ($${precio}) - ${activeUser.name}`);
        }

        this.saveToDisk();
        this.mostrarNotificacion(`Has adquirido: ${nombreProducto}`);
        
        if (document.getElementById('history-items-container')) {
            this.loadPurchaseHistory();
        }
    },

    mostrarNotificacion(msj) {
        const alertBox = document.createElement('div');
        alertBox.className = 'vortex-toast'; 
        alertBox.innerText = msj;
        document.body.appendChild(alertBox);
        
        setTimeout(() => {
            alertBox.style.opacity = "0";
            setTimeout(() => alertBox.remove(), 500);
        }, 3000);
    },

    toggleHistory() {
        const panel = document.getElementById('user-history-list');
        if (!panel) return;
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            this.loadPurchaseHistory();
        }
    },

    loadPurchaseHistory() {
        const container = document.getElementById('history-items-container');
        if (!container) return;
        const activeUser = this.state.currentUser;
        const salesData = this.state.data.sales;

        if (!activeUser || !salesData) {
            container.innerHTML = '<p class="empty-log">Inicia sesión para ver tu historial.</p>';
            return;
        }

        const myPurchases = salesData.filter(sale => 
            sale.client === activeUser.email || sale.client === activeUser.name
        );

        if (myPurchases.length > 0) {
            container.innerHTML = myPurchases.map(sale => `
                <div class="history-entry">
                    <div>
                        <span class="type-icon">${sale.type === 'gaming' ? '🎮' : '📺'}</span>
                        <span>${sale.service}</span>
                    </div>
                    <span class="price-tag">$${sale.amount.toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-log">Aún no hay compras.</p>';
        }
    },

    // --- Utilidades Visuales ---
    applyErrorEffect(element) {
        if (!element) return;
        element.style.animation = "shake 0.4s cubic-bezier(.36,.07,.19,.97) both";
        setTimeout(() => element.style.animation = "", 500);
    },

    updateHeaderUI(user) {
        const nameDisp = document.getElementById('display-username');
        const adminTag = document.getElementById('admin-link-el');
        if(nameDisp) nameDisp.innerText = user.name;
        if(adminTag) adminTag.style.display = (user.role === 'ADMIN') ? 'block' : 'none';
        
        const currentView = this.state.view || 'market';
        document.querySelectorAll('.nav-btn-vortex').forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(currentView)) {
                btn.classList.add('bg-cyan-500', 'text-black');
                btn.classList.remove('bg-white/10');
            } else {
                btn.classList.remove('bg-cyan-500', 'text-black');
                btn.classList.add('bg-white/10');
            }
        });
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        if(!t) { this.mostrarNotificacion(msg); return; }
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    },

    renderNeuralBackground() {
        const canvas = document.getElementById('canvas-network');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let dots = [];
        const resize = () => {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            dots = []; 
            for(let i=0; i<60; i++) dots.push({
                x: Math.random()*canvas.width, 
                y: Math.random()*canvas.height, 
                vx: (Math.random()-0.5)*0.6, 
                vy: (Math.random()-0.5)*0.6
            });
        }
        const animate = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle="rgba(0,242,255,0.4)"; 
            ctx.strokeStyle="rgba(0,242,255,0.06)";
            dots.forEach((dot, i) => {
                dot.x += dot.vx; dot.y += dot.vy;
                if(dot.x<0 || dot.x>canvas.width) dot.vx*=-1;
                if(dot.y<0 || dot.y>canvas.height) dot.vy*=-1;
                ctx.beginPath(); ctx.arc(dot.x, dot.y, 1.2, 0, Math.PI*2); ctx.fill();
                for(let j=i+1; j<dots.length; j++) {
                    const d = Math.hypot(dot.x-dots[j].x, dot.y-dots[j].y);
                    if(d < 160) { 
                        ctx.beginPath(); 
                        ctx.moveTo(dot.x,dot.y); 
                        ctx.lineTo(dots[j].x,dots[j].y); 
                        ctx.stroke(); 
                    }
                }
            });
            requestAnimationFrame(animate);
        }
        window.onresize = resize; 
        resize(); 
        animate();
    },

    // --- Inicialización del Sistema (Lógica Nueva Integrada) ---
    init() {
        console.log("Vortex Core 3.2: Sistema Restablecido.");
        
        const saved = localStorage.getItem('vortex_v3_data');
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                if (!parsedData.tickets) parsedData.tickets = [];
                // [LÓGICA NUEVA: Restaurar servicios guardados si existen]
                if (parsedData.servicios) this.servicios = parsedData.servicios;
                this.state.data = parsedData;
            } catch(e) {
                console.error("Error al cargar persistencia inicial.");
            }
        }

        this.renderNeuralBackground();
        
        if (!this.state.currentUser) {
            this.router('login');
        } else {
            const startView = this.state.view === 'dashboard' ? 'admin' : (this.state.view || 'market');
            this.router(startView);
            this.updateHeaderUI(this.state.currentUser);
        }

        if (this.state.currentUser?.role === 'ADMIN') {
            this.checkHeartbeat();
            if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = setInterval(() => this.checkHeartbeat(), 30000);
        }

        document.addEventListener('mousedown', (e) => {
            const menu = document.getElementById('side-menu-vortex');
            const sc = document.getElementById('search-input-container');
            if (menu && menu.classList.contains('active') && !menu.contains(e.target) && !e.target.closest('.menu-hamburguer')) menu.classList.remove('active');
            if (sc && sc.classList.contains('active') && !sc.contains(e.target) && !e.target.closest('.vortex-search-wrapper')) sc.classList.remove('active');
        });

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-adquirir, .btn-recarga, .pay-btn'); 
            if (btn && !btn.hasAttribute('onclick') && (btn.innerText.includes('ADQUIERE') || btn.innerText.includes('ADQUIRIR') || btn.innerText.includes('RECARGA'))) {
                e.preventDefault();
                const card = btn.closest('.card, .product-card, .service-item, .vortex-item');
                if (card) {
                    const nombre = card.querySelector('h2, h3, .title')?.innerText || "Servicio Vortex";
                    const precioText = card.querySelector('.price, .costo')?.innerText || "0";
                    const precio = parseFloat(precioText.replace(/[^0-9.]/g, '')) || 0;
                    const tipo = btn.innerText.includes('RECARGA') ? 'gaming' : 'streaming';
                    this.registrarCompra(nombre, precio, tipo);
                }
            }
        });

        if (document.getElementById('history-items-container')) {
            this.loadPurchaseHistory();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('vortex_session');
    if (session) {
        app.router('market');
    }
});

app.init();