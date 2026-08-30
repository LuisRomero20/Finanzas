export interface Transaction {
  id: string;
  Tipo: 'Ingreso' | 'Egreso';
  Fecha: string;
  Categoria: string;
  Concepto: string;
  Monto: number;
  Entidad: string;
  Mes: string;
}

export const CATEGORIAS = [
  'Sueldo',
  'Servicio',
  'Gasto',
  'Ahorro',
  'Deuda',
  'Negocio',
  'Otro Ing',
  'Otro Egre',
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
    "id": "tx-1",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 32.02,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-2",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2073.06,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-3",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-4",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 104,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-5",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 29.3,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-6",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 128.08,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-7",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-8",
    "Tipo": "Egreso",
    "Fecha": "2026-01-14",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 4.02,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-9",
    "Tipo": "Egreso",
    "Fecha": "2026-01-15",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-10",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "IA",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-11",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-12",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 267.56,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-13",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 379.4,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-14",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 36.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-15",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 14.1,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-16",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Salida Familiar",
    "Monto": 34,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-17",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 36.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-18",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 2.7,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-19",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 15.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-20",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-21",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-22",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Concierto Bad Bunny",
    "Monto": 550.46,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-23",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-24",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Medicinas",
    "Monto": 20.8,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-25",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-26",
    "Tipo": "Egreso",
    "Fecha": "2026-01-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-27",
    "Tipo": "Egreso",
    "Fecha": "2026-01-02",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Fatima",
    "Monto": 59.4,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-28",
    "Tipo": "Egreso",
    "Fecha": "2026-01-02",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-29",
    "Tipo": "Egreso",
    "Fecha": "2026-01-04",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños",
    "Monto": 100.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-30",
    "Tipo": "Egreso",
    "Fecha": "2026-01-04",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños",
    "Monto": 20,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-31",
    "Tipo": "Egreso",
    "Fecha": "2026-01-04",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 110.8,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-32",
    "Tipo": "Ingreso",
    "Fecha": "2026-01-05",
    "Categoria": "Otro Ing",
    "Concepto": "Madre",
    "Monto": 60.1,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-33",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Fatima",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-34",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 18.6,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-35",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 6.39,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-36",
    "Tipo": "Egreso",
    "Fecha": "2026-01-06",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12.2,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-37",
    "Tipo": "Egreso",
    "Fecha": "2026-01-08",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-38",
    "Tipo": "Egreso",
    "Fecha": "2026-01-10",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 15.71,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-39",
    "Tipo": "Egreso",
    "Fecha": "2026-01-10",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-40",
    "Tipo": "Egreso",
    "Fecha": "2026-01-11",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-41",
    "Tipo": "Egreso",
    "Fecha": "2026-01-11",
    "Categoria": "Gasto",
    "Concepto": "Alcohol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-42",
    "Tipo": "Egreso",
    "Fecha": "2026-01-11",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 19.09,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-43",
    "Tipo": "Egreso",
    "Fecha": "2026-01-12",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-44",
    "Tipo": "Egreso",
    "Fecha": "2026-01-13",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 90.9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-45",
    "Tipo": "Egreso",
    "Fecha": "2026-01-14",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-46",
    "Tipo": "Egreso",
    "Fecha": "2026-01-15",
    "Categoria": "Deuda",
    "Concepto": "Yape Crédito",
    "Monto": 60.36,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-47",
    "Tipo": "Egreso",
    "Fecha": "2026-01-15",
    "Categoria": "Gasto",
    "Concepto": "Shawarma",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-48",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Concierto Bad Bunny",
    "Monto": 86.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-49",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Concierto Bad Bunny",
    "Monto": 32.3,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-50",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-51",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Videojuegos",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-52",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Makis",
    "Monto": 71,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-53",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 7.09,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-54",
    "Tipo": "Egreso",
    "Fecha": "2026-01-17",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-55",
    "Tipo": "Egreso",
    "Fecha": "2026-01-19",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 12.36,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-56",
    "Tipo": "Egreso",
    "Fecha": "2026-01-21",
    "Categoria": "Gasto",
    "Concepto": "Tacos",
    "Monto": 55,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-57",
    "Tipo": "Egreso",
    "Fecha": "2026-01-21",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 6.25,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-58",
    "Tipo": "Egreso",
    "Fecha": "2026-01-21",
    "Categoria": "Gasto",
    "Concepto": "Alcohol",
    "Monto": 9.19,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-59",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 2.29,
    "Entidad": "BBVA Bfree",
    "Mes": "Enero"
  },
  {
    "id": "tx-60",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 5.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-61",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 5.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-62",
    "Tipo": "Egreso",
    "Fecha": "2026-01-22",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-63",
    "Tipo": "Egreso",
    "Fecha": "2026-01-23",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 9.4,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-64",
    "Tipo": "Egreso",
    "Fecha": "2026-01-23",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-65",
    "Tipo": "Egreso",
    "Fecha": "2026-01-25",
    "Categoria": "Gasto",
    "Concepto": "Mercado",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Enero"
  },
  {
    "id": "tx-66",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 46.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-67",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2073.06,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-68",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 481,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-69",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 500,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-70",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-71",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 134.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-72",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 19.1,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-73",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-74",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-75",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 107.3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-76",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Otro Egre",
    "Concepto": "Viaje Argentina",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-77",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-78",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 19.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-79",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Mercado",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-80",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 1.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-81",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-82",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Otro Egre",
    "Concepto": "Pasaporte",
    "Monto": 120.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-83",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-84",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-85",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-86",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 3.3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-87",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-88",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Empanada",
    "Monto": 10.3,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-89",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Otro Egre",
    "Concepto": "DNI Electronico",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-90",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-91",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Agua Mineral",
    "Monto": 2.69,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-92",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-93",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Chicharron",
    "Monto": 22,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-94",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 59.3,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-95",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Propina",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-96",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-97",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-98",
    "Tipo": "Egreso",
    "Fecha": "2026-02-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 51,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-99",
    "Tipo": "Egreso",
    "Fecha": "2026-02-02",
    "Categoria": "Gasto",
    "Concepto": "Mercado",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-100",
    "Tipo": "Egreso",
    "Fecha": "2026-02-02",
    "Categoria": "Gasto",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-101",
    "Tipo": "Egreso",
    "Fecha": "2026-02-02",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-102",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Aseo Personal",
    "Monto": 17.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-103",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 7.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-104",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 13.65,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-105",
    "Tipo": "Egreso",
    "Fecha": "2026-02-04",
    "Categoria": "Gasto",
    "Concepto": "Temu",
    "Monto": 103.09,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-106",
    "Tipo": "Egreso",
    "Fecha": "2026-02-05",
    "Categoria": "Gasto",
    "Concepto": "Mercado",
    "Monto": 49.32,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-107",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 13.06,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-108",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 3.31,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-109",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-06",
    "Categoria": "Otro Ing",
    "Concepto": "AFP",
    "Monto": 394,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-110",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Otro Egre",
    "Concepto": "Viaje Argentina",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-111",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-06",
    "Categoria": "Otro Ing",
    "Concepto": "AFP",
    "Monto": 242,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-112",
    "Tipo": "Egreso",
    "Fecha": "2026-02-06",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-113",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 3.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-114",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3.29,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-115",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 30.57,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-116",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Febrero"
  },
  {
    "id": "tx-117",
    "Tipo": "Egreso",
    "Fecha": "2026-02-07",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-118",
    "Tipo": "Egreso",
    "Fecha": "2026-02-09",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 59.54,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-119",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-10",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 1000,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-120",
    "Tipo": "Egreso",
    "Fecha": "2026-02-10",
    "Categoria": "Gasto",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-121",
    "Tipo": "Egreso",
    "Fecha": "2026-02-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-122",
    "Tipo": "Egreso",
    "Fecha": "2026-02-10",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-123",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-124",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 5.9,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-125",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 42.46,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-126",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Gasto",
    "Concepto": "Gorra",
    "Monto": 40,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-127",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Gasto",
    "Concepto": "Zapatillas",
    "Monto": 50.89,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-128",
    "Tipo": "Egreso",
    "Fecha": "2026-02-11",
    "Categoria": "Gasto",
    "Concepto": "Makis",
    "Monto": 90,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-129",
    "Tipo": "Egreso",
    "Fecha": "2026-02-12",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 69.5,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-130",
    "Tipo": "Egreso",
    "Fecha": "2026-02-13",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 90,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-131",
    "Tipo": "Egreso",
    "Fecha": "2026-02-13",
    "Categoria": "Gasto",
    "Concepto": "Salida Casual",
    "Monto": 24,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-132",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Gasto",
    "Concepto": "Yogurt",
    "Monto": 15.6,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-133",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-14",
    "Categoria": "Otro Ing",
    "Concepto": "Venta de iPhone",
    "Monto": 400,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-134",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-135",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 60,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-136",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 21.5,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-137",
    "Tipo": "Egreso",
    "Fecha": "2026-02-14",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Aseo Personal",
    "Monto": 6.5,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-138",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Deuda",
    "Concepto": "Yape Crédito",
    "Monto": 60.36,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-139",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Gasto",
    "Concepto": "Salida Casual",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-140",
    "Tipo": "Egreso",
    "Fecha": "2026-02-15",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 8.1,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-141",
    "Tipo": "Egreso",
    "Fecha": "2026-02-16",
    "Categoria": "Gasto",
    "Concepto": "Mercado",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-142",
    "Tipo": "Egreso",
    "Fecha": "2026-02-16",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-143",
    "Tipo": "Egreso",
    "Fecha": "2026-02-16",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-144",
    "Tipo": "Egreso",
    "Fecha": "2026-02-18",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-145",
    "Tipo": "Egreso",
    "Fecha": "2026-02-19",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-146",
    "Tipo": "Egreso",
    "Fecha": "2026-02-19",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-147",
    "Tipo": "Egreso",
    "Fecha": "2026-02-20",
    "Categoria": "Gasto",
    "Concepto": "Concierto Paulo Londra",
    "Monto": 480,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-148",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-20",
    "Categoria": "Otro Ing",
    "Concepto": "Mili",
    "Monto": 240,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-149",
    "Tipo": "Egreso",
    "Fecha": "2026-02-20",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 6.99,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-150",
    "Tipo": "Egreso",
    "Fecha": "2026-02-20",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-151",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 28,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-152",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-21",
    "Categoria": "Otro Ing",
    "Concepto": "Madre",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-153",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-154",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Alcohol",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-155",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Agua Mineral",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-156",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Cigarro",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-157",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 30,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-158",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Cigarro",
    "Monto": 9,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-159",
    "Tipo": "Egreso",
    "Fecha": "2026-02-21",
    "Categoria": "Gasto",
    "Concepto": "Cigarro",
    "Monto": 13.91,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-160",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Gasto",
    "Concepto": "Ceviche",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-161",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Gasto",
    "Concepto": "Chicharron",
    "Monto": 14.7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-162",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Gasto",
    "Concepto": "Shawarma",
    "Monto": 22.5,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-163",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-164",
    "Tipo": "Egreso",
    "Fecha": "2026-02-22",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 0.94,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-165",
    "Tipo": "Egreso",
    "Fecha": "2026-02-24",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 30.8,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-166",
    "Tipo": "Egreso",
    "Fecha": "2026-02-24",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 379.76,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-167",
    "Tipo": "Ingreso",
    "Fecha": "2026-02-24",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 379.74,
    "Entidad": "Interbank Amex",
    "Mes": "Febrero"
  },
  {
    "id": "tx-168",
    "Tipo": "Egreso",
    "Fecha": "2026-02-25",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-169",
    "Tipo": "Egreso",
    "Fecha": "2026-02-25",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Febrero"
  },
  {
    "id": "tx-170",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 154.46,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-171",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2073.06,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-172",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 431.15,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-173",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-174",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 111.5,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-175",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 35.8,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-176",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Otro Egre",
    "Concepto": "Viaje Argentina",
    "Monto": 1050,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-177",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Concierto Rawayana",
    "Monto": 180,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-178",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Concierto Milo J",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-179",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-180",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 121.5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-181",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Shawarma",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-182",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-01",
    "Categoria": "Otro Ing",
    "Concepto": "Aaron",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-183",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Otro Egre",
    "Concepto": "Maleta",
    "Monto": 110,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-184",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Abuela",
    "Monto": 74.7,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-185",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Pantalones y Shorts",
    "Monto": 99,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-186",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-187",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 55,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-188",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-189",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 71.03,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-190",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Agua Mineral",
    "Monto": 1.91,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-191",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 22.8,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-192",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-193",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Gasto",
    "Concepto": "Mercado",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-194",
    "Tipo": "Egreso",
    "Fecha": "2026-03-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-195",
    "Tipo": "Egreso",
    "Fecha": "2026-03-02",
    "Categoria": "Servicio",
    "Concepto": "Streaming",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-196",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 16.49,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-197",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Aseo Personal",
    "Monto": 8.48,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-198",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-199",
    "Tipo": "Egreso",
    "Fecha": "2026-03-03",
    "Categoria": "Gasto",
    "Concepto": "Dollarcity",
    "Monto": 17,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-200",
    "Tipo": "Egreso",
    "Fecha": "2026-03-04",
    "Categoria": "Gasto",
    "Concepto": "Zapatillas",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-201",
    "Tipo": "Egreso",
    "Fecha": "2026-03-04",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9.09,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-202",
    "Tipo": "Egreso",
    "Fecha": "2026-03-04",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 4.06,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-203",
    "Tipo": "Egreso",
    "Fecha": "2026-03-05",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-204",
    "Tipo": "Egreso",
    "Fecha": "2026-03-05",
    "Categoria": "Gasto",
    "Concepto": "Abrigos",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-205",
    "Tipo": "Egreso",
    "Fecha": "2026-03-06",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-206",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 17,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-207",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-208",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-209",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Gasto",
    "Concepto": "Alcohol",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-210",
    "Tipo": "Egreso",
    "Fecha": "2026-03-07",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 6,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-211",
    "Tipo": "Egreso",
    "Fecha": "2026-03-08",
    "Categoria": "Gasto",
    "Concepto": "Salida Familiar",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-212",
    "Tipo": "Egreso",
    "Fecha": "2026-03-09",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Aseo Personal",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-213",
    "Tipo": "Egreso",
    "Fecha": "2026-03-09",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-214",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-215",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 6.63,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-216",
    "Tipo": "Egreso",
    "Fecha": "2026-03-10",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 16.98,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-217",
    "Tipo": "Egreso",
    "Fecha": "2026-03-14",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 4.02,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-218",
    "Tipo": "Egreso",
    "Fecha": "2026-03-15",
    "Categoria": "Deuda",
    "Concepto": "Yape Crédito",
    "Monto": 60.36,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-219",
    "Tipo": "Egreso",
    "Fecha": "2026-03-15",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-220",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-15",
    "Categoria": "Otro Ing",
    "Concepto": "Venta de iPhone",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-221",
    "Tipo": "Ingreso",
    "Fecha": "2026-03-15",
    "Categoria": "Otro Ing",
    "Concepto": "Jacko",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-222",
    "Tipo": "Egreso",
    "Fecha": "2026-03-21",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Madre",
    "Monto": 115.7,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-223",
    "Tipo": "Egreso",
    "Fecha": "2026-03-21",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 22.94,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-224",
    "Tipo": "Egreso",
    "Fecha": "2026-03-24",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-225",
    "Tipo": "Egreso",
    "Fecha": "2026-03-24",
    "Categoria": "Gasto",
    "Concepto": "Hamburguesa",
    "Monto": 6.78,
    "Entidad": "Interbank Amex",
    "Mes": "Marzo"
  },
  {
    "id": "tx-226",
    "Tipo": "Egreso",
    "Fecha": "2026-03-26",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Marzo"
  },
  {
    "id": "tx-227",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 42.04,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-228",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-229",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 1010,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-230",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-231",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Deuda",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-232",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 1000,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-233",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Viaje Laraos",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-234",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 195,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-235",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-236",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 36.63,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-237",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-238",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-239",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Viaje Raura",
    "Monto": 135,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-240",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 13.5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-241",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Psicologo",
    "Monto": 60,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-242",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 101.5,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-243",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 14.1,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-244",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-245",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Otro Egre",
    "Concepto": "Mayra",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-246",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 22,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-247",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.91,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-248",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 29.5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-249",
    "Tipo": "Egreso",
    "Fecha": "2026-04-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 117.3,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-250",
    "Tipo": "Egreso",
    "Fecha": "2026-04-02",
    "Categoria": "Gasto",
    "Concepto": "Pantalones y Shorts",
    "Monto": 55.89,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-251",
    "Tipo": "Egreso",
    "Fecha": "2026-04-02",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Adriano",
    "Monto": 122.6,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-252",
    "Tipo": "Egreso",
    "Fecha": "2026-04-02",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-253",
    "Tipo": "Egreso",
    "Fecha": "2026-04-03",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 58.8,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-254",
    "Tipo": "Egreso",
    "Fecha": "2026-04-03",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 19.7,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-255",
    "Tipo": "Egreso",
    "Fecha": "2026-04-04",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 88.75,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-256",
    "Tipo": "Egreso",
    "Fecha": "2026-04-04",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 24,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-257",
    "Tipo": "Egreso",
    "Fecha": "2026-04-05",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 104.8,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-258",
    "Tipo": "Egreso",
    "Fecha": "2026-04-06",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 36,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-259",
    "Tipo": "Egreso",
    "Fecha": "2026-04-06",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-260",
    "Tipo": "Egreso",
    "Fecha": "2026-04-15",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-261",
    "Tipo": "Egreso",
    "Fecha": "2026-04-07",
    "Categoria": "Gasto",
    "Concepto": "Viaje Piura",
    "Monto": 10.4,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-262",
    "Tipo": "Egreso",
    "Fecha": "2026-04-08",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 55.72,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-263",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-264",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Gasto",
    "Concepto": "Hotel",
    "Monto": 32,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-265",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Alondra",
    "Monto": 69.22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-266",
    "Tipo": "Egreso",
    "Fecha": "2026-04-09",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 28,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-267",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-09",
    "Categoria": "Otro Ing",
    "Concepto": "Milagros",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-268",
    "Tipo": "Egreso",
    "Fecha": "2026-04-10",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 18.9,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-269",
    "Tipo": "Egreso",
    "Fecha": "2026-04-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 22.22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-270",
    "Tipo": "Egreso",
    "Fecha": "2026-04-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-271",
    "Tipo": "Egreso",
    "Fecha": "2026-04-11",
    "Categoria": "Gasto",
    "Concepto": "Hotel",
    "Monto": 42,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-272",
    "Tipo": "Egreso",
    "Fecha": "2026-04-14",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 4.04,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-273",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-15",
    "Categoria": "Otro Ing",
    "Concepto": "Yape Crédito",
    "Monto": 200,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-274",
    "Tipo": "Egreso",
    "Fecha": "2026-04-15",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 200,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-275",
    "Tipo": "Egreso",
    "Fecha": "2026-04-16",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-276",
    "Tipo": "Ingreso",
    "Fecha": "2026-04-17",
    "Categoria": "Otro Ing",
    "Concepto": "Padre",
    "Monto": 60,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-277",
    "Tipo": "Egreso",
    "Fecha": "2026-04-17",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 16.7,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-278",
    "Tipo": "Egreso",
    "Fecha": "2026-04-17",
    "Categoria": "Gasto",
    "Concepto": "Concierto Milo J",
    "Monto": 43.3,
    "Entidad": "BCP",
    "Mes": "Abril"
  },
  {
    "id": "tx-279",
    "Tipo": "Egreso",
    "Fecha": "2026-04-18",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Beu",
    "Monto": 40.48,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-280",
    "Tipo": "Egreso",
    "Fecha": "2026-04-18",
    "Categoria": "Gasto",
    "Concepto": "Hotel",
    "Monto": 40,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-281",
    "Tipo": "Egreso",
    "Fecha": "2026-04-18",
    "Categoria": "Gasto",
    "Concepto": "Hamburguesa",
    "Monto": 12,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-282",
    "Tipo": "Egreso",
    "Fecha": "2026-04-19",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3.96,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-283",
    "Tipo": "Egreso",
    "Fecha": "2026-04-20",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-284",
    "Tipo": "Egreso",
    "Fecha": "2026-04-24",
    "Categoria": "Gasto",
    "Concepto": "Cine",
    "Monto": 49.06,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-285",
    "Tipo": "Egreso",
    "Fecha": "2026-04-25",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 32.22,
    "Entidad": "Interbank Amex",
    "Mes": "Abril"
  },
  {
    "id": "tx-286",
    "Tipo": "Egreso",
    "Fecha": "2026-04-25",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 9.3,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-287",
    "Tipo": "Egreso",
    "Fecha": "2026-04-26",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 21,
    "Entidad": "Interbank",
    "Mes": "Abril"
  },
  {
    "id": "tx-288",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 32.1,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-289",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-290",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 785,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-291",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Deuda",
    "Concepto": "Yape Crédito",
    "Monto": 206.33,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-292",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Deuda",
    "Concepto": "Aaron",
    "Monto": 92.42,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-293",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Deuda",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-294",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Deuda",
    "Concepto": "Aaron",
    "Monto": 170,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-295",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 816.3,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-296",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Deuda",
    "Concepto": "Jacko",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-297",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-298",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Dia del Trabajador",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-299",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 2.2,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-300",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-301",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 84.5,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-302",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 45,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-303",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-304",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Deuda",
    "Concepto": "Padre",
    "Monto": 60,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-305",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-306",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 50,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-307",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 21,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-308",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Gasto",
    "Concepto": "Dia del Trabajador",
    "Monto": 107.3,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-309",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-310",
    "Tipo": "Egreso",
    "Fecha": "2026-05-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 162,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-311",
    "Tipo": "Egreso",
    "Fecha": "2026-05-02",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 14.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-312",
    "Tipo": "Egreso",
    "Fecha": "2026-05-02",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-313",
    "Tipo": "Egreso",
    "Fecha": "2026-05-03",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 14.61,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-314",
    "Tipo": "Egreso",
    "Fecha": "2026-05-04",
    "Categoria": "Servicio",
    "Concepto": "IA",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-315",
    "Tipo": "Egreso",
    "Fecha": "2026-05-04",
    "Categoria": "Gasto",
    "Concepto": "Dia de la Madre",
    "Monto": 92.36,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-316",
    "Tipo": "Egreso",
    "Fecha": "2026-05-04",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-317",
    "Tipo": "Egreso",
    "Fecha": "2026-05-05",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 2,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-318",
    "Tipo": "Egreso",
    "Fecha": "2026-05-05",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-319",
    "Tipo": "Egreso",
    "Fecha": "2026-05-06",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 63.4,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-320",
    "Tipo": "Egreso",
    "Fecha": "2026-05-06",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-321",
    "Tipo": "Egreso",
    "Fecha": "2026-05-07",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 11.8,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-322",
    "Tipo": "Egreso",
    "Fecha": "2026-05-07",
    "Categoria": "Gasto",
    "Concepto": "Condones",
    "Monto": 4.9,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-323",
    "Tipo": "Egreso",
    "Fecha": "2026-05-08",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-324",
    "Tipo": "Egreso",
    "Fecha": "2026-05-09",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 14.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-325",
    "Tipo": "Egreso",
    "Fecha": "2026-05-09",
    "Categoria": "Gasto",
    "Concepto": "Dia de la Madre",
    "Monto": 35,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-326",
    "Tipo": "Egreso",
    "Fecha": "2026-05-10",
    "Categoria": "Gasto",
    "Concepto": "Dia de la Madre",
    "Monto": 64.7,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-327",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gasto",
    "Concepto": "Entrada Estadio",
    "Monto": 50,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-328",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 4.99,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-329",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-330",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 12.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-331",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-332",
    "Tipo": "Egreso",
    "Fecha": "2026-05-12",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 10,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-333",
    "Tipo": "Ingreso",
    "Fecha": "2026-05-13",
    "Categoria": "Sueldo",
    "Concepto": "CTS",
    "Monto": 1469.67,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-334",
    "Tipo": "Egreso",
    "Fecha": "2026-05-13",
    "Categoria": "Otro Egre",
    "Concepto": "Titulación",
    "Monto": 700,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-335",
    "Tipo": "Egreso",
    "Fecha": "2026-05-14",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 59.99,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-336",
    "Tipo": "Egreso",
    "Fecha": "2026-05-14",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 11.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-337",
    "Tipo": "Egreso",
    "Fecha": "2026-05-14",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 15.35,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-338",
    "Tipo": "Egreso",
    "Fecha": "2026-05-15",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-339",
    "Tipo": "Egreso",
    "Fecha": "2026-05-15",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 39.05,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-340",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 2.19,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-341",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gasto",
    "Concepto": "Polo y/o Camisa",
    "Monto": 62,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-342",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gasto",
    "Concepto": "Pantalones y Shorts",
    "Monto": 60.19,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-343",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-344",
    "Tipo": "Egreso",
    "Fecha": "2026-05-16",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-345",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-346",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-347",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 29,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-348",
    "Tipo": "Egreso",
    "Fecha": "2026-05-18",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-349",
    "Tipo": "Egreso",
    "Fecha": "2026-05-19",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-350",
    "Tipo": "Egreso",
    "Fecha": "2026-05-21",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 5.69,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-351",
    "Tipo": "Egreso",
    "Fecha": "2026-05-22",
    "Categoria": "Gasto",
    "Concepto": "Concierto  Soda Stereo",
    "Monto": 83.08,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-352",
    "Tipo": "Egreso",
    "Fecha": "2026-05-23",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 28.1,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-353",
    "Tipo": "Egreso",
    "Fecha": "2026-05-26",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 60,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-354",
    "Tipo": "Egreso",
    "Fecha": "2026-05-26",
    "Categoria": "Gasto",
    "Concepto": "Apuestas",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Mayo"
  },
  {
    "id": "tx-355",
    "Tipo": "Egreso",
    "Fecha": "2026-05-27",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 12,
    "Entidad": "Interbank Amex",
    "Mes": "Mayo"
  },
  {
    "id": "tx-356",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 434.53,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-357",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-358",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 1225.9,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-359",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 899.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-360",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Padre",
    "Monto": 15.66,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-361",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 880.45,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-362",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-363",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Titulación",
    "Monto": 434,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-364",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 26,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-365",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-366",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 54.2,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-367",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 17,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-368",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Deuda",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-369",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 60,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-370",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 75,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-371",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 3.67,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-372",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 37.9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-373",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-374",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Tatuaje",
    "Monto": 66.66,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-375",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Bowling",
    "Monto": 41.17,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-376",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-377",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-378",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Medicinas",
    "Monto": 27.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-379",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 38.3,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-380",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Gasto",
    "Concepto": "Chicharron",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-381",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Padre",
    "Monto": 16.7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-382",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-383",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Otro Egre",
    "Concepto": "Milagros",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-384",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 158.1,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-385",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-386",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 102,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-387",
    "Tipo": "Egreso",
    "Fecha": "2026-06-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 44.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-388",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 79.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-389",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-390",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-391",
    "Tipo": "Egreso",
    "Fecha": "2026-06-02",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-392",
    "Tipo": "Egreso",
    "Fecha": "2026-06-03",
    "Categoria": "Gasto",
    "Concepto": "Cumpleaños Padre",
    "Monto": 170.4,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-393",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 29.8,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-394",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 19.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-395",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-396",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 100.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-397",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 30,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-398",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 16.9,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-399",
    "Tipo": "Egreso",
    "Fecha": "2026-06-05",
    "Categoria": "Gasto",
    "Concepto": "Videojuegos",
    "Monto": 67.8,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-400",
    "Tipo": "Egreso",
    "Fecha": "2026-06-07",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 112,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-401",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Gasto",
    "Concepto": "Apuestas",
    "Monto": 30,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-402",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-08",
    "Categoria": "Otro Ing",
    "Concepto": "Prestamo BCP",
    "Monto": 117.86,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-403",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-404",
    "Tipo": "Egreso",
    "Fecha": "2026-06-08",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-405",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 20,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-406",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-407",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-408",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 6.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-409",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-410",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 13,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-411",
    "Tipo": "Egreso",
    "Fecha": "2026-06-09",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 55.3,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-412",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 18,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-413",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 25.5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-414",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 5.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-415",
    "Tipo": "Egreso",
    "Fecha": "2026-06-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 11.6,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-416",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Servicio",
    "Concepto": "Streaming",
    "Monto": 21.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-417",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 69,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-418",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-11",
    "Categoria": "Otro Ing",
    "Concepto": "Prestamo Yape",
    "Monto": 600,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-419",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-420",
    "Tipo": "Egreso",
    "Fecha": "2026-06-11",
    "Categoria": "Gasto",
    "Concepto": "Figuritas",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-421",
    "Tipo": "Egreso",
    "Fecha": "2026-06-12",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-422",
    "Tipo": "Egreso",
    "Fecha": "2026-06-12",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-423",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 25,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-424",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-425",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 21.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-426",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 16.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-427",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 16,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-428",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Abrigos",
    "Monto": 100,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-429",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Dollarcity",
    "Monto": 54,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-430",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 106,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-431",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 10.4,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-432",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-433",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-434",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 39.9,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-435",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-436",
    "Tipo": "Egreso",
    "Fecha": "2026-06-13",
    "Categoria": "Gasto",
    "Concepto": "Abrigos",
    "Monto": 144.92,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-437",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-13",
    "Categoria": "Otro Ing",
    "Concepto": "Carol",
    "Monto": 145,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-438",
    "Tipo": "Egreso",
    "Fecha": "2026-06-14",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 14.96,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-439",
    "Tipo": "Egreso",
    "Fecha": "2026-06-14",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-440",
    "Tipo": "Egreso",
    "Fecha": "2026-06-15",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-441",
    "Tipo": "Egreso",
    "Fecha": "2026-06-15",
    "Categoria": "Servicio",
    "Concepto": "IA",
    "Monto": 21.91,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-442",
    "Tipo": "Egreso",
    "Fecha": "2026-06-15",
    "Categoria": "Servicio",
    "Concepto": "IA",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-443",
    "Tipo": "Egreso",
    "Fecha": "2026-06-16",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-444",
    "Tipo": "Egreso",
    "Fecha": "2026-06-16",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 13.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-445",
    "Tipo": "Egreso",
    "Fecha": "2026-06-16",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-446",
    "Tipo": "Egreso",
    "Fecha": "2026-06-17",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12.77,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-447",
    "Tipo": "Ingreso",
    "Fecha": "2026-06-19",
    "Categoria": "Otro Ing",
    "Concepto": "Apuestas",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-448",
    "Tipo": "Egreso",
    "Fecha": "2026-06-19",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-449",
    "Tipo": "Egreso",
    "Fecha": "2026-06-19",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-450",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 1.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-451",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 4.5,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-452",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gasto",
    "Concepto": "Figuritas",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-453",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gasto",
    "Concepto": "Comida",
    "Monto": 22,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-454",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 3.99,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-455",
    "Tipo": "Egreso",
    "Fecha": "2026-06-20",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-456",
    "Tipo": "Egreso",
    "Fecha": "2026-06-21",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 21.23,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-457",
    "Tipo": "Egreso",
    "Fecha": "2026-06-21",
    "Categoria": "Gasto",
    "Concepto": "Medicinas",
    "Monto": 18.9,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-458",
    "Tipo": "Egreso",
    "Fecha": "2026-06-21",
    "Categoria": "Gasto",
    "Concepto": "Medicinas",
    "Monto": 35.2,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-459",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 55,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-460",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Gasto",
    "Concepto": "Condones",
    "Monto": 12,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-461",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Gasto",
    "Concepto": "Agua Mineral",
    "Monto": 5,
    "Entidad": "Interbank Amex",
    "Mes": "Junio"
  },
  {
    "id": "tx-462",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Junio"
  },
  {
    "id": "tx-463",
    "Tipo": "Egreso",
    "Fecha": "2026-06-22",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 22.9,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-464",
    "Tipo": "Egreso",
    "Fecha": "2026-06-23",
    "Categoria": "Gasto",
    "Concepto": "Medicinas",
    "Monto": 96,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-465",
    "Tipo": "Egreso",
    "Fecha": "2026-06-23",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 40,
    "Entidad": "Ripley",
    "Mes": "Junio"
  },
  {
    "id": "tx-466",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 474.94,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-467",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-468",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 883.88,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-469",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 878,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-470",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 227.18,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-471",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Titulación",
    "Monto": 380,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-472",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 79,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-473",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 94,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-474",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 48.5,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-475",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Deuda",
    "Concepto": "Prestamo Yape",
    "Monto": 116.85,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-476",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-477",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Deuda",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-478",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-479",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-480",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 47,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-481",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 58.5,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-482",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 50,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-483",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-484",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-485",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 15.6,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-486",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-487",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-488",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 18,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-489",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-490",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 60,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-491",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-492",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-493",
    "Tipo": "Egreso",
    "Fecha": "2026-07-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 39,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-494",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-02",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 700,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-495",
    "Tipo": "Egreso",
    "Fecha": "2026-07-02",
    "Categoria": "Gasto",
    "Concepto": "Apuestas",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-496",
    "Tipo": "Egreso",
    "Fecha": "2026-07-03",
    "Categoria": "Otro Egre",
    "Concepto": "Seguro Rimac",
    "Monto": 178.99,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-497",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 15.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-498",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 15.9,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-499",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 45.9,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-500",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 65,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-501",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 34,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-502",
    "Tipo": "Egreso",
    "Fecha": "2026-07-04",
    "Categoria": "Gasto",
    "Concepto": "Condones",
    "Monto": 20,
    "Entidad": "Ripley",
    "Mes": "Julio"
  },
  {
    "id": "tx-503",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Otro Egre",
    "Concepto": "Madre",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-504",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-505",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-506",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Gasto",
    "Concepto": "Apuestas",
    "Monto": 30,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-507",
    "Tipo": "Egreso",
    "Fecha": "2026-07-06",
    "Categoria": "Otro Egre",
    "Concepto": "Padre",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-508",
    "Tipo": "Egreso",
    "Fecha": "2026-07-07",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 1.3,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-509",
    "Tipo": "Egreso",
    "Fecha": "2026-07-07",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 2.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-510",
    "Tipo": "Egreso",
    "Fecha": "2026-07-08",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-511",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-512",
    "Tipo": "Ingreso",
    "Fecha": "2026-07-10",
    "Categoria": "Sueldo",
    "Concepto": "Gratificación",
    "Monto": 2721.6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-513",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Gasto",
    "Concepto": "Viaje Brasil",
    "Monto": 2084.8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-514",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Otro Egre",
    "Concepto": "Titulación",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-515",
    "Tipo": "Egreso",
    "Fecha": "2026-07-10",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 0.61,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-516",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 34.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-517",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Gasto",
    "Concepto": "Alcohol",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-518",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 38,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-519",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 49.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-520",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 16,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-521",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Gasto",
    "Concepto": "Dollarcity",
    "Monto": 3,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-522",
    "Tipo": "Egreso",
    "Fecha": "2026-07-11",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 56,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-523",
    "Tipo": "Egreso",
    "Fecha": "2026-07-12",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-524",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Deuda",
    "Concepto": "Prestamo BCP",
    "Monto": 143.16,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-525",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Gasto",
    "Concepto": "Concierto Trueno",
    "Monto": 132,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-526",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 17.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-527",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 20,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-528",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Gasto",
    "Concepto": "Makis",
    "Monto": 96,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-529",
    "Tipo": "Egreso",
    "Fecha": "2026-07-15",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 16,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-530",
    "Tipo": "Egreso",
    "Fecha": "2026-07-17",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 11.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-531",
    "Tipo": "Egreso",
    "Fecha": "2026-07-17",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-532",
    "Tipo": "Egreso",
    "Fecha": "2026-07-18",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 55,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-533",
    "Tipo": "Egreso",
    "Fecha": "2026-07-18",
    "Categoria": "Gasto",
    "Concepto": "Shawarma",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-534",
    "Tipo": "Egreso",
    "Fecha": "2026-07-18",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 74.72,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-535",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Gasto",
    "Concepto": "Ceviche",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-536",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-537",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Gasto",
    "Concepto": "Videojuegos",
    "Monto": 14,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-538",
    "Tipo": "Egreso",
    "Fecha": "2026-07-19",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 30,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-539",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-540",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Gasto",
    "Concepto": "Videojuegos",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-541",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-542",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 37,
    "Entidad": "BBVA Bfree",
    "Mes": "Julio"
  },
  {
    "id": "tx-543",
    "Tipo": "Egreso",
    "Fecha": "2026-07-20",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9.97,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-544",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 14.69,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-545",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 18.9,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-546",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Gasto",
    "Concepto": "Agua Mineral",
    "Monto": 1.8,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-547",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-548",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Gasto",
    "Concepto": "Makis",
    "Monto": 108,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-549",
    "Tipo": "Egreso",
    "Fecha": "2026-07-23",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-550",
    "Tipo": "Egreso",
    "Fecha": "2026-07-24",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 3.5,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-551",
    "Tipo": "Egreso",
    "Fecha": "2026-07-24",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-552",
    "Tipo": "Egreso",
    "Fecha": "2026-07-25",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 11.9,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-553",
    "Tipo": "Egreso",
    "Fecha": "2026-07-25",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 12.1,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-554",
    "Tipo": "Egreso",
    "Fecha": "2026-07-25",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 34.5,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-555",
    "Tipo": "Egreso",
    "Fecha": "2026-07-26",
    "Categoria": "Gasto",
    "Concepto": "Videojuegos",
    "Monto": 31.9,
    "Entidad": "Interbank Amex",
    "Mes": "Julio"
  },
  {
    "id": "tx-556",
    "Tipo": "Egreso",
    "Fecha": "2026-07-26",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-557",
    "Tipo": "Egreso",
    "Fecha": "2026-07-27",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-558",
    "Tipo": "Egreso",
    "Fecha": "2026-07-27",
    "Categoria": "Gasto",
    "Concepto": "Dulce",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Julio"
  },
  {
    "id": "tx-559",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 795.41,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-560",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-561",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 819.05,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-562",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 308.67,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-563",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 835.14,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-564",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-565",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Deuda",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-566",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Ripley",
    "Monto": 827.76,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-567",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Deuda",
    "Concepto": "Prestamo Yape",
    "Monto": 116.85,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-568",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-569",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 731.69,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-570",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 60.27,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-571",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 21,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-572",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 14,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-573",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 20,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-574",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 53,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-575",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-576",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 14,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-577",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 3.2,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-578",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Internet",
    "Monto": 78.48,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-579",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-580",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Perfume",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-581",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 41,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-582",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Café",
    "Monto": 20,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-583",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Gas",
    "Monto": 43.5,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-584",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 5.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-585",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 18.2,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-586",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Mayonesa",
    "Monto": 9.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-587",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Poster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-588",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-589",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 2.45,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-590",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-591",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 35.8,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-592",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Servicio",
    "Concepto": "Spotify",
    "Monto": 11.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-593",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-594",
    "Tipo": "Egreso",
    "Fecha": "2026-08-01",
    "Categoria": "Gasto",
    "Concepto": "Apuestas",
    "Monto": 27,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-595",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 14.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-596",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 35.5,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-597",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 36.7,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-598",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 25,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-599",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 7.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-600",
    "Tipo": "Egreso",
    "Fecha": "2026-08-02",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-601",
    "Tipo": "Egreso",
    "Fecha": "2026-08-03",
    "Categoria": "Gasto",
    "Concepto": "Ceviche",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-602",
    "Tipo": "Egreso",
    "Fecha": "2026-08-03",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 43,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-603",
    "Tipo": "Egreso",
    "Fecha": "2026-08-03",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 25.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-604",
    "Tipo": "Egreso",
    "Fecha": "2026-08-04",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 4,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-605",
    "Tipo": "Egreso",
    "Fecha": "2026-08-04",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 18,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-606",
    "Tipo": "Egreso",
    "Fecha": "2026-08-05",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 19.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-607",
    "Tipo": "Egreso",
    "Fecha": "2026-08-05",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-608",
    "Tipo": "Egreso",
    "Fecha": "2026-08-05",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 57.3,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-609",
    "Tipo": "Egreso",
    "Fecha": "2026-08-06",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-610",
    "Tipo": "Egreso",
    "Fecha": "2026-08-06",
    "Categoria": "Gasto",
    "Concepto": "Ceviche",
    "Monto": 6,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-611",
    "Tipo": "Egreso",
    "Fecha": "2026-08-07",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 16.9,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-612",
    "Tipo": "Egreso",
    "Fecha": "2026-08-07",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-613",
    "Tipo": "Egreso",
    "Fecha": "2026-08-08",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-614",
    "Tipo": "Egreso",
    "Fecha": "2026-08-08",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 16.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-615",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 40,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-616",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 23,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-617",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 19,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-618",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Gasto",
    "Concepto": "Chifa",
    "Monto": 64.7,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-619",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Gasto",
    "Concepto": "Medicinas",
    "Monto": 173.2,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-620",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-09",
    "Categoria": "Otro Ing",
    "Concepto": "Madre",
    "Monto": 70,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-621",
    "Tipo": "Egreso",
    "Fecha": "2026-08-09",
    "Categoria": "Servicio",
    "Concepto": "Desvagramen",
    "Monto": 21.31,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-622",
    "Tipo": "Egreso",
    "Fecha": "2026-08-10",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 21,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-623",
    "Tipo": "Egreso",
    "Fecha": "2026-08-10",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 28.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-624",
    "Tipo": "Egreso",
    "Fecha": "2026-08-11",
    "Categoria": "Servicio",
    "Concepto": "Luz",
    "Monto": 98,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-625",
    "Tipo": "Egreso",
    "Fecha": "2026-08-11",
    "Categoria": "Servicio",
    "Concepto": "Telefonia Movil",
    "Monto": 39.9,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-626",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-11",
    "Categoria": "Otro Ing",
    "Concepto": "Apuestas",
    "Monto": 50,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-627",
    "Tipo": "Egreso",
    "Fecha": "2026-08-11",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 12,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-628",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-629",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 9.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-630",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 10.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-631",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 75.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-632",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-633",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 8.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-634",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-635",
    "Tipo": "Egreso",
    "Fecha": "2026-08-12",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 7,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-636",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-637",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 2.49,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-638",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 19,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-639",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 8,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-640",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 14,
    "Entidad": "BBVA Bfree",
    "Mes": "Agosto"
  },
  {
    "id": "tx-641",
    "Tipo": "Egreso",
    "Fecha": "2026-08-13",
    "Categoria": "Otro Egre",
    "Concepto": "Carol",
    "Monto": 118,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-642",
    "Tipo": "Egreso",
    "Fecha": "2026-08-14",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 9.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-643",
    "Tipo": "Egreso",
    "Fecha": "2026-08-14",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 11,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-644",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Deuda",
    "Concepto": "Prestamo BCP",
    "Monto": 143.16,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-645",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 12.9,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-646",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 25,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-647",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 15.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-648",
    "Tipo": "Egreso",
    "Fecha": "2026-08-15",
    "Categoria": "Gasto",
    "Concepto": "Alcohol",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-649",
    "Tipo": "Egreso",
    "Fecha": "2026-08-16",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-650",
    "Tipo": "Egreso",
    "Fecha": "2026-08-17",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 7.3,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-651",
    "Tipo": "Egreso",
    "Fecha": "2026-08-17",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 1.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-652",
    "Tipo": "Egreso",
    "Fecha": "2026-08-18",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-653",
    "Tipo": "Egreso",
    "Fecha": "2026-08-19",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-654",
    "Tipo": "Egreso",
    "Fecha": "2026-08-20",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 12.9,
    "Entidad": "Ripley",
    "Mes": "Agosto"
  },
  {
    "id": "tx-655",
    "Tipo": "Egreso",
    "Fecha": "2026-08-21",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-656",
    "Tipo": "Egreso",
    "Fecha": "2026-08-21",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-657",
    "Tipo": "Egreso",
    "Fecha": "2026-08-22",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 13,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-658",
    "Tipo": "Egreso",
    "Fecha": "2026-08-22",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-659",
    "Tipo": "Egreso",
    "Fecha": "2026-08-23",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 14.66,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-660",
    "Tipo": "Egreso",
    "Fecha": "2026-08-23",
    "Categoria": "Gasto",
    "Concepto": "Pollo a la Brasa",
    "Monto": 25.9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-661",
    "Tipo": "Egreso",
    "Fecha": "2026-08-23",
    "Categoria": "Gasto",
    "Concepto": "Transporte",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-662",
    "Tipo": "Egreso",
    "Fecha": "2026-08-24",
    "Categoria": "Gasto",
    "Concepto": "Shawarma",
    "Monto": 10,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-663",
    "Tipo": "Egreso",
    "Fecha": "2026-08-24",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 23.9,
    "Entidad": "Interbank Amex",
    "Mes": "Agosto"
  },
  {
    "id": "tx-664",
    "Tipo": "Egreso",
    "Fecha": "2026-08-27",
    "Categoria": "Gasto",
    "Concepto": "Utencilios de Limpieza",
    "Monto": 1.5,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-665",
    "Tipo": "Egreso",
    "Fecha": "2026-08-27",
    "Categoria": "Gasto",
    "Concepto": "Broaster",
    "Monto": 9,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-666",
    "Tipo": "Ingreso",
    "Fecha": "2026-08-27",
    "Categoria": "Otro Ing",
    "Concepto": "Entrada Paulo Londra",
    "Monto": 100,
    "Entidad": "Interbank",
    "Mes": "Agosto"
  },
  {
    "id": "tx-667",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Otro Ing",
    "Concepto": "Bonificación Ahorro",
    "Monto": 193,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-668",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Sueldo",
    "Concepto": "Sueldo",
    "Monto": 2259.63,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-669",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 976.1,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-670",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 488.43,
    "Entidad": "BBVA Bfree",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-671",
    "Tipo": "Ingreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gasto",
    "Concepto": "Linea Tarjeta",
    "Monto": 637.11,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-672",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Ripley",
    "Monto": 200.67,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-673",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Deuda",
    "Concepto": "Prestamo Yape",
    "Monto": 116.85,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-674",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Servicio",
    "Concepto": "Corte de Cabello",
    "Monto": 20,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-675",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Deuda",
    "Concepto": "iPhone 16",
    "Monto": 245.75,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-676",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta Interbank Amex",
    "Monto": 751.89,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-677",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Servicio",
    "Concepto": "Pago de Tarjeta BBVA Bfree",
    "Monto": 455.09,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-678",
    "Tipo": "Egreso",
    "Fecha": "2026-09-05",
    "Categoria": "Servicio",
    "Concepto": "Agua + Mantenimiento",
    "Monto": 160,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-679",
    "Tipo": "Egreso",
    "Fecha": "2026-09-15",
    "Categoria": "Deuda",
    "Concepto": "Prestamo BCP",
    "Monto": 143.16,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-680",
    "Tipo": "Egreso",
    "Fecha": "2026-09-15",
    "Categoria": "Otro Egre",
    "Concepto": "Titulación",
    "Monto": 80,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-681",
    "Tipo": "Egreso",
    "Fecha": "2026-09-23",
    "Categoria": "Servicio",
    "Concepto": "iCloud",
    "Monto": 15,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-682",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gasto",
    "Concepto": "Futbol",
    "Monto": 24.5,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-683",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Servicio",
    "Concepto": "IA",
    "Monto": 18.99,
    "Entidad": "Ripley",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-684",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gasto",
    "Concepto": "Gaseosa",
    "Monto": 12.7,
    "Entidad": "Interbank Amex",
    "Mes": "Setiembre"
  },
  {
    "id": "tx-685",
    "Tipo": "Egreso",
    "Fecha": "2026-09-01",
    "Categoria": "Gasto",
    "Concepto": "Tortes",
    "Monto": 2,
    "Entidad": "Interbank",
    "Mes": "Setiembre"
  }
];
