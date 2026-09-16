export interface Transaction {
  id: string;
  Tipo: 'Ingreso' | 'Egreso';
  Fecha: string;
  Categoria: string;
  Concepto: string;
  Monto: number;
  Entidad: string;
  Mes: string;
  estado?: 'confirmado' | 'pendiente' | 'provisional';
  isBridgedFromPrevMonth?: boolean;
  bridgedTargetMonth?: string;
  createdAt?: string;
  cuotas?: number;
  esCuotas?: boolean;
  montoTotal?: number;
  montoCuota?: number;
  mesInicioFacturacion?: string;
}

export { CONCEPTO_A_CATEGORIA, CATEGORIAS_PERSONALES } from './categoryClassification';

export const CATEGORIAS = [
  'Deuda',
  'Gasto',
  'Otro Egre',
  'Otro Ing',
  'Servicio',
  'Sueldo',
  'Tarjeta',
] as const;

export type CategoriaType = typeof CATEGORIAS[number];

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export const ENTIDADES = [
  'Interbank', 'BBVA Bfree', 'Interbank Amex', 'BCP', 'Ripley'
] as const;

export const LINE_OVERRIDES: Record<string, number> = {
  'BBVA Bfree': 3000,
  'Interbank Amex': 5000,
  'Ripley': 2000,
};

export const ACCOUNT_LABELS: Record<string, string> = {
  'Interbank': 'Cuenta Principal',
  'BBVA Bfree': 'Tarjeta Crédito',
  'Interbank Amex': 'Tarjeta Crédito',
  'BCP': 'Cuenta Ahorro',
  'Ripley': 'Tarjeta Crédito',
};

export const masterTransactions: Transaction[] = [
  {
    "id": "tx-6",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 128.08,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-3",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-4",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 104,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-14",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Vino",
    "Monto": 34,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-7",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-5",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 29.3,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-17",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-24",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-23",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Turron",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-8",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "IA",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-2",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2073.06,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-13",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 14.1,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-12",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 36.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-15",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 36.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-10",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 267.56,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-16",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 2.7,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-21",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-9",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-11",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 379.4,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-1",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 32.02,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-22",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 20.8,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-18",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Chupete",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-19",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-20",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto Bad Bunny",
    "Monto": 550.46,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-25",
    "Tipo": "Egreso",
    "Fecha": "2026-01-02",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Fatima",
    "Monto": 59.4,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-26",
    "Tipo": "Egreso",
    "Fecha": "2026-01-02",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-29",
    "Tipo": "Egreso",
    "Fecha": "2026-01-04",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 110.8,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-27",
    "Tipo": "Egreso",
    "Fecha": "2026-01-04",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños",
    "Monto": 100.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-28",
    "Tipo": "Egreso",
    "Fecha": "2026-01-04",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños",
    "Monto": 20,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-30",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-05",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 60.1,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-32",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 18.6,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-31",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Fatima",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-33",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 6.39,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-34",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12.2,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-35",
    "Tipo": "Egreso",
    "Fecha": "2026-01-08",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-37",
    "Tipo": "Egreso",
    "Fecha": "2026-01-10",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-36",
    "Tipo": "Egreso",
    "Fecha": "2026-01-10",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 15.71,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-40",
    "Tipo": "Egreso",
    "Fecha": "2026-01-11",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 19.09,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-39",
    "Tipo": "Egreso",
    "Fecha": "2026-01-11",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Alcohol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-38",
    "Tipo": "Egreso",
    "Fecha": "2026-01-11",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Shawarma",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-41",
    "Tipo": "Egreso",
    "Fecha": "2026-01-12",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-42",
    "Tipo": "Egreso",
    "Fecha": "2026-01-13",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Camisa",
    "Monto": 90.9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-43",
    "Tipo": "Egreso",
    "Fecha": "2026-01-14",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 4.02,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-44",
    "Tipo": "Egreso",
    "Fecha": "2026-01-14",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-46",
    "Tipo": "Egreso",
    "Fecha": "2026-01-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Yape Crédito",
    "Monto": 60.36,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-47",
    "Tipo": "Egreso",
    "Fecha": "2026-01-15",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Shawarma",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-45",
    "Tipo": "Egreso",
    "Fecha": "2026-01-15",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-49",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-50",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Cerveza",
    "Monto": 16.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-48",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Gorra",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-51",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-57",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-52",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Cerveza",
    "Monto": 32.3,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-55",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 71,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-56",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 7.09,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-53",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-54",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "In Game",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-58",
    "Tipo": "Egreso",
    "Fecha": "2026-01-19",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 12.36,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-60",
    "Tipo": "Egreso",
    "Fecha": "2026-01-21",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 6.25,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-59",
    "Tipo": "Egreso",
    "Fecha": "2026-01-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Tacos",
    "Monto": 55,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-61",
    "Tipo": "Egreso",
    "Fecha": "2026-01-21",
    "Categoria": "Salidas & Sociales",
    "Concepto": "FourLoko",
    "Monto": 9.19,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-63",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 5.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-62",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 2.29,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-65",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-64",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 5.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-66",
    "Tipo": "Egreso",
    "Fecha": "2026-01-23",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 9.4,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-67",
    "Tipo": "Egreso",
    "Fecha": "2026-01-23",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-68",
    "Tipo": "Egreso",
    "Fecha": "2026-01-25",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mercado",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-75",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 19.1,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-79",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-78",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Argentina",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-80",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 19.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-85",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-86",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Menú",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-92",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-98",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-96",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 59.3,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-83",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Papa Rellena",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-94",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-82-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 0.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-82-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 0.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-88-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 1.1,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-88-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 1.1,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-95",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chicharron",
    "Monto": 22,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-88",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 1.1,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-77",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 107.3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-73",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-69",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 46.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-72",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 500,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-74",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 134.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-70",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2073.06,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-76",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-71",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 481,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-93",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 2.69,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-97",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Propina",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-82",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 0.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-84",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Trámites & Documentos",
    "Concepto": "Pasaporte",
    "Monto": 120.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-87",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-90",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Empanada",
    "Monto": 10.3,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-81",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mercado",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-91",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Trámites & Documentos",
    "Concepto": "DNI Electronico",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-100",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 51,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-99",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-89",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-103",
    "Tipo": "Egreso",
    "Fecha": "2026-02-02",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-101",
    "Tipo": "Egreso",
    "Fecha": "2026-02-02",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mercado",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-102",
    "Tipo": "Egreso",
    "Fecha": "2026-02-02",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-105",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 2.63,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-106",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Menú",
    "Monto": 13.65,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-107",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Temu",
    "Monto": 103.09,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-104",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Shampoo",
    "Monto": 17.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-105-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 2.63,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-105-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 2.64,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-108",
    "Tipo": "Egreso",
    "Fecha": "2026-02-05",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mercado",
    "Monto": 49.32,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-113",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Argentina",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-112",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-06",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "AFP",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-109",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 13.06,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-115",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-111",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-06",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "AFP",
    "Monto": 394,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-110",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 3.31,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-114",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-06",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "AFP",
    "Monto": 242,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-117",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3.29,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-116",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 3.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-120",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-118",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 30.57,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-119",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-121",
    "Tipo": "Egreso",
    "Fecha": "2026-02-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 59.54,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-122",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-10",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 1000,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-125",
    "Tipo": "Egreso",
    "Fecha": "2026-02-10",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-124",
    "Tipo": "Egreso",
    "Fecha": "2026-02-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-123",
    "Tipo": "Egreso",
    "Fecha": "2026-02-10",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-126",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-130",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Zapatillas",
    "Monto": 50.89,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-127",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 5.9,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-128",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Polo",
    "Monto": 42.46,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-131",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 90,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-129",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Gorra",
    "Monto": 40,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-132",
    "Tipo": "Egreso",
    "Fecha": "2026-02-12",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Camisa",
    "Monto": 69.5,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-134",
    "Tipo": "Egreso",
    "Fecha": "2026-02-13",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Ron",
    "Monto": 24,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-133",
    "Tipo": "Egreso",
    "Fecha": "2026-02-13",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 90,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-139",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 21.5,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-136",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-14",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Venta de iPhone",
    "Monto": 400,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-140",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Shampoo",
    "Monto": 6.5,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-137",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-135",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Yogurt",
    "Monto": 15.6,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-138",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Camisa",
    "Monto": 60,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-143",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Ron",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-141",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-144",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 8.1,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-142",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Yape Crédito",
    "Monto": 60.36,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-145",
    "Tipo": "Egreso",
    "Fecha": "2026-02-16",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mercado",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-146",
    "Tipo": "Egreso",
    "Fecha": "2026-02-16",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-147",
    "Tipo": "Egreso",
    "Fecha": "2026-02-16",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-148",
    "Tipo": "Egreso",
    "Fecha": "2026-02-18",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-150",
    "Tipo": "Egreso",
    "Fecha": "2026-02-19",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-149",
    "Tipo": "Egreso",
    "Fecha": "2026-02-19",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-153",
    "Tipo": "Egreso",
    "Fecha": "2026-02-20",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 6.99,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-152",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-20",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Mili",
    "Monto": 240,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-151",
    "Tipo": "Egreso",
    "Fecha": "2026-02-20",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto Paulo Londra",
    "Monto": 480,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-154",
    "Tipo": "Egreso",
    "Fecha": "2026-02-20",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-159",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-158",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Alcohol",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-160",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Cigarro",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-163",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Cigarro",
    "Monto": 13.91,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-162",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Cigarro",
    "Monto": 9,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-161",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 30,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-156",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-21",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-157",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-155",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 28,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-166",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Shawarma",
    "Monto": 22.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-164",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Ceviche",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-168",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 0.94,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-165",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chicharron",
    "Monto": 14.7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-167",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-169",
    "Tipo": "Egreso",
    "Fecha": "2026-02-24",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 30.8,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-171",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-24",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 379.74,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-170",
    "Tipo": "Egreso",
    "Fecha": "2026-02-24",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 379.76,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-172",
    "Tipo": "Egreso",
    "Fecha": "2026-02-25",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-173",
    "Tipo": "Egreso",
    "Fecha": "2026-02-25",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-182",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto Rawayana",
    "Monto": 180,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-184",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-180",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "AFP",
    "Monto": 1050,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-ahorro-dic25-marzo",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Ahorro Diciembre 25",
    "Monto": 3002,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-192",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Polo",
    "Monto": 55,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-193",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Camisa",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-199",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-196",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 22.8,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-191",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-195",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 1.91,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-187",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Aaron",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-190",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Pantalon",
    "Monto": 99,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-189",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Abuela",
    "Monto": 74.7,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-188",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Maleta",
    "Monto": 110,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-183",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto Milo J",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-198",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mercado",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-185",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 121.5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-186",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Shawarma",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-174",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 154.46,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-175",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2073.06,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-177",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-178",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 111.5,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-179",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 35.8,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-181",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Argentina",
    "Monto": 4052,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-194",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 71.03,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-176",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 431.15,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-197",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-200",
    "Tipo": "Egreso",
    "Fecha": "2026-03-02",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Streaming",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-201-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 5.49,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-201-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 5.5,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-202",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Shampoo",
    "Monto": 8.48,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-203",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-204",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Dollarcity",
    "Monto": 17,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-201",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 5.5,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-205",
    "Tipo": "Egreso",
    "Fecha": "2026-03-04",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Zapatillas",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-207",
    "Tipo": "Egreso",
    "Fecha": "2026-03-04",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 4.06,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-206",
    "Tipo": "Egreso",
    "Fecha": "2026-03-04",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9.09,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-209",
    "Tipo": "Egreso",
    "Fecha": "2026-03-05",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Casaca",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-208",
    "Tipo": "Egreso",
    "Fecha": "2026-03-05",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Galleta",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-210",
    "Tipo": "Egreso",
    "Fecha": "2026-03-06",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-212",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-214",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Ron",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-213",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Polo",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-215",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 6,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-211",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 17,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-216",
    "Tipo": "Egreso",
    "Fecha": "2026-03-08",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Vino",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-218",
    "Tipo": "Egreso",
    "Fecha": "2026-03-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-217",
    "Tipo": "Egreso",
    "Fecha": "2026-03-09",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Shampoo",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-220",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 2.21,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-221",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Torta de Chocolate",
    "Monto": 16.98,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-219",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-220-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 2.21,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-220-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 2.21,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-222",
    "Tipo": "Egreso",
    "Fecha": "2026-03-14",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 4.02,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-225",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-15",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Venta de iPhone",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-226",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-15",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Jacko",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-223",
    "Tipo": "Egreso",
    "Fecha": "2026-03-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Yape Crédito",
    "Monto": 60.36,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-224",
    "Tipo": "Egreso",
    "Fecha": "2026-03-15",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-228",
    "Tipo": "Egreso",
    "Fecha": "2026-03-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 22.94,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-227",
    "Tipo": "Egreso",
    "Fecha": "2026-03-21",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Madre",
    "Monto": 115.7,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-230",
    "Tipo": "Egreso",
    "Fecha": "2026-03-24",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Hamburguesa",
    "Monto": 6.78,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-229",
    "Tipo": "Egreso",
    "Fecha": "2026-03-24",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-231",
    "Tipo": "Egreso",
    "Fecha": "2026-03-26",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-249",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-253",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 29.5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-232",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 42.04,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-234",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 1010,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-236",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-245",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 13.5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-248",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 14.1,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-244",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Raura",
    "Monto": 135,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-243",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-247",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 101.5,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-251",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Menú",
    "Monto": 22,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-246",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Psicologo",
    "Monto": 60,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-252",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.91,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-254",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 117.3,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-242",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Menú",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-250",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Mayra",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-233",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-235",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-238",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Laraos",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-237",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 1000,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-241",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 36.63,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-239",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 195,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-240",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-256",
    "Tipo": "Egreso",
    "Fecha": "2026-04-02",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Adriano",
    "Monto": 122.6,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-255",
    "Tipo": "Egreso",
    "Fecha": "2026-04-02",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Pantalon",
    "Monto": 55.89,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-257",
    "Tipo": "Egreso",
    "Fecha": "2026-04-02",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-259",
    "Tipo": "Egreso",
    "Fecha": "2026-04-03",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 19.7,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-258",
    "Tipo": "Egreso",
    "Fecha": "2026-04-03",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 58.8,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-261",
    "Tipo": "Egreso",
    "Fecha": "2026-04-04",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 24,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-260",
    "Tipo": "Egreso",
    "Fecha": "2026-04-04",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 88.75,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-262",
    "Tipo": "Egreso",
    "Fecha": "2026-04-05",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 104.8,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-263",
    "Tipo": "Egreso",
    "Fecha": "2026-04-06",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 36,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-264",
    "Tipo": "Egreso",
    "Fecha": "2026-04-06",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-265",
    "Tipo": "Egreso",
    "Fecha": "2026-04-07",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Piura",
    "Monto": 10.4,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-266-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-04-08",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 18.57,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-266",
    "Tipo": "Egreso",
    "Fecha": "2026-04-08",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 18.57,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-266-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-04-08",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 18.58,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-268",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Hotel",
    "Monto": 32,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-271",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-09",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Milagros",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-267",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-270",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 28,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-269",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Alondra",
    "Monto": 69.22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-272",
    "Tipo": "Egreso",
    "Fecha": "2026-04-10",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 18.9,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-273",
    "Tipo": "Egreso",
    "Fecha": "2026-04-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 22.22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-274",
    "Tipo": "Egreso",
    "Fecha": "2026-04-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-275",
    "Tipo": "Egreso",
    "Fecha": "2026-04-11",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Hotel",
    "Monto": 42,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-276",
    "Tipo": "Egreso",
    "Fecha": "2026-04-14",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 4.04,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-279",
    "Tipo": "Egreso",
    "Fecha": "2026-04-15",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 200,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-278",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Yape Crédito",
    "Monto": 200,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-277",
    "Tipo": "Egreso",
    "Fecha": "2026-04-15",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-280",
    "Tipo": "Egreso",
    "Fecha": "2026-04-16",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-281",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-17",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Padre",
    "Monto": 60,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-283",
    "Tipo": "Egreso",
    "Fecha": "2026-04-17",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto Milo J",
    "Monto": 43.3,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-282",
    "Tipo": "Egreso",
    "Fecha": "2026-04-17",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 16.7,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-285",
    "Tipo": "Egreso",
    "Fecha": "2026-04-18",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Hotel",
    "Monto": 40,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-284",
    "Tipo": "Egreso",
    "Fecha": "2026-04-18",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Beu",
    "Monto": 40.48,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-286",
    "Tipo": "Egreso",
    "Fecha": "2026-04-18",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Hamburguesa",
    "Monto": 12,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-287",
    "Tipo": "Egreso",
    "Fecha": "2026-04-19",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3.96,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-288",
    "Tipo": "Egreso",
    "Fecha": "2026-04-20",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-289",
    "Tipo": "Egreso",
    "Fecha": "2026-04-24",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Cine",
    "Monto": 49.06,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-291",
    "Tipo": "Egreso",
    "Fecha": "2026-04-25",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 9.3,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-290",
    "Tipo": "Egreso",
    "Fecha": "2026-04-25",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 32.22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-292",
    "Tipo": "Egreso",
    "Fecha": "2026-04-26",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 21,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-306",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 84.5,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-307",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 45,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-309",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Padre",
    "Monto": 60,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-296",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Yape Crédito",
    "Monto": 206.33,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-293",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 32.1,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-294",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-304",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 0.73,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-310",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-297",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Aaron",
    "Monto": 92.42,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-315",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 162,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-308",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-299",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Aaron",
    "Monto": 170,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-303",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Dia del Trabajador",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-302",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-301",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Jacko",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-300",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 816.3,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-298",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-304-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 0.74,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-295",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 785,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-314",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-312",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 21,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-305",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-304-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 0.73,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-311",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 50,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-313",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Dia del Trabajador",
    "Monto": 107.3,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-316",
    "Tipo": "Egreso",
    "Fecha": "2026-05-02",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 14.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-317",
    "Tipo": "Egreso",
    "Fecha": "2026-05-02",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-318",
    "Tipo": "Egreso",
    "Fecha": "2026-05-03",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 14.61,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-320",
    "Tipo": "Egreso",
    "Fecha": "2026-05-04",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Dia de la Madre",
    "Monto": 92.36,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-319",
    "Tipo": "Egreso",
    "Fecha": "2026-05-04",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "IA",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-321",
    "Tipo": "Egreso",
    "Fecha": "2026-05-04",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-322",
    "Tipo": "Egreso",
    "Fecha": "2026-05-05",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 2,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-323",
    "Tipo": "Egreso",
    "Fecha": "2026-05-05",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-324-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-05-06",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 21.13,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-325",
    "Tipo": "Egreso",
    "Fecha": "2026-05-06",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-324-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-05-06",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 21.14,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-324",
    "Tipo": "Egreso",
    "Fecha": "2026-05-06",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 21.13,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-326",
    "Tipo": "Egreso",
    "Fecha": "2026-05-07",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 11.8,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-327",
    "Tipo": "Egreso",
    "Fecha": "2026-05-07",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-328",
    "Tipo": "Egreso",
    "Fecha": "2026-05-08",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-330",
    "Tipo": "Egreso",
    "Fecha": "2026-05-09",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Dia de la Madre",
    "Monto": 35,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-329",
    "Tipo": "Egreso",
    "Fecha": "2026-05-09",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 14.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-331",
    "Tipo": "Egreso",
    "Fecha": "2026-05-10",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Dia de la Madre",
    "Monto": 64.7,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-333",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 4.99,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-337",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 10,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-335",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-334",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-336",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-332",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Entrada Estadio",
    "Monto": 50,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-339",
    "Tipo": "Egreso",
    "Fecha": "2026-05-13",
    "Categoria": "Trámites & Documentos",
    "Concepto": "Titulación",
    "Monto": 700,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-338",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-13",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "CTS",
    "Monto": 1469.67,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-342",
    "Tipo": "Egreso",
    "Fecha": "2026-05-14",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 15.35,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-341",
    "Tipo": "Egreso",
    "Fecha": "2026-05-14",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 11.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-340",
    "Tipo": "Egreso",
    "Fecha": "2026-05-14",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Polo",
    "Monto": 59.99,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-343",
    "Tipo": "Egreso",
    "Fecha": "2026-05-15",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-344",
    "Tipo": "Egreso",
    "Fecha": "2026-05-15",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "KFC",
    "Monto": 39.05,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-345",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 2.19,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-347",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Pantalon",
    "Monto": 60.19,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-346",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Camisa",
    "Monto": 62,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-349",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-348",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-351",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-350",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-352",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 29,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-353",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-354",
    "Tipo": "Egreso",
    "Fecha": "2026-05-19",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-355",
    "Tipo": "Egreso",
    "Fecha": "2026-05-21",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 5.69,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-356",
    "Tipo": "Egreso",
    "Fecha": "2026-05-22",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto  Soda Stereo",
    "Monto": 83.08,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-357",
    "Tipo": "Egreso",
    "Fecha": "2026-05-23",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 28.1,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-358",
    "Tipo": "Egreso",
    "Fecha": "2026-05-26",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 60,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-359",
    "Tipo": "Egreso",
    "Fecha": "2026-05-26",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-360",
    "Tipo": "Egreso",
    "Fecha": "2026-05-27",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 12,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-370",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-361",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 434.53,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-374",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "HappyLand",
    "Monto": 60,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-392",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 44.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-376",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 3.67,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-377",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 37.9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-365",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Padre",
    "Monto": 15.66,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-382",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-375",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 75,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-362",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-373",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-372",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 17,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-369",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 26,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-371",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 18.07,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-383",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Bepanten",
    "Monto": 27.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-385",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chicharron",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-387",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-381",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-386",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Padre",
    "Monto": 16.7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-390",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-384",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 38.3,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-368",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Trámites & Documentos",
    "Concepto": "Titulación",
    "Monto": 434,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-367",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-366",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 880.45,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-363",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 1225.9,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-364",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 899.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-378",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-380",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Bowling",
    "Monto": 41.17,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-389",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 158.1,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-388",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Milagros",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-391",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 102,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-379",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Tatuaje",
    "Monto": 66.66,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-371-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 18.07,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-371-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 18.06,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-395",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-393",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Cine",
    "Monto": 79.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-394",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-396",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-397",
    "Tipo": "Egreso",
    "Fecha": "2026-06-03",
    "Categoria": "Regalos & Celebraciones",
    "Concepto": "Cumpleaños Padre",
    "Monto": 170.4,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-400",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-399",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 19.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-403",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 16.9,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-404",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Fifa 26",
    "Monto": 67.8,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-402",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Karts",
    "Monto": 30,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-401",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Fridays",
    "Monto": 100.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-398",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Cine",
    "Monto": 29.8,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-405",
    "Tipo": "Egreso",
    "Fecha": "2026-06-07",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 112,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-406",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 30,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-408",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Brasil",
    "Monto": 1600.06,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-410",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-407",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-08",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo BCP",
    "Monto": 1717.92,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-409",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-414",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 6.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-416",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 13,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-417",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Planet Chicken",
    "Monto": 55.3,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-412",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-411",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 20,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-415",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-413",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-421",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 11.6,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-419",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 25.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-418",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 18,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-420",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 5.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-423",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Hotel",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-422",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Streaming",
    "Monto": 21.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-426",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-11",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo Yape",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-428",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Figuritas",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-425",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-427",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-424",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-429",
    "Tipo": "Egreso",
    "Fecha": "2026-06-12",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-430",
    "Tipo": "Egreso",
    "Fecha": "2026-06-12",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-440",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-435",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 16,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-431",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 25,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-437",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Dollarcity",
    "Monto": 54,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-432",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-433",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 21.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-436",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Casaca",
    "Monto": 100,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-442",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Dollarcity",
    "Monto": 39.9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-443",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-445",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-13",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 145,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-434",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 16.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-441",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-444",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Ropa & Calzado",
    "Concepto": "Casaca",
    "Monto": 144.92,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-438",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 106,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-439",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 10.4,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-447",
    "Tipo": "Egreso",
    "Fecha": "2026-06-14",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-446",
    "Tipo": "Egreso",
    "Fecha": "2026-06-14",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 14.96,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-449",
    "Tipo": "Egreso",
    "Fecha": "2026-06-15",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "IA",
    "Monto": 21.91,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-450",
    "Tipo": "Egreso",
    "Fecha": "2026-06-15",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "IA",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-448",
    "Tipo": "Egreso",
    "Fecha": "2026-06-15",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-453",
    "Tipo": "Egreso",
    "Fecha": "2026-06-16",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-452",
    "Tipo": "Egreso",
    "Fecha": "2026-06-16",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 13.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-451",
    "Tipo": "Egreso",
    "Fecha": "2026-06-16",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-454",
    "Tipo": "Egreso",
    "Fecha": "2026-06-17",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12.77,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-457",
    "Tipo": "Egreso",
    "Fecha": "2026-06-19",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-455",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-19",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-456",
    "Tipo": "Egreso",
    "Fecha": "2026-06-19",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-459",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 4.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-463",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-460",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Figuritas",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-461",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Menú",
    "Monto": 22,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-462",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 3.99,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-458",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 1.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-464",
    "Tipo": "Egreso",
    "Fecha": "2026-06-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 21.23,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-466",
    "Tipo": "Egreso",
    "Fecha": "2026-06-21",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Medicina Madre",
    "Monto": 35.2,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-465",
    "Tipo": "Egreso",
    "Fecha": "2026-06-21",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Medicina Madre",
    "Monto": 18.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-471",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 7.63,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-468",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 12,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-470",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-469",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-467",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Hotel",
    "Monto": 55,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-471-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 7.64,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-471-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 7.63,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-472",
    "Tipo": "Egreso",
    "Fecha": "2026-06-23",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Medicina Madre",
    "Monto": 96,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-473",
    "Tipo": "Egreso",
    "Fecha": "2026-06-23",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 40,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-474",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 474.94,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-485",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-497",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-500",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-483",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo Yape",
    "Monto": 116.85,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-481",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 94,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-487",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-484",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-492",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-488",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Cine",
    "Monto": 47,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-479",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Trámites & Documentos",
    "Concepto": "Titulación",
    "Monto": 380,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-477",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 878,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-482",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 48.5,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-478",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 227.18,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-489",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 58.5,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-490",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Coptel",
    "Monto": 50,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-491",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-499",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-494",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-495",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-496",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 18,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-475",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-498",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 60,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-493-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 5.2,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-493-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 5.2,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-501",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 39,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-480",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-486",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-493",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 5.2,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-476",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 883.88,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-503",
    "Tipo": "Egreso",
    "Fecha": "2026-07-02",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-502",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-02",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 700,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-504",
    "Tipo": "Egreso",
    "Fecha": "2026-07-03",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Seguro Rimac",
    "Monto": 178.99,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-507",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 45.9,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-505",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 15.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-508",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 65,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-506",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 15.9,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-509",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 34,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-510",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Condones",
    "Monto": 20,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-513",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-512",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-514",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-515",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Padre",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-511",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-517",
    "Tipo": "Egreso",
    "Fecha": "2026-07-07",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-516-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-07-07",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 0.43,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-516-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-07-07",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 0.44,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-516",
    "Tipo": "Egreso",
    "Fecha": "2026-07-07",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 0.43,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-518",
    "Tipo": "Egreso",
    "Fecha": "2026-07-08",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-520",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-10",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Gratificación",
    "Monto": 2721.6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-523",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 0.61,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-519",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-522",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Trámites & Documentos",
    "Concepto": "Titulación",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-521",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Viajes & Hospedaje",
    "Concepto": "Viaje Brasil",
    "Monto": 2084.8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-525",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Alcohol",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-526",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 38,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-529",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Dollarcity",
    "Monto": 3,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-530",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pizza",
    "Monto": 56,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-527",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Crema de Manos",
    "Monto": 49.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-528",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 16,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-524",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 34.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-531",
    "Tipo": "Egreso",
    "Fecha": "2026-07-12",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-533",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Conciertos & Eventos",
    "Concepto": "Concierto Trueno",
    "Monto": 132,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-534",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 17.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-532",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo BCP",
    "Monto": 143.16,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-536",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 96,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-535",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 20,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-537",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 16,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-538",
    "Tipo": "Egreso",
    "Fecha": "2026-07-17",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 11.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-539",
    "Tipo": "Egreso",
    "Fecha": "2026-07-17",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-540",
    "Tipo": "Egreso",
    "Fecha": "2026-07-18",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 55,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-541",
    "Tipo": "Egreso",
    "Fecha": "2026-07-18",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Shawarma",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-542",
    "Tipo": "Egreso",
    "Fecha": "2026-07-18",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 74.72,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-544",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-543",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Ceviche",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-546",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 30,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-545",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "In Game",
    "Monto": 14,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-551",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9.97,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-548",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Minecraft",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-547",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-550",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 37,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-549",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-555",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-553",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 18.9,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-557",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-552",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 14.69,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-556",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 108,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-554",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 1.8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-559",
    "Tipo": "Egreso",
    "Fecha": "2026-07-24",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-558",
    "Tipo": "Egreso",
    "Fecha": "2026-07-24",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-560",
    "Tipo": "Egreso",
    "Fecha": "2026-07-25",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 11.9,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-562",
    "Tipo": "Egreso",
    "Fecha": "2026-07-25",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 34.5,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-561",
    "Tipo": "Egreso",
    "Fecha": "2026-07-25",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 12.1,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-564",
    "Tipo": "Egreso",
    "Fecha": "2026-07-26",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-563",
    "Tipo": "Egreso",
    "Fecha": "2026-07-26",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Skin de Valorant",
    "Monto": 31.9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-565",
    "Tipo": "Egreso",
    "Fecha": "2026-07-27",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-566",
    "Tipo": "Egreso",
    "Fecha": "2026-07-27",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Dulce de Leche",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-578",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 60.27,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-571",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 835.14,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-567",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 795.41,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-568",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-569",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 819.05,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-570",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 308.67,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-575",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo Yape",
    "Monto": 116.85,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-580",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 14,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-573",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-574",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Ripley",
    "Monto": 827.76,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-579",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 21,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-581",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 20,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-572",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-576",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-577",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 731.69,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-589",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 41,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-590",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 20,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-600",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-601",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-585",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 1.07,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-586",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 78.48,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-599",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 35.8,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-595",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Compras Generales & Bazar",
    "Concepto": "Poster de Spiderman",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-585-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 1.06,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-585-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 1.07,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-593",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 18.2,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-592",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 5.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-602",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 27,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-588",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Perfume Invictus",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-598",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-583",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-596",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-587",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-597",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 2.45,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-582",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 53,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-584",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-594",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Mayonesa",
    "Monto": 9.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-591",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 43.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-605",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 36.7,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-603",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 14.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-606",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 25,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-608",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-607",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-604",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 11.83,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-604-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 11.84,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-604-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 11.83,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-611",
    "Tipo": "Egreso",
    "Fecha": "2026-08-03",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 25.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-609",
    "Tipo": "Egreso",
    "Fecha": "2026-08-03",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Ceviche",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-610",
    "Tipo": "Egreso",
    "Fecha": "2026-08-03",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 43,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-613",
    "Tipo": "Egreso",
    "Fecha": "2026-08-04",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-612",
    "Tipo": "Egreso",
    "Fecha": "2026-08-04",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-616",
    "Tipo": "Egreso",
    "Fecha": "2026-08-05",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 57.3,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-615",
    "Tipo": "Egreso",
    "Fecha": "2026-08-05",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-614",
    "Tipo": "Egreso",
    "Fecha": "2026-08-05",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 19.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-617",
    "Tipo": "Egreso",
    "Fecha": "2026-08-06",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-618",
    "Tipo": "Egreso",
    "Fecha": "2026-08-06",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Ceviche",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-619",
    "Tipo": "Egreso",
    "Fecha": "2026-08-07",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 16.9,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-620",
    "Tipo": "Egreso",
    "Fecha": "2026-08-07",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-622",
    "Tipo": "Egreso",
    "Fecha": "2026-08-08",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 16.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-621",
    "Tipo": "Egreso",
    "Fecha": "2026-08-08",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-625",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 19,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-623",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-624",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-627",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Salud & Farmacia",
    "Concepto": "Medicina Madre",
    "Monto": 173.2,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-628",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-09",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Madre",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-629",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Desvagramen",
    "Monto": 21.31,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-626",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Chifa",
    "Monto": 64.7,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-630",
    "Tipo": "Egreso",
    "Fecha": "2026-08-10",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 21,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-631",
    "Tipo": "Egreso",
    "Fecha": "2026-08-10",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 28.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-635",
    "Tipo": "Egreso",
    "Fecha": "2026-08-11",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-633",
    "Tipo": "Egreso",
    "Fecha": "2026-08-11",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-632",
    "Tipo": "Egreso",
    "Fecha": "2026-08-11",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Luz",
    "Monto": 98,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-634",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-11",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-640",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-637",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 9.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-639",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Planet Chicken",
    "Monto": 75.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-636",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-643",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-642",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-638",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 10.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-641",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-648",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 14,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-649",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 118,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-645",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Carol",
    "Monto": 2.49,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-646",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 19,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-644",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-647",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-651",
    "Tipo": "Egreso",
    "Fecha": "2026-08-14",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-650",
    "Tipo": "Egreso",
    "Fecha": "2026-08-14",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-654",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 25,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-652",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo BCP",
    "Monto": 143.16,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-655",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 15.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-653",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 12.9,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-656",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Alcohol",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-657",
    "Tipo": "Egreso",
    "Fecha": "2026-08-16",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-658",
    "Tipo": "Egreso",
    "Fecha": "2026-08-17",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 2.43,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-658-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-08-17",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 2.43,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-658-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-08-17",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 2.44,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-659",
    "Tipo": "Egreso",
    "Fecha": "2026-08-17",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 1.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-660",
    "Tipo": "Egreso",
    "Fecha": "2026-08-18",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-661",
    "Tipo": "Egreso",
    "Fecha": "2026-08-19",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-662",
    "Tipo": "Egreso",
    "Fecha": "2026-08-20",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 12.9,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-664",
    "Tipo": "Egreso",
    "Fecha": "2026-08-21",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-663",
    "Tipo": "Egreso",
    "Fecha": "2026-08-21",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-666",
    "Tipo": "Egreso",
    "Fecha": "2026-08-22",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-665",
    "Tipo": "Egreso",
    "Fecha": "2026-08-22",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-669",
    "Tipo": "Egreso",
    "Fecha": "2026-08-23",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Taxi",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-667",
    "Tipo": "Egreso",
    "Fecha": "2026-08-23",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 14.66,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-668",
    "Tipo": "Egreso",
    "Fecha": "2026-08-23",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 25.9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-670",
    "Tipo": "Egreso",
    "Fecha": "2026-08-24",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Shawarma",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-671",
    "Tipo": "Egreso",
    "Fecha": "2026-08-24",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 7.97,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-671-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-08-24",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 7.96,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-671-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-08-24",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 7.97,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-672-pap",
    "Tipo": "Egreso",
    "Fecha": "2026-08-27",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Papel Higiénico",
    "Monto": 0.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-673",
    "Tipo": "Egreso",
    "Fecha": "2026-08-27",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-672",
    "Tipo": "Egreso",
    "Fecha": "2026-08-27",
    "Categoria": "Hogar & Mantenimiento",
    "Concepto": "Detergente",
    "Monto": 0.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-674",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-27",
    "Categoria": "Familia & Transferencias",
    "Concepto": "Eduardo",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-672-pas",
    "Tipo": "Egreso",
    "Fecha": "2026-08-27",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Pasta Dental",
    "Monto": 0.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-681",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo Yape",
    "Monto": 116.85,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-692",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Café",
    "Monto": 16,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-679",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 637.11,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-688",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-689",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-696",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-690",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Salidas & Sociales",
    "Concepto": "Alcohol",
    "Monto": 12.9,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-699",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 751.89,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-683",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788304865069-1pmm",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Gas",
    "Monto": 41.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788306110429-9yf9",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Entretenimiento & Streaming",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-698",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-682",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Cuidado Personal & Aseo",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-678",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 488.43,
    "Entidad": "BBVA Bfree",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-695",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-701",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-680",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta Ripley",
    "Monto": 200.67,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-693",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-684",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Futbol",
    "Monto": 24.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788304930230-yya3",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "BBVA Bfree",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-676",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Sueldos & Beneficios Laborales",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-686",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Gaseosa",
    "Monto": 12.7,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-677",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Linea Tarjeta",
    "Monto": 976.1,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788290934287-axni",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-691",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Ceviche",
    "Monto": 145,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-694",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Agua Mineral",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-687",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Supermercado & Alimentos",
    "Concepto": "Tortes",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-700",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 455.09,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-697",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-675",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Otros Ingresos & Ventas",
    "Concepto": "Bonificación Ahorro",
    "Monto": 193,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788318732143-ph17",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Pollo a la Brasa",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788319781444-bedx",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gustos & Ocio",
    "Concepto": "Apuestas",
    "Monto": 120,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-685",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Tecnología & Gadgets",
    "Concepto": "IA",
    "Monto": 18.99,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788390566112-9gyc",
    "Tipo": "Egreso",
    "Fecha": "2026-09-02",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788380807638-qzj4",
    "Tipo": "Egreso",
    "Fecha": "2026-09-02",
    "Categoria": "Comida & Restaurantes",
    "Concepto": "Makis",
    "Monto": 99,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788380184349-e8m0",
    "Tipo": "Egreso",
    "Fecha": "2026-09-02",
    "Categoria": "Transporte & Movilidad",
    "Concepto": "Bus",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788541099278-r8yh",
    "Tipo": "Egreso",
    "Fecha": "2026-09-03",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 13.92,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788558526336-dvbk",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 47.25,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788540997523-ytrh",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Cine",
    "Monto": 26.88,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788558413976-ooyv",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Bus",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788620451597-k8vf",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788620475501-krho",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788620525467-cu97",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Taxi",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788546849270-e52s",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Pasta Dental",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788561084403-tfxb",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Mayonesa",
    "Monto": 9.9,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788561096015-fxvf",
    "Tipo": "Egreso",
    "Fecha": "2026-09-04",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 5,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788653119631-prsa",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Gasto",
    "Concepto": "Detergente",
    "Monto": 8,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788640222821-1cj3",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Gasto",
    "Concepto": "Galleta",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788620492474-4p5i",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788667679166-2ztv",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Gasto",
    "Concepto": "Makis",
    "Monto": 59,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788653787716-m1gx",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Gasto",
    "Concepto": "Bus",
    "Monto": 1,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788670305457-4w6u",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Gasto",
    "Concepto": "Bus",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788737864008-30b6",
    "Tipo": "Egreso",
    "Fecha": "2026-09-06",
    "Categoria": "Gasto",
    "Concepto": "Case",
    "Monto": 25,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788725780217-m1qm",
    "Tipo": "Egreso",
    "Fecha": "2026-09-06",
    "Categoria": "Gasto",
    "Concepto": "Casaca",
    "Monto": 84.5,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788745983523-7uds",
    "Tipo": "Egreso",
    "Fecha": "2026-09-06",
    "Categoria": "Gasto",
    "Concepto": "Bus",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788719826948-ukxo",
    "Tipo": "Egreso",
    "Fecha": "2026-09-06",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 6.9,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788736934245-2ise",
    "Tipo": "Egreso",
    "Fecha": "2026-09-06",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 25.5,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788733452807-snw0",
    "Tipo": "Egreso",
    "Fecha": "2026-09-06",
    "Categoria": "Gasto",
    "Concepto": "Bus",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788834477840-zr2u",
    "Tipo": "Egreso",
    "Fecha": "2026-09-07",
    "Categoria": "Gasto",
    "Concepto": "Bus",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788747719018-og21",
    "Tipo": "Egreso",
    "Fecha": "2026-09-15",
    "Categoria": "Trámites & Documentos",
    "Concepto": "Titulación",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-702",
    "Tipo": "Egreso",
    "Fecha": "2026-09-15",
    "Categoria": "Pagos de Tarjetas & Deudas",
    "Concepto": "Prestamo BCP",
    "Monto": 143.16,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "custom-1788747730169-95kx",
    "Tipo": "Egreso",
    "Fecha": "2026-09-23",
    "Categoria": "Servicios Básicos & Facturas",
    "Concepto": "iCloud",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  }
];
