// ---------------------------------------------------------------
// textos da pagina inicial em cada idioma
// ---------------------------------------------------------------
// so a home e traduzida (o resto do site e o painel ficam em portugues).
// pra adicionar um idioma: incluir o codigo em Idioma, em IDIOMAS e um objeto novo em TEXTOS_HOME.
// o tipo TextosHome obriga todo idioma a ter as mesmas chaves, entao nenhum texto fica faltando.
//
// ficam fora de proposito: nome da marca (AJT Viagens), telefone, e-mail e endereco.

export type Idioma = 'pt' | 'en' | 'es';

// ordem das opcoes no seletor do cabecalho; "lang" vai pro <html lang> (leitor de tela, tradutor do navegador)
export const IDIOMAS: { codigo: Idioma; rotulo: string; nome: string; lang: string }[] = [
  { codigo: 'pt', rotulo: 'PT', nome: 'Português', lang: 'pt-BR' },
  { codigo: 'en', rotulo: 'EN', nome: 'English', lang: 'en' },
  { codigo: 'es', rotulo: 'ES', nome: 'Español', lang: 'es' },
];

const pt = {
  marcaSubtitulo: 'Viagens e Turismo',
  logoAlt: 'Logo AJT Viagens',
  seletorIdioma: 'Idioma do site',

  nav: {
    inicio: 'Início',
    sobre: 'Sobre',
    servicos: 'Serviços',
    porQue: 'Por que a AJT?',
    contato: 'Contato',
  },

  hero: {
    rotulo: 'AJT Viagens e Turismo',
    titulo: 'Conforto, segurança e experiências que tornam sua viagem',
    tituloDestaque: 'inesquecível',
    texto: 'Transporte turístico e atendimento personalizado para quem quer aproveitar Foz do Iguaçu com tranquilidade do início ao fim.',
    botaoServicos: 'Conheça nossos serviços',
    botaoContato: 'Fale com a AJT',
  },

  sobre: {
    rotulo: 'Sobre a AJT',
    titulo: 'Mais do que transporte: cuidado em cada trajeto',
    texto1: 'A AJT Viagens e Turismo atua para oferecer deslocamentos seguros, confortáveis e organizados para visitantes, famílias, grupos e empresas.',
    texto2: 'Nosso compromisso é proporcionar uma experiência tranquila desde a chegada até o último destino, com atendimento próximo e atenção aos detalhes.',
    cards: [
      { titulo: 'Segurança', texto: 'Transporte realizado com cuidado e responsabilidade.' },
      { titulo: 'Conforto', texto: 'Uma experiência pensada para tornar cada trajeto agradável.' },
      { titulo: 'Pontualidade', texto: 'Organização para você aproveitar melhor o seu tempo.' },
      { titulo: 'Atendimento', texto: 'Suporte próximo e personalizado durante sua experiência.' },
    ],
  },

  servicos: {
    rotulo: 'Nossos serviços',
    titulo: 'Soluções para diferentes momentos da sua viagem',
    texto: 'Escolha a opção que combina com sua necessidade e tenha uma experiência mais tranquila em Foz do Iguaçu e região.',
    verDetalhes: 'Ver detalhes →',
    transfers: { titulo: 'Transfers', texto: 'Transporte entre aeroporto, hotel e principais pontos da cidade.' },
    passeios: { titulo: 'Passeios', texto: 'Experiências e roteiros para conhecer os principais atrativos da região.' },
    executivo: { titulo: 'Transporte Executivo', texto: 'Atendimento personalizado para viagens corporativas e privativas.' },
    grupos: { titulo: 'Grupos e Excursões', texto: 'Soluções para grupos, eventos, excursões e roteiros especiais.' },
  },

  diferenciais: {
    rotulo: 'Por que escolher a AJT?',
    titulo: 'Sua viagem merece atenção em cada detalhe',
    cards: [
      { titulo: 'Atendimento personalizado', texto: 'Cada viagem tem necessidades diferentes. Nosso atendimento busca entender exatamente o que você precisa.' },
      { titulo: 'Experiência local', texto: 'Conhecimento da região para tornar os deslocamentos mais organizados e sua experiência mais tranquila.' },
      { titulo: 'Praticidade', texto: 'Uma solução para você se preocupar menos com transporte e aproveitar mais cada momento da viagem.' },
    ],
  },

  contato: {
    rotulo: 'Contato',
    titulo: 'Fale com a AJT',
    texto: 'Entre em contato para informações, reservas e atendimento. Nossa equipe está pronta para ajudar você a organizar sua viagem.',
    telefone: 'Telefone e WhatsApp',
    email: 'E-mail',
    endereco: 'Endereço',
    botaoWhatsapp: 'Falar pelo WhatsApp',
    acaoTelefone: 'Ligar',
    acaoEmail: 'Enviar e-mail',
    acaoEndereco: 'Ver no mapa',
  },

  rodape: {
    marca: 'AJT Viagens e Turismo',
    navegacao: 'Navegação',
    botaoAdmin: 'Acessar Admin',
    direitos: '© 2026 AJT Viagens e Turismo.',
  },
};

export type TextosHome = typeof pt;

const en: TextosHome = {
  marcaSubtitulo: 'Travel & Tourism',
  logoAlt: 'AJT Viagens logo',
  seletorIdioma: 'Site language',

  nav: {
    inicio: 'Home',
    sobre: 'About',
    servicos: 'Services',
    porQue: 'Why AJT?',
    contato: 'Contact',
  },

  hero: {
    rotulo: 'AJT Travel & Tourism',
    titulo: 'Comfort, safety and experiences that make your trip',
    tituloDestaque: 'unforgettable',
    texto: 'Tourist transportation and personalized service for those who want to enjoy Foz do Iguaçu with peace of mind from start to finish.',
    botaoServicos: 'Explore our services',
    botaoContato: 'Talk to AJT',
  },

  sobre: {
    rotulo: 'About AJT',
    titulo: 'More than transportation: care on every ride',
    texto1: 'AJT Travel & Tourism provides safe, comfortable and well-organized transportation for visitors, families, groups and companies.',
    texto2: 'Our commitment is to deliver a smooth experience from your arrival to your final destination, with close support and attention to detail.',
    cards: [
      { titulo: 'Safety', texto: 'Transportation carried out with care and responsibility.' },
      { titulo: 'Comfort', texto: 'An experience designed to make every ride enjoyable.' },
      { titulo: 'Punctuality', texto: 'Careful planning so you can make the most of your time.' },
      { titulo: 'Service', texto: 'Close, personalized support throughout your experience.' },
    ],
  },

  servicos: {
    rotulo: 'Our services',
    titulo: 'Solutions for every moment of your trip',
    texto: 'Choose the option that fits your needs and enjoy a smoother experience in Foz do Iguaçu and the surrounding region.',
    verDetalhes: 'See details →',
    transfers: { titulo: 'Transfers', texto: 'Transportation between the airport, your hotel and the main spots in the city.' },
    passeios: { titulo: 'Tours', texto: 'Experiences and itineraries to discover the main attractions of the region.' },
    executivo: { titulo: 'Executive Transportation', texto: 'Personalized service for corporate and private trips.' },
    grupos: { titulo: 'Groups & Excursions', texto: 'Solutions for groups, events, excursions and special itineraries.' },
  },

  diferenciais: {
    rotulo: 'Why choose AJT?',
    titulo: 'Your trip deserves attention to every detail',
    cards: [
      { titulo: 'Personalized service', texto: 'Every trip has different needs. We work to understand exactly what you need.' },
      { titulo: 'Local expertise', texto: 'Knowledge of the region to make your rides more organized and your experience more relaxed.' },
      { titulo: 'Convenience', texto: 'A solution that lets you worry less about transportation and enjoy every moment of your trip.' },
    ],
  },

  contato: {
    rotulo: 'Contact',
    titulo: 'Talk to AJT',
    texto: 'Get in touch for information, bookings and support. Our team is ready to help you plan your trip.',
    telefone: 'Phone & WhatsApp',
    email: 'Email',
    endereco: 'Address',
    botaoWhatsapp: 'Chat on WhatsApp',
    acaoTelefone: 'Call',
    acaoEmail: 'Send an email',
    acaoEndereco: 'View on map',
  },

  rodape: {
    marca: 'AJT Travel & Tourism',
    navegacao: 'Navigation',
    botaoAdmin: 'Admin access',
    direitos: '© 2026 AJT Travel & Tourism.',
  },
};

const es: TextosHome = {
  marcaSubtitulo: 'Viajes y Turismo',
  logoAlt: 'Logo de AJT Viagens',
  seletorIdioma: 'Idioma del sitio',

  nav: {
    inicio: 'Inicio',
    sobre: 'Nosotros',
    servicos: 'Servicios',
    porQue: '¿Por qué AJT?',
    contato: 'Contacto',
  },

  hero: {
    rotulo: 'AJT Viajes y Turismo',
    titulo: 'Comodidad, seguridad y experiencias que hacen tu viaje',
    tituloDestaque: 'inolvidable',
    texto: 'Transporte turístico y atención personalizada para quienes quieren disfrutar Foz do Iguaçu con tranquilidad de principio a fin.',
    botaoServicos: 'Conoce nuestros servicios',
    botaoContato: 'Habla con AJT',
  },

  sobre: {
    rotulo: 'Sobre AJT',
    titulo: 'Más que transporte: cuidado en cada trayecto',
    texto1: 'AJT Viajes y Turismo ofrece traslados seguros, cómodos y organizados para visitantes, familias, grupos y empresas.',
    texto2: 'Nuestro compromiso es brindarte una experiencia tranquila desde tu llegada hasta el último destino, con atención cercana y cuidado en cada detalle.',
    cards: [
      { titulo: 'Seguridad', texto: 'Transporte realizado con cuidado y responsabilidad.' },
      { titulo: 'Comodidad', texto: 'Una experiencia pensada para que cada trayecto sea agradable.' },
      { titulo: 'Puntualidad', texto: 'Organización para que aproveches mejor tu tiempo.' },
      { titulo: 'Atención', texto: 'Soporte cercano y personalizado durante toda tu experiencia.' },
    ],
  },

  servicos: {
    rotulo: 'Nuestros servicios',
    titulo: 'Soluciones para cada momento de tu viaje',
    texto: 'Elige la opción que mejor se adapte a lo que necesitas y vive una experiencia más tranquila en Foz do Iguaçu y la región.',
    verDetalhes: 'Ver detalles →',
    transfers: { titulo: 'Traslados', texto: 'Transporte entre el aeropuerto, el hotel y los principales puntos de la ciudad.' },
    passeios: { titulo: 'Paseos', texto: 'Experiencias y recorridos para conocer los principales atractivos de la región.' },
    executivo: { titulo: 'Transporte Ejecutivo', texto: 'Atención personalizada para viajes corporativos y privados.' },
    grupos: { titulo: 'Grupos y Excursiones', texto: 'Soluciones para grupos, eventos, excursiones y recorridos especiales.' },
  },

  diferenciais: {
    rotulo: '¿Por qué elegir AJT?',
    titulo: 'Tu viaje merece atención en cada detalle',
    cards: [
      { titulo: 'Atención personalizada', texto: 'Cada viaje tiene necesidades distintas. Buscamos entender exactamente lo que necesitas.' },
      { titulo: 'Experiencia local', texto: 'Conocimiento de la región para que tus traslados sean más organizados y tu experiencia más tranquila.' },
      { titulo: 'Practicidad', texto: 'Una solución para que te preocupes menos por el transporte y disfrutes más cada momento del viaje.' },
    ],
  },

  contato: {
    rotulo: 'Contacto',
    titulo: 'Habla con AJT',
    texto: 'Contáctanos para información, reservas y atención. Nuestro equipo está listo para ayudarte a organizar tu viaje.',
    telefone: 'Teléfono y WhatsApp',
    email: 'Correo electrónico',
    endereco: 'Dirección',
    botaoWhatsapp: 'Escribir por WhatsApp',
    acaoTelefone: 'Llamar',
    acaoEmail: 'Enviar correo',
    acaoEndereco: 'Ver en el mapa',
  },

  rodape: {
    marca: 'AJT Viajes y Turismo',
    navegacao: 'Navegación',
    botaoAdmin: 'Acceso de administración',
    direitos: '© 2026 AJT Viajes y Turismo.',
  },
};

export const TEXTOS_HOME: Record<Idioma, TextosHome> = { pt, en, es };
