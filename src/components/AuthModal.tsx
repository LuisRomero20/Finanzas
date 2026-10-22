import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, UserCheck, LogOut, Copy, Check, ShieldAlert } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signOut, getCurrentUser } from '../services/authService';
import type { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCurrentUser().then(user => setCurrentUser(user));
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          const msg = result.error.toLowerCase().includes('failed to fetch')
            ? 'El navegador no pudo conectar con Supabase. Esto ocurre cuando una extensión (AdBlock, uBlock, Brave Shields) o el antivirus bloquea la conexión externa. Prueba abriendo la aplicación en una Ventana de Incógnito (Ctrl + Shift + N) o pausando AdBlock.'
            : result.error === 'Invalid login credentials'
            ? 'Correo o contraseña incorrectos. Verifica que la contraseña coincida con tu usuario de Supabase.'
            : result.error;
          setErrorMessage(msg);
        } else if (result.user) {
          setCurrentUser(result.user);
          setSuccessMessage('¡Sesión iniciada con éxito!');
          onAuthSuccess?.(result.user);
          setTimeout(() => onClose(), 1000);
        }
      } else {
        const result = await signUpWithEmail(email, password);
        if (result.error) {
          const msg = result.error.toLowerCase().includes('failed to fetch')
            ? 'No se pudo conectar al servidor. Si ya creaste tu usuario en Supabase, elige la pestaña «Iniciar Sesión».'
            : result.error;
          setErrorMessage(msg);
        } else if (result.user) {
          setCurrentUser(result.user);
          setSuccessMessage('Usuario registrado con éxito. Si ya confirmaste tu cuenta, puedes iniciar sesión.');
          onAuthSuccess?.(result.user);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setCurrentUser(null);
    setSuccessMessage('Sesión cerrada.');
    setLoading(false);
  };

  const copyUidToClipboard = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Lock size={18} className="text-emerald-200" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg">Autenticación Segura</h3>
              <p className="text-[11px] text-emerald-200/80">Acceso cifrado al repositorio financiero</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentUser ? (
            /* Vista de Usuario Autenticado */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                <UserCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Sesión Activa como Propietario</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Caja de UID para la migración de Supabase */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tu User UID en Supabase</span>
                  <button
                    type="button"
                    onClick={copyUidToClipboard}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {copiedUid ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUid ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <code className="text-xs font-mono bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 block text-slate-700 dark:text-slate-300 break-all select-all">
                  {currentUser.id}
                </code>
                <p className="text-[10px] text-slate-400 mt-2">
                  Tu cuenta tiene titularidad y acceso autorizado sobre tus 2,246 registros históricos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 font-bold text-xs transition cursor-pointer"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            /* Formulario de Login / Registro */
            <div>
              {/* Pestañas Segmentadas */}
              <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    isLoginMode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    !isLoginMode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                    <Check size={16} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{successMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu_correo@ejemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
