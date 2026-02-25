/* ==========================================================================
   VORTEX STREAMING - CORE V3.2 (MODULAR CONSOLIDADO)
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

    // --- Autenticación y Navegación (Lógica Unificada) ---
    handleAuth: auth.handleAuth,
    logout: auth.logout,
    toggleAuthMode: auth.toggleAuthMode,
    router: ui.router,           // <--- Lógica unificada: Mapeado desde ui.js
    renderAdmin: ui.renderAdmin, // <--- Lógica unificada: Vital para el acceso administrativo
    enterSystem: ui.enterSystem,

    // --- Funciones Administrativas (Lógica Nueva Integrada) ---
    ...admin,

    // [LÓGICA NUEVA: HEARTBEAT INTEGRADA]
    checkHeartbeat: async function() {
        const statusVal = document.getElementById('server-status-val');
        try {
            // Ping silencioso al servidor de streaming
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
        
        // Log activity (Lógica Nueva aplicada a compras)
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
        
        // 1. Cargamos datos del disco (Persistencia con Garantía de Infraestructura)
        const saved = localStorage.getItem('vortex_v3_data');
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                // Lógica Nueva: Garantizamos que tickets sea al menos un array vacío para evitar undefined
                if (!parsedData.tickets) parsedData.tickets = [];
                this.state.data = parsedData;
            } catch(e) {
                console.error("Error al cargar persistencia inicial.");
            }
        }

        // 2. Fondo neural y UI estética
        this.renderNeuralBackground();
        
        // 3. Enrutamiento inicial inteligente (Lógica Nueva)
        if (!this.state.currentUser) {
            this.router('login');
        } else {
            this.router(this.state.view || 'market');
            this.updateHeaderUI(this.state.currentUser);
        }

        // [LÓGICA NUEVA: INICIO DEL MONITOREO DEL SERVIDOR]
        if (this.state.currentUser?.role === 'ADMIN') {
            this.checkHeartbeat();
            if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = setInterval(() => this.checkHeartbeat(), 30000);
        }

        // 4. Listeners globales para UX
        document.addEventListener('mousedown', (e) => {
            const menu = document.getElementById('side-menu-vortex');
            const sc = document.getElementById('search-input-container');
            if (menu && menu.classList.contains('active') && !menu.contains(e.target) && !e.target.closest('.menu-hamburguer')) menu.classList.remove('active');
            if (sc && sc.classList.contains('active') && !sc.contains(e.target) && !e.target.closest('.vortex-search-wrapper')) sc.classList.remove('active');
        });

        // 5. Delegación de eventos para compras dinámicas
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

        // 6. Carga de historial si el contenedor existe
        if (document.getElementById('history-items-container')) {
            this.loadPurchaseHistory();
        }
    }
});

// 4. Lanzamiento oficial
app.init();