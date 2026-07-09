import React, { useMemo, useState } from "react";
import { npv, irrPeriodic } from "./lib/finance";
import { useAppStore } from "./store";
import { useAuthInit } from "./hooks/useAuthInit";
import type { Deuda } from "./store";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle2, Info, Trash2, Edit2, Plus, LogOut, CalendarDays } from "lucide-react";

// ============ COMPONENTES REUTILIZABLES ============

const Section: React.FC<{ title?: string; className?: string; children: React.ReactNode }> = ({ title, className = "", children }) => (
  <section className={`bg-white rounded-2xl shadow-sm p-6 mb-6 ${className}`}>
    {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
    {children}
  </section>
);

const Field: React.FC<{ label: string; hint?: string; error?: string; children: React.ReactNode }> = ({ label, hint, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
    <div className="flex items-center justify-between">
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${props.className || ""}`}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }> = ({ options, ...props }) => (
  <select
    {...props}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 ${props.className || ""}`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

const toneMap = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  zinc: "bg-zinc-50 text-zinc-700 border-zinc-200",
} as const;

const Pill: React.FC<{ tone?: keyof typeof toneMap; children: React.ReactNode }> = ({ tone = "blue", children }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${toneMap[tone]}`}>{children}</span>
);

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-center justify-between border-b last:border-none py-2">
    <span className="text-gray-600">{k}</span>
    <span className="font-semibold">{v}</span>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => <th className="text-left px-4 py-2 font-semibold text-zinc-700">{children}</th>;
const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <td className={`px-4 py-2 ${className || ""}`}>{children}</td>;

const Button: React.FC<{ variant?: "primary" | "secondary" | "danger"; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ variant = "primary", children, ...props }) => {
  const baseClass = "rounded-xl px-4 py-2 font-medium transition";
  const variantClass = {
    primary: "bg-blue-800 text-white hover:bg-blue-900",
    secondary: "bg-white text-blue-900 border border-blue-900 hover:bg-blue-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];
  return <button {...props} className={`${baseClass} ${variantClass}`}>{children}</button>;
};

function fmtMoney(moneda: string, v: number | null | undefined) {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(v || 0);
  } catch {
    return `${moneda} ${Number(v || 0).toFixed(2)}`;
  }
}

const tabs = ["Inicio", "Mis Deudas", "Crear Deuda", "Cronograma", "Reportes", "Config"] as const;
type Tab = typeof tabs[number];

// ============ APP PRINCIPAL ============

export default function App() {
  const [tab, setTab] = useState<Tab>("Inicio");
  const { usuario } = useAppStore();
  
  // Inicializar autenticación y cargar sesión
  useAuthInit();

  if (!usuario) {
    return <AuthLayout />;
  }

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-to-b from-zinc-100 to-zinc-200">
      <Navbar tab={tab} setTab={setTab} />
      <Notifications />
      <main className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {tab === "Inicio" && <Landing setTab={setTab} />}
        {tab === "Mis Deudas" && <MisDeudas setTab={setTab} />}
        {tab === "Crear Deuda" && <CrearDeuda setTab={setTab} />}
        {tab === "Cronograma" && <CronogramaView />}
        {tab === "Reportes" && <Reportes />}
        {tab === "Config" && <Configuracion />}
      </main>
      <Footer />
    </div>
  );
}

// 🔔 NOTIFICACIONES GLOBALES
function Notifications() {
  const { notificaciones } = useAppStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notificaciones.map((notif) => (
        <div
          key={notif.id}
          className={`rounded-lg p-4 shadow-lg border flex items-center gap-2 animate-in fade-in slide-in-from-right ${
            notif.tipo === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : notif.tipo === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : notif.tipo === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {notif.tipo === "success" && <CheckCircle2 size={18} />}
          {notif.tipo === "error" && <AlertCircle size={18} />}
          {notif.tipo === "warning" && <AlertCircle size={18} />}
          {notif.tipo === "info" && <Info size={18} />}
          <span className="text-sm font-medium">{notif.mensaje}</span>
        </div>
      ))}
    </div>
  );
}

// 🔐 AUTENTICACIÓN
function AuthLayout() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const { login, registrar, cargando } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (form.password !== form.confirmPassword) {
          setError("Las contraseñas no coinciden");
          return;
        }
        await registrar(form.nombre, form.email, form.password);
      }
      setForm({ nombre: "", email: "", password: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err.message || "Error en la autenticación");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💳</div>
          <h1 className="text-3xl font-bold text-blue-900">DeudaTracker</h1>
          <p className="text-gray-600 text-sm mt-1">Gestiona tus deudas personales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Field label="Nombre completo">
              <Input placeholder="Tu nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </Field>
          )}
          <Field label="Email">
            <Input type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Contraseña" hint={isLogin ? undefined : "Mínimo 6 caracteres"}>
            <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          {!isLogin && (
            <Field label="Confirmar contraseña">
              <Input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </Field>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {cargando ? "Procesando..." : (isLogin ? "Ingresar" : "Crear cuenta")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline">
            {isLogin ? "Registrate" : "Inicia sesión"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-gray-700 border border-blue-200">
          <p className="font-semibold mb-2">Demo: Prueba con</p>
          <p>📧 Email: demo@test.com</p>
          <p>🔑 Pass: 123456</p>
        </div>
      </div>
    </div>
  );
}

// 🧭 NAVBAR
function Navbar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { usuario, logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-900 to-blue-800 text-zinc-100 shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/20 flex items-center justify-center font-bold">💳</div>
          <span className="font-bold hidden sm:block truncate">DeudaTracker</span>
        </div>
        <nav className="flex gap-1 flex-wrap justify-end items-center">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm transition ${
                tab === t ? "bg-white/30 font-bold" : "hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
          <div className="border-l border-white/30 pl-2 ml-2 flex items-center gap-2">
            <span className="text-xs hidden sm:inline truncate max-w-[100px]">{usuario?.nombre}</span>
            <button onClick={handleLogout} className="hover:bg-white/20 p-1 rounded transition" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

// 🏠 INICIO
function Landing({ setTab }: { setTab: (t: Tab) => void }) {
  const { getTotalDeudado, deudas } = useAppStore();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
      <Section className="order-2 xl:order-1" title="Bienvenido a DeudaTracker 💳">
        <p className="text-gray-700 mb-4 text-base md:text-lg leading-relaxed">
          Gestiona todas tus deudas en un solo lugar. Cálculos automáticos, cronogramas precisos y alertas de vencimiento.
          Nunca más olvides un pago.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600">Total adeudado</p>
            <p className="text-xl font-bold text-blue-900">{fmtMoney("PEN", getTotalDeudado())}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600">Deudas activas</p>
            <p className="text-xl font-bold text-green-900">{deudas.length}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setTab("Crear Deuda")}>
            <Plus size={18} className="inline" /> Nueva deuda
          </Button>
          <Button variant="secondary" onClick={() => setTab("Mis Deudas")}>
            Ver todas
          </Button>
        </div>
      </Section>
      <div className="order-1 xl:order-2">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-blue-100">
          <img
            src="https://images.unsplash.com/photo-1579621970563-430f63602d4b?q=80&w=1470&auto=format&fit=crop"
            alt="Gestión de deudas"
            className="w-full h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover"
          />
        </div>
      </div>
    </div>
  );
}

// 💳 MIS DEUDAS
function MisDeudas({ setTab }: { setTab: (t: Tab) => void }) {
  const { deudas, getTotalDeudado, getTotalMensual, marcarCuotaPagada, eliminarDeuda } = useAppStore();
  const [editId, setEditId] = useState<string | null>(null);

  const handleMarcarPagada = async (id: string) => {
    await marcarCuotaPagada(id);
  };

  const handleEliminar = async (id: string) => {
    await eliminarDeuda(id);
  };

  const calcularCuota = (deuda: Deuda) => {
    const i_mensual = deuda.tipo_tasa === "efectiva" ? Math.pow(1 + deuda.tasa_anual, 1 / 12) - 1 : deuda.tasa_anual / 12;
    const n = Math.max(0, deuda.plazo_meses - deuda.meses_pagados);
    if (i_mensual <= 0 || n <= 0) return 0;
    return (deuda.monto * i_mensual) / (1 - Math.pow(1 + i_mensual, -n));
  };

  const chartData = deudas.map((d) => ({ name: d.acreedor, monto: d.monto }));
  const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

  return (
    <div className="grid gap-6">
      <Section title="📊 Resumen General">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-blue-600 text-sm font-medium">Total adeudado</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{fmtMoney("PEN", getTotalDeudado())}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-amber-600 text-sm font-medium">Cuota mensual</p>
            <p className="text-3xl font-bold text-amber-900 mt-2">{fmtMoney("PEN", getTotalMensual())}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-green-600 text-sm font-medium">Deudas activas</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{deudas.length}</p>
          </div>
        </div>
      </Section>

      {chartData.length > 0 && (
        <Section title="📈 Distribución de deudas">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${fmtMoney("PEN", value)}`} outerRadius={80} fill="#8884d8" dataKey="monto">
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => fmtMoney("PEN", value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      )}

      <Section title="📋 Tus deudas">
        {deudas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No tienes deudas registradas</p>
            <Button variant="primary" onClick={() => setTab("Crear Deuda")}>
              Agregar primera deuda
            </Button>
          </div>
        ) : (
          <div className="overflow-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <Th>Acreedor</Th>
                  <Th>Monto</Th>
                  <Th>Cuota</Th>
                  <Th>Meses</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {deudas.map((d) => (
                  <tr key={d.id} className="odd:bg-white even:bg-zinc-50 border-b hover:bg-blue-50/50">
                    <Td className="font-semibold">{d.acreedor}</Td>
                    <Td>{fmtMoney(d.moneda, d.monto)}</Td>
                    <Td>{fmtMoney(d.moneda, calcularCuota(d))}</Td>
                    <Td>
                      {d.meses_pagados}/{d.plazo_meses}
                    </Td>
                    <Td>
                      <Pill tone={d.estado === "activa" ? "blue" : d.estado === "proximo_vencer" ? "amber" : "green"}>{d.estado}</Pill>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <button onClick={() => handleMarcarPagada(d.id)} className="text-green-600 hover:text-green-700 text-xs font-bold" title="Marcar cuota pagada">
                          ✓
                        </button>
                        <button onClick={() => handleEliminar(d.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

// ➕ CREAR DEUDA
function CrearDeuda({ setTab }: { setTab: (t: Tab) => void }) {
  const { agregarDeuda, agregarNotificacion } = useAppStore();
  const [input, setInput] = useState({
    acreedor: "",
    moneda: "PEN",
    monto: 0,
    tasa_anual: 0.085,
    plazo_meses: 12,
    tipo_tasa: "efectiva" as "nominal" | "efectiva",
    fecha_inicio: new Date().toISOString().slice(0, 10),
  });

  const i_mensual = input.tipo_tasa === "efectiva" ? Math.pow(1 + input.tasa_anual, 1 / 12) - 1 : input.tasa_anual / 12;
  const cuota = useMemo(() => {
    if (i_mensual <= 0 || input.plazo_meses <= 0) return 0;
    return (input.monto * i_mensual) / (1 - Math.pow(1 + i_mensual, -input.plazo_meses));
  }, [i_mensual, input.plazo_meses, input.monto]);

  const total_pagar = cuota * input.plazo_meses;
  const interes_total = total_pagar - input.monto;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.acreedor || input.monto <= 0) {
      agregarNotificacion("Completa todos los campos", "error");
      return;
    }
    try {
      await agregarDeuda({
        acreedor: input.acreedor,
        monto: input.monto,
        tasa_anual: input.tasa_anual,
        plazo_meses: input.plazo_meses,
        tipo_tasa: input.tipo_tasa,
        moneda: input.moneda,
        fecha_inicio: input.fecha_inicio,
      });
      setInput({ acreedor: "", moneda: "PEN", monto: 0, tasa_anual: 0.085, plazo_meses: 12, tipo_tasa: "efectiva", fecha_inicio: new Date().toISOString().slice(0, 10) });
      setTimeout(() => setTab("Mis Deudas"), 1000);
    } catch (error) {
      console.error("Error al guardar deuda:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
      <Section title="➕ Registrar nueva deuda">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Acreedor (banco, tarjeta, prestamista)" className="sm:col-span-2">
            <Input placeholder="Ej: Banco ABC, Tarjeta Visa, Prestamista Juan" value={input.acreedor} onChange={(e) => setInput({ ...input, acreedor: e.target.value })} required />
          </Field>
          <Field label="Moneda">
            <Select value={input.moneda} onChange={(e) => setInput({ ...input, moneda: e.target.value })} options={[{ value: "PEN", label: "Soles (PEN)" }, { value: "USD", label: "Dólares (USD)" }]} />
          </Field>
          <Field label="Monto inicial">
            <Input type="number" step="0.01" min="0" value={input.monto} onChange={(e) => setInput({ ...input, monto: Number(e.target.value) })} required />
          </Field>
          <Field label="Tipo de tasa">
            <Select value={input.tipo_tasa} onChange={(e) => setInput({ ...input, tipo_tasa: e.target.value as any })} options={[{ value: "efectiva", label: "Efectiva (TEA)" }, { value: "nominal", label: "Nominal" }]} />
          </Field>
          <Field label="Tasa anual" hint="Ej: 0.085 = 8.5%">
            <Input type="number" step="0.000001" min="0" value={input.tasa_anual} onChange={(e) => setInput({ ...input, tasa_anual: Number(e.target.value) })} required />
          </Field>
          <Field label="Plazo (meses)">
            <Input type="number" min="1" value={input.plazo_meses} onChange={(e) => setInput({ ...input, plazo_meses: Number(e.target.value) })} required />
          </Field>
          <Field label="Fecha de inicio" className="sm:col-span-2">
            <Input type="date" value={input.fecha_inicio} onChange={(e) => setInput({ ...input, fecha_inicio: e.target.value })} required />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setInput({ acreedor: "", moneda: "PEN", monto: 0, tasa_anual: 0.085, plazo_meses: 12, tipo_tasa: "efectiva", fecha_inicio: new Date().toISOString().slice(0, 10) })}>
              Limpiar
            </Button>
            <Button variant="primary" type="submit">
              Guardar deuda
            </Button>
          </div>
        </form>
      </Section>

      <Section title="📊 Cálculo preliminar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row k="Cuota mensual" v={fmtMoney(input.moneda, cuota)} />
          <Row k="Total a pagar" v={fmtMoney(input.moneda, total_pagar)} />
          <Row k="Interés total" v={fmtMoney(input.moneda, interes_total)} />
          <Row k="Tasa mensual" v={(i_mensual * 100).toFixed(4) + "%"} />
        </div>
      </Section>
    </div>
  );
}

// 📅 CRONOGRAMA
function CronogramaView() {
  const { deudas } = useAppStore();
  const [selectedDeudaId, setSelectedDeudaId] = useState<string>(deudas[0]?.id || "");
  const deuda = deudas.find((d) => d.id === selectedDeudaId);

  if (!deuda || deudas.length === 0) {
    return (
      <Section title="📅 Cronograma">
        <div className="text-center py-8 text-gray-500">
          <p>No tienes deudas para mostrar cronograma</p>
        </div>
      </Section>
    );
  }

  const i_mensual = deuda.tipo_tasa === "efectiva" ? Math.pow(1 + deuda.tasa_anual, 1 / 12) - 1 : deuda.tasa_anual / 12;
  const n = Math.max(0, deuda.plazo_meses - deuda.meses_pagados);
  const cuota = (deuda.monto * i_mensual) / (1 - Math.pow(1 + i_mensual, -n));

  const cronograma = useMemo(() => {
    const rows: { periodo: number; fecha: string; cuota: number; interes: number; amortizacion: number; saldo: number }[] = [];
    let saldo = deuda.monto;

    const addMonths = (start: string, m: number) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + m);
      return d.toISOString().slice(0, 10);
    };

    for (let k = 1; k <= deuda.plazo_meses; k++) {
      const interes = saldo * i_mensual;
      const amort = cuota - interes;
      saldo = Math.max(0, saldo - amort);
      rows.push({ periodo: k, fecha: addMonths(deuda.fecha_inicio, k), cuota, interes, amortizacion: amort, saldo });
    }
    return rows;
  }, [deuda, i_mensual, cuota]);

  const exportCSV = () => {
    const headers = ["Período", "Fecha", "Cuota", "Interés", "Amortización", "Saldo"];
    const lines = cronograma.map((r) => [r.periodo, r.fecha, r.cuota.toFixed(2), r.interes.toFixed(2), r.amortizacion.toFixed(2), r.saldo.toFixed(2)].join(","));
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cronograma_${deuda.acreedor}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <Section title="Seleccionar deuda">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {deudas.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDeudaId(d.id)}
              className={`rounded-xl p-3 text-left transition ${selectedDeudaId === d.id ? "bg-blue-100 border-2 border-blue-600" : "bg-gray-50 border border-gray-200 hover:border-blue-300"}`}
            >
              <p className="font-semibold text-sm">{d.acreedor}</p>
              <p className="text-xs text-gray-600">{fmtMoney(d.moneda, d.monto)}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title={`📅 Cronograma – ${deuda.acreedor}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Row k="Cuota" v={fmtMoney(deuda.moneda, cuota)} />
          <Row k="Total pagado" v={fmtMoney(deuda.moneda, cuota * deuda.plazo_meses)} />
          <Row k="Interés" v={fmtMoney(deuda.moneda, cronograma.reduce((s, r) => s + r.interes, 0))} />
          <Row k="Meses" v={deuda.plazo_meses} />
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="primary" onClick={exportCSV}>
            📥 Descargar CSV
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            🖨 Imprimir
          </Button>
        </div>

        <div className="overflow-auto border rounded-xl">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-blue-50">
              <tr>
                <Th>Per</Th>
                <Th>Fecha</Th>
                <Th>Cuota</Th>
                <Th>Interés</Th>
                <Th>Amortización</Th>
                <Th>Saldo</Th>
              </tr>
            </thead>
            <tbody>
              {cronograma.map((r) => (
                <tr key={r.periodo} className="odd:bg-white even:bg-zinc-50 border-b">
                  <Td>{r.periodo}</Td>
                  <Td>{r.fecha}</Td>
                  <Td>{fmtMoney(deuda.moneda, r.cuota)}</Td>
                  <Td>{fmtMoney(deuda.moneda, r.interes)}</Td>
                  <Td>{fmtMoney(deuda.moneda, r.amortizacion)}</Td>
                  <Td className="font-semibold">{fmtMoney(deuda.moneda, r.saldo)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// 📊 REPORTES
function Reportes() {
  const { deudas, getTotalDeudado, getProximosVencimientos } = useAppStore();
  const proximosVencimientos = getProximosVencimientos();

  const calcularCuota = (deuda: Deuda) => {
    const i_mensual = deuda.tipo_tasa === "efectiva" ? Math.pow(1 + deuda.tasa_anual, 1 / 12) - 1 : deuda.tasa_anual / 12;
    const n = Math.max(0, deuda.plazo_meses - deuda.meses_pagados);
    if (i_mensual <= 0 || n <= 0) return 0;
    return (deuda.monto * i_mensual) / (1 - Math.pow(1 + i_mensual, -n));
  };

  const chartData = deudas.map((d) => ({
    name: d.acreedor.substring(0, 10),
    monto: d.monto,
    cuota: calcularCuota(d),
  }));

  const chartDataByMonth = Array.from({ length: 6 }, (_, i) => ({
    mes: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"][i],
    deuda: getTotalDeudado() * (1 - (i * 0.08)),
  }));

  return (
    <div className="grid gap-6">
      <Section title="📊 Resumen de reportes">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-red-600 text-sm font-medium">Total adeudado</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{fmtMoney("PEN", getTotalDeudado())}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-blue-600 text-sm font-medium">Deudas activas</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{deudas.filter((d) => d.estado === "activa").length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-green-600 text-sm font-medium">Promedio por deuda</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{fmtMoney("PEN", deudas.length > 0 ? getTotalDeudado() / deudas.length : 0)}</p>
          </div>
        </div>
      </Section>

      {chartData.length > 0 && (
        <Section title="📈 Comparativo de deudas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => fmtMoney("PEN", value as number)} />
              <Legend />
              <Bar dataKey="monto" fill="#3b82f6" name="Monto" />
              <Bar dataKey="cuota" fill="#f59e0b" name="Cuota mensual" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}

      <Section title="📉 Proyección de deuda (6 meses)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartDataByMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => fmtMoney("PEN", value as number)} />
            <Legend />
            <Line type="monotone" dataKey="deuda" stroke="#3b82f6" strokeWidth={2} name="Deuda total" />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      <Section title="🚨 Próximos vencimientos">
        {proximosVencimientos.length === 0 ? (
          <p className="text-gray-500">No hay vencimientos próximos</p>
        ) : (
          <div className="space-y-3">
            {proximosVencimientos.slice(0, 5).map((d) => (
              <div key={d.id} className={`flex items-center justify-between p-4 rounded-lg border ${d.prioridad === "alta" ? "bg-red-50 border-red-200" : d.prioridad === "media" ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                <div>
                  <p className="font-semibold">{d.acreedor}</p>
                  <p className="text-sm text-gray-600">
                    <CalendarDays size={14} className="inline mr-1" />
                    Próximo pago
                  </p>
                </div>
                <Pill tone={d.prioridad === "alta" ? "red" : d.prioridad === "media" ? "amber" : "green"}>{d.prioridad.toUpperCase()}</Pill>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ⚙️ CONFIGURACIÓN
function Configuracion() {
  const { usuario, logout } = useAppStore();

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
      <Section title="⚙️ Configuración de cuenta">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Nombre</p>
            <p className="text-lg font-semibold">{usuario?.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-lg font-semibold">{usuario?.email}</p>
          </div>
          <div className="pt-4 border-t">
            <Button variant="danger" onClick={() => { logout(); window.location.reload(); }}>
              <LogOut size={18} className="inline" /> Cerrar sesión
            </Button>
          </div>
        </div>
      </Section>

      <Section title="💡 Acerca de DeudaTracker">
        <p className="text-gray-700 mb-3">
          DeudaTracker es una herramienta para gestionar tus deudas personales de forma eficiente. Calcula automáticamente cuotas, genera cronogramas y te alerta sobre vencimientos próximos.
        </p>
        <p className="text-sm text-gray-600">
          Versión 1.0 • {new Date().getFullYear()}
        </p>
      </Section>
    </div>
  );
}

// 🔗 FOOTER
function Footer() {
  return (
    <footer className="border-t mt-10">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 text-sm text-zinc-600 flex items-center justify-between">
        <span>© {new Date().getFullYear()} DeudaTracker — Tu gestor de deudas</span>
        <a href="#" className="hover:text-blue-800 transition">
          Privacidad
        </a>
      </div>
    </footer>
  );
}
