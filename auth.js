/* ==========================================================================
   VORTEX STREAMING - AUTH ENGINE (MODULAR UNIFICADO)
   ========================================================================== */

import { app } from './app.js';

/**
 * Maneja el proceso de Login y Registro
 */
export function handleAuth(e) {
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
        app.applyErrorEffect(btn);
        return;
    }

    if (app.state.isRegisterMode) {
        // Lógica de Registro
        if (app.state.data.users.find(u => u.email === email)) {
            msg.innerText = "Correo ya registrado.";
            app.applyErrorEffect(btn);
            return;
        }
        const newUser = { 
            id: Date.now(), 
            name: email.split('@')[0].toUpperCase(), 
            email, 
            pass, 
            role: "USER", 
            status: "Activo" 
        };
        app.state.data.users.push(newUser);
        app.saveToDisk();
        alert("Registro exitoso.");
        app.toggleAuthMode(false);
    } else {
        // Lógica de Login
        const found = app.state.data.users.find(u => u.email === email && u.pass === pass);
        if (found) {
            if (found.status === 'Suspendido' || found.status === 'Baneado') {
                msg.innerText = "Cuenta suspendida.";
                app.applyErrorEffect(btn);
                return;
            }
            app.enterSystem(found);
        } else {
            msg.innerText = "Credenciales incorrectas.";
            app.applyErrorEffect(btn);
        }
    }
}

/**
 * Alterna la interfaz entre Login y Registro
 */
export function toggleAuthMode(isReg) {
    app.state.isRegisterMode = isReg;
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
}

/**
 * Ejecuta la entrada al sistema tras validación exitosa
 */
export function enterSystem(user) {
    app.state.currentUser = user;
    app.updateHeaderUI(user);
    const overlay = document.getElementById('auth-screen');
    
    if(overlay) {
        overlay.style.transition = "opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease";
        overlay.style.opacity = "0";
        overlay.style.transform = "scale(1.1) blur(10px)";
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            app.router('market'); 
            app.showToast(`Bienvenido, ${user.name}`);
        }, 500);
    }
}

/**
 * Cierra la sesión (Exportado para compatibilidad modular)
 */
export function logout() {
    location.reload();
}