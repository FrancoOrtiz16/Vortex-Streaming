/* ==========================================================================
   VORTEX STREAMING - AUTH ENGINE (MODULAR UNIFICADO)
   ========================================================================== */

import { state, saveToDisk } from './data.js';

// --- Lógica Nueva: Gestión de sesión y persistencia ---
export const saveSession = (userData) => {
    localStorage.setItem('vortex_session', JSON.stringify(userData));
};

export const getSession = () => {
    const session = localStorage.getItem('vortex_session');
    return session ? JSON.parse(session) : null;
};

export const removeSession = () => {
    localStorage.removeItem('vortex_session');
};
// -----------------------------------------------------

/**
 * Lógica Nueva: Alterna el modo de autenticación y refresca la vista.
 * Se integra el uso de window.app para coordinar con el router.
 */
export const toggleAuthMode = (isReg) => {
    // Si se pasa un booleano se usa, de lo contrario alterna el estado actual
    state.isRegisterMode = (typeof isReg === 'boolean') ? isReg : !state.isRegisterMode;
    
    const title = document.getElementById('auth-title');
    const btnText = document.getElementById('btn-main-auth')?.querySelector('span');
    const switchText = document.getElementById('auth-switch');

    // Actualización de UI manteniendo la estética inicial
    if(title) title.innerText = state.isRegisterMode ? "Crear Cuenta" : "Acceso al Sistema";
    if(btnText) btnText.innerText = state.isRegisterMode ? "Registrarse" : "Entrar";
    if(switchText) {
        switchText.innerHTML = state.isRegisterMode ? 
            '¿Ya tienes cuenta? <a href="#" onclick="app.toggleAuthMode(false)">Inicia Sesión</a>' :
            '¿No tienes cuenta? <a href="#" onclick="app.toggleAuthMode(true)">Regístrate</a>';
    }

    // Llamada lógica nueva: Notificar al router (si fuera necesario refrescar la vista de login)
    if (window.app && window.app.router) {
        // window.app.router('login'); // Opcional según flujo de UI
    }
};

/**
 * Maneja el proceso de Login y Registro.
 * Implementa la validación robusta y el uso de window.app para utilidades y logs.
 */
export const handleAuth = (e) => {
    if(e) e.preventDefault(); 
    
    console.log("Validando acceso..."); // Lógica inicial integrada

    const emailEl = document.getElementById('auth-email');
    const passEl = document.getElementById('auth-pass');
    const msg = document.getElementById('auth-msg');
    const btn = document.getElementById('btn-main-auth');

    if (!emailEl || !passEl) return;
    const email = emailEl.value.trim();
    const pass = passEl.value.trim();

    if (!email || !pass) {
        msg.innerText = "Ingresa tus credenciales.";
        if (window.app?.applyErrorEffect) window.app.applyErrorEffect(btn);
        return;
    }

    if (state.isRegisterMode) {
        // Lógica de Registro
        if (state.data.users.find(u => u.email === email)) {
            msg.innerText = "Correo ya registrado.";
            if (window.app?.applyErrorEffect) window.app.applyErrorEffect(btn);
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
        state.data.users.push(newUser);
        saveToDisk(); // Usando import directo
        alert("Registro exitoso.");
        toggleAuthMode(false); // Volver a login tras registro
    } else {
        // Lógica de Login
        const found = state.data.users.find(u => u.email === email && u.pass === pass);
        if (found) {
            if (found.status === 'Suspendido' || found.status === 'Baneado') {
                msg.innerText = "Cuenta suspendida.";
                if (window.app?.applyErrorEffect) window.app.applyErrorEffect(btn);
                return;
            }
            enterSystem(found);
        } else {
            // --- Lógica Nueva Unificada ---
            if (window.app && window.app.logActivity) {
                window.app.logActivity('WARN', `Acceso fallido: ${email}`);
            }
            msg.innerText = "Credenciales incorrectas.";
            alert("Credenciales incorrectas");
            if (window.app?.applyErrorEffect) window.app.applyErrorEffect(btn);
        }
    }
};

/**
 * Ejecuta la entrada al sistema tras validación exitosa.
 */
export function enterSystem(user) {
    state.currentUser = user;
    
    // Integración Lógica Nueva: Persistencia de sesión
    saveSession(user);
    
    // Log de éxito (Opcional, siguiendo la lógica de monitoreo)
    if (window.app && window.app.logActivity) {
        window.app.logActivity('INFO', `Sesión iniciada: ${user.email}`);
    }

    if (window.app?.updateHeaderUI) window.app.updateHeaderUI(user);
    
    const overlay = document.getElementById('auth-screen');
    
    if(overlay) {
        overlay.style.transition = "opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease";
        overlay.style.opacity = "0";
        overlay.style.transform = "scale(1.1) blur(10px)";
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            if (window.app?.router) window.app.router('market'); 
            if (window.app?.showToast) window.app.showToast(`Bienvenido, ${user.name}`);
        }, 500);
    }
}

/**
 * Cierra la sesión restableciendo el estado y usando la lógica nueva.
 */
export function logout() {
    if (state.currentUser && window.app?.logActivity) {
        window.app.logActivity('INFO', `Sesión cerrada: ${state.currentUser.email}`);
    }

    // Integración Lógica Nueva: Limpieza de persistencia
    removeSession();

    state.currentUser = null;
    state.view = 'login';
    
    if (window.app && window.app.router) {
        window.app.router('login');
        location.reload(); 
    } else {
        location.reload();
    }
}