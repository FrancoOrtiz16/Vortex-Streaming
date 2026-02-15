/* ==========================================================================
   VORTEX STREAMING - CORE V3.2 (MODULAR CONSOLIDADO)
   ========================================================================== */

import { state, saveToDisk } from './data.js';
import * as auth from './auth.js';
import * as ui from './ui.js';
import * as admin from './admin.js';

// Definimos el objeto vacío primero para evitar errores de inicialización
export const app = {};

// Asignamos todas las funcionalidades manteniendo la infraestructura inicial
Object.assign(app, {
    // --- Estado y Persistencia ---
    state,
    saveToDisk,

    // --- Autenticación y Navegación ---
    handleAuth: auth.handleAuth,
    logout: auth.logout,
    toggleAuthMode: auth.toggleAuthMode,
    router: ui.router,
    enterSystem: ui.enterSystem,
    renderAdmin: ui.renderAdmin,

    // --- Funciones Administrativas (Lógica Nueva Integrada) ---
    logActivity: admin.logActivity,
    editProduct: admin.editProduct,
    updateUserStatus: admin.updateUserStatus,
    changeUserPass: admin.changeUserPass,
    addService: admin.addService,
    toggleStock: admin.toggleStock, // Mapeado a la nueva lógica
    deleteService: admin.deleteService,

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

    // --- Inicialización del Sistema ---
    init() {
        console.log("Vortex Core 3.2: Sistema Restablecido.");
        
        // Cargamos datos del disco antes de arrancar (Persistencia)
        const saved = localStorage.getItem('vortex_v3_data');
        if (saved) {
            try {
                this.state.data = JSON.parse(saved);
            } catch(e) {
                console.error("Error al cargar persistencia inicial.");
            }
        }

        // Fondo neural y UI
        this.renderNeuralBackground();
        this.router(this.state.view);

        // Listeners globales para UX
        document.addEventListener('mousedown', (e) => {
            const menu = document.getElementById('side-menu-vortex');
            const sc = document.getElementById('search-input-container');
            if (menu && menu.classList.contains('active') && !menu.contains(e.target) && !e.target.closest('.menu-hamburguer')) menu.classList.remove('active');
            if (sc && sc.classList.contains('active') && !sc.contains(e.target) && !e.target.closest('.vortex-search-wrapper')) sc.classList.remove('active');
        });

        // Delegación de eventos para compras
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

        // Carga de historial si el contenedor existe
        if (document.getElementById('history-items-container')) {
            this.loadPurchaseHistory();
        }
    }
});

// Exponemos al mundo global para compatibilidad con el HTML
window.app = app;

// Lanzamiento oficial
app.init();