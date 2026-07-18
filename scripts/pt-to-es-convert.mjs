/** Multi-word / phrase replacements (PT → ES), longest first. */
const PHRASES = [
  ['Bem-vindo', 'Bienvenido'],
  ['Bem-vinda', 'Bienvenida'],
  ['Bem-vindos', 'Bienvenidos'],
  ['Bem-vindas', 'Bienvenidas'],
  ['palavra-passe', 'contraseña'],
  ['Palavra-passe', 'Contraseña'],
  ['e-mail', 'correo'],
  ['E-mail', 'Correo'],
  ['email', 'correo'],
  ['Email', 'Correo'],
  ['telemóvel', 'móvil'],
  ['Telemóvel', 'Móvil'],
  ['telefone', 'teléfono'],
  ['Telefone', 'Teléfono'],
  ['utilizador', 'usuario'],
  ['Utilizador', 'Usuario'],
  ['utilizadores', 'usuarios'],
  ['Utilizadores', 'Usuarios'],
  ['utilizadora', 'usuaria'],
  ['palavra', 'palabra'],
  ['Palavra', 'Palabra'],
  ['definições', 'ajustes'],
  ['Definições', 'Ajustes'],
  ['definição', 'definición'],
  ['Definição', 'Definición'],
  ['encomenda', 'envío'],
  ['Encomenda', 'Envío'],
  ['encomendas', 'envíos'],
  ['Encomendas', 'Envíos'],
  ['transferência', 'transferencia'],
  ['Transferência', 'Transferencia'],
  ['transferências', 'transferencias'],
  ['Transferências', 'Transferencias'],
  ['anúncio', 'anuncio'],
  ['Anúncio', 'Anuncio'],
  ['anúncios', 'anuncios'],
  ['Anúncios', 'Anuncios'],
  ['publicação', 'publicación'],
  ['Publicação', 'Publicación'],
  ['publicações', 'publicaciones'],
  ['Publicações', 'Publicaciones'],
  ['mensagem', 'mensaje'],
  ['Mensagem', 'Mensaje'],
  ['mensagens', 'mensajes'],
  ['Mensagens', 'Mensajes'],
  ['conversa', 'conversación'],
  ['Conversa', 'Conversación'],
  ['conversas', 'conversaciones'],
  ['Conversas', 'Conversaciones'],
  ['notificação', 'notificación'],
  ['Notificação', 'Notificación'],
  ['notificações', 'notificaciones'],
  ['Notificações', 'Notificaciones'],
  ['subscrição', 'suscripción'],
  ['Subscrição', 'Suscripción'],
  ['subscrições', 'suscripciones'],
  ['Subscrições', 'Suscripciones'],
  ['favorito', 'favorito'],
  ['Favorito', 'Favorito'],
  ['favoritos', 'favoritos'],
  ['Favoritos', 'Favoritos'],
  ['empresa', 'empresa'],
  ['Empresa', 'Empresa'],
  ['empresas', 'empresas'],
  ['Empresas', 'Empresas'],
  ['emprego', 'empleo'],
  ['Emprego', 'Empleo'],
  ['empregos', 'empleos'],
  ['Empregos', 'Empleos'],
  ['evento', 'evento'],
  ['Evento', 'Evento'],
  ['eventos', 'eventos'],
  ['Eventos', 'Eventos'],
  ['notícia', 'noticia'],
  ['Notícia', 'Noticia'],
  ['notícias', 'noticias'],
  ['Notícias', 'Noticias'],
  ['atualidade', 'actualidad'],
  ['Atualidade', 'Actualidad'],
  ['pesquisa', 'búsqueda'],
  ['Pesquisa', 'Búsqueda'],
  ['pesquisar', 'buscar'],
  ['Pesquisar', 'Buscar'],
  ['guardar', 'guardar'],
  ['Guardar', 'Guardar'],
  ['eliminar', 'eliminar'],
  ['Eliminar', 'Eliminar'],
  ['apagar', 'borrar'],
  ['Apagar', 'Borrar'],
  ['editar', 'editar'],
  ['Editar', 'Editar'],
  ['criar', 'crear'],
  ['Criar', 'Crear'],
  ['publicar', 'publicar'],
  ['Publicar', 'Publicar'],
  ['enviar', 'enviar'],
  ['Enviar', 'Enviar'],
  ['receber', 'recibir'],
  ['Receber', 'Recibir'],
  ['aceitar', 'aceptar'],
  ['Aceitar', 'Aceptar'],
  ['recusar', 'rechazar'],
  ['Recusar', 'Rechazar'],
  ['rejeitar', 'rechazar'],
  ['Rejeitar', 'Rechazar'],
  ['cancelar', 'cancelar'],
  ['Cancelar', 'Cancelar'],
  ['confirmar', 'confirmar'],
  ['Confirmar', 'Confirmar'],
  ['continuar', 'continuar'],
  ['Continuar', 'Continuar'],
  ['voltar', 'volver'],
  ['Voltar', 'Volver'],
  ['retorno', 'retorno'],
  ['Retorno', 'Retorno'],
  ['seguinte', 'siguiente'],
  ['Seguinte', 'Siguiente'],
  ['anterior', 'anterior'],
  ['Anterior', 'Anterior'],
  ['próximo', 'próximo'],
  ['Próximo', 'Próximo'],
  ['próxima', 'próxima'],
  ['Próxima', 'Próxima'],
  ['obrigatório', 'obligatorio'],
  ['Obrigatório', 'Obligatorio'],
  ['obrigatória', 'obligatoria'],
  ['opcional', 'opcional'],
  ['Opcional', 'Opcional'],
  ['disponível', 'disponible'],
  ['Disponível', 'Disponible'],
  ['disponíveis', 'disponibles'],
  ['Disponíveis', 'Disponibles'],
  ['indisponível', 'no disponible'],
  ['verificado', 'verificado'],
  ['Verificado', 'Verificado'],
  ['verificada', 'verificada'],
  ['Verificada', 'Verificada'],
  ['verificar', 'verificar'],
  ['Verificar', 'Verificar'],
  ['identidade', 'identidad'],
  ['Identidade', 'Identidad'],
  ['segurança', 'seguridad'],
  ['Segurança', 'Seguridad'],
  ['palavra', 'palabra'],
  ['palavra-passe', 'contraseña'],
  ['palavra passe', 'contraseña'],
  ['conta', 'cuenta'],
  ['Conta', 'Cuenta'],
  ['contas', 'cuentas'],
  ['Contas', 'Cuentas'],
  ['perfil', 'perfil'],
  ['Perfil', 'Perfil'],
  ['perfis', 'perfiles'],
  ['Perfis', 'Perfiles'],
  ['administração', 'administración'],
  ['Administração', 'Administración'],
  ['administrador', 'administrador'],
  ['Administrador', 'Administrador'],
  ['comunidade', 'comunidad'],
  ['Comunidade', 'Comunidad'],
  ['comunicação', 'comunicación'],
  ['Comunicação', 'Comunicación'],
  ['serviço', 'servicio'],
  ['Serviço', 'Servicio'],
  ['serviços', 'servicios'],
  ['Serviços', 'Servicios'],
  ['espaço', 'espacio'],
  ['Espaço', 'Espacio'],
  ['profissional', 'profesional'],
  ['Profissional', 'Profesional'],
  ['profissionais', 'profesionales'],
  ['Profissionais', 'Profesionales'],
  ['candidato', 'candidato'],
  ['Candidato', 'Candidato'],
  ['candidatura', 'candidatura'],
  ['Candidatura', 'Candidatura'],
  ['candidaturas', 'candidaturas'],
  ['Candidaturas', 'Candidaturas'],
  ['missão', 'misión'],
  ['Missão', 'Misión'],
  ['missões', 'misiones'],
  ['Missões', 'Misiones'],
  ['oportunidade', 'oportunidad'],
  ['Oportunidade', 'Oportunidad'],
  ['oportunidades', 'oportunidades'],
  ['Oportunidades', 'Oportunidades'],
  ['descrição', 'descripción'],
  ['Descrição', 'Descripción'],
  ['título', 'título'],
  ['Título', 'Título'],
  ['categoria', 'categoría'],
  ['Categoria', 'Categoría'],
  ['categorias', 'categorías'],
  ['Categorias', 'Categorías'],
  ['cidade', 'ciudad'],
  ['Cidade', 'Ciudad'],
  ['cidades', 'ciudades'],
  ['Cidades', 'Ciudades'],
  ['país', 'país'],
  ['País', 'País'],
  ['países', 'países'],
  ['Países', 'Países'],
  ['morada', 'dirección'],
  ['Morada', 'Dirección'],
  ['endereço', 'dirección'],
  ['Endereço', 'Dirección'],
  ['endereços', 'direcciones'],
  ['Endereços', 'Direcciones'],
  ['documento', 'documento'],
  ['Documento', 'Documento'],
  ['documentos', 'documentos'],
  ['Documentos', 'Documentos'],
  ['recibo', 'recibo'],
  ['Recibo', 'Recibo'],
  ['recibos', 'recibos'],
  ['Recibos', 'Recibos'],
  ['reclamação', 'reclamación'],
  ['Reclamação', 'Reclamación'],
  ['reclamações', 'reclamaciones'],
  ['Reclamações', 'Reclamaciones'],
  ['disputa', 'disputa'],
  ['Disputa', 'Disputa'],
  ['disputas', 'disputas'],
  ['Disputas', 'Disputas'],
  ['suporte', 'soporte'],
  ['Suporte', 'Soporte'],
  ['ajuda', 'ayuda'],
  ['Ajuda', 'Ayuda'],
  ['carteira', 'monedero'],
  ['Carteira', 'Monedero'],
  ['saldo', 'saldo'],
  ['Saldo', 'Saldo'],
  ['pagamento', 'pago'],
  ['Pagamento', 'Pago'],
  ['pagamentos', 'pagos'],
  ['Pagamentos', 'Pagos'],
  ['montante', 'importe'],
  ['Montante', 'Importe'],
  ['quantidade', 'cantidad'],
  ['Quantidade', 'Cantidad'],
  ['preço', 'precio'],
  ['Preço', 'Precio'],
  ['preços', 'precios'],
  ['Preços', 'Precios'],
  ['taxa', 'tasa'],
  ['Taxa', 'Tasa'],
  ['taxas', 'tasas'],
  ['Taxas', 'Tasas'],
  ['moeda', 'moneda'],
  ['Moeda', 'Moneda'],
  ['moedas', 'monedas'],
  ['Moedas', 'Monedas'],
  ['câmbio', 'cambio'],
  ['Câmbio', 'Cambio'],
  ['câmbios', 'cambios'],
  ['Câmbios', 'Cambios'],
  ['cambista', 'cambista'],
  ['Cambista', 'Cambista'],
  ['cambistas', 'cambistas'],
  ['Cambistas', 'Cambistas'],
  ['troca', 'intercambio'],
  ['Troca', 'Intercambio'],
  ['trocas', 'intercambios'],
  ['Trocas', 'Intercambios'],
  ['oferta', 'oferta'],
  ['Oferta', 'Oferta'],
  ['ofertas', 'ofertas'],
  ['Ofertas', 'Ofertas'],
  ['pedido', 'pedido'],
  ['Pedido', 'Pedido'],
  ['pedidos', 'pedidos'],
  ['Pedidos', 'Pedidos'],
  ['pedido', 'solicitud'],
  ['viagem', 'viaje'],
  ['Viagem', 'Viaje'],
  ['viagens', 'viajes'],
  ['Viagens', 'Viajes'],
  ['viajante', 'viajero'],
  ['Viajante', 'Viajero'],
  ['viajantes', 'viajeros'],
  ['Viajantes', 'Viajeros'],
  ['quilo', 'kilo'],
  ['Quilo', 'Kilo'],
  ['quilos', 'kilos'],
  ['Quilos', 'Kilos'],
  ['disponibilidade', 'disponibilidad'],
  ['Disponibilidade', 'Disponibilidad'],
  ['localização', 'ubicación'],
  ['Localização', 'Ubicación'],
  ['localizações', 'ubicaciones'],
  ['Localizações', 'Ubicaciones'],
  ['estado', 'estado'],
  ['Estado', 'Estado'],
  ['estados', 'estados'],
  ['Estados', 'Estados'],
  ['estado', 'condición'],
  ['histórico', 'historial'],
  ['Histórico', 'Historial'],
  ['atividade', 'actividad'],
  ['Atividade', 'Actividad'],
  ['atividades', 'actividades'],
  ['Atividades', 'Actividades'],
  ['ação', 'acción'],
  ['Ação', 'Acción'],
  ['ações', 'acciones'],
  ['Ações', 'Acciones'],
  ['rápida', 'rápida'],
  ['rápido', 'rápido'],
  ['Rápida', 'Rápida'],
  ['Rápido', 'Rápido'],
  ['essencial', 'esencial'],
  ['Essencial', 'Esencial'],
  ['essenciais', 'esenciales'],
  ['Essenciais', 'Esenciales'],
  ['descobrir', 'descubrir'],
  ['Descobrir', 'Descubrir'],
  ['explorar', 'explorar'],
  ['Explorar', 'Explorar'],
  ['gerir', 'gestionar'],
  ['Gerir', 'Gestionar'],
  ['gestão', 'gestión'],
  ['Gestão', 'Gestión'],
  ['acompanhar', 'seguir'],
  ['Acompanhar', 'Seguir'],
  ['acompanhamento', 'seguimiento'],
  ['Acompanhamento', 'Seguimiento'],
  ['seguimento', 'seguimiento'],
  ['Seguimento', 'Seguimiento'],
  ['pendente', 'pendiente'],
  ['Pendente', 'Pendiente'],
  ['pendentes', 'pendientes'],
  ['Pendentes', 'Pendientes'],
  ['concluído', 'completado'],
  ['Concluído', 'Completado'],
  ['concluída', 'completada'],
  ['Concluída', 'Completada'],
  ['em curso', 'en curso'],
  ['Em curso', 'En curso'],
  ['em andamento', 'en curso'],
  ['Em andamento', 'En curso'],
  ['hoje', 'hoy'],
  ['Hoje', 'Hoy'],
  ['ontem', 'ayer'],
  ['Ontem', 'Ayer'],
  ['amanhã', 'mañana'],
  ['Amanhã', 'Mañana'],
  ['agora', 'ahora'],
  ['Agora', 'Ahora'],
  ['já', 'ya'],
  ['Já', 'Ya'],
  ['ainda', 'aún'],
  ['Ainda', 'Aún'],
  ['também', 'también'],
  ['Também', 'También'],
  ['apenas', 'solo'],
  ['Apenas', 'Solo'],
  ['somente', 'solo'],
  ['Somente', 'Solo'],
  ['nenhum', 'ningún'],
  ['Nenhum', 'Ningún'],
  ['nenhuma', 'ninguna'],
  ['Nenhuma', 'Ninguna'],
  ['nenhuns', 'ningunos'],
  ['nenhumas', 'ningunas'],
  ['todos', 'todos'],
  ['Todos', 'Todos'],
  ['todas', 'todas'],
  ['Todas', 'Todas'],
  ['tudo', 'todo'],
  ['Tudo', 'Todo'],
  ['mais', 'más'],
  ['Mais', 'Más'],
  ['menos', 'menos'],
  ['Menos', 'Menos'],
  ['ou', 'o'],
  ['e ', 'y '],
  [' E ', ' Y '],
  ['com ', 'con '],
  ['Com ', 'Con '],
  ['sem ', 'sin '],
  ['Sem ', 'Sin '],
  ['para ', 'para '],
  ['Para ', 'Para '],
  ['por ', 'por '],
  ['Por ', 'Por '],
  ['de ', 'de '],
  ['da ', 'de la '],
  ['do ', 'del '],
  ['das ', 'de las '],
  ['dos ', 'de los '],
  ['na ', 'en la '],
  ['no ', 'en el '],
  ['nas ', 'en las '],
  ['nos ', 'en los '],
  ['em ', 'en '],
  ['Em ', 'En '],
  ['ao ', 'al '],
  ['à ', 'a la '],
  ['às ', 'a las '],
  ['aos ', 'a los '],
  ['seu ', 'su '],
  ['Seu ', 'Su '],
  ['sua ', 'su '],
  ['Sua ', 'Su '],
  ['seus ', 'sus '],
  ['Seus ', 'Sus '],
  ['suas ', 'sus '],
  ['Suas ', 'Sus '],
  ['meu ', 'mi '],
  ['Meu ', 'Mi '],
  ['minha ', 'mi '],
  ['Minha ', 'Mi '],
  ['meus ', 'mis '],
  ['Meus ', 'Mis '],
  ['minhas ', 'mis '],
  ['Minhas ', 'Mis '],
  ['nosso ', 'nuestro '],
  ['Nosso ', 'Nuestro '],
  ['nossa ', 'nuestra '],
  ['Nossa ', 'Nuestra '],
  ['nossos ', 'nuestros '],
  ['Nossos ', 'Nuestros '],
  ['nossas ', 'nuestras '],
  ['Nossas ', 'Nuestras '],
  ['este ', 'este '],
  ['esta ', 'esta '],
  ['estes ', 'estos '],
  ['estas ', 'estas '],
  ['esse ', 'ese '],
  ['essa ', 'esa '],
  ['esses ', 'esos '],
  ['essas ', 'esas '],
  ['aquele ', 'aquel '],
  ['aquela ', 'aquella '],
  ['aqueles ', 'aquellos '],
  ['aquelas ', 'aquellas '],
  ['aqui', 'aquí'],
  ['Aqui', 'Aquí'],
  ['ali', 'allí'],
  ['Ali', 'Allí'],
  ['onde', 'dónde'],
  ['Onde', 'Dónde'],
  ['quando', 'cuándo'],
  ['Quando', 'Cuándo'],
  ['como', 'cómo'],
  ['Como', 'Cómo'],
  ['porque', 'porque'],
  ['Porque', 'Porque'],
  ['não', 'no'],
  ['Não', 'No'],
  ['sim', 'sí'],
  ['Sim', 'Sí'],
  ['ou ', 'o '],
  [' Ou ', ' O '],
  ['mas ', 'pero '],
  ['Mas ', 'Pero '],
  ['se ', 'si '],
  ['Se ', 'Si '],
  ['que ', 'que '],
  ['Que ', 'Que '],
  ['qual ', 'cuál '],
  ['Qual ', 'Cuál '],
  ['quais ', 'cuáles '],
  ['Quais ', 'Cuáles '],
  ['quem ', 'quién '],
  ['Quem ', 'Quién '],
  ['muito ', 'muy '],
  ['Muito ', 'Muy '],
  ['muita ', 'mucha '],
  ['Muita ', 'Mucha '],
  ['muitos ', 'muchos '],
  ['Muitos ', 'Muchos '],
  ['muitas ', 'muchas '],
  ['Muitas ', 'Muchas '],
  ['pouco ', 'poco '],
  ['Pouco ', 'Poco '],
  ['pouca ', 'poca '],
  ['Pouca ', 'Poca '],
  ['poucos ', 'pocos '],
  ['Poucos ', 'Pocos '],
  ['poucas ', 'pocas '],
  ['Poucas ', 'Pocas '],
  ['outro ', 'otro '],
  ['Outro ', 'Otro '],
  ['outra ', 'otra '],
  ['Outra ', 'Otra '],
  ['outros ', 'otros '],
  ['Outros ', 'Otros '],
  ['outras ', 'otras '],
  ['Outras ', 'Otras '],
  ['novo ', 'nuevo '],
  ['Novo ', 'Nuevo '],
  ['nova ', 'nueva '],
  ['Nova ', 'Nueva '],
  ['novos ', 'nuevos '],
  ['Novos ', 'Nuevos '],
  ['novas ', 'nuevas '],
  ['Novas ', 'Nuevas '],
  ['primeiro ', 'primer '],
  ['Primeiro ', 'Primer '],
  ['primeira ', 'primera '],
  ['Primeira ', 'Primera '],
  ['último ', 'último '],
  ['Último ', 'Último '],
  ['última ', 'última '],
  ['Última ', 'Última '],
  ['últimos ', 'últimos '],
  ['Últimos ', 'Últimos '],
  ['últimas ', 'últimas '],
  ['Últimas ', 'Últimas '],
  ['recente ', 'reciente '],
  ['Recente ', 'Reciente '],
  ['recentes ', 'recientes '],
  ['Recentes ', 'Recientes '],
  ['atual ', 'actual '],
  ['Atual ', 'Actual '],
  ['atuais ', 'actuales '],
  ['Atuais ', 'Actuales '],
  ['atualizado', 'actualizado'],
  ['Atualizado', 'Actualizado'],
  ['atualizada', 'actualizada'],
  ['Atualizada', 'Actualizada'],
  ['atualizar', 'actualizar'],
  ['Atualizar', 'Actualizar'],
  ['carregar', 'cargar'],
  ['Carregar', 'Cargar'],
  ['carregando', 'cargando'],
  ['Carregando', 'Cargando'],
  ['A carregar', 'Cargando'],
  ['a carregar', 'cargando'],
  ['erro', 'error'],
  ['Erro', 'Error'],
  ['erros', 'errores'],
  ['Erros', 'Errores'],
  ['sucesso', 'éxito'],
  ['Sucesso', 'Éxito'],
  ['falha', 'fallo'],
  ['Falha', 'Fallo'],
  ['falhou', 'falló'],
  ['Falhou', 'Falló'],
  ['tente novamente', 'inténtelo de nuevo'],
  ['Tente novamente', 'Inténtelo de nuevo'],
  ['tente outra vez', 'inténtelo de nuevo'],
  ['obrigado', 'gracias'],
  ['Obrigado', 'Gracias'],
  ['obrigada', 'gracias'],
  ['Obrigada', 'Gracias'],
  ['por favor', 'por favor'],
  ['Por favor', 'Por favor'],
  ['atenção', 'atención'],
  ['Atenção', 'Atención'],
  ['aviso', 'aviso'],
  ['Aviso', 'Aviso'],
  ['informação', 'información'],
  ['Informação', 'Información'],
  ['informações', 'información'],
  ['Informações', 'Información'],
  ['detalhe', 'detalle'],
  ['Detalhe', 'Detalle'],
  ['detalhes', 'detalles'],
  ['Detalhes', 'Detalles'],
  ['resumo', 'resumen'],
  ['Resumo', 'Resumen'],
  ['resultado', 'resultado'],
  ['Resultado', 'Resultado'],
  ['resultados', 'resultados'],
  ['Resultados', 'Resultados'],
  ['filtro', 'filtro'],
  ['Filtro', 'Filtro'],
  ['filtros', 'filtros'],
  ['Filtros', 'Filtros'],
  ['ordenar', 'ordenar'],
  ['Ordenar', 'Ordenar'],
  ['classificar', 'clasificar'],
  ['Classificar', 'Clasificar'],
  ['selecionar', 'seleccionar'],
  ['Selecionar', 'Seleccionar'],
  ['selecionado', 'seleccionado'],
  ['Selecionado', 'Seleccionado'],
  ['escolha', 'elección'],
  ['Escolha', 'Elección'],
  ['escolher', 'elegir'],
  ['Escolher', 'Elegir'],
  ['adicionar', 'añadir'],
  ['Adicionar', 'Añadir'],
  ['remover', 'quitar'],
  ['Remover', 'Quitar'],
  ['retirar', 'retirar'],
  ['Retirar', 'Retirar'],
  ['partilhar', 'compartir'],
  ['Partilhar', 'Compartir'],
  ['partilha', 'compartir'],
  ['Partilha', 'Compartir'],
  ['convidar', 'invitar'],
  ['Convidar', 'Invitar'],
  ['convite', 'invitación'],
  ['Convite', 'Invitación'],
  ['convites', 'invitaciones'],
  ['Convites', 'Invitaciones'],
  ['ligação', 'enlace'],
  ['Ligação', 'Enlace'],
  ['ligações', 'enlaces'],
  ['Ligações', 'Enlaces'],
  ['link', 'enlace'],
  ['Link', 'Enlace'],
  ['copiar', 'copiar'],
  ['Copiar', 'Copiar'],
  ['copiado', 'copiado'],
  ['Copiado', 'Copiado'],
  ['abrir', 'abrir'],
  ['Abrir', 'Abrir'],
  ['fechar', 'cerrar'],
  ['Fechar', 'Cerrar'],
  ['mostrar', 'mostrar'],
  ['Mostrar', 'Mostrar'],
  ['ocultar', 'ocultar'],
  ['Ocultar', 'Ocultar'],
  ['esconder', 'ocultar'],
  ['Esconder', 'Ocultar'],
  ['ver ', 'ver '],
  ['Ver ', 'Ver '],
  ['vista', 'vista'],
  ['Vista', 'Vista'],
  ['vistas', 'vistas'],
  ['Vistas', 'Vistas'],
  ['ler ', 'leer '],
  ['Ler ', 'Leer '],
  ['lido', 'leído'],
  ['Lido', 'Leído'],
  ['lida', 'leída'],
  ['Lida', 'Leída'],
  ['não lido', 'no leído'],
  ['Não lido', 'No leído'],
  ['não lidos', 'no leídos'],
  ['Não lidos', 'No leídos'],
  ['não lidas', 'no leídas'],
  ['Não lidas', 'No leídas'],
  ['arquivar', 'archivar'],
  ['Arquivar', 'Archivar'],
  ['arquivo', 'archivo'],
  ['Arquivo', 'Archivo'],
  ['arquivos', 'archivos'],
  ['Arquivos', 'Archivos'],
  ['silenciar', 'silenciar'],
  ['Silenciar', 'Silenciar'],
  ['fixar', 'fijar'],
  ['Fixar', 'Fijar'],
  ['fixado', 'fijado'],
  ['Fixado', 'Fijado'],
  ['bloquear', 'bloquear'],
  ['Bloquear', 'Bloquear'],
  ['desbloquear', 'desbloquear'],
  ['Desbloquear', 'Desbloquear'],
  ['denunciar', 'denunciar'],
  ['Denunciar', 'Denunciar'],
  ['denúncia', 'denuncia'],
  ['Denúncia', 'Denuncia'],
  ['responder', 'responder'],
  ['Responder', 'Responder'],
  ['resposta', 'respuesta'],
  ['Resposta', 'Respuesta'],
  ['respostas', 'respuestas'],
  ['Respostas', 'Respuestas'],
  ['comentário', 'comentario'],
  ['Comentário', 'Comentario'],
  ['comentários', 'comentarios'],
  ['Comentários', 'Comentarios'],
  ['avaliação', 'valoración'],
  ['Avaliação', 'Valoración'],
  ['avaliações', 'valoraciones'],
  ['Avaliações', 'Valoraciones'],
  ['classificação', 'calificación'],
  ['Classificação', 'Calificación'],
  ['opinião', 'opinión'],
  ['Opinião', 'Opinión'],
  ['opiniões', 'opiniones'],
  ['Opiniões', 'Opiniones'],
  ['contacto', 'contacto'],
  ['Contacto', 'Contacto'],
  ['contactos', 'contactos'],
  ['Contactos', 'Contactos'],
  ['contactar', 'contactar'],
  ['Contactar', 'Contactar'],
  ['telefone', 'teléfono'],
  ['Telefone', 'Teléfono'],
  ['telemóvel', 'móvil'],
  ['Telemóvel', 'Móvil'],
  ['palavra-passe', 'contraseña'],
  ['iniciar sessão', 'iniciar sesión'],
  ['Iniciar sessão', 'Iniciar sesión'],
  ['terminar sessão', 'cerrar sesión'],
  ['Terminar sessão', 'Cerrar sesión'],
  ['sessão', 'sesión'],
  ['Sessão', 'Sesión'],
  ['sessões', 'sesiones'],
  ['Sessões', 'Sesiones'],
  ['registo', 'registro'],
  ['Registo', 'Registro'],
  ['registos', 'registros'],
  ['Registos', 'Registros'],
  ['registar', 'registrar'],
  ['Registar', 'Registrar'],
  ['inscrição', 'inscripción'],
  ['Inscrição', 'Inscripción'],
  ['inscrições', 'inscripciones'],
  ['Inscrições', 'Inscripciones'],
  ['inscrever', 'inscribir'],
  ['Inscrever', 'Inscribir'],
  ['autenticação', 'autenticación'],
  ['Autenticação', 'Autenticación'],
  ['autorização', 'autorización'],
  ['Autorização', 'Autorización'],
  ['permissão', 'permiso'],
  ['Permissão', 'Permiso'],
  ['permissões', 'permisos'],
  ['Permissões', 'Permisos'],
  ['privacidade', 'privacidad'],
  ['Privacidade', 'Privacidad'],
  ['dados', 'datos'],
  ['Dados', 'Datos'],
  ['dado', 'dato'],
  ['Dado', 'Dato'],
  ['ficheiro', 'archivo'],
  ['Ficheiro', 'Archivo'],
  ['ficheiros', 'archivos'],
  ['Ficheiros', 'Archivos'],
  ['imagem', 'imagen'],
  ['Imagem', 'Imagen'],
  ['imagens', 'imágenes'],
  ['Imagens', 'Imágenes'],
  ['foto', 'foto'],
  ['Foto', 'Foto'],
  ['fotos', 'fotos'],
  ['Fotos', 'Fotos'],
  ['vídeo', 'vídeo'],
  ['Vídeo', 'Vídeo'],
  ['vídeos', 'vídeos'],
  ['Vídeos', 'Vídeos'],
  ['áudio', 'audio'],
  ['Áudio', 'Audio'],
  ['anexo', 'adjunto'],
  ['Anexo', 'Adjunto'],
  ['anexos', 'adjuntos'],
  ['Anexos', 'Adjuntos'],
  ['anexar', 'adjuntar'],
  ['Anexar', 'Adjuntar'],
  ['carregar ficheiro', 'subir archivo'],
  ['Carregar ficheiro', 'Subir archivo'],
  ['descarregar', 'descargar'],
  ['Descarregar', 'Descargar'],
  ['descarregar', 'descargar'],
  ['transferir', 'transferir'],
  ['Transferir', 'Transferir'],
  ['declarar', 'declarar'],
  ['Declarar', 'Declarar'],
  ['declaração', 'declaración'],
  ['Declaração', 'Declaración'],
  ['declarações', 'declaraciones'],
  ['Declarações', 'Declaraciones'],
  ['operação', 'operación'],
  ['Operação', 'Operación'],
  ['operações', 'operaciones'],
  ['Operações', 'Operaciones'],
  ['parceiro', 'socio'],
  ['Parceiro', 'Socio'],
  ['parceiros', 'socios'],
  ['Parceiros', 'Socios'],
  ['fiável', 'fiable'],
  ['Fiável', 'Fiable'],
  ['fiáveis', 'fiables'],
  ['Fiáveis', 'Fiables'],
  ['confiável', 'confiable'],
  ['Confiável', 'Confiable'],
  ['confiança', 'confianza'],
  ['Confiança', 'Confianza'],
  ['controlo', 'control'],
  ['Controlo', 'Control'],
  ['controle', 'control'],
  ['Controle', 'Control'],
  ['centro de controlo', 'centro de control'],
  ['Centro de controlo', 'Centro de control'],
  ['centro de controle', 'centro de control'],
  ['piloto', 'piloto'],
  ['pilotagem', 'pilotaje'],
  ['Pilotagem', 'Pilotaje'],
  ['cobertura', 'cobertura'],
  ['Cobertura', 'Cobertura'],
  ['funcional', 'funcional'],
  ['Funcional', 'Funcional'],
  ['funcionalidade', 'funcionalidad'],
  ['Funcionalidade', 'Funcionalidad'],
  ['funcionalidades', 'funcionalidades'],
  ['Funcionalidades', 'Funcionalidades'],
  ['preferência', 'preferencia'],
  ['Preferência', 'Preferencia'],
  ['preferências', 'preferencias'],
  ['Preferências', 'Preferencias'],
  ['idioma', 'idioma'],
  ['Idioma', 'Idioma'],
  ['língua', 'idioma'],
  ['Língua', 'Idioma'],
  ['tema', 'tema'],
  ['Tema', 'Tema'],
  ['claro', 'claro'],
  ['Claro', 'Claro'],
  ['escuro', 'oscuro'],
  ['Escuro', 'Oscuro'],
  ['ativar', 'activar'],
  ['Ativar', 'Activar'],
  ['desativar', 'desactivar'],
  ['Desativar', 'Desactivar'],
  ['ativo', 'activo'],
  ['Ativo', 'Activo'],
  ['ativa', 'activa'],
  ['Ativa', 'Activa'],
  ['ativos', 'activos'],
  ['Ativos', 'Activos'],
  ['ativas', 'activas'],
  ['Ativas', 'Activas'],
  ['inativo', 'inactivo'],
  ['Inativo', 'Inactivo'],
  ['inativa', 'inactiva'],
  ['Inativa', 'Inactiva'],
  ['rascunho', 'borrador'],
  ['Rascunho', 'Borrador'],
  ['rascunhos', 'borradores'],
  ['Rascunhos', 'Borradores'],
  ['publicado', 'publicado'],
  ['Publicado', 'Publicado'],
  ['publicada', 'publicada'],
  ['Publicada', 'Publicada'],
  ['publicados', 'publicados'],
  ['Publicados', 'Publicados'],
  ['publicadas', 'publicadas'],
  ['Publicadas', 'Publicadas'],
  ['republicar', 'republicar'],
  ['Republicar', 'Republicar'],
  ['duplicar', 'duplicar'],
  ['Duplicar', 'Duplicar'],
  ['marcar', 'marcar'],
  ['Marcar', 'Marcar'],
  ['vendido', 'vendido'],
  ['Vendido', 'Vendido'],
  ['comprar', 'comprar'],
  ['Comprar', 'Comprar'],
  ['vender', 'vender'],
  ['Vender', 'Vender'],
  ['aluguer', 'alquiler'],
  ['Aluguer', 'Alquiler'],
  ['arrendamento', 'alquiler'],
  ['Arrendamento', 'Alquiler'],
  ['produto', 'producto'],
  ['Produto', 'Producto'],
  ['produtos', 'productos'],
  ['Produtos', 'Productos'],
  ['particular', 'particular'],
  ['Particular', 'Particular'],
  ['particulares', 'particulares'],
  ['Particulares', 'Particulares'],
  ['indivíduo', 'individuo'],
  ['Indivíduo', 'Individuo'],
  ['organização', 'organización'],
  ['Organização', 'Organización'],
  ['organizações', 'organizaciones'],
  ['Organizações', 'Organizaciones'],
  ['associação', 'asociación'],
  ['Associação', 'Asociación'],
  ['associações', 'asociaciones'],
  ['Associações', 'Asociaciones'],
  ['membro', 'miembro'],
  ['Membro', 'Miembro'],
  ['membros', 'miembros'],
  ['Membros', 'Miembros'],
  ['desde', 'desde'],
  ['Desde', 'Desde'],
  ['até', 'hasta'],
  ['Até', 'Hasta'],
  ['entre', 'entre'],
  ['Entre', 'Entre'],
  ['durante', 'durante'],
  ['Durante', 'Durante'],
  ['após', 'después de'],
  ['Após', 'Después de'],
  ['antes', 'antes'],
  ['Antes', 'Antes'],
  ['depois', 'después'],
  ['Depois', 'Después'],
  ['hora', 'hora'],
  ['Hora', 'Hora'],
  ['horas', 'horas'],
  ['Horas', 'Horas'],
  ['dia', 'día'],
  ['Dia', 'Día'],
  ['dias', 'días'],
  ['Dias', 'Días'],
  ['semana', 'semana'],
  ['Semana', 'Semana'],
  ['semanas', 'semanas'],
  ['Semanas', 'Semanas'],
  ['mês', 'mes'],
  ['Mês', 'Mes'],
  ['meses', 'meses'],
  ['Meses', 'Meses'],
  ['ano', 'año'],
  ['Ano', 'Año'],
  ['anos', 'años'],
  ['Anos', 'Años'],
  ['minuto', 'minuto'],
  ['Minuto', 'Minuto'],
  ['minutos', 'minutos'],
  ['Minutos', 'Minutos'],
  ['segundo', 'segundo'],
  ['Segundo', 'Segundo'],
  ['segundos', 'segundos'],
  ['Segundos', 'Segundos'],
  ['agora mesmo', 'ahora mismo'],
  ['há ', 'hace '],
  ['Há ', 'Hace '],
  ['atrás', 'atrás'],
  ['Atrás', 'Atrás'],
  ['vazio', 'vacío'],
  ['Vazio', 'Vacío'],
  ['vazia', 'vacía'],
  ['Vazia', 'Vacía'],
  ['vazio', 'vacío'],
  ['completo', 'completo'],
  ['Completo', 'Completo'],
  ['completa', 'completa'],
  ['Completa', 'Completa'],
  ['completar', 'completar'],
  ['Completar', 'Completar'],
  ['preencher', 'rellenar'],
  ['Preencher', 'Rellenar'],
  ['preenchido', 'rellenado'],
  ['Preenchido', 'Rellenado'],
  ['campo', 'campo'],
  ['Campo', 'Campo'],
  ['campos', 'campos'],
  ['Campos', 'Campos'],
  ['formulário', 'formulario'],
  ['Formulário', 'Formulario'],
  ['formulários', 'formularios'],
  ['Formulários', 'Formularios'],
  ['enviar dinheiro', 'enviar dinero'],
  ['Enviar dinheiro', 'Enviar dinero'],
  ['dinheiro', 'dinero'],
  ['Dinheiro', 'Dinero'],
  ['recebido', 'recibido'],
  ['Recebido', 'Recibido'],
  ['recebida', 'recibida'],
  ['Recebida', 'Recibida'],
  ['enviado', 'enviado'],
  ['Enviado', 'Enviado'],
  ['enviada', 'enviada'],
  ['Enviada', 'Enviada'],
  ['destino', 'destino'],
  ['Destino', 'Destino'],
  ['origem', 'origen'],
  ['Origem', 'Origen'],
  ['destinatário', 'destinatario'],
  ['Destinatário', 'Destinatario'],
  ['remetente', 'remitente'],
  ['Remetente', 'Remitente'],
  ['referência', 'referencia'],
  ['Referência', 'Referencia'],
  ['referências', 'referencias'],
  ['Referências', 'Referencias'],
  ['método', 'método'],
  ['Método', 'Método'],
  ['métodos', 'métodos'],
  ['Métodos', 'Métodos'],
  ['banco', 'banco'],
  ['Banco', 'Banco'],
  ['bancos', 'bancos'],
  ['Bancos', 'Bancos'],
  ['cartão', 'tarjeta'],
  ['Cartão', 'Tarjeta'],
  ['cartões', 'tarjetas'],
  ['Cartões', 'Tarjetas'],
  ['agência', 'agencia'],
  ['Agência', 'Agencia'],
  ['agências', 'agencias'],
  ['Agências', 'Agencias'],
  ['confirmação', 'confirmación'],
  ['Confirmação', 'Confirmación'],
  ['confirmações', 'confirmaciones'],
  ['Confirmações', 'Confirmaciones'],
  ['esperada', 'esperada'],
  ['Esperada', 'Esperada'],
  ['esperado', 'esperado'],
  ['Esperado', 'Esperado'],
  ['horário', 'horario'],
  ['Horário', 'Horario'],
  ['horários', 'horarios'],
  ['Horários', 'Horarios'],
  ['prazo', 'plazo'],
  ['Prazo', 'Plazo'],
  ['prazos', 'plazos'],
  ['Prazos', 'Plazos'],
  ['atraso', 'retraso'],
  ['Atraso', 'Retraso'],
  ['atrasos', 'retrasos'],
  ['Atrasos', 'Retrasos'],
  ['entrega', 'entrega'],
  ['Entrega', 'Entrega'],
  ['entregas', 'entregas'],
  ['Entregas', 'Entregas'],
  ['entregar', 'entregar'],
  ['Entregar', 'Entregar'],
  ['recolha', 'recogida'],
  ['Recolha', 'Recogida'],
  ['recolher', 'recoger'],
  ['Recolher', 'Recoger'],
  ['embalagem', 'embalaje'],
  ['Embalagem', 'Embalaje'],
  ['conteúdo', 'contenido'],
  ['Conteúdo', 'Contenido'],
  ['conteúdos', 'contenidos'],
  ['Conteúdos', 'Contenidos'],
  ['roupa', 'ropa'],
  ['Roupa', 'Ropa'],
  ['materiais', 'materiales'],
  ['Materiais', 'Materiales'],
  ['perigoso', 'peligroso'],
  ['Perigoso', 'Peligroso'],
  ['perigosos', 'peligrosos'],
  ['Perigosos', 'Peligrosos'],
  ['líquido', 'líquido'],
  ['Líquido', 'Líquido'],
  ['líquidos', 'líquidos'],
  ['Líquidos', 'Líquidos'],
  ['regra', 'regla'],
  ['Regra', 'Regla'],
  ['regras', 'reglas'],
  ['Regras', 'Reglas'],
  ['condição', 'condición'],
  ['Condição', 'Condición'],
  ['condições', 'condiciones'],
  ['Condições', 'Condiciones'],
  ['termo', 'término'],
  ['Termo', 'Término'],
  ['termos', 'términos'],
  ['Termos', 'Términos'],
  ['política', 'política'],
  ['Política', 'Política'],
  ['políticas', 'políticas'],
  ['Políticas', 'Políticas'],
  ['legal', 'legal'],
  ['Legal', 'Legal'],
  ['jurídico', 'jurídico'],
  ['Jurídico', 'Jurídico'],
  ['aceitação', 'aceptación'],
  ['Aceitação', 'Aceptación'],
  ['recusa', 'rechazo'],
  ['Recusa', 'Rechazo'],
  ['motivo', 'motivo'],
  ['Motivo', 'Motivo'],
  ['motivos', 'motivos'],
  ['Motivos', 'Motivos'],
  ['razão', 'razón'],
  ['Razão', 'Razón'],
  ['razões', 'razones'],
  ['Razões', 'Razones'],
  ['explicação', 'explicación'],
  ['Explicação', 'Explicación'],
  ['explique', 'explique'],
  ['Explique', 'Explique'],
  ['descreva', 'describa'],
  ['Descreva', 'Describa'],
  ['descrever', 'describir'],
  ['Descrever', 'Describir'],
  ['precisão', 'precisión'],
  ['Precisão', 'Precisión'],
  ['disponibilidade', 'disponibilidad'],
  ['perguntar', 'preguntar'],
  ['Perguntar', 'Preguntar'],
  ['pergunta', 'pregunta'],
  ['Pergunta', 'Pregunta'],
  ['perguntas', 'preguntas'],
  ['Perguntas', 'Preguntas'],
  ['assistente', 'asistente'],
  ['Assistente', 'Asistente'],
  ['inteligente', 'inteligente'],
  ['Inteligente', 'Inteligente'],
  ['pedir', 'pedir'],
  ['Pedir', 'Pedir'],
  ['algo', 'algo'],
  ['Algo', 'Algo'],
  ['experiência', 'experiencia'],
  ['Experiência', 'Experiencia'],
  ['experiências', 'experiencias'],
  ['Experiências', 'Experiencias'],
  ['comportamento', 'comportamiento'],
  ['Comportamento', 'Comportamiento'],
  ['abusivo', 'abusivo'],
  ['Abusivo', 'Abusivo'],
  ['assédio', 'acoso'],
  ['Assédio', 'Acoso'],
  ['spam', 'spam'],
  ['Spam', 'Spam'],
  ['problema', 'problema'],
  ['Problema', 'Problema'],
  ['problemas', 'problemas'],
  ['Problemas', 'Problemas'],
  ['problema', 'problema'],
  ['ticket', 'ticket'],
  ['Ticket', 'Ticket'],
  ['tickets', 'tickets'],
  ['Tickets', 'Tickets'],
  ['resposta rápida', 'respuesta rápida'],
  ['Resposta rápida', 'Respuesta rápida'],
  ['resposta ao ticket', 'respuesta al ticket'],
  ['comentário', 'comentario'],
  ['seu comentário', 'su comentario'],
  ['sua resposta', 'su respuesta'],
  ['sua mensagem', 'su mensaje'],
  ['escreva', 'escriba'],
  ['Escreva', 'Escriba'],
  ['escrever', 'escribir'],
  ['Escrever', 'Escribir'],
  ['redija', 'redacte'],
  ['Redija', 'Redacte'],
  ['partilhe', 'comparta'],
  ['Partilhe', 'Comparta'],
  ['resposta profissional', 'respuesta profesional'],
  ['injusto', 'injusto'],
  ['Injusto', 'Injusto'],
  ['não conforme', 'no conforme'],
  ['caracteres', 'caracteres'],
  ['Caracteres', 'Caracteres'],
  ['mínimo', 'mínimo'],
  ['Mínimo', 'Mínimo'],
  ['máximo', 'máximo'],
  ['Máximo', 'Máximo'],
  ['mín.', 'mín.'],
  ['máx.', 'máx.'],
  ['ex.', 'ej.'],
  ['Ex.', 'Ej.'],
  ['ex:', 'ej:'],
  ['Ex:', 'Ej:'],
  ['ex :', 'ej:'],
  ['Ex :', 'Ej:'],
  ['exemplos', 'ejemplos'],
  ['Exemplos', 'Ejemplos'],
  ['exemplo', 'ejemplo'],
  ['Exemplo', 'Ejemplo'],
  ['Moscovo', 'Moscú'],
  ['moscovo', 'Moscú'],
  ['São Petersburgo', 'San Petersburgo'],
  ['Benim', 'Benín'],
  ['benim', 'Benín'],
  ['Rússia', 'Rusia'],
  ['rússia', 'Rusia'],
  ['África', 'África'],
  ['diáspora', 'diáspora'],
  ['Diáspora', 'Diáspora'],
  ['plataforma', 'plataforma'],
  ['Plataforma', 'Plataforma'],
  ['aplicação', 'aplicación'],
  ['Aplicação', 'Aplicación'],
  ['aplicações', 'aplicaciones'],
  ['Aplicações', 'Aplicaciones'],
  ['navegador', 'navegador'],
  ['Navegador', 'Navegador'],
  ['nativa', 'nativa'],
  ['Nativa', 'Nativa'],
  ['nativo', 'nativo'],
  ['Nativo', 'Nativo'],
  ['predefinição', 'predeterminación'],
  ['Predefinição', 'Predeterminación'],
  ['por predefinição', 'por defecto'],
  ['Por predefinição', 'Por defecto'],
  ['alterável', 'modificable'],
  ['Alterável', 'Modificable'],
  ['clique', 'clic'],
  ['Clique', 'Clic'],
  ['toque', 'toque'],
  ['Toque', 'Toque'],
  ['gesto', 'gesto'],
  ['Gesto', 'Gesto'],
  ['mesmo sítio', 'mismo lugar'],
  ['mesmo lugar', 'mismo lugar'],
  ['num só lugar', 'en un solo lugar'],
  ['Num só lugar', 'En un solo lugar'],
  ['no mesmo sítio', 'en el mismo lugar'],
  ['um só lugar', 'un solo lugar'],
  ['Um só lugar', 'Un solo lugar'],
  ['só ', 'solo '],
  ['Só ', 'Solo '],
  ['sítio', 'sitio'],
  ['Sítio', 'Sitio'],
  ['sítios', 'sitios'],
  ['Sítios', 'Sitios'],
  ['lugar', 'lugar'],
  ['Lugar', 'Lugar'],
  ['lugares', 'lugares'],
  ['Lugares', 'Lugares'],
  ['página', 'página'],
  ['Página', 'Página'],
  ['páginas', 'páginas'],
  ['Páginas', 'Páginas'],
  ['ecrã', 'pantalla'],
  ['Ecrã', 'Pantalla'],
  ['ecrãs', 'pantallas'],
  ['Ecrãs', 'Pantallas'],
  ['botão', 'botón'],
  ['Botão', 'Botón'],
  ['botões', 'botones'],
  ['Botões', 'Botones'],
  ['menu', 'menú'],
  ['Menu', 'Menú'],
  ['menus', 'menús'],
  ['Menus', 'Menús'],
  ['navegação', 'navegación'],
  ['Navegação', 'Navegación'],
  ['principal', 'principal'],
  ['Principal', 'Principal'],
  ['móvel', 'móvil'],
  ['Móvel', 'Móvil'],
  ['rápida', 'rápida'],
  ['rápido', 'rápido'],
  ['fechar navegação', 'cerrar navegación'],
  ['Fechar navegação', 'Cerrar navegación'],
  ['mais serviços', 'más servicios'],
  ['Mais serviços', 'Más servicios'],
  ['sem ler', 'sin leer'],
  ['Sem ler', 'Sin leer'],
  ['não lidos', 'sin leer'],
  ['ativar tema', 'activar tema'],
  ['Ativar tema', 'Activar tema'],
  ['tema claro', 'tema claro'],
  ['tema escuro', 'tema oscuro'],
  ['conta e sessão', 'cuenta y sesión'],
  ['Conta e sessão', 'Cuenta y sesión'],
  ['centro de controle', 'centro de control'],
  ['Centro de controle', 'Centro de control'],
  ['cobertura funcional', 'cobertura funcional'],
  ['Cobertura funcional', 'Cobertura funcional'],
  ['controle do sistema', 'control del sistema'],
  ['Controle do sistema', 'Control del sistema'],
  ['serviços adicionais', 'servicios adicionales'],
  ['Serviços adicionais', 'Servicios adicionales'],
  ['QR e convite', 'QR e invitación'],
  ['meus favoritos', 'mis favoritos'],
  ['Meus favoritos', 'Mis favoritos'],
  ['minhas publicações', 'mis publicaciones'],
  ['Minhas publicações', 'Mis publicaciones'],
  ['espaço profissional', 'espacio profesional'],
  ['Espaço profissional', 'Espacio profesional'],
  ['troca P2P', 'intercambios P2P'],
  ['Troca P2P', 'Intercambios P2P'],
  ['finanças', 'finanzas'],
  ['Finanças', 'Finanzas'],
  ['administração', 'administración'],
  ['Administração', 'Administración'],
]

// Sort longest first so multi-word wins
PHRASES.sort((a, b) => b[0].length - a[0].length)

/** Suffix / character morphology (apply after phrases). */
function applyMorphology(text) {
  return text
    .replace(/ções\b/g, 'ciones')
    .replace(/ção\b/g, 'ción')
    .replace(/Ções\b/g, 'Ciones')
    .replace(/ÇÃO\b/g, 'CIÓN')
    .replace(/ões\b/g, 'ones')
    .replace(/ão\b/g, 'ón')
    .replace(/ães\b/g, 'anes')
    .replace(/ãe\b/g, 'madre') // rare; mostly mãe
    .replace(/\bmãe\b/gi, (m) => (m[0] === 'M' ? 'Madre' : 'madre'))
    .replace(/nh/g, 'ñ')
    .replace(/Nh/g, 'Ñ')
    .replace(/lh/g, 'll')
    .replace(/Lh/g, 'Ll')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/ss/g, 's') // Portuguese double-s → Spanish s (approx)
    .replace(/dade\b/g, 'dad')
    .replace(/dades\b/g, 'dades')
    .replace(/ável\b/g, 'able')
    .replace(/íveis\b/g, 'ibles')
    .replace(/ível\b/g, 'ible')
    .replace(/agem\b/g, 'aje')
    .replace(/agens\b/g, 'ajes')
    .replace(/\bnão\b/gi, (m) => (m[0] === 'N' ? 'No' : 'no'))
    .replace(/\bé\b/g, 'es')
    .replace(/\bÉ\b/g, 'Es')
    .replace(/\bestá\b/gi, (m) => (m[0] === 'E' ? 'Está' : 'está'))
    .replace(/\bestão\b/gi, (m) => (m[0] === 'E' ? 'Están' : 'están'))
    .replace(/\bfoi\b/gi, (m) => (m[0] === 'F' ? 'Fue' : 'fue'))
    .replace(/\bser\b/g, 'ser')
    .replace(/\bter\b/g, 'tener')
    .replace(/\bTer\b/g, 'Tener')
    .replace(/\btem\b/g, 'tiene')
    .replace(/\bTem\b/g, 'Tiene')
    .replace(/\btêm\b/g, 'tienen')
    .replace(/\bTêm\b/g, 'Tienen')
    .replace(/\bfazer\b/g, 'hacer')
    .replace(/\bFazer\b/g, 'Hacer')
    .replace(/\bfaz\b/g, 'hace')
    .replace(/\bFaz\b/g, 'Hace')
    .replace(/\bpode\b/g, 'puede')
    .replace(/\bPode\b/g, 'Puede')
    .replace(/\bpodem\b/g, 'pueden')
    .replace(/\bPodem\b/g, 'Pueden')
    .replace(/\bpoder\b/g, 'poder')
    .replace(/\bdeve\b/g, 'debe')
    .replace(/\bDeve\b/g, 'Debe')
    .replace(/\bdevem\b/g, 'deben')
    .replace(/\bDevem\b/g, 'Deben')
    .replace(/\bquero\b/g, 'quiero')
    .replace(/\bQuero\b/g, 'Quiero')
    .replace(/\bquer\b/g, 'quiere')
    .replace(/\bQuer\b/g, 'Quiere')
    .replace(/\bpreciso\b/g, 'necesito')
    .replace(/\bPreciso\b/g, 'Necesito')
    .replace(/\bprecisa\b/g, 'necesita')
    .replace(/\bPrecisa\b/g, 'Necesita')
    .replace(/\bencontrar\b/g, 'encontrar')
    .replace(/\bEncontrar\b/g, 'Encontrar')
    .replace(/\bencontre\b/g, 'encuentre')
    .replace(/\bEncontre\b/g, 'Encuentre')
    .replace(/\bencontre\b/g, 'encuentre')
    .replace(/\busar\b/g, 'usar')
    .replace(/\bUsar\b/g, 'Usar')
    .replace(/\busado\b/g, 'usado')
    .replace(/\bUsado\b/g, 'Usado')
    .replace(/\busada\b/g, 'usada')
    .replace(/\bUsada\b/g, 'Usada')
    .replace(/\bnovo\b/g, 'nuevo')
    .replace(/\bNovo\b/g, 'Nuevo')
    .replace(/\bnova\b/g, 'nueva')
    .replace(/\bNova\b/g, 'Nueva')
    .replace(/\btodos\b/g, 'todos')
    .replace(/\btodas\b/g, 'todas')
    .replace(/\btudo\b/g, 'todo')
    .replace(/\bTudo\b/g, 'Todo')
    .replace(/\bmais\b/g, 'más')
    .replace(/\bMais\b/g, 'Más')
    .replace(/\bagora\b/g, 'ahora')
    .replace(/\bAgora\b/g, 'Ahora')
    .replace(/\bhoje\b/g, 'hoy')
    .replace(/\bHoje\b/g, 'Hoy')
    .replace(/\bajuda\b/g, 'ayuda')
    .replace(/\bAjuda\b/g, 'Ayuda')
    .replace(/\bajudar\b/g, 'ayudar')
    .replace(/\bAjudar\b/g, 'Ayudar')
    .replace(/\bsalvar\b/g, 'guardar')
    .replace(/\bSalvar\b/g, 'Guardar')
    .replace(/\bapagar\b/g, 'borrar')
    .replace(/\bApagar\b/g, 'Borrar')
    .replace(/\bvoltar\b/g, 'volver')
    .replace(/\bVoltar\b/g, 'Volver')
    .replace(/\bentrar\b/g, 'entrar')
    .replace(/\bsair\b/g, 'salir')
    .replace(/\bSair\b/g, 'Salir')
    .replace(/\binício\b/g, 'inicio')
    .replace(/\bInício\b/g, 'Inicio')
    .replace(/\biniciar\b/g, 'iniciar')
    .replace(/\bIniciar\b/g, 'Iniciar')
    .replace(/\bterminar\b/g, 'terminar')
    .replace(/\bTerminar\b/g, 'Terminar')
    .replace(/\bfinalizar\b/g, 'finalizar')
    .replace(/\bFinalizar\b/g, 'Finalizar')
    .replace(/\bconcluir\b/g, 'concluir')
    .replace(/\bConcluir\b/g, 'Concluir')
    .replace(/\bcancelar\b/g, 'cancelar')
    .replace(/\bCancelar\b/g, 'Cancelar')
    .replace(/\bconfirmar\b/g, 'confirmar')
    .replace(/\bConfirmar\b/g, 'Confirmar')
    .replace(/\bcontinuar\b/g, 'continuar')
    .replace(/\bContinuar\b/g, 'Continuar')
    .replace(/\benviar\b/g, 'enviar')
    .replace(/\bEnviar\b/g, 'Enviar')
    .replace(/\breceber\b/g, 'recibir')
    .replace(/\bReceber\b/g, 'Recibir')
    .replace(/\baceitar\b/g, 'aceptar')
    .replace(/\bAceitar\b/g, 'Aceptar')
    .replace(/\brecusar\b/g, 'rechazar')
    .replace(/\bRecusar\b/g, 'Rechazar')
    .replace(/\bpublicar\b/g, 'publicar')
    .replace(/\bPublicar\b/g, 'Publicar')
    .replace(/\beditar\b/g, 'editar')
    .replace(/\bEditar\b/g, 'Editar')
    .replace(/\beliminar\b/g, 'eliminar')
    .replace(/\bEliminar\b/g, 'Eliminar')
    .replace(/\bcriar\b/g, 'crear')
    .replace(/\bCriar\b/g, 'Crear')
    .replace(/\badicionar\b/g, 'añadir')
    .replace(/\bAdicionar\b/g, 'Añadir')
    .replace(/\bremover\b/g, 'quitar')
    .replace(/\bRemover\b/g, 'Quitar')
    .replace(/\bpesquisar\b/g, 'buscar')
    .replace(/\bPesquisar\b/g, 'Buscar')
    .replace(/\bpesquisa\b/g, 'búsqueda')
    .replace(/\bPesquisa\b/g, 'Búsqueda')
    .replace(/\bguardar\b/g, 'guardar')
    .replace(/\bGuardar\b/g, 'Guardar')
    .replace(/\babrir\b/g, 'abrir')
    .replace(/\bfechar\b/g, 'cerrar')
    .replace(/\bFechar\b/g, 'Cerrar')
    .replace(/\bmostrar\b/g, 'mostrar')
    .replace(/\bocultar\b/g, 'ocultar')
    .replace(/\bver\b/g, 'ver')
    .replace(/\bler\b/g, 'leer')
    .replace(/\bLer\b/g, 'Leer')
    .replace(/\bescrever\b/g, 'escribir')
    .replace(/\bEscrever\b/g, 'Escribir')
    .replace(/\bpartilhar\b/g, 'compartir')
    .replace(/\bPartilhar\b/g, 'Compartir')
    .replace(/\bconvidar\b/g, 'invitar')
    .replace(/\bConvidar\b/g, 'Invitar')
    .replace(/\bcopiar\b/g, 'copiar')
    .replace(/\bcarregar\b/g, 'cargar')
    .replace(/\bCarregar\b/g, 'Cargar')
    .replace(/\batualizar\b/g, 'actualizar')
    .replace(/\bAtualizar\b/g, 'Actualizar')
    .replace(/\bgerir\b/g, 'gestionar')
    .replace(/\bGerir\b/g, 'Gestionar')
    .replace(/\bdescobrir\b/g, 'descubrir')
    .replace(/\bDescobrir\b/g, 'Descubrir')
    .replace(/\bexplorar\b/g, 'explorar')
    .replace(/\bescolher\b/g, 'elegir')
    .replace(/\bEscolher\b/g, 'Elegir')
    .replace(/\bselecionar\b/g, 'seleccionar')
    .replace(/\bSelecionar\b/g, 'Seleccionar')
    .replace(/\bordenar\b/g, 'ordenar')
    .replace(/\bfiltrar\b/g, 'filtrar')
    .replace(/\bFiltrar\b/g, 'Filtrar')
    .replace(/\butilizador\b/g, 'usuario')
    .replace(/\bUtilizador\b/g, 'Usuario')
    .replace(/\butilizadores\b/g, 'usuarios')
    .replace(/\bUtilizadores\b/g, 'Usuarios')
    .replace(/\btelemóvel\b/g, 'móvil')
    .replace(/\bTelemóvel\b/g, 'Móvil')
    .replace(/\btelefone\b/g, 'teléfono')
    .replace(/\bTelefone\b/g, 'Teléfono')
    .replace(/\bpalavra-passe\b/g, 'contraseña')
    .replace(/\bPalavra-passe\b/g, 'Contraseña')
    .replace(/\be-mail\b/gi, 'correo')
    .replace(/\bemail\b/gi, 'correo')
    .replace(/\bencomenda\b/g, 'envío')
    .replace(/\bEncomenda\b/g, 'Envío')
    .replace(/\bencomendas\b/g, 'envíos')
    .replace(/\bEncomendas\b/g, 'Envíos')
    .replace(/\bmensagem\b/g, 'mensaje')
    .replace(/\bMensagem\b/g, 'Mensaje')
    .replace(/\bmensagens\b/g, 'mensajes')
    .replace(/\bMensagens\b/g, 'Mensajes')
    .replace(/\banúncio\b/g, 'anuncio')
    .replace(/\bAnúncio\b/g, 'Anuncio')
    .replace(/\banúncios\b/g, 'anuncios')
    .replace(/\bAnúncios\b/g, 'Anuncios')
    .replace(/\bdefinições\b/g, 'ajustes')
    .replace(/\bDefinições\b/g, 'Ajustes')
    .replace(/\bdefinição\b/g, 'definición')
    .replace(/\bDefinição\b/g, 'Definición')
    .replace(/\bsegurança\b/g, 'seguridad')
    .replace(/\bSegurança\b/g, 'Seguridad')
    .replace(/\bidentidade\b/g, 'identidad')
    .replace(/\bIdentidade\b/g, 'Identidad')
    .replace(/\bconta\b/g, 'cuenta')
    .replace(/\bConta\b/g, 'Cuenta')
    .replace(/\bcontas\b/g, 'cuentas')
    .replace(/\bContas\b/g, 'Cuentas')
    .replace(/\bserviço\b/g, 'servicio')
    .replace(/\bServiço\b/g, 'Servicio')
    .replace(/\bserviços\b/g, 'servicios')
    .replace(/\bServiços\b/g, 'Servicios')
    .replace(/\bespaço\b/g, 'espacio')
    .replace(/\bEspaço\b/g, 'Espacio')
    .replace(/\bprofissional\b/g, 'profesional')
    .replace(/\bProfissional\b/g, 'Profesional')
    .replace(/\bemprego\b/g, 'empleo')
    .replace(/\bEmprego\b/g, 'Empleo')
    .replace(/\bempregos\b/g, 'empleos')
    .replace(/\bEmpregos\b/g, 'Empleos')
    .replace(/\bnotícia\b/g, 'noticia')
    .replace(/\bNotícia\b/g, 'Noticia')
    .replace(/\bnotícias\b/g, 'noticias')
    .replace(/\bNotícias\b/g, 'Noticias')
    .replace(/\bcidade\b/g, 'ciudad')
    .replace(/\bCidade\b/g, 'Ciudad')
    .replace(/\bcategoria\b/g, 'categoría')
    .replace(/\bCategoria\b/g, 'Categoría')
    .replace(/\bdescrição\b/g, 'descripción')
    .replace(/\bDescrição\b/g, 'Descripción')
    .replace(/\binformação\b/g, 'información')
    .replace(/\bInformação\b/g, 'Información')
    .replace(/\binformações\b/g, 'información')
    .replace(/\bInformações\b/g, 'Información')
    .replace(/\bação\b/g, 'acción')
    .replace(/\bAção\b/g, 'Acción')
    .replace(/\bações\b/g, 'acciones')
    .replace(/\bAções\b/g, 'Acciones')
    .replace(/\boperação\b/g, 'operación')
    .replace(/\bOperação\b/g, 'Operación')
    .replace(/\boperações\b/g, 'operaciones')
    .replace(/\bOperações\b/g, 'Operaciones')
    .replace(/\btransferência\b/g, 'transferencia')
    .replace(/\bTransferência\b/g, 'Transferencia')
    .replace(/\btransferências\b/g, 'transferencias')
    .replace(/\bTransferências\b/g, 'Transferencias')
    .replace(/\bpublicação\b/g, 'publicación')
    .replace(/\bPublicação\b/g, 'Publicación')
    .replace(/\bpublicações\b/g, 'publicaciones')
    .replace(/\bPublicações\b/g, 'Publicaciones')
    .replace(/\bnotificação\b/g, 'notificación')
    .replace(/\bNotificação\b/g, 'Notificación')
    .replace(/\bnotificações\b/g, 'notificaciones')
    .replace(/\bNotificações\b/g, 'Notificaciones')
    .replace(/\bconversa\b/g, 'conversación')
    .replace(/\bConversa\b/g, 'Conversación')
    .replace(/\bconversas\b/g, 'conversaciones')
    .replace(/\bConversas\b/g, 'Conversaciones')
    .replace(/\bdisponível\b/g, 'disponible')
    .replace(/\bDisponível\b/g, 'Disponible')
    .replace(/\bdisponíveis\b/g, 'disponibles')
    .replace(/\bDisponíveis\b/g, 'Disponibles')
    .replace(/\bobrigatório\b/g, 'obligatorio')
    .replace(/\bObrigatório\b/g, 'Obligatorio')
    .replace(/\bobrigatória\b/g, 'obligatoria')
    .replace(/\bpendente\b/g, 'pendiente')
    .replace(/\bPendente\b/g, 'Pendiente')
    .replace(/\bpendentes\b/g, 'pendientes')
    .replace(/\bPendentes\b/g, 'Pendientes')
    .replace(/\bnavegação\b/g, 'navegación')
    .replace(/\bNavegação\b/g, 'Navegación')
    .replace(/\bmóvel\b/g, 'móvil')
    .replace(/\bMóvel\b/g, 'Móvil')
    .replace(/\bficheiro\b/g, 'archivo')
    .replace(/\bFicheiro\b/g, 'Archivo')
    .replace(/\bficheiros\b/g, 'archivos')
    .replace(/\bFicheiros\b/g, 'Archivos')
    .replace(/\bimagem\b/g, 'imagen')
    .replace(/\bImagem\b/g, 'Imagen')
    .replace(/\bimagens\b/g, 'imágenes')
    .replace(/\bImagens\b/g, 'Imágenes')
    .replace(/\bendereço\b/g, 'dirección')
    .replace(/\bEndereço\b/g, 'Dirección')
    .replace(/\bmorada\b/g, 'dirección')
    .replace(/\bMorada\b/g, 'Dirección')
    .replace(/\bpreço\b/g, 'precio')
    .replace(/\bPreço\b/g, 'Precio')
    .replace(/\bpreços\b/g, 'precios')
    .replace(/\bPreços\b/g, 'Precios')
    .replace(/\bmontante\b/g, 'importe')
    .replace(/\bMontante\b/g, 'Importe')
    .replace(/\bdinheiro\b/g, 'dinero')
    .replace(/\bDinheiro\b/g, 'Dinero')
    .replace(/\bcartão\b/g, 'tarjeta')
    .replace(/\bCartão\b/g, 'Tarjeta')
    .replace(/\bcartões\b/g, 'tarjetas')
    .replace(/\bCartões\b/g, 'Tarjetas')
    .replace(/\bagência\b/g, 'agencia')
    .replace(/\bAgência\b/g, 'Agencia')
    .replace(/\bconfirmação\b/g, 'confirmación')
    .replace(/\bConfirmação\b/g, 'Confirmación')
    .replace(/\breferência\b/g, 'referencia')
    .replace(/\bReferência\b/g, 'Referencia')
    .replace(/\bdestinatário\b/g, 'destinatario')
    .replace(/\bDestinatário\b/g, 'Destinatario')
    .replace(/\borigem\b/g, 'origen')
    .replace(/\bOrigem\b/g, 'Origen')
    .replace(/\bviagem\b/g, 'viaje')
    .replace(/\bViagem\b/g, 'Viaje')
    .replace(/\bviagens\b/g, 'viajes')
    .replace(/\bViagens\b/g, 'Viajes')
    .replace(/\bviajante\b/g, 'viajero')
    .replace(/\bViajante\b/g, 'Viajero')
    .replace(/\bviajantes\b/g, 'viajeros')
    .replace(/\bViajantes\b/g, 'Viajeros')
    .replace(/\bquilograma\b/g, 'kilogramo')
    .replace(/\bquilo\b/g, 'kilo')
    .replace(/\bQuilo\b/g, 'Kilo')
    .replace(/\bquilos\b/g, 'kilos')
    .replace(/\bQuilos\b/g, 'Kilos')
    .replace(/\batividade\b/g, 'actividad')
    .replace(/\bAtividade\b/g, 'Actividad')
    .replace(/\batividades\b/g, 'actividades')
    .replace(/\bAtividades\b/g, 'Actividades')
    .replace(/\bhistórico\b/g, 'historial')
    .replace(/\bHistórico\b/g, 'Historial')
    .replace(/\blocalização\b/g, 'ubicación')
    .replace(/\bLocalização\b/g, 'Ubicación')
    .replace(/\bdisponibilidade\b/g, 'disponibilidad')
    .replace(/\bDisponibilidade\b/g, 'Disponibilidad')
    .replace(/\bprivacidade\b/g, 'privacidad')
    .replace(/\bPrivacidade\b/g, 'Privacidad')
    .replace(/\bpermissão\b/g, 'permiso')
    .replace(/\bPermissão\b/g, 'Permiso')
    .replace(/\bpermissões\b/g, 'permisos')
    .replace(/\bPermissões\b/g, 'Permisos')
    .replace(/\bautenticação\b/g, 'autenticación')
    .replace(/\bAutenticação\b/g, 'Autenticación')
    .replace(/\bautorização\b/g, 'autorización')
    .replace(/\bAutorização\b/g, 'Autorización')
    .replace(/\binscrição\b/g, 'inscripción')
    .replace(/\bInscrição\b/g, 'Inscripción')
    .replace(/\bregisto\b/g, 'registro')
    .replace(/\bRegisto\b/g, 'Registro')
    .replace(/\bsessão\b/g, 'sesión')
    .replace(/\bSessão\b/g, 'Sesión')
    .replace(/\bsubscrição\b/g, 'suscripción')
    .replace(/\bSubscrição\b/g, 'Suscripción')
    .replace(/\bsubscrições\b/g, 'suscripciones')
    .replace(/\bSubscrições\b/g, 'Suscripciones')
    .replace(/\breclamação\b/g, 'reclamación')
    .replace(/\bReclamação\b/g, 'Reclamación')
    .replace(/\breclamações\b/g, 'reclamaciones')
    .replace(/\bReclamações\b/g, 'Reclamaciones')
    .replace(/\bavaliação\b/g, 'valoración')
    .replace(/\bAvaliação\b/g, 'Valoración')
    .replace(/\bavaliações\b/g, 'valoraciones')
    .replace(/\bAvaliações\b/g, 'Valoraciones')
    .replace(/\bcomentário\b/g, 'comentario')
    .replace(/\bComentário\b/g, 'Comentario')
    .replace(/\bcomentários\b/g, 'comentarios')
    .replace(/\bComentários\b/g, 'Comentarios')
    .replace(/\bresposta\b/g, 'respuesta')
    .replace(/\bResposta\b/g, 'Respuesta')
    .replace(/\brespostas\b/g, 'respuestas')
    .replace(/\bRespostas\b/g, 'Respuestas')
    .replace(/\bpergunta\b/g, 'pregunta')
    .replace(/\bPergunta\b/g, 'Pregunta')
    .replace(/\bperguntas\b/g, 'preguntas')
    .replace(/\bPerguntas\b/g, 'Preguntas')
    .replace(/\bexperiência\b/g, 'experiencia')
    .replace(/\bExperiência\b/g, 'Experiencia')
    .replace(/\bcomportamento\b/g, 'comportamiento')
    .replace(/\bComportamento\b/g, 'Comportamiento')
    .replace(/\bassédio\b/g, 'acoso')
    .replace(/\bAssédio\b/g, 'Acoso')
    .replace(/\bconfiança\b/g, 'confianza')
    .replace(/\bConfiança\b/g, 'Confianza')
    .replace(/\bfiável\b/g, 'fiable')
    .replace(/\bFiável\b/g, 'Fiable')
    .replace(/\bfiáveis\b/g, 'fiables')
    .replace(/\bFiáveis\b/g, 'Fiables')
    .replace(/\bparceiro\b/g, 'socio')
    .replace(/\bParceiro\b/g, 'Socio')
    .replace(/\bparceiros\b/g, 'socios')
    .replace(/\bParceiros\b/g, 'Socios')
    .replace(/\baluguer\b/g, 'alquiler')
    .replace(/\bAluguer\b/g, 'Alquiler')
    .replace(/\barrendamento\b/g, 'alquiler')
    .replace(/\bArrendamento\b/g, 'Alquiler')
    .replace(/\bproduto\b/g, 'producto')
    .replace(/\bProduto\b/g, 'Producto')
    .replace(/\bprodutos\b/g, 'productos')
    .replace(/\bProdutos\b/g, 'Productos')
    .replace(/\borganização\b/g, 'organización')
    .replace(/\bOrganização\b/g, 'Organización')
    .replace(/\bmembro\b/g, 'miembro')
    .replace(/\bMembro\b/g, 'Miembro')
    .replace(/\bmembros\b/g, 'miembros')
    .replace(/\bMembros\b/g, 'Miembros')
    .replace(/\baté\b/g, 'hasta')
    .replace(/\bAté\b/g, 'Hasta')
    .replace(/\bapós\b/g, 'después de')
    .replace(/\bApós\b/g, 'Después de')
    .replace(/\bdepois\b/g, 'después')
    .replace(/\bDepois\b/g, 'Después')
    .replace(/\bdia\b/g, 'día')
    .replace(/\bDia\b/g, 'Día')
    .replace(/\bdias\b/g, 'días')
    .replace(/\bDias\b/g, 'Días')
    .replace(/\bmês\b/g, 'mes')
    .replace(/\bMês\b/g, 'Mes')
    .replace(/\bano\b/g, 'año')
    .replace(/\bAno\b/g, 'Año')
    .replace(/\banos\b/g, 'años')
    .replace(/\bAnos\b/g, 'Años')
    .replace(/\bvazio\b/g, 'vacío')
    .replace(/\bVazio\b/g, 'Vacío')
    .replace(/\bvazia\b/g, 'vacía')
    .replace(/\bVazia\b/g, 'Vacía')
    .replace(/\berro\b/g, 'error')
    .replace(/\bErro\b/g, 'Error')
    .replace(/\berros\b/g, 'errores')
    .replace(/\bErros\b/g, 'Errores')
    .replace(/\bsucesso\b/g, 'éxito')
    .replace(/\bSucesso\b/g, 'Éxito')
    .replace(/\bobrigado\b/gi, 'gracias')
    .replace(/\bobrigada\b/gi, 'gracias')
    .replace(/\batensão\b/g, 'atención')
    .replace(/\bAtenção\b/g, 'Atención')
    .replace(/\bdetalhe\b/g, 'detalle')
    .replace(/\bDetalhe\b/g, 'Detalle')
    .replace(/\bdetalhes\b/g, 'detalles')
    .replace(/\bDetalhes\b/g, 'Detalles')
    .replace(/\bresumo\b/g, 'resumen')
    .replace(/\bResumo\b/g, 'Resumen')
    .replace(/\bexemplo\b/g, 'ejemplo')
    .replace(/\bExemplo\b/g, 'Ejemplo')
    .replace(/\bexemplos\b/g, 'ejemplos')
    .replace(/\bExemplos\b/g, 'Ejemplos')
    .replace(/\bMoscovo\b/g, 'Moscú')
    .replace(/\bBenim\b/g, 'Benín')
    .replace(/\bRússia\b/g, 'Rusia')
    .replace(/\baplicação\b/g, 'aplicación')
    .replace(/\bAplicação\b/g, 'Aplicación')
    .replace(/\bpágina\b/g, 'página')
    .replace(/\becrã\b/g, 'pantalla')
    .replace(/\bEcrã\b/g, 'Pantalla')
    .replace(/\bbotão\b/g, 'botón')
    .replace(/\bBotão\b/g, 'Botón')
    .replace(/\bbotões\b/g, 'botones')
    .replace(/\bBotões\b/g, 'Botones')
    .replace(/\bmenu\b/g, 'menú')
    .replace(/\bMenu\b/g, 'Menú')
    .replace(/\bsítio\b/g, 'sitio')
    .replace(/\bSítio\b/g, 'Sitio')
    .replace(/\btambém\b/g, 'también')
    .replace(/\bTambém\b/g, 'También')
    .replace(/\bainda\b/g, 'aún')
    .replace(/\bAinda\b/g, 'Aún')
    .replace(/\bnão\b/g, 'no')
    .replace(/\bNão\b/g, 'No')
    .replace(/\bsim\b/g, 'sí')
    .replace(/\bSim\b/g, 'Sí')
    .replace(/\bmas\b/g, 'pero')
    .replace(/\bMas\b/g, 'Pero')
    .replace(/\bcom\b/g, 'con')
    .replace(/\bCom\b/g, 'Con')
    .replace(/\bsem\b/g, 'sin')
    .replace(/\bSem\b/g, 'Sin')
    .replace(/\bem\b/g, 'en')
    .replace(/\bEm\b/g, 'En')
    .replace(/\be\b/g, 'y')
    .replace(/\bE\b/g, 'Y')
    .replace(/\bou\b/g, 'o')
    .replace(/\bOu\b/g, 'O')
}

function maskPlaceholders(text) {
  const values = []
  const masked = String(text).replace(/\{[^{}]+\}/g, (m) => {
    values.push(m)
    return `__PH${values.length - 1}__`
  })
  return { masked, values }
}

function unmaskPlaceholders(text, values) {
  let out = text
  values.forEach((v, i) => {
    out = out.split(`__PH${i}__`).join(v)
  })
  return out
}

function ptToEs(ptText) {
  if (ptText == null) return ptText
  if (typeof ptText !== 'string') return ptText
  const { masked, values } = maskPlaceholders(ptText)
  let s = masked
  for (const [from, to] of PHRASES) {
    if (!from) continue
    if (s.includes(from)) s = s.split(from).join(to)
  }
  s = applyMorphology(s)
  // Fix over-aggressive "e" → "y" inside words (morphology may have broken tokens)
  // Re-apply common broken patterns
  s = s
    .replace(/\bymail\b/gi, 'correo')
    .replace(/\bynvío\b/g, 'envío')
    .replace(/\bYnvío\b/g, 'Envío')
    .replace(/\bynvíos\b/g, 'envíos')
    .replace(/\bYnvíos\b/g, 'Envíos')
    .replace(/\bynviar\b/g, 'enviar')
    .replace(/\bYnviar\b/g, 'Enviar')
    .replace(/\bynviado\b/g, 'enviado')
    .replace(/\bYnviado\b/g, 'Enviado')
    .replace(/\byncontrar\b/g, 'encontrar')
    .replace(/\bYncontrar\b/g, 'Encontrar')
    .replace(/\byncontre\b/g, 'encuentre')
    .replace(/\bYncontre\b/g, 'Encuentre')
    .replace(/\byn\b/g, 'en')
    .replace(/\bYn\b/g, 'En')
    .replace(/\bdel a\b/g, 'de la')
    .replace(/\bdel as\b/g, 'de las')
    .replace(/\bdel os\b/g, 'de los')
    .replace(/\ben el a\b/g, 'en la')
    .replace(/\ben el as\b/g, 'en las')
    .replace(/\ben el os\b/g, 'en los')
    .replace(/\bal a\b/g, 'a la')
    .replace(/\bal as\b/g, 'a las')
    .replace(/\bal os\b/g, 'a los')
    .replace(/\byrror\b/g, 'error')
    .replace(/\bYrror\b/g, 'Error')
    .replace(/\bystado\b/g, 'estado')
    .replace(/\bYstado\b/g, 'Estado')
    .replace(/\byspacío\b/g, 'espacio')
    .replace(/\bYspacío\b/g, 'Espacio')
    .replace(/\bysencial\b/g, 'esencial')
    .replace(/\bYsencial\b/g, 'Esencial')
    .replace(/\byxplor\b/g, 'explor')
    .replace(/\byxplorar\b/g, 'explorar')
    .replace(/\bYxplorar\b/g, 'Explorar')
    .replace(/\byscrever\b/g, 'escribir')
    .replace(/\bYscrever\b/g, 'Escribir')
    .replace(/\byscolh\b/g, 'eleg')
    .replace(/\bylegir\b/g, 'elegir')
    .replace(/\bYlegir\b/g, 'Elegir')
    .replace(/\byxito\b/g, 'éxito')
    .replace(/\bYxito\b/g, 'Éxito')
    .replace(/\byxito\b/g, 'éxito')
    .replace(/\bynlace\b/g, 'enlace')
    .replace(/\bYnlace\b/g, 'Enlace')
    .replace(/\bynlaces\b/g, 'enlaces')
    .replace(/\bYnlaces\b/g, 'Enlaces')
    .replace(/\byjemplo\b/g, 'ejemplo')
    .replace(/\bYjemplo\b/g, 'Ejemplo')
    .replace(/\byjemplos\b/g, 'ejemplos')
    .replace(/\bYjemplos\b/g, 'Ejemplos')
    .replace(/\byj\./g, 'ej.')
    .replace(/\bYj\./g, 'Ej.')
    .replace(/\byj:/g, 'ej:')
    .replace(/\bYj:/g, 'Ej:')
    .replace(/\byvent\b/g, 'event')
    .replace(/\byvento\b/g, 'evento')
    .replace(/\bYvento\b/g, 'Evento')
    .replace(/\byventos\b/g, 'eventos')
    .replace(/\bYventos\b/g, 'Eventos')
    .replace(/\bympresa\b/g, 'empresa')
    .replace(/\bYmpresa\b/g, 'Empresa')
    .replace(/\bympresas\b/g, 'empresas')
    .replace(/\bYmpresas\b/g, 'Empresas')
    .replace(/\bympleo\b/g, 'empleo')
    .replace(/\bYmpleo\b/g, 'Empleo')
    .replace(/\bympleos\b/g, 'empleos')
    .replace(/\bYmpleos\b/g, 'Empleos')
    .replace(/\byspacío profesional\b/g, 'espacio profesional')
    .replace(/\bYspacío profesional\b/g, 'Espacio profesional')
    .replace(/\by n\b/g, 'en')
    .replace(/\bY n\b/g, 'En')
    // Portuguese "ou" became "o" too aggressively in mid-sentence — leave as is for now
  return unmaskPlaceholders(s, values)
}


function flatten(node, prefix = "", out = {}) {
  if (node == null || typeof node !== "object" || Array.isArray(node)) {
    if (prefix) out[prefix] = node;
    return out;
  }
  for (const [k, v] of Object.entries(node)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === "object" && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

function setPath(root, dotted, value) {
  const parts = dotted.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (node[key] == null || typeof node[key] !== "object" || Array.isArray(node[key])) node[key] = {};
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
}

function escapeString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function serialize(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);
  if (typeof value === "string") return `"${escapeString(value)}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((v) => typeof v === "string")) {
      return `[\n${value.map((v) => `${padInner}"${escapeString(v)}",`).join("\n")}\n${pad}]`;
    }
    return `[\n${value.map((v) => `${padInner}${serialize(v, indent + 1)},`).join("\n")}\n${pad}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  return `{\n${entries
    .map(([k, v]) => {
      const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${padInner}${key}: ${serialize(v, indent + 1)},`;
    })
    .join("\n")}\n${pad}}`;
}

export { flatten, setPath, serialize, ptToEs };
