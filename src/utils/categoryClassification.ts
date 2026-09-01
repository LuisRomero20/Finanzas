import type { Transaction } from '../store/financeStore';

export interface CategoriaInfo {
  id: string;
  nombre: string;
  emoji: string;
  fullLabel: string;
  color: string;
  bg: string;
  border: string;
  tipo?: 'Egreso' | 'Ingreso' | 'Ambos';
  keywords: string[];
}

export const CONCEPTO_A_CATEGORIA: Record<string, string> = {
  // 🍔 Comida & Restaurantes
  "Broaster": "🍔 Comida & Restaurantes",
  "Café": "🍔 Comida & Restaurantes",
  "Ceviche": "🍔 Comida & Restaurantes",
  "Chicharron": "🍔 Comida & Restaurantes",
  "Chifa": "🍔 Comida & Restaurantes",
  "Comida": "🍔 Comida & Restaurantes",
  "Empanada": "🍔 Comida & Restaurantes",
  "Fridays": "🍔 Comida & Restaurantes",
  "Hamburguesa": "🍔 Comida & Restaurantes",
  "Makis": "🍔 Comida & Restaurantes",
  "Menú": "🍔 Comida & Restaurantes",
  "Papa Rellena": "🍔 Comida & Restaurantes",
  "Pizza": "🍔 Comida & Restaurantes",
  "Planet Chicken": "🍔 Comida & Restaurantes",
  "Pollo a la Brasa": "🍔 Comida & Restaurantes",
  "Shawarma": "🍔 Comida & Restaurantes",
  "Tacos": "🍔 Comida & Restaurantes",

  // 🛒 Supermercado & Alimentos
  "Agua Mineral": "🛒 Supermercado & Alimentos",
  "Chupete": "🛒 Supermercado & Alimentos",
  "Dulce": "🛒 Supermercado & Alimentos",
  "Dulce de Leche": "🛒 Supermercado & Alimentos",
  "Galleta Casino": "🛒 Supermercado & Alimentos",
  "Gaseosa": "🛒 Supermercado & Alimentos",
  "Mayonesa": "🛒 Supermercado & Alimentos",
  "Mercado": "🛒 Supermercado & Alimentos",
  "Torta de Chocolate": "🛒 Supermercado & Alimentos",
  "Tortes": "🛒 Supermercado & Alimentos",
  "Turron": "🛒 Supermercado & Alimentos",
  "Yogurt": "🛒 Supermercado & Alimentos",

  // 💡 Servicios Básicos & Facturas
  "Agua + Mantenimiento": "💡 Servicios Básicos & Facturas",
  "Gas": "💡 Servicios Básicos & Facturas",
  "Internet": "💡 Servicios Básicos & Facturas",
  "Luz": "💡 Servicios Básicos & Facturas",
  "Telefonia Movil": "💡 Servicios Básicos & Facturas",
  "Utencilios de Limpieza": "🏠 Hogar & Mantenimiento",

  // 👗 Ropa, Calzado & Reparaciones
  "Abrigo": "👗 Ropa & Calzado",
  "Arreglar Abrigo": "👗 Ropa & Calzado",
  "Arreglar Zapatillas": "👗 Ropa & Calzado",
  "Camisa": "👗 Ropa & Calzado",
  "Casaca": "👗 Ropa & Calzado",
  "Gorra": "👗 Ropa & Calzado",
  "Pantalon": "👗 Ropa & Calzado",
  "Polo": "👗 Ropa & Calzado",
  "Polo y/o Camisa": "👗 Ropa & Calzado",
  "Zapatillas": "👗 Ropa & Calzado",

  // 🎮 Entretenimiento & Streaming
  "Fifa 26": "🎮 Entretenimiento & Streaming",
  "IA": "💻 Tecnología & Gadgets",
  "iCloud": "🎮 Entretenimiento & Streaming",
  "In Game": "🎮 Entretenimiento & Streaming",
  "Minecraft": "🎮 Entretenimiento & Streaming",
  "Skin de Valorant": "🎮 Entretenimiento & Streaming",
  "Spotify": "🎮 Entretenimiento & Streaming",
  "Streaming": "🎮 Entretenimiento & Streaming",
  "Videojuegos": "🎮 Entretenimiento & Streaming",

  // 🎤 Conciertos & Eventos
  "Concierto  Soda Stereo": "🎤 Conciertos & Eventos",
  "Concierto Soda Stereo": "🎤 Conciertos & Eventos",
  "Concierto Bad Bunny": "🎤 Conciertos & Eventos",
  "Concierto Milo J": "🎤 Conciertos & Eventos",
  "Concierto Paulo Londra": "🎤 Conciertos & Eventos",
  "Concierto Rawayana": "🎤 Conciertos & Eventos",
  "Concierto Trueno": "🎤 Conciertos & Eventos",
  "Entrada Estadio": "🎤 Conciertos & Eventos",
  "Entrada Paulo Londra": "🎤 Conciertos & Eventos",

  // 🎁 Regalos & Celebraciones
  "Cumpleaños": "🎁 Regalos & Celebraciones",
  "Cumpleaños Abuela": "🎁 Regalos & Celebraciones",
  "Cumpleaños Adriano": "🎁 Regalos & Celebraciones",
  "Cumpleaños Alondra": "🎁 Regalos & Celebraciones",
  "Cumpleaños Beu": "🎁 Regalos & Celebraciones",
  "Cumpleaños Fatima": "🎁 Regalos & Celebraciones",
  "Cumpleaños Madre": "🎁 Regalos & Celebraciones",
  "Cumpleaños Padre": "🎁 Regalos & Celebraciones",
  "Dia de la Madre": "🎁 Regalos & Celebraciones",
  "Dia del Trabajador": "🎁 Regalos & Celebraciones",

  // ✈️ Viajes & Hospedaje
  "Hotel": "✈️ Viajes & Hospedaje",
  "Maleta": "✈️ Viajes & Hospedaje",
  "Viaje Argentina": "✈️ Viajes & Hospedaje",
  "Viaje Brasil": "✈️ Viajes & Hospedaje",
  "Viaje Laraos": "✈️ Viajes & Hospedaje",
  "Viaje Piura": "✈️ Viajes & Hospedaje",
  "Viaje Raura": "✈️ Viajes & Hospedaje",

  // 🏥 Salud & Farmacia
  "Bepanten": "🏥 Salud & Farmacia",
  "Condones": "🏥 Salud & Farmacia",
  "Medicina Madre": "🏥 Salud & Farmacia",
  "Medicinas": "🏥 Salud & Farmacia",
  "Psicologo": "🏥 Salud & Farmacia",
  "Seguro Rimac": "🏥 Salud & Farmacia",

  // 🧴 Cuidado Personal & Aseo
  "Corte de Cabello": "🧴 Cuidado Personal & Aseo",
  "Crema de Manos": "🧴 Cuidado Personal & Aseo",
  "Perfume Invictus": "🧴 Cuidado Personal & Aseo",
  "Tatuaje": "🧴 Cuidado Personal & Aseo",
  "Utencilios de Aseo Personal": "🧴 Cuidado Personal & Aseo",

  // 🚍 Transporte & Movilidad
  "Bus": "🚍 Transporte & Movilidad",
  "Taxi": "🚍 Transporte & Movilidad",

  // 🛍️ Compras Generales & Gadgets
  "Dollarcity": "🛍️ Compras Generales & Bazar",
  "Figuritas": "🛍️ Compras Generales & Bazar",
  "iPhone 16": "💻 Tecnología & Gadgets",
  "Poster de Spiderman": "🛍️ Compras Generales & Bazar",
  "Temu": "🛍️ Compras Generales & Bazar",

  // 🛹 Gustos, Ocio & Sociales
  "Alcohol": "🎉 Salidas & Sociales",
  "Apuestas": "🛹 Gustos & Ocio",
  "Bowling": "🛹 Gustos & Ocio",
  "Cerveza": "🎉 Salidas & Sociales",
  "Cigarro": "🛹 Gustos & Ocio",
  "Cine": "🛹 Gustos & Ocio",
  "Coptel": "🎉 Salidas & Sociales",
  "FourLoko": "🎉 Salidas & Sociales",
  "Futbol": "🛹 Gustos & Ocio",
  "HappyLand": "🛹 Gustos & Ocio",
  "Karts": "🛹 Gustos & Ocio",
  "Propina": "🎉 Salidas & Sociales",
  "Ron": "🎉 Salidas & Sociales",
  "Salida Casual": "🎉 Salidas & Sociales",
  "Salida Familiar": "🎉 Salidas & Sociales",

  // 📄 Trámites & Documentos
  "DNI Electronico": "📄 Trámites & Documentos",
  "Pasaporte": "📄 Trámites & Documentos",
  "Titulación": "📄 Trámites & Documentos",

  // 👥 Transferencias / Personas
  "Aaron": "👥 Familia & Transferencias",
  "Carol": "👥 Familia & Transferencias",
  "Jacko": "👥 Familia & Transferencias",
  "Madre": "👥 Familia & Transferencias",
  "Mayra": "👥 Familia & Transferencias",
  "Milagros": "👥 Familia & Transferencias",
  "Mili": "👥 Familia & Transferencias",
  "Padre": "👥 Familia & Transferencias",

  // 💳 Deudas, Tarjetas & Préstamos
  "Desvagramen": "💳 Pagos de Tarjetas & Deudas",
  "Linea Tarjeta": "💳 Pagos de Tarjetas & Deudas",
  "Pago de Tarjeta BBVA Bfree": "💳 Pagos de Tarjetas & Deudas",
  "Pago de Tarjeta Interbank Amex": "💳 Pagos de Tarjetas & Deudas",
  "Pago de Tarjeta Ripley": "💳 Pagos de Tarjetas & Deudas",
  "Prestamo BCP": "💳 Pagos de Tarjetas & Deudas",
  "Prestamo Yape": "💳 Pagos de Tarjetas & Deudas",
  "Yape Crédito": "💳 Pagos de Tarjetas & Deudas",

  // 💵 Ingresos
  "AFP": "💵 Sueldos & Beneficios Laborales",
  "Bonificación Ahorro": "📈 Otros Ingresos & Ventas",
  "CTS": "💵 Sueldos & Beneficios Laborales",
  "Gratificación": "💵 Sueldos & Beneficios Laborales",
  "Sueldo": "💵 Sueldos & Beneficios Laborales",
  "Venta de iPhone": "📈 Otros Ingresos & Ventas"
};

export const CATEGORIAS_PERSONALES: CategoriaInfo[] = [
  {
    id: 'comida',
    nombre: 'Comida & Restaurantes',
    emoji: '🍔',
    fullLabel: '🍔 Comida & Restaurantes',
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60',
    border: 'border-amber-300 dark:border-amber-800',
    tipo: 'Egreso',
    keywords: ['broaster', 'cafe', 'café', 'ceviche', 'chicharron', 'chifa', 'comida', 'empanada', 'fridays', 'hamburguesa', 'makis', 'menu', 'menú', 'papa rellena', 'pizza', 'planet chicken', 'pollo', 'brasa', 'shawarma', 'taco', 'almuerzo', 'desayuno', 'cena', 'sushi', 'anticucho', 'lomo', 'restaurante'],
  },
  {
    id: 'supermercado',
    nombre: 'Supermercado & Alimentos',
    emoji: '🛒',
    fullLabel: '🛒 Supermercado & Alimentos',
    color: 'text-emerald-800 dark:text-emerald-300',
    bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60',
    border: 'border-emerald-300 dark:border-emerald-800',
    tipo: 'Egreso',
    keywords: ['agua mineral', 'chupete', 'dulce', 'dulce de leche', 'galleta', 'casino', 'gaseosa', 'mayonesa', 'mercado', 'torta de chocolate', 'tortes', 'turron', 'turrón', 'yogurt', 'supermercado', 'vivanda', 'metro', 'plaza vea', 'wong', 'tottus', 'despensa', 'alimentos'],
  },
  {
    id: 'servicios_facturas',
    nombre: 'Servicios Básicos & Facturas',
    emoji: '💡',
    fullLabel: '💡 Servicios Básicos & Facturas',
    color: 'text-yellow-800 dark:text-yellow-300',
    bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800/60',
    border: 'border-yellow-300 dark:border-yellow-800',
    tipo: 'Egreso',
    keywords: ['agua + mantenimiento', 'gas', 'internet', 'luz', 'telefonia movil', 'telefonía móvil', 'recibo', 'calidda', 'sedapal', 'enel', 'pluz', 'claro', 'movistar', 'entel', 'bitel', 'factura', 'servicio basico'],
  },
  {
    id: 'hogar',
    nombre: 'Hogar & Mantenimiento',
    emoji: '🏠',
    fullLabel: '🏠 Hogar & Mantenimiento',
    color: 'text-orange-800 dark:text-orange-300',
    bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800/60',
    border: 'border-orange-300 dark:border-orange-800',
    tipo: 'Egreso',
    keywords: ['utencilios de limpieza', 'utensilios de limpieza', 'candado', 'limpieza', 'hogar', 'casa', 'mueble', 'cocina', 'baño', 'detergente', 'escoba', 'trapeador', 'sodimac', 'promart'],
  },
  {
    id: 'ropa',
    nombre: 'Ropa & Calzado',
    emoji: '👗',
    fullLabel: '👗 Ropa & Calzado',
    color: 'text-rose-800 dark:text-rose-300',
    bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/60',
    border: 'border-rose-300 dark:border-rose-800',
    tipo: 'Egreso',
    keywords: ['abrigo', 'arreglar abrigo', 'arreglar zapatillas', 'camisa', 'casaca', 'gorra', 'pantalon', 'pantalón', 'polo', 'polo y/o camisa', 'zapatillas', 'zapato', 'jean', 'medias', 'calzado', 'sastrería', 'zapatería'],
  },
  {
    id: 'entretenimiento',
    nombre: 'Entretenimiento & Streaming',
    emoji: '🎮',
    fullLabel: '🎮 Entretenimiento & Streaming',
    color: 'text-indigo-800 dark:text-indigo-300',
    bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800/60',
    border: 'border-indigo-300 dark:border-indigo-800',
    tipo: 'Egreso',
    keywords: ['fifa 26', 'fifa', 'icloud', 'in game', 'minecraft', 'skin de valorant', 'spotify', 'streaming', 'videojuegos', 'netflix', 'disney', 'prime video', 'hbo', 'max', 'playstation', 'steam', 'game pass'],
  },
  {
    id: 'tecnologia',
    nombre: 'Tecnología & Gadgets',
    emoji: '💻',
    fullLabel: '💻 Tecnología & Gadgets',
    color: 'text-blue-800 dark:text-blue-300',
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60',
    border: 'border-blue-300 dark:border-blue-800',
    tipo: 'Egreso',
    keywords: ['ia', 'chatgpt', 'claude', 'copilot', 'openai', 'iphone 16', 'iphone', 'gadget', 'laptop', 'hardware', 'software', 'tecnologia', 'tecnología', 'mouse', 'teclado', 'auriculares'],
  },
  {
    id: 'conciertos',
    nombre: 'Conciertos & Eventos',
    emoji: '🎤',
    fullLabel: '🎤 Conciertos & Eventos',
    color: 'text-purple-800 dark:text-purple-300',
    bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/60',
    border: 'border-purple-300 dark:border-purple-800',
    tipo: 'Egreso',
    keywords: ['concierto', 'soda stereo', 'bad bunny', 'milo j', 'paulo londra', 'rawayana', 'trueno', 'entrada estadio', 'entrada paulo londra', 'festival', 'recital', 'teleticket', 'joinnus'],
  },
  {
    id: 'regalos',
    nombre: 'Regalos & Celebraciones',
    emoji: '🎁',
    fullLabel: '🎁 Regalos & Celebraciones',
    color: 'text-red-800 dark:text-red-300',
    bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800/60',
    border: 'border-red-300 dark:border-red-800',
    tipo: 'Egreso',
    keywords: ['cumpleaños', 'cumpleaños abuela', 'cumpleaños adriano', 'cumpleaños alondra', 'cumpleaños beu', 'cumpleaños fatima', 'cumpleaños madre', 'cumpleaños padre', 'dia de la madre', 'dia del trabajador', 'regalo', 'fiesta', 'aniversario', 'navidad'],
  },
  {
    id: 'viajes',
    nombre: 'Viajes & Hospedaje',
    emoji: '✈️',
    fullLabel: '✈️ Viajes & Hospedaje',
    color: 'text-sky-800 dark:text-sky-300',
    bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800/60',
    border: 'border-sky-300 dark:border-sky-800',
    tipo: 'Egreso',
    keywords: ['hotel', 'maleta', 'viaje argentina', 'viaje brasil', 'viaje laraos', 'viaje piura', 'viaje raura', 'viaje', 'vuelo', 'pasajes aereos', 'booking', 'airbnb', 'turismo'],
  },
  {
    id: 'salud',
    nombre: 'Salud & Farmacia',
    emoji: '🏥',
    fullLabel: '🏥 Salud & Farmacia',
    color: 'text-teal-800 dark:text-teal-300',
    bg: 'bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800/60',
    border: 'border-teal-300 dark:border-teal-800',
    tipo: 'Egreso',
    keywords: ['bepanten', 'condones', 'medicina madre', 'medicinas', 'psicologo', 'psicólogo', 'seguro rimac', 'farmacia', 'doctor', 'clinica', 'salud', 'consulta', 'medicamento', 'pastilla', 'hospital', 'analisis'],
  },
  {
    id: 'cuidado_personal',
    nombre: 'Cuidado Personal & Aseo',
    emoji: '🧴',
    fullLabel: '🧴 Cuidado Personal & Aseo',
    color: 'text-pink-800 dark:text-pink-300',
    bg: 'bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800/60',
    border: 'border-pink-300 dark:border-pink-800',
    tipo: 'Egreso',
    keywords: ['corte de cabello', 'crema de manos', 'perfume invictus', 'tatuaje', 'utencilios de aseo personal', 'utensilios de aseo personal', 'barberia', 'peluqueria', 'desodorante', 'shampoo', 'crema', 'higiene'],
  },
  {
    id: 'transporte',
    nombre: 'Transporte & Movilidad',
    emoji: '🚍',
    fullLabel: '🚍 Transporte & Movilidad',
    color: 'text-cyan-800 dark:text-cyan-300',
    bg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-800/60',
    border: 'border-cyan-300 dark:border-cyan-800',
    tipo: 'Egreso',
    keywords: ['bus', 'taxi', 'uber', 'indriver', 'cabify', 'pasaje', 'combustible', 'gasolina', 'movilidad', 'metro', 'peaje'],
  },
  {
    id: 'bazar',
    nombre: 'Compras Generales & Bazar',
    emoji: '🛍️',
    fullLabel: '🛍️ Compras Generales & Bazar',
    color: 'text-violet-800 dark:text-violet-300',
    bg: 'bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800/60',
    border: 'border-violet-300 dark:border-violet-800',
    tipo: 'Egreso',
    keywords: ['dollarcity', 'figuritas', 'poster de spiderman', 'temu', 'amazon', 'aliexpress', 'bazar', 'adornos', 'papeleria', 'artículos'],
  },
  {
    id: 'salidas',
    nombre: 'Salidas & Sociales',
    emoji: '🎉',
    fullLabel: '🎉 Salidas & Sociales',
    color: 'text-amber-900 dark:text-amber-300',
    bg: 'bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800/70',
    border: 'border-amber-400 dark:border-amber-700',
    tipo: 'Egreso',
    keywords: ['alcohol', 'cerveza', 'coptel', 'coctel', 'fourloko', 'propina', 'ron', 'salida casual', 'salida familiar', 'bar', 'discoteca', 'karaoke', 'tragos', 'social'],
  },
  {
    id: 'ocio',
    nombre: 'Gustos & Ocio',
    emoji: '🛹',
    fullLabel: '🛹 Gustos & Ocio',
    color: 'text-slate-800 dark:text-slate-200',
    bg: 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700',
    border: 'border-slate-300 dark:border-slate-600',
    tipo: 'Egreso',
    keywords: ['apuestas', 'bowling', 'cigarro', 'cine', 'futbol', 'fútbol', 'happyland', 'karts', 'casino', 'billar', 'paintball', 'ocio', 'gustos'],
  },
  {
    id: 'tramites',
    nombre: 'Trámites & Documentos',
    emoji: '📄',
    fullLabel: '📄 Trámites & Documentos',
    color: 'text-stone-800 dark:text-stone-300',
    bg: 'bg-stone-100 border-stone-300 dark:bg-stone-800 dark:border-stone-700',
    border: 'border-stone-300 dark:border-stone-600',
    tipo: 'Egreso',
    keywords: ['dni electronico', 'dni electrónico', 'pasaporte', 'titulacion', 'titulación', 'tramite', 'notaria', 'certificados', 'apostilla', 'derecho de trámite'],
  },
  {
    id: 'transferencias',
    nombre: 'Familia & Transferencias',
    emoji: '👥',
    fullLabel: '👥 Familia & Transferencias',
    color: 'text-lime-800 dark:text-lime-300',
    bg: 'bg-lime-50 border-lime-200 dark:bg-lime-950/40 dark:border-lime-800/60',
    border: 'border-lime-300 dark:border-lime-800',
    tipo: 'Ambos',
    keywords: ['aaron', 'carol', 'jacko', 'madre', 'mayra', 'milagros', 'mili', 'padre', 'transferencia familiar', 'remesa', 'apoyo familiar'],
  },
  {
    id: 'deudas',
    nombre: 'Pagos de Tarjetas & Deudas',
    emoji: '💳',
    fullLabel: '💳 Pagos de Tarjetas & Deudas',
    color: 'text-rose-900 dark:text-rose-300',
    bg: 'bg-rose-100 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800/60',
    border: 'border-rose-400 dark:border-rose-700',
    tipo: 'Egreso',
    keywords: ['desvagramen', 'desgravamen', 'linea tarjeta', 'pago de tarjeta bbva bfree', 'pago de tarjeta interbank amex', 'pago de tarjeta ripley', 'prestamo bcp', 'préstamo bcp', 'prestamo yape', 'préstamo yape', 'yape credito', 'yape crédito', 'cuota', 'amortización'],
  },
  {
    id: 'sueldos',
    nombre: 'Sueldos & Beneficios Laborales',
    emoji: '💵',
    fullLabel: '💵 Sueldos & Beneficios Laborales',
    color: 'text-emerald-900 dark:text-emerald-300',
    bg: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800/70',
    border: 'border-emerald-400 dark:border-emerald-700',
    tipo: 'Ingreso',
    keywords: ['afp', 'cts', 'gratificacion', 'gratificación', 'sueldo', 'quincena', 'haberes', 'nomina', 'nómina', 'utilidades', 'planilla'],
  },
  {
    id: 'otros_ingresos',
    nombre: 'Otros Ingresos & Ventas',
    emoji: '📈',
    fullLabel: '📈 Otros Ingresos & Ventas',
    color: 'text-blue-900 dark:text-blue-300',
    bg: 'bg-blue-100 border-blue-300 dark:bg-blue-950/50 dark:border-blue-800/70',
    border: 'border-blue-400 dark:border-blue-700',
    tipo: 'Ingreso',
    keywords: ['bonificacion ahorro', 'bonificación ahorro', 'venta de iphone', 'venta', 'intereses', 'cashback', 'reembolso', 'premio', 'dividendo', 'ganancia'],
  },
];

// Mapa normalizado para matching sin acentos ni espacios extra
const CONCEPTO_NORMALIZADO_MAP = new Map<string, string>();
Object.entries(CONCEPTO_A_CATEGORIA).forEach(([concepto, categoriaFull]) => {
  const norm = normalizeText(concepto);
  CONCEPTO_NORMALIZADO_MAP.set(norm, categoriaFull);
});

// Mapa de FullLabel, ID y Nombre a CategoriaInfo
const CATEGORIA_BY_FULL_LABEL = new Map<string, CategoriaInfo>();
const CATEGORIA_BY_ID = new Map<string, CategoriaInfo>();
const CATEGORIA_BY_NOMBRE = new Map<string, CategoriaInfo>();

CATEGORIAS_PERSONALES.forEach(cat => {
  CATEGORIA_BY_FULL_LABEL.set(cat.fullLabel, cat);
  CATEGORIA_BY_ID.set(cat.id, cat);
  CATEGORIA_BY_NOMBRE.set(cat.nombre, cat);
});

export function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const CLASIFICACIONES_STORAGE_KEY = 'finper_clasificaciones_v2';

export function getStoredClasificaciones(): Record<string, string> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return JSON.parse(localStorage.getItem(CLASIFICACIONES_STORAGE_KEY) || '{}');
    }
  } catch {}
  return {};
}

export function saveStoredClasificaciones(data: Record<string, string>): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(CLASIFICACIONES_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {}
}

/**
 * Encuentra la categoría exacta o inteligente para un movimiento dado
 */
export function autoClassify(t: Transaction): string | null {
  const rawConcept = (t.Concepto || (t as any).concepto || '').trim();
  if (!rawConcept) return null;

  // 1. Coincidencia directa por diccionario exacto
  if (CONCEPTO_A_CATEGORIA[rawConcept]) {
    const full = CONCEPTO_A_CATEGORIA[rawConcept];
    const cat = CATEGORIA_BY_FULL_LABEL.get(full);
    return cat ? cat.id : null;
  }

  // 2. Coincidencia normalizada (sin tildes, mayúsculas o espacios múltiples)
  const normConcept = normalizeText(rawConcept);
  if (CONCEPTO_NORMALIZADO_MAP.has(normConcept)) {
    const full = CONCEPTO_NORMALIZADO_MAP.get(normConcept)!;
    const cat = CATEGORIA_BY_FULL_LABEL.get(full);
    return cat ? cat.id : null;
  }

  // 3. Coincidencia de subcadena exacta contra las claves de CONCEPTO_A_CATEGORIA
  for (const [key, fullCat] of Object.entries(CONCEPTO_A_CATEGORIA)) {
    const keyNorm = normalizeText(key);
    if (normConcept === keyNorm || normConcept.includes(keyNorm) || keyNorm.includes(normConcept)) {
      const cat = CATEGORIA_BY_FULL_LABEL.get(fullCat);
      if (cat) return cat.id;
    }
  }

  // 4. Fallback: búsqueda por palabras clave de cada categoría
  const rawCat = t.Categoria || (t as any).categoria || '';
  const fullTexto = normalizeText(`${rawConcept} ${rawCat}`);
  for (const cat of CATEGORIAS_PERSONALES) {
    for (const kw of cat.keywords) {
      const kwNorm = normalizeText(kw);
      // Evitar colisiones cortas usando word boundary o matching
      if (kwNorm.length <= 3) {
        const regex = new RegExp(`\\b${kwNorm}\\b`, 'i');
        if (regex.test(fullTexto)) return cat.id;
      } else if (fullTexto.includes(kwNorm)) {
        return cat.id;
      }
    }
  }

  return null;
}

export function getCategoryByIdOrLabel(idOrLabel: string): CategoriaInfo | null {
  if (!idOrLabel) return null;
  const direct = CATEGORIA_BY_ID.get(idOrLabel) 
    || CATEGORIA_BY_FULL_LABEL.get(idOrLabel) 
    || CATEGORIA_BY_NOMBRE.get(idOrLabel);
  if (direct) return direct;

  const norm = normalizeText(idOrLabel);
  for (const cat of CATEGORIAS_PERSONALES) {
    if (
      normalizeText(cat.id) === norm ||
      normalizeText(cat.nombre) === norm ||
      normalizeText(cat.fullLabel) === norm
    ) {
      return cat;
    }
  }
  return null;
}

/**
 * Obtiene la categoría enriquecida efectiva para una transacción,
 * respetando clasificaciones manuales guardadas en el store / storage,
 * o la categoría asignada directamente en el registro, o el autoClassify inteligente.
 */
export function getEffectiveCategory(
  t: Transaction,
  customClasificaciones?: Record<string, string>
): CategoriaInfo | null {
  if (!t) return null;

  // 1. Clasificación manual explícita pasada o guardada en storage
  const map = customClasificaciones || getStoredClasificaciones();
  if (t.id && map[t.id]) {
    const cat = getCategoryByIdOrLabel(map[t.id]);
    if (cat) return cat;
  }

  // 2. Si t.Categoria ya corresponde a una categoría personal de 21
  const rawCat = t.Categoria || (t as any).categoria;
  if (rawCat && rawCat !== 'Gasto' && rawCat !== 'Servicio' && rawCat !== 'Otro Egre' && rawCat !== 'Otro Ing' && rawCat !== 'Deuda') {
    const directCat = getCategoryByIdOrLabel(rawCat);
    if (directCat) return directCat;
  }

  // 3. Fallback a autoClassify por concepto
  const autoCatId = autoClassify(t);
  if (autoCatId) {
    return getCategoryByIdOrLabel(autoCatId);
  }

  // 4. Mapeo genérico para categorías legacy si no hubo match
  if (rawCat === 'Deuda') return getCategoryByIdOrLabel('deudas');
  if (rawCat === 'Sueldo') return getCategoryByIdOrLabel('sueldos');
  if (rawCat === 'Servicio') return getCategoryByIdOrLabel('servicios_facturas');

  return null;
}

export function getEffectiveCategoryId(
  t: Transaction,
  customClasificaciones?: Record<string, string>
): string | null {
  return getEffectiveCategory(t, customClasificaciones)?.id || null;
}

export function getEffectiveCategoryLabel(
  t: Transaction,
  customClasificaciones?: Record<string, string>
): string {
  const cat = getEffectiveCategory(t, customClasificaciones);
  return cat ? cat.fullLabel : (t.Categoria || (t as any).categoria || 'Sin clasificar');
}

/**
 * Determina de manera consistente si una transacción es un pago de deuda / pasivo / amortización
 */
export function isDebtTransaction(
  t: Transaction,
  customClasificaciones?: Record<string, string>
): boolean {
  if (!t) return false;
  const rawCat = t.Categoria || (t as any).categoria;
  if (rawCat === 'Deuda') return true;
  const cat = getEffectiveCategory(t, customClasificaciones);
  if (cat?.id === 'deudas') return true;
  const concepto = (t.Concepto || (t as any).concepto || '').toLowerCase();
  return /prestamo|préstamo|linea\s*tarjeta|pago\s*de\s*tarjeta|yape\s*cr[eé]dito|amortizaci[oó]n|desgravamen|desvagramen/i.test(concepto);
}

