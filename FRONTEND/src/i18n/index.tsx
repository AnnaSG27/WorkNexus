import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "es" | "en";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
};

const STORAGE_KEY = "worknexus-language";

const normalizeMojibake = (value: string) =>
  value
    .replaceAll("Ã¡", "á")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã­", "í")
    .replaceAll("Ã³", "ó")
    .replaceAll("Ãº", "ú")
    .replaceAll("Ã", "Á")
    .replaceAll("Ã‰", "É")
    .replaceAll("Ã", "Í")
    .replaceAll("Ã“", "Ó")
    .replaceAll("Ãš", "Ú")
    .replaceAll("Ã±", "ñ")
    .replaceAll("Ã‘", "Ñ")
    .replaceAll("Â¿", "¿")
    .replaceAll("Â¡", "¡")
    .replaceAll("â€¦", "...")
    .replaceAll("â†’", "->")
    .replaceAll("âœï¸", "")
    .replaceAll("ðŸ’µ", "💵")
    .replaceAll("ðŸ’³", "💳")
    .replaceAll("ðŸ’°", "💰")
    .replace(/\s+/g, " ")
    .trim();

const translations: Record<string, string> = {
  Inicio: "Home",
  Servicios: "Services",
  Profesionales: "Professionals",
  "Explorar profesionales": "Explore professionals",
  "Perfiles guardados": "Saved profiles",
  "Iniciar sesion": "Log in",
  Registrarse: "Sign up",
  Mensajes: "Messages",
  "Mi perfil": "My profile",
  "Cerrar sesion": "Log out",
  "Cerrar sesión": "Log out",
  "Mis trabajos": "My jobs",
  "Mis proyectos": "My projects",
  "Más de 50,000 profesionales disponibles": "More than 50,000 professionals available",
  "Encuentra el talento": "Find the talent",
  "perfecto para tu proyecto": "perfect for your project",
  "Conectamos empresas con freelancers de élite. Diseño, desarrollo, marketing y más. Tu próximo proyecto comienza aquí.":
    "We connect companies with elite freelancers. Design, development, marketing, and more. Your next project starts here.",
  "¿Qué servicio necesitas?": "What service do you need?",
  Buscar: "Search",
  "Diseño web": "Web design",
  Logo: "Logo",
  "Desarrollo app": "App development",
  "Video editing": "Video editing",
  Proyectos: "Projects",
  Valoración: "Rating",
  Categorías: "Categories",
  Categorias: "Categories",
  "Explora nuestros servicios": "Explore our services",
  "Desde desarrollo web hasta producción audiovisual, encuentra exactamente lo que necesitas":
    "From web development to audiovisual production, find exactly what you need",
  Desarrollo: "Development",
  Diseño: "Design",
  Marketing: "Marketing",
  Video: "Video",
  Escritura: "Writing",
  Publicidad: "Advertising",
  Fotografía: "Photography",
  Audio: "Audio",
  "servicios": "services",
  "Mantente actualizado": "Stay up to date",
  "Recibe las mejores ofertas y novedades en tu correo": "Get the best offers and updates in your inbox",
  Suscribirse: "Subscribe",
  Plataforma: "Platform",
  Precios: "Pricing",
  Seguridad: "Security",
  Empresas: "Companies",
  Soporte: "Support",
  "Centro de ayuda": "Help center",
  Contacto: "Contact",
  Términos: "Terms",
  "Sobre nosotros": "About us",
  Carreras: "Careers",
  Prensa: "Press",
  "La plataforma líder para conectar con freelancers profesionales.": "The leading platform for connecting with professional freelancers.",
  "Iniciar sesión": "Log in",
  "Correo electrónico": "Email",
  Contraseña: "Password",
  Ingresar: "Enter",
  "¿No tienes cuenta?": "Don't have an account?",
  Registrate: "Sign up",
  "Volver al inicio": "Back to home",
  "Crear cuenta": "Create account",
  "Nombre completo": "Full name",
  Usuario: "Username",
  "Confirmar contraseña": "Confirm password",
  Celular: "Phone",
  Pais: "Country",
  País: "Country",
  Ciudad: "City",
  "Selecciona una opción": "Select an option",
  "Selecciona una ciudad": "Select a city",
  "Ingresa tu ciudad": "Enter your city",
  "Selecciona el tipo de usuario": "Select the user type",
  Cliente: "Client",
  "Profesional / Freelancer": "Professional / Freelancer",
  "Nombre de empresa": "Company name",
  Descripción: "Description",
  Descripcion: "Description",
  "Cuéntanos sobre ti": "Tell us about yourself",
  "Fecha de Nacimiento": "Date of birth",
  "¿Ya tienes cuenta?": "Already have an account?",
  "Inicia sesión": "Log in",
  "Contratacion de servicios": "Service hiring",
  "Contratación de servicios": "Service hiring",
  "Encuentra un servicio y contratalo de forma clara desde la misma plataforma.":
    "Find a service and hire it clearly from the same platform.",
  "Cada boton de contratar crea una contratacion real. Luego la ves en Mis proyectos para hacer seguimiento al estado del trabajo.":
    "Each hire button creates a real order. Then you can track its status in My projects.",
  "Ir a Mis proyectos": "Go to My projects",
  "Servicios disponibles": "Available services",
  "Categorias activas": "Active categories",
  "Buscar servicio": "Search service",
  Categoria: "Category",
  "Todas las categorias": "All categories",
  Diseno: "Design",
  "Hablar con freelancer": "Talk to freelancer",
  "Contratar servicio": "Hire service",
  "Inicia sesion como cliente para contratar este servicio.": "Log in as a client to hire this service.",
  "Los freelancers no pueden contratar servicios desde esta cuenta.": "Freelancers cannot hire services from this account.",
  "No puedes contratar tu propio servicio.": "You cannot hire your own service.",
  "No encontramos servicios con esos filtros.": "We did not find services with those filters.",
  "Exploracion visual": "Visual exploration",
  "Conservamos tambien la vitrina visual con servicios de muestra para seguir mostrando la experiencia de descubrimiento.":
    "We also keep the visual showcase with sample services to keep showing the discovery experience.",
  "Explora talento": "Explore talent",
  "Encuentra profesionales expertos": "Find expert professionals",
  "Descubre talento verificado, compara perfiles con calma y guarda tus favoritos para tomar mejores decisiones.":
    "Discover verified talent, compare profiles calmly, and save favorites to make better decisions.",
  "Proyectos WorkNexus": "WorkNexus Projects",
  "Publica oportunidades o encuentra tu siguiente proyecto con una experiencia clara y directa.":
    "Post opportunities or find your next project with a clear, direct experience.",
  "Los clientes pueden publicar necesidades reales y los freelancers pueden descubrir proyectos activos para postularse en minutos.":
    "Clients can post real needs and freelancers can discover active projects to apply in minutes.",
  "Como funciona": "How it works",
  "Cómo funciona": "How it works",
  "La nueva seccion de proyectos conecta demanda real con talento disponible.":
    "The new projects section connects real demand with available talent.",
  "Clientes publican proyectos": "Clients post projects",
  "Definen alcance, presupuesto y tiempos esperados.": "They define scope, budget, and expected timelines.",
  "Freelancers exploran oportunidades": "Freelancers explore opportunities",
  "La plataforma muestra proyectos abiertos para aplicar facilmente.": "The platform shows open projects to apply easily.",
  "Las aplicaciones llegan al cliente": "Applications reach the client",
  "Cada publicacion permite recibir candidatos directamente.": "Each post lets clients receive candidates directly.",
  "Panel de proyectos": "Projects dashboard",
  "Publicar proyecto": "Post project",
  "Agrega detalles suficientes para atraer mejores postulaciones.": "Add enough detail to attract better applications.",
  Titulo: "Title",
  "Título": "Title",
  Presupuesto: "Budget",
  "Presupuesto (COP)": "Budget (COP)",
  Modalidad: "Work mode",
  "Fecha limite": "Deadline",
  "Fecha límite": "Deadline",
  "Tiempo estimado": "Estimated time",
  Ubicacion: "Location",
  Ubicación: "Location",
  "Habilidades requeridas": "Required skills",
  "Enlace de referencia": "Reference link",
  "Publicando...": "Publishing...",
  "Tus proyectos": "Your projects",
  "Gestiona estados, revisa postulantes y activa conversaciones cuando elijas talento.":
    "Manage statuses, review applicants, and start conversations when you choose talent.",
  Explorar: "Explore",
  Favoritos: "Favorites",
  "Mis postulaciones": "My applications",
  "Presupuesto max": "Max budget",
  "Recomendados para ti": "Recommended for you",
  "Se priorizan coincidencias entre tu perfil y las habilidades pedidas.":
    "Matches between your profile and required skills are prioritized.",
  "Seguir viendo": "Keep viewing",
  Total: "Total",
  Pendientes: "Pending",
  "En revision": "Under review",
  "En revisión": "Under review",
  Aceptadas: "Accepted",
  Rechazadas: "Rejected",
  "Sin mensaje adicional.": "No additional message.",
  "Retirar postulacion": "Withdraw application",
  "Retirar postulación": "Withdraw application",
  "Abrir conversacion": "Open conversation",
  "Abrir conversación": "Open conversation",
  "Escribir al cliente": "Write to client",
  "Califica al freelancer": "Rate the freelancer",
  "Guardar reseña": "Save review",
  "Guardar reseña y cerrar": "Save review and close",
  Después: "Later",
  "Debes iniciar sesion para ver tus contrataciones": "You must log in to see your orders",
  "Esta seccion organiza tus servicios contratados y trabajos activos.": "This section organizes your hired services and active jobs.",
  "Aqui encuentras los trabajos que te han contratado desde servicios o proyectos.":
    "Here you find the jobs you have been hired for from services or projects.",
  "Aqui encuentras las contrataciones que hiciste desde servicios o al aceptar postulaciones.":
    "Here you find the orders you created from services or accepted applications.",
  "Sin iniciar": "Not started",
  "En proceso": "In progress",
  Terminados: "Completed",
  Terminado: "Completed",
  Cancelado: "Canceled",
  Servicio: "Service",
  Proyecto: "Project",
  "Sin descripcion adicional.": "No additional description.",
  "Abrir chat": "Open chat",
  "Factura PDF": "PDF invoice",
  "Descargando...": "Downloading...",
  Pagar: "Pay",
  Cancelar: "Cancel",
  Terminar: "Finish",
  "En aprobacion": "Pending approval",
  "En aprobación": "Pending approval",
  "Pago liberado": "Payment released",
  "Reseña final del proyecto": "Final project review",
  "Calificación general": "Overall rating",
  "Selecciona de 1 a 5 estrellas según tu experiencia.": "Select from 1 to 5 stars based on your experience.",
  "Debes iniciar sesion para usar mensajes": "You must log in to use messages",
  "El panel de mensajes muestra tus conversaciones activas, mensajes enviados, recibidos y respuestas en tiempo real.":
    "The messages panel shows your active conversations, sent messages, received messages, and real-time replies.",
  "Explorar freelancers": "Explore freelancers",
  Mensajeria: "Messaging",
  Mensajería: "Messaging",
  "Centro de conversaciones": "Conversation center",
  "Revisa tu bandeja, responde en tiempo real y mantén visible tanto lo enviado como lo recibido.":
    "Review your inbox, reply in real time, and keep both sent and received messages visible.",
  "Buscar profesionales": "Find professionals",
  Conversaciones: "Conversations",
  "Sin leer": "Unread",
  "Bandeja de entrada": "Inbox",
  "Aun no hay mensajes": "No messages yet",
  "Todavia no tienes conversaciones activas. Desde los perfiles de freelancers puedes iniciar una nueva.":
    "You do not have active conversations yet. You can start a new one from freelancer profiles.",
  "Selecciona una conversacion": "Select a conversation",
  "Tu historial aparecera aqui.": "Your history will appear here.",
  "Esta conversacion aun no tiene mensajes. Puedes enviar el primero ahora mismo.":
    "This conversation does not have messages yet. You can send the first one now.",
  "Tu panel de mensajes esta listo": "Your messages panel is ready",
  "Abre una conversacion existente o visita la seccion de freelancers para iniciar una nueva.":
    "Open an existing conversation or visit the freelancers section to start a new one.",
  "Ultima actividad:": "Last activity:",
  "Ultima respuesta": "Last response",
  "Sin actividad": "No activity",
  "Fecha invalida": "Invalid date",
  "Escribe tu mensaje...": "Write your message...",
  Enviar: "Send",
  Enviado: "Sent",
  Leido: "Read",
  "No hay usuario logueado": "No user is logged in",
  Guardar: "Save",
  "Editar perfil": "Edit profile",
  "Informacion general": "General information",
  "Información general": "General information",
  "Informacion de empresa": "Company information",
  Empresa: "Company",
  "Proyectos publicados": "Posted projects",
  Activos: "Active",
  Finalizados: "Completed",
  "Saldo disponible para pagar ordenes dentro de WorkNexus.": "Available balance to pay orders inside WorkNexus.",
  "Saldo actual": "Current balance",
  "Datos bancarios": "Bank details",
  "Información usada para habilitar recargas con Stripe.": "Information used to enable Stripe top-ups.",
  Editar: "Edit",
  Banco: "Bank",
  "Cuenta bancaria": "Bank account",
  "No registrado": "Not registered",
  "No registrada": "Not registered",
  "Numero de cuenta": "Account number",
  "Guardando...": "Saving...",
  "Monto a ingresar": "Amount to add",
  "Creando recarga...": "Creating top-up...",
  "Añadir plata": "Add money",
  "Confirmando...": "Confirming...",
  "Confirmar recarga": "Confirm top-up",
  "Perfil profesional": "Professional profile",
  "Tu información pública y la reputación que se construye con cada proyecto finalizado.":
    "Your public information and the reputation built with every completed project.",
  "Fecha de nacimiento": "Date of birth",
  "reseñas recibidas": "reviews received",
  "Historial de postulaciones": "Application history",
  "Reseñas recibidas": "Received reviews",
  "Comentarios que dejaron tus clientes al finalizar proyectos.": "Comments your clients left after finishing projects.",
  "Todavía no has recibido reseñas en proyectos finalizados.": "You have not received reviews on completed projects yet.",
  "Sin comentario adicional.": "No additional comment.",
  "No especificado": "Not specified",
  "No especificada": "Not specified",
  "Proceso simple": "Simple process",
  Encuentra: "Find",
  Conecta: "Connect",
  Contrata: "Hire",
  Recibe: "Receive",
  "Explora miles de servicios y freelancers especializados en tu industria.": "Explore thousands of services and freelancers specialized in your industry.",
  "Comunícate directamente con profesionales y define los detalles del proyecto.": "Communicate directly with professionals and define the project details.",
  "Realiza el pago de forma segura. El dinero se libera cuando estés satisfecho.": "Pay securely. The money is released when you are satisfied.",
  "Obtén tu proyecto terminado a tiempo y con la calidad que esperas.": "Get your finished project on time and with the quality you expect.",
  "¿Cómo funciona?": "How does it work?",
  "Contratar talento profesional nunca fue tan fácil. Sigue estos 4 pasos simples.": "Hiring professional talent has never been so easy. Follow these 4 simple steps.",
  "Profesionales destacados": "Featured professionals",
  "Conoce a nuestros expertos": "Meet our experts",
  "Explora perfiles confiables, guarda tus favoritos y encuentra al profesional ideal para avanzar tu proyecto con claridad.":
    "Explore trusted profiles, save your favorites, and find the ideal professional to move your project forward clearly.",
  "Cargar mas": "Load more",
  "Cargar más": "Load more",
  "Sin mas resultados": "No more results",
  "Sin más resultados": "No more results",
  "Busca por diseno, marketing, frontend, soporte, seguridad, datos...": "Search by design, marketing, frontend, support, security, data...",
  resultados: "results",
  "Encuentra profesionales por habilidades, rol, ubicacion o necesidades especificas de tu proyecto.":
    "Find professionals by skills, role, location, or specific project needs.",
  "Solo los clientes con sesion iniciada pueden guardar perfiles en favoritos y usar el chat.":
    "Only logged-in clients can save profiles to favorites and use chat.",
  Todas: "All",
  "Filtra rapidamente por el tipo de profesional que necesitas para tu proyecto.": "Quickly filter by the type of professional you need for your project.",
  "categorias disponibles": "available categories",
  "No encontramos perfiles con esa busqueda": "We did not find profiles for that search",
  "Prueba con otras palabras clave o cambia la categoria para ampliar los resultados.":
    "Try other keywords or change the category to broaden the results.",
  "Inicia sesion como cliente": "Log in as a client",
  "Para guardar profesionales en favoritos y escribir por chat necesitas entrar con una cuenta de cliente.":
    "To save professionals to favorites and write by chat, you need to sign in with a client account.",
  "Ir a iniciar sesion": "Go to log in",
  "Ahora no": "Not now",
  "Enviar mensaje": "Send message",
  "Nuevo mensaje": "New message",
  "Ver chat": "View chat",
  "Perfil guardado": "Profile saved",
  "Perfil quitado": "Profile removed",
  "fue agregado de tus favoritos.": "was added to your favorites.",
  "fue removido de tus favoritos.": "was removed from your favorites.",
  "El perfil fue agregado de tus favoritos.": "The profile was added to your favorites.",
  "El perfil fue removido de tus favoritos.": "The profile was removed from your favorites.",
  "Perfiles guardados solo para clientes": "Saved profiles for clients only",
  "Inicia sesion con una cuenta cliente para guardar profesionales y revisarlos despues desde esta pagina.":
    "Log in with a client account to save professionals and review them later from this page.",
  "Ver profesionales": "View professionals",
  "Revisa tus likes con contexto real: fecha guardada, estado del chat, categoria y disponibilidad.":
    "Review your likes with real context: saved date, chat status, category, and availability.",
  "Explorar mas profesionales": "Explore more professionals",
  "Busca por nombre, skill, categoria o disponibilidad...": "Search by name, skill, category, or availability...",
  "Mas recientes": "Most recent",
  Verificados: "Verified",
  "Con chat activo": "With active chat",
  "Por categoria": "By category",
  "Solo con chat activo": "Only with active chat",
  guardados: "saved",
  "con chat": "with chat",
  verificados: "verified",
  "Tu shortlist todavia esta vacia": "Your shortlist is still empty",
  "Guarda perfiles para compararlos con calma, revisar si ya tienes chat con ellos y volver rapido a los profesionales que mas te interesan.":
    "Save profiles to compare them calmly, check whether you already have a chat with them, and quickly return to the professionals you like most.",
  "Abrir mensajes": "Open messages",
  "Ningun favorito coincide con esos filtros": "No favorite matches those filters",
  "Prueba con otra categoria, cambia el orden o desactiva el filtro de chat activo.":
    "Try another category, change the order, or turn off the active chat filter.",
  "Cargar mas perfiles guardados": "Load more saved profiles",
  "Método de pago": "Payment method",
  "Metodo de pago": "Payment method",
  Orden: "Order",
  Billetera: "Wallet",
  "Pagar ahora": "Pay now",
  "Cancelando...": "Canceling...",
  "Procesando...": "Processing...",
  Continuar: "Continue",
  "No se pudo crear el pago": "The payment could not be created",
  "No se pudo cancelar el pago": "The payment could not be canceled",
  "Confirmación:": "Confirmation:",
  "Cliente:": "Client:",
  "Freelancer:": "Freelancer:",
  "Servicio:": "Service:",
  "Proyecto:": "Project:",
  "Presupuesto acordado:": "Agreed budget:",
  "Tu propuesta:": "Your proposal:",
  "Presupuesto cliente:": "Client budget:",
  "Conversacion activa con": "Active conversation with",
  "Conversación activa con": "Active conversation with",
  conversaciones: "conversations",
  conversacion: "conversation",
  conversación: "conversation",
  mensajes: "messages",
  usuario: "user",
  "Última respuesta": "Last response",
  "Aun no has publicado proyectos.": "You have not posted projects yet.",
  "Todavia no has guardado proyectos favoritos.": "You have not saved favorite projects yet.",
  "Aun no has enviado postulaciones.": "You have not sent applications yet.",
  "Publica, revisa perfiles, mueve proyectos entre estados y activa el chat cuando aceptes a alguien.":
    "Post, review profiles, move projects between statuses, and activate chat when you accept someone.",
  "Filtra oportunidades, recibe recomendaciones segun tu perfil y organiza tu pipeline de aplicaciones.":
    "Filter opportunities, receive recommendations based on your profile, and organize your application pipeline.",
};

const reverseTranslations = Object.fromEntries(Object.entries(translations).map(([es, en]) => [en, es]));
const sortedTranslationEntries = Object.entries(translations).sort(([left], [right]) => right.length - left.length);
const sortedReverseTranslationEntries = Object.entries(reverseTranslations).sort(([left], [right]) => right.length - left.length);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceKnownSegments = (value: string, dictionaryEntries: [string, string][]) =>
  dictionaryEntries.reduce((current, [source, target]) => {
      if (!source.trim()) return current;
      return current.replace(new RegExp(escapeRegExp(source), "g"), target);
    }, value);

const translateCore = (value: string, language: Language) => {
  const normalized = normalizeMojibake(value);
  const dictionary = language === "en" ? translations : reverseTranslations;
  const dictionaryEntries = language === "en" ? sortedTranslationEntries : sortedReverseTranslationEntries;
  return dictionary[normalized] ?? dictionary[value.trim()] ?? replaceKnownSegments(normalized, dictionaryEntries);
};

export const translateText = (value: string, language: Language) => {
  const normalized = normalizeMojibake(value);
  if (!normalized) return value;
  return translateCore(value, language);
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "es";
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => nativeAlert(typeof message === "string" ? translateText(message, language) : message);
    return () => {
      window.alert = nativeAlert;
    };
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "es" ? "en" : "es"),
      t: (text: string) => translateText(text, language),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
};

const translateNodeText = (node: Text, language: Language) => {
  const original = node.textContent ?? "";
  if (!original.trim()) return;
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  const core = original.trim();
  const nextCore = translateCore(core, language);
  if (nextCore !== core) node.textContent = `${leading}${nextCore}${trailing}`;
};

const translateElementAttributes = (element: Element, language: Language) => {
  ["placeholder", "title", "aria-label", "alt"].forEach((attribute) => {
    const value = element.getAttribute(attribute);
    if (!value) return;
    const nextValue = translateCore(value, language);
    if (nextValue !== value) element.setAttribute(attribute, nextValue);
  });
};

const translateTree = (root: ParentNode, language: Language) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  textNodes.forEach((node) => translateNodeText(node, language));
  if (root instanceof Element) translateElementAttributes(root, language);
  root.querySelectorAll?.("[placeholder], [title], [aria-label], [alt]").forEach((element) => translateElementAttributes(element, language));
};

export const AutoTranslate = () => {
  const { language } = useI18n();

  useEffect(() => {
    translateTree(document.body, language);
    let queuedNodes = new Set<Element | Text>();
    let frameId: number | null = null;

    const flushQueue = () => {
      const nodes = Array.from(queuedNodes);
      queuedNodes = new Set();
      frameId = null;

      nodes.forEach((node) => {
        if (node instanceof Text) translateNodeText(node, language);
        if (node instanceof Element) translateTree(node, language);
      });
    };

    const queueNode = (node: Node) => {
      if (node instanceof Text || node instanceof Element) {
        queuedNodes.add(node);
      }
      if (frameId === null) {
        frameId = window.requestAnimationFrame(flushQueue);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(queueNode);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [language]);

  return null;
};
