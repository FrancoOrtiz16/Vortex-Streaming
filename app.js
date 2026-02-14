/* ==========================================================================
   VORTEX STREAMING - CORE V3.2 (PARIDAD TOTAL & INFRAESTRUCTURA PROTEGIDA)
   ========================================================================== */

const app = {
    // 1. ESTADO GLOBAL CON AUTOSUFICIENCIA Y BLINDAJE
    state: {
        view: 'login',
        currentUser: null,
        isRegisterMode: false,
        // Lógica que garantiza paridad total entre navegadores e Incógnito
        data: (function() {
            const defaultData = {
                users: [
                    { id: 1, name: "Admin Principal", email: "admin", pass: "admin", role: "ADMIN", status: "Activo" },
                    { id: 2, name: "Juan Perez", email: "juan@mail.com", pass: "123", role: "USER", status: "Activo" }
                ],
                sales: [
                    { id: 101, client: "Admin Principal", service: "NETFLIX 4K", amount: 5.50, date: "2026-02-12", type: "streaming" }
                ]
            };
            
            const saved = localStorage.getItem('vortex_v3_data');
            if (!saved) return defaultData;

            try {
                const parsed = JSON.parse(saved);
                // Validación de integridad: si el storage está corrupto o vacío, inyectamos default
                if (!parsed.users || parsed.users.length === 0) return defaultData;
                
                // Garantía de acceso: re-inyectamos Admin Principal si falta en el storage
                const adminExists = parsed.users.some(u => u.email === 'admin');
                if (!adminExists) parsed.users.push(defaultData.users[0]);
                
                return parsed;
            } catch (e) {
                console.error("Vortex Data Error: Restaurando default por seguridad.");
                return defaultData;
            }
        })(),
        services: {
            streaming: ["NETFLIX", "DISNEY+", "MAX", "Crunchyroll", "PARAMOUNT+", "VIX", "CANVA PRO", "Spotify", "Prime Video", "CapCut Pro"],
            gaming: ["Free Fire", "Roblox", "Valorant", "Mobile Legends", "Genshin Impact"]
        }
    },

    // 2. PERSISTENCIA
    saveToDisk() {
        localStorage.setItem('vortex_v3_data', JSON.stringify(this.state.data));
    },

    // 3. LÓGICA DE COMPRAS (MANTENIDA Y REFORZADA)
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

    // 4. LÓGICA DE INTERFAZ (UI MODERN)
    toggleSearchField() {
        const sc = document.getElementById('search-input-container');
        if (sc) sc.classList.toggle('active');
    },

    toggleModernMenu() {
        const menu = document.getElementById('side-menu-vortex');
        if (menu) menu.classList.toggle('active');
    },

    toggleUserCard() {
        const card = document.getElementById('user-info-card');
        if (!card) return;
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) {
            this.loadCurrentUserData();
        }
    },

    loadCurrentUserData() {
        const u = this.state.currentUser;
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
    },

    revealPass() {
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

    // 5. MOTOR DE ACCESO (PROTEGIDO)
    handleAuth(e) {
        if(e) e.preventDefault(); 
        const emailEl = document.getElementById('auth-email');
        const passEl = document.getElementById('auth-pass');
        const msg = document.getElementById('auth-msg');
        const btn = document.getElementById('btn-main-auth');

        if (!emailEl || !passEl) return;
        const email = emailEl.value.trim();
        const pass = passEl.value.trim();

        if (!email || !pass) {
            msg.innerText = "Ingresa tus credenciales.";
            this.applyErrorEffect(btn);
            return;
        }

        if (this.state.isRegisterMode) {
            if (this.state.data.users.find(u => u.email === email)) {
                msg.innerText = "Correo ya registrado.";
                this.applyErrorEffect(btn);
                return;
            }
            const newUser = { id: Date.now(), name: email.split('@')[0].toUpperCase(), email, pass, role: "USER", status: "Activo" };
            this.state.data.users.push(newUser);
            this.saveToDisk();
            alert("Registro exitoso.");
            this.toggleAuthMode(false);
        } else {
            const found = this.state.data.users.find(u => u.email === email && u.pass === pass);
            if (found) {
                if (found.status === 'Suspendido') {
                    msg.innerText = "Cuenta suspendida.";
                    this.applyErrorEffect(btn);
                    return;
                }
                this.enterSystem(found);
            } else {
                msg.innerText = "Credenciales incorrectas.";
                this.applyErrorEffect(btn);
            }
        }
    },

    toggleAuthMode(isReg) {
        this.state.isRegisterMode = isReg;
        const title = document.getElementById('auth-title');
        const btnText = document.getElementById('btn-main-auth')?.querySelector('span');
        const switchText = document.getElementById('auth-switch');

        if(title) title.innerText = isReg ? "Crear Cuenta" : "Acceso al Sistema";
        if(btnText) btnText.innerText = isReg ? "Registrarse" : "Entrar";
        if(switchText) {
            switchText.innerHTML = isReg ? 
                '¿Ya tienes cuenta? <a href="#" onclick="app.toggleAuthMode(false)">Inicia Sesión</a>' :
                '¿No tienes cuenta? <a href="#" onclick="app.toggleAuthMode(true)">Regístrate</a>';
        }
    },

    enterSystem(user) {
        this.state.currentUser = user;
        this.updateHeaderUI(user);

        const overlay = document.getElementById('auth-screen');
        if(overlay) {
            // Efecto de escala + blur + fade de lógica nueva
            overlay.style.transition = "opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease";
            overlay.style.opacity = "0";
            overlay.style.transform = "scale(1.1) blur(10px)";
            
            setTimeout(() => {
                overlay.classList.add('hidden');
                this.router('market'); 
                this.showToast(`Bienvenido, ${user.name}`);
            }, 500);
        }
    },

    // 6. NAVEGACIÓN Y RENDERIZADO (PROTEGIDO)
    router(view) {
        this.state.view = view;
        const container = document.getElementById('app-content');
        const menu = document.getElementById('side-menu-vortex');
        if(!container) return;
        if(menu) menu.classList.remove('active');

        if (['market', 'streaming', 'gaming'].includes(view)) {
            const list = view === 'gaming' ? this.state.services.gaming : this.state.services.streaming;
            container.innerHTML = `<h1 class="fade-in">Catálogo Elite</h1><div class="bento-grid" id="grid"></div>`;
            const grid = document.getElementById('grid');
            list.forEach(item => {
                grid.innerHTML += `
                    <div class="card vortex-item fade-in">
                        <div class="badge">VORTEX</div>
                        <h3 class="title">${item}</h3>
                        <p class="price">$5.00</p>
                        <button class="btn-adquirir pay-btn btc">ADQUIERE</button>
                    </div>`;
            });
        } else if (view === 'admin') {
            this.renderAdmin(container);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderAdmin(container) {
        const data = this.state.data;
        const totalSales = data.sales.reduce((acc, s) => acc + s.amount, 0).toFixed(2);
        container.innerHTML = `
            <div class="admin-header fade-in">
                <h2 class="text-4xl font-black italic">ENTERPRISE COMMAND CENTER</h2>
                <p class="text-cyan-500 text-[10px] font-black tracking-[0.4em] uppercase">Status: SECURE | Revenue: $${totalSales}</p>
            </div>
            <div class="bento-grid">
                <div class="card fade-in">
                    <h3>Usuarios Totales: ${data.users.length}</h3>
                    <table style="width:100%; font-size: 12px; margin-top:20px; border-collapse: collapse;">
                        ${data.users.map(u => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <td style="padding:10px 0">${u.name}<br><small style="opacity:0.5">${u.email}</small></td>
                                <td style="font-family:monospace">${u.pass}</td>
                                <td><span style="color:${u.status === 'Activo' ? '#4ade80' : '#f43f5e'}; font-weight:bold">${u.status}</span></td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>`;
    },

    // 7. UTILIDADES E INICIALIZACIÓN
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
        if(!t) {
            this.mostrarNotificacion(msg); 
            return;
        }
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    },

    init() {
        this.renderNeuralBackground();

        // Control de clics fuera para menús (UI Protection)
        document.addEventListener('mousedown', (e) => {
            const menu = document.getElementById('side-menu-vortex');
            const sc = document.getElementById('search-input-container');

            if (menu && menu.classList.contains('active') && !menu.contains(e.target) && !e.target.closest('.menu-hamburguer')) {
                menu.classList.remove('active');
            }
            if (sc && sc.classList.contains('active') && !sc.contains(e.target) && !e.target.closest('.vortex-search-wrapper')) {
                sc.classList.remove('active');
            }
        });

        // Manejador de compras dinámico (Integrado)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-adquirir, .btn-recarga, .pay-btn'); 
            if (btn && (btn.innerText.includes('ADQUIERE') || btn.innerText.includes('ADQUIRIR') || btn.innerText.includes('RECARGA'))) {
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

        console.log("Vortex Core 3.2: Online & Persistent.");
    },

    renderNeuralBackground() {
        const canvas = document.getElementById('canvas-network');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let dots = [];
        const resize = () => {
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            dots = []; for(let i=0; i<60; i++) dots.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6});
        }
        const animate = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle="rgba(0,242,255,0.4)"; ctx.strokeStyle="rgba(0,242,255,0.06)";
            dots.forEach((dot, i) => {
                dot.x += dot.vx; dot.y += dot.vy;
                if(dot.x<0 || dot.x>canvas.width) dot.vx*=-1;
                if(dot.y<0 || dot.y>canvas.height) dot.vy*=-1;
                ctx.beginPath(); ctx.arc(dot.x, dot.y, 1.2, 0, Math.PI*2); ctx.fill();
                for(let j=i+1; j<dots.length; j++) {
                    const d = Math.hypot(dot.x-dots[j].x, dot.y-dots[j].y);
                    if(d < 160) { ctx.beginPath(); ctx.moveTo(dot.x,dot.y); ctx.lineTo(dots[j].x,dots[j].y); ctx.stroke(); }
                }
            });
            requestAnimationFrame(animate);
        }
        window.onresize = resize; resize(); animate();
    }
};

// INICIALIZACIÓN SEGURA Y CARGA DE HISTORIAL
window.onload = () => {
    app.init();
    if (document.getElementById('history-items-container')) {
        app.loadPurchaseHistory();
    }
};