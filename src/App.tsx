import React, { useMemo, useState } from "react";
import { npv, irrPeriodic } from "./lib/finance";

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
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-rose-600 focus:border-rose-600 ${props.className || ""}`}
  />
);

const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }
> = ({ options, ...props }) => (
  <select
    {...props}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-rose-600 focus:border-rose-600 ${props.className || ""}`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

// ✅ sin clases dinámicas (seguro en build/purge)
const toneMap = {
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  zinc: "bg-zinc-50 text-zinc-700 border-zinc-200",
} as const;

const Pill: React.FC<{ tone?: keyof typeof toneMap; children: React.ReactNode }> = ({ tone = "rose", children }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${toneMap[tone]}`}>{children}</span>
);

const tabs = ["Inicio", "Registrar", "Login", "Simulador", "Auditoría"] as const;
type Tab = typeof tabs[number];

export default function App() {
  const [tab, setTab] = useState<Tab>("Inicio");
  return (
    // ✅ ancho completo + evitar scroll horizontal residual
    <div className="min-h-screen w-screen overflow-x-hidden bg-gradient-to-b from-zinc-100 to-zinc-200">
      <Navbar tab={tab} setTab={setTab} />
      {/* ✅ contenedor full-width con paddings responsivos */}
      <main className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {tab === "Inicio" && <Landing setTab={setTab} />}
        {tab === "Registrar" && <Register />}
        {tab === "Login" && <Login />}
        {tab === "Simulador" && <Simulador />}
        {tab === "Auditoría" && <Auditoria />}
      </main>
      <Footer />
    </div>
  );
}

function Navbar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <header className="sticky top-0 z-10 bg-rose-900 text-zinc-100 shadow">
      {/* ✅ full-width + flex-wrap para que no se corten los botones */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center font-bold">MV</div>
          <span className="font-semibold hidden sm:block truncate">MiVivienda – Simulador</span>
        </div>
        <nav className="flex gap-2 flex-wrap justify-end">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-sm transition whitespace-nowrap ${
                tab === t ? "bg-zinc-100 text-rose-900" : "hover:bg-rose-800/60"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Landing({ setTab }: { setTab: (t: Tab) => void }) {
  return (
    // ✅ mejor grid en móviles + texto legible
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
      <Section className="order-2 xl:order-1" title="Nuevo Crédito MiVivienda – Simulador 30/360">
        <p className="text-gray-700 mb-4 text-base md:text-lg leading-relaxed break-words">
          Calcula planes de pago bajo método francés vencido, con opción de gracia (total/parcial), bono y costos.
          Obtén TCEA/TREA por IRR del cliente, VAN/TIR y sensibilidad (duración/convexidad).
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          <Pill tone="rose">Base 30/360</Pill>
          <Pill tone="rose">Transparencia SBS</Pill>
          <Pill tone="rose">VAN / TIR / TCEA</Pill>
          <Pill tone="rose">Duración / Convexidad</Pill>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl bg-rose-800 text-white px-4 py-2 hover:bg-rose-900" onClick={() => setTab("Simulador")}>
            Ir al Simulador
          </button>
          <button className="rounded-xl bg-white text-rose-900 border border-rose-900 px-4 py-2" onClick={() => setTab("Registrar")}>
            Crear cuenta
          </button>
        </div>
      </Section>
      <div className="order-1 xl:order-2">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-rose-100">
          {/* ✅ altura responsiva */}
          <img
            src="https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=1470&auto=format&fit=crop"
            alt="Finanzas y vivienda"
            className="w-full h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover"
          />
        </div>
      </div>
    </div>
  );
}

function Register() {
  return (
    <div className="max-w-xl mx-auto">
      <Section title="Registrar usuario">
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre"><Input placeholder="Juan" /></Field>
          <Field label="Apellido"><Input placeholder="Pérez" /></Field>
          <Field label="Email" hint="Se usará para login"><Input type="email" placeholder="nombre@correo.com" className="sm:col-span-2" /></Field>
          <Field label="Teléfono"><Input placeholder="999 999 999" /></Field>
          <Field label="Contraseña"><Input type="password" placeholder="••••••••" /></Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="reset" className="rounded-xl px-4 py-2 border">Cancelar</button>
            <button type="button" className="rounded-xl px-4 py-2 bg-rose-800 text-white">Crear cuenta</button>
          </div>
        </form>
      </Section>
    </div>
  );
}

function Login() {
  return (
    <div className="max-w-md mx-auto">
      <Section title="Iniciar sesión">
        <form className="grid gap-4">
          <Field label="Email"><Input type="email" placeholder="nombre@correo.com" /></Field>
          <Field label="Contraseña"><Input type="password" placeholder="••••••••" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-xl px-4 py-2 bg-rose-800 text-white">Ingresar</button>
          </div>
        </form>
      </Section>
    </div>
  );
}

function Simulador() {
  const [input, setInput] = useState({
    moneda: "PEN",
    principal: 180000,
    plazo_meses: 240,
    fecha_desembolso: "2025-11-01",
    tipo_tasa: "efectiva" as "nominal" | "efectiva",
    tasa_anual: 0.085,
    capitalizacion_m: 12,
    tipo_gracia: "parcial" as "ninguna" | "parcial" | "total",
    periodo_gracia: 6,
    bono_aplicado: 30000,
    fees_upfront: 500,
    seguro_mensual: 45,
    cok: 0.10,
    base_dias: 360,
  });

  const i_periodica = useMemo(() => {
    if (input.tipo_tasa === "nominal") return (input.tasa_anual || 0) / (input.capitalizacion_m || 12);
    return Math.pow(1 + (input.tasa_anual || 0), 1 / 12) - 1; // TEA → mensual
  }, [input.tipo_tasa, input.tasa_anual, input.capitalizacion_m]);

  const nAmort = Math.max(0, (input.plazo_meses || 0) - (input.periodo_gracia || 0));
  const Pnet = Math.max(0, (input.principal || 0) - (input.bono_aplicado || 0));

  const cuotaBase = useMemo(() => {
    if (i_periodica <= 0 || nAmort <= 0) return 0;
    return (Pnet * i_periodica) / (1 - Math.pow(1 + i_periodica, -nAmort));
  }, [i_periodica, nAmort, Pnet]);

  const cronograma = useMemo(() => {
    const rows: { periodo: number; fecha: string; cuota: number; interes: number; amortizacion: number; seguro: number; saldo: number }[] = [];
    let saldo = Pnet;
    const g = input.periodo_gracia || 0;

    const addMonths = (start: string, m: number) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + m);
      const day = Math.min(30, d.getDate());
      d.setDate(day);
      return d.toISOString().slice(0, 10);
    };

    // Gracia
    for (let t = 1; t <= g; t++) {
      const interes = saldo * i_periodica;
      let cuota = 0, amort = 0, seguro = 0;
      if (input.tipo_gracia === "parcial") {
        cuota = interes + (input.seguro_mensual || 0);
        seguro = input.seguro_mensual || 0;
      } else if (input.tipo_gracia === "total") {
        saldo += interes; // capitaliza
      }
      rows.push({ periodo: t, fecha: addMonths(input.fecha_desembolso, t), cuota, interes, amortizacion: amort, seguro, saldo: Math.max(0, saldo) });
    }

    // Amortización
    const n = nAmort;
    const A = cuotaBase; // sin seguro
    for (let k = 1; k <= n; k++) {
      const t = g + k;
      const interes = saldo * i_periodica;
      const amort = A - interes;
      saldo = +(saldo - amort).toFixed(10);
      const cuota = A + (input.seguro_mensual || 0);
      rows.push({ periodo: t, fecha: addMonths(input.fecha_desembolso, t), cuota, interes, amortizacion: amort, seguro: (input.seguro_mensual || 0), saldo: Math.max(0, saldo) });
    }
    return rows;
  }, [Pnet, input.fecha_desembolso, input.periodo_gracia, input.tipo_gracia, input.seguro_mensual, cuotaBase, i_periodica, nAmort]);

  const flujosCliente = useMemo(() => {
    const arr: number[] = [];
    const desembolso0 = Pnet - (input.fees_upfront || 0);
    arr.push(desembolso0);
    cronograma.forEach((r) => { arr.push(-(r.cuota)); });
    return arr;
  }, [cronograma, Pnet, input.fees_upfront]);

  const irrPer = useMemo(() => irrPeriodic(flujosCliente), [flujosCliente]);
  const tcea = irrPer != null ? Math.pow(1 + irrPer, 12) - 1 : null;
  const cokPer = Math.pow(1 + (input.cok || 0), 1 / 12) - 1;
  const van = useMemo(() => (cokPer != null ? npv(cokPer, flujosCliente) : null), [cokPer, flujosCliente]);

  const totalPagado = cronograma.reduce((s, r) => s + r.cuota, 0);
  const interesTotal = cronograma.reduce((s, r) => s + r.interes, 0);
  const totalSeguros = cronograma.reduce((s, r) => s + (r.seguro || 0), 0);

  const exportCSV = () => {
    const headers = ["Periodo", "Fecha", "Cuota", "Interés", "Amortización", "Seguro", "Saldo"];
    const lines = cronograma.map(r => [r.periodo, r.fecha, r.cuota, r.interes, r.amortizacion, r.seguro || 0, r.saldo].join(","));
    const csv = [headers.join(","), ...lines].join("\n"); // newline correcto
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cronograma_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ grilla 2XL para aprovechar pantallas muy anchas
  return (
    <div className="grid lg:grid-cols-2 2xl:grid-cols-3 gap-6">
      <Section title="Parámetros del crédito">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Moneda">
            <Select value={input.moneda} onChange={(e) => setInput({ ...input, moneda: e.target.value })} options={[{ value: "PEN", label: "PEN" }, { value: "USD", label: "USD" }]} />
          </Field>
          <Field label="Monto del crédito"><Input type="number" value={input.principal} onChange={(e) => setInput({ ...input, principal: Number(e.target.value) })} /></Field>
          <Field label="Plazo (meses)"><Input type="number" value={input.plazo_meses} onChange={(e) => setInput({ ...input, plazo_meses: Number(e.target.value) })} /></Field>
          <Field label="Fecha de desembolso"><Input type="date" value={input.fecha_desembolso} onChange={(e) => setInput({ ...input, fecha_desembolso: e.target.value })} /></Field>
          <Field label="Tipo de tasa">
            <Select value={input.tipo_tasa} onChange={(e) => setInput({ ...input, tipo_tasa: e.target.value as any })} options={[{ value: "nominal", label: "Nominal" }, { value: "efectiva", label: "Efectiva" }]} />
          </Field>
          <Field label="Tasa anual" hint="fracción: 0.085 = 8.5%"><Input type="number" step="0.000001" value={input.tasa_anual} onChange={(e) => setInput({ ...input, tasa_anual: Number(e.target.value) })} /></Field>
          {input.tipo_tasa === "nominal" && (
            <Field label="Capitalización (m)"><Input type="number" value={input.capitalizacion_m} onChange={(e) => setInput({ ...input, capitalizacion_m: Number(e.target.value) })} /></Field>
          )}
          <Field label="Tipo de gracia">
            <Select value={input.tipo_gracia} onChange={(e) => setInput({ ...input, tipo_gracia: e.target.value as any })} options={[
              { value: "ninguna", label: "Ninguna" }, { value: "parcial", label: "Parcial" }, { value: "total", label: "Total" }
            ]} />
          </Field>
          <Field label="Meses de gracia"><Input type="number" value={input.periodo_gracia} onChange={(e) => setInput({ ...input, periodo_gracia: Number(e.target.value) })} /></Field>
          <Field label="Bono aplicado"><Input type="number" value={input.bono_aplicado} onChange={(e) => setInput({ ...input, bono_aplicado: Number(e.target.value) })} /></Field>
          <Field label="Comisiones iniciales (fees)"><Input type="number" value={input.fees_upfront} onChange={(e) => setInput({ ...input, fees_upfront: Number(e.target.value) })} /></Field>
          <Field label="Seguro mensual (monto)"><Input type="number" value={input.seguro_mensual} onChange={(e) => setInput({ ...input, seguro_mensual: Number(e.target.value) })} /></Field>
          <Field label="COK (anual)"><Input type="number" step="0.000001" value={input.cok} onChange={(e) => setInput({ ...input, cok: Number(e.target.value) })} /></Field>
        </div>
      </Section>

      <Section title="Resultados" className="2xl:col-span-1">
        <div className="grid gap-3 text-sm">
          <Row k="Tasa periódica (mensual)" v={(i_periodica * 100).toFixed(4) + "%"} />
          <Row k="Periodos amortizables (n)" v={nAmort} />
          <Row k="Principal neto (P_net)" v={fmtMoney(input.moneda, Pnet)} />
          <Row k="Cuota base (sin seguro)" v={fmtMoney(input.moneda, cuotaBase)} />
          <Row k="Total pagado" v={fmtMoney(input.moneda, totalPagado)} />
          <Row k="Interés total" v={fmtMoney(input.moneda, interesTotal)} />
          <Row k="Total seguros" v={fmtMoney(input.moneda, totalSeguros)} />
          <Row k="VAN (cliente)" v={fmtMoney(input.moneda, van)} />
          <Row k="TCEA (anual)" v={tcea != null ? (tcea * 100).toFixed(3) + "%" : "—"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-xl bg-rose-800 text-white px-4 py-2" onClick={exportCSV}>Exportar XLSX (CSV)</button>
          <button className="rounded-xl bg-white text-rose-900 border px-4 py-2" onClick={() => window.print()}>Exportar PDF</button>
        </div>
      </Section>

      <Section title="Cronograma (vista previa)" className="lg:col-span-2 2xl:col-span-3 print:bg-white">
        <div className="overflow-auto border rounded-xl print:border-0">
          <table className="min-w-full text-sm">
            <thead className="bg-rose-50">
              <tr><Th>Per</Th><Th>Fecha</Th><Th>Cuota</Th><Th>Interés</Th><Th>Amortización</Th><Th>Seguro</Th><Th>Saldo</Th></tr>
            </thead>
            <tbody>
              {cronograma.map((r) => (
                <tr key={r.periodo} className="odd:bg-white even:bg-zinc-50">
                  <Td>{r.periodo}</Td>
                  <Td>{r.fecha}</Td>
                  <Td>{fmtMoney(input.moneda, r.cuota)}</Td>
                  <Td>{fmtMoney(input.moneda, r.interes)}</Td>
                  <Td>{fmtMoney(input.moneda, r.amortizacion)}</Td>
                  <Td>{fmtMoney(input.moneda, r.seguro || 0)}</Td>
                  <Td>{fmtMoney(input.moneda, r.saldo)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b last:border-none py-2">
      <span className="text-gray-600">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

function Auditoria() {
  return (
    <div className="grid gap-6">
      <Section title="Bitácora de cambios (demo)">
        <div className="overflow-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr><Th>Fecha</Th><Th>Usuario</Th><Th>Campo</Th><Th>Anterior</Th><Th>Nuevo</Th></tr>
            </thead>
            <tbody>
              {[
                { f: "2025-10-10 10:12", u: "luis", c: "tasa_anual", a: "0.0825", n: "0.0850" },
                { f: "2025-10-11 09:01", u: "luis", c: "bono_aplicado", a: "25000", n: "30000" },
              ].map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-zinc-50">
                  <Td>{r.f}</Td><Td>{r.u}</Td><Td>{r.c}</Td><Td>{r.a}</Td><Td>{r.n}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => <th className="text-left px-4 py-2 font-semibold text-zinc-700">{children}</th>;
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => <td className="px-4 py-2">{children}</td>;

function Footer() {
  return (
    <footer className="border-t mt-10">
      {/* ✅ full-width en footer */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-6 text-sm text-zinc-600 flex items-center justify-between">
        <span>© {new Date().getFullYear()} MiVivienda – Simulador</span>
        <a className="hover:text-rose-800" href="#">Política de transparencia</a>
      </div>
    </footer>
  );
}

function fmtMoney(moneda: string, v: number | null | undefined) {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(v || 0);
  } catch {
    return `${moneda} ${Number(v || 0).toFixed(2)}`;
  }
}
