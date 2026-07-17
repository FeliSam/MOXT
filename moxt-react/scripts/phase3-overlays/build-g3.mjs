import fs from 'fs'
import { writeOverlay } from './writeOverlay.mjs'

/** Remaining g3 translations: key → [en, ru, pt] */
const T = {
  'messages.empty.title': ['No conversations yet', 'Пока нет переписок', 'Ainda sem conversas'],
  'messages.empty.description': [
    'Contact a seller, traveller or professional from a MOXT page to start a chat.',
    'Свяжитесь с продавцом, путешественником или специалистом со страницы MOXT, чтобы начать общение.',
    'Contacte um vendedor, viajante ou profissional a partir de uma ficha MOXT para iniciar uma conversa.',
  ],
  'messages.notFound.title': ['Conversation unavailable', 'Переписка недоступна', 'Conversa indisponível'],
  'messages.notFound.description': [
    'This thread does not exist or is no longer accessible from this link.',
    'Эта переписка не существует или больше недоступна по этой ссылке.',
    'Este tópico não existe ou já não está acessível a partir desta ligação.',
  ],
  'messages.notFound.back': ['Back to conversations', 'К перепискам', 'Voltar às conversas'],
  'messages.exchangeCount': ['{count} exchange(s)', '{count} обмен(ов)', '{count} troca(s)'],
  'messages.unreadCount': [' · {count} unread', ' · {count} непрочит.', ' · {count} não lida'],
  'messages.unreadCountPlural': [' · {count} unread', ' · {count} непрочит.', ' · {count} não lidas'],
  'messages.showSuggestions': ['Show suggestions', 'Показать подсказки', 'Mostrar sugestões'],
  'messages.hideSuggestions': ['Hide suggestions', 'Скрыть подсказки', 'Ocultar sugestões'],
  'messages.conversationOptionsAria': ['Conversation options', 'Параметры переписки', 'Opções da conversa'],
  'messages.archivedBanner': [
    'Conversation archived — you can restore it from the ⋯ menu',
    'Переписка в архиве — восстановите её из меню ⋯',
    'Conversa arquivada — pode restaurá-la a partir do menu ⋯',
  ],
  'messages.blockedBanner': [
    'This conversation is blocked. You can no longer send messages.',
    'Эта переписка заблокирована. Отправка сообщений недоступна.',
    'Esta conversa está bloqueada. Já não pode enviar mensagens.',
  ],
  'messages.removeAllVisible': ['Remove all', 'Убрать все', 'Remover tudo'],
  'messages.replyToListingLabel': ['Reply to listing', 'Ответ на объявление', 'Resposta ao anúncio'],
  'messages.replyToMessage': ['Reply to {name}', 'Ответ {name}', 'Resposta a {name}'],
  'messages.replyToMessageFallback': ['a message', 'сообщение', 'uma mensagem'],
  'messages.editingTitle': ['Editing message', 'Редактирование сообщения', 'A editar a mensagem'],
  'messages.editingHint': [
    'Edit the text then confirm to save.',
    'Измените текст и подтвердите сохранение.',
    'Edite o texto e confirme para guardar.',
  ],
  'messages.draftSaved': ['Draft saved', 'Черновик сохранён', 'Rascunho guardado'],
  'messages.youPrefix': ['You: ', 'Вы: ', 'Você: '],
  'messages.startConversation': ['Start the conversation', 'Начните переписку', 'Inicie a conversa'],
  'messages.messageCount': ['{count} message', '{count} сообщение', '{count} mensagem'],
  'messages.messageCountPlural': ['{count} messages', '{count} сообщений', '{count} mensagens'],
  'messages.unreadSeparator': ['Unread message', 'Непрочитанное сообщение', 'Mensagem não lida'],
  'messages.unreadSeparatorPlural': [
    '{count} unread messages',
    '{count} непрочитанных сообщений',
    '{count} mensagens não lidas',
  ],
  'messages.threadStart': ['Start of conversation', 'Начало переписки', 'Início da conversa'],
  'messages.securityTitle': ['Safety tips', 'Правила безопасности', 'Indicações de segurança'],
  'messages.activity.new': ['New conversation', 'Новая переписка', 'Nova conversa'],
  'messages.activity.recent': ['Active recently', 'Недавно в сети', 'Ativo recentemente'],
  'messages.activity.seenMinutes': ['Seen {minutes} min ago', 'Был(а) {minutes} мин назад', 'Visto há {minutes} min'],
  'messages.activity.activeToday': ["Active today · {time}", 'Сегодня в сети · {time}', "Ativo hoje · {time}"],
  'messages.activity.activeYesterday': ['Active yesterday', 'Вчера в сети', 'Ativo ontem'],
  'messages.activity.last': ['Last activity · {time}', 'Последняя активность · {time}', 'Última atividade · {time}'],
  'messages.assistant.name': ['MOXT Assistant', 'Ассистент MOXT', 'Assistente MOXT'],
  'messages.assistant.alwaysThere': ['Always here', 'Всегда на связи', 'Sempre disponível'],
  'messages.assistant.preview': [
    'How can I help you today?',
    'Чем могу помочь сегодня?',
    'Como posso ajudar hoje?',
  ],
  'messages.assistant.subtitle': [
    'Local contextual assistant',
    'Локальный контекстный ассистент',
    'Assistente local contextual',
  ],
  'messages.assistant.greeting': [
    'Hello — I can search your MOXT data and guide you to the right action.',
    'Здравствуйте! Могу искать по вашим данным MOXT и подсказать нужное действие.',
    'Olá — posso pesquisar nos seus dados MOXT e guiá-lo para a ação certa.',
  ],
  'messages.assistant.backAria': ['Back to conversations', 'К перепискам', 'Voltar às conversas'],
  'messages.assistant.clearHistoryAria': ['Clear history', 'Очистить историю', 'Limpar histórico'],
  'messages.assistant.removeDocAria': ['Remove document', 'Убрать документ', 'Remover documento'],
  'messages.assistant.placeholder': [
    'Ask the assistant something…',
    'Спросите ассистента…',
    'Peça algo ao assistente…',
  ],
  'messages.assistant.sendAria': ['Send to assistant', 'Отправить ассистенту', 'Enviar ao assistente'],
  'messages.assistant.sources': ['Sources: {list}', 'Источники: {list}', 'Fontes: {list}'],
  'messages.assistant.error': [
    'The local assistant could not reply. {detail}',
    'Локальный ассистент не смог ответить. {detail}',
    'O assistente local não conseguiu responder. {detail}',
  ],
  'messages.assistant.suggestions.transfer': [
    'How do I make a money transfer?',
    'Как сделать денежный перевод?',
    'Como efetuar uma transferência de dinheiro?',
  ],
  'messages.assistant.suggestions.publishListing': [
    'How do I publish a marketplace listing?',
    'Как опубликовать объявление на маркетплейсе?',
    'Como publicar um anúncio no marketplace?',
  ],
  'messages.assistant.suggestions.parcel': [
    'How do I send a parcel with a traveller?',
    'Как отправить посылку через путешественника?',
    'Como enviar uma encomenda através de um viajante?',
  ],
  'messages.assistant.suggestions.verify': [
    'How do I verify my identity?',
    'Как подтвердить личность?',
    'Como verificar a minha identidade?',
  ],
  'messages.assistant.suggestions.dispute': [
    'How do I contact support for a dispute?',
    'Как связаться с поддержкой при споре?',
    'Como contactar o suporte em caso de litígio?',
  ],
  'messages.assistant.suggestions.business': [
    'How do I create a business account?',
    'Как создать бизнес-аккаунт?',
    'Como criar uma conta profissional?',
  ],
  'messages.attachment.photo': ['📷 Photo', '📷 Фото', '📷 Foto'],
  'messages.attachment.photos': ['📷 {count} photos', '📷 {count} фото', '📷 {count} fotos'],
  'messages.attachment.file': ['📎 {name}', '📎 {name}', '📎 {name}'],
  'messages.attachment.searchPhoto': ['photo image', 'фото изображение', 'foto imagem'],
  'messages.attachment.searchPhotos': [
    '{count} photos photo images',
    '{count} фото изображения',
    '{count} fotos foto imagens',
  ],
  'messages.attachment.searchFileFallback': ['attachment', 'вложение', 'anexo'],
  'messages.sendFailedBanner': ['Send failed', 'Ошибка отправки', 'Falha de envio'],
  'messages.notSynced': ['Not synced', 'Не синхронизировано', 'Não sincronizado'],
  'messages.deleteConfirmDescription': [
    'The message will be removed from your conversation. This cannot be undone.',
    'Сообщение будет удалено из переписки. Действие необратимо.',
    'A mensagem será removida da sua conversa. Esta ação é definitiva.',
  ],
  'messages.threadEmptyTitle': ['No messages yet', 'Пока нет сообщений', 'Ainda sem mensagens'],
  'messages.threadEmptyDescription': [
    'Write the first message to start the exchange.',
    'Напишите первое сообщение, чтобы начать общение.',
    'Escreva a primeira mensagem para iniciar a troca.',
  ],
  'messages.searchNoMatch': [
    'No messages match your search.',
    'Нет сообщений по вашему запросу.',
    'Nenhuma mensagem corresponde à sua pesquisa.',
  ],
  'communications.snapshot.transferTitle': ['Transfer {id}', 'Перевод {id}', 'Transferência {id}'],
  'communications.snapshot.rate': ['Rate {rate}', 'Курс {rate}', 'Taxa {rate}'],
  'communications.snapshot.amount': ['Amount {amount}', 'Сумма {amount}', 'Montante {amount}'],
  'communications.chips.business.services': [
    'Hello, what services do you offer?',
    'Здравствуйте, какие услуги вы предлагаете?',
    'Olá, que serviços oferecem?',
  ],
  'communications.chips.business.hours': [
    'What are your opening hours?',
    'Какой у вас график работы?',
    'Qual é o vosso horário?',
  ],
  'communications.chips.business.quote': [
    'I would like a quote.',
    'Хочу получить коммерческое предложение.',
    'Gostaria de obter um orçamento.',
  ],
  'communications.chips.event.seats': [
    'Hello, are there seats left?',
    'Здравствуйте, есть ещё места?',
    'Olá, ainda há lugares?',
  ],
  'communications.chips.event.register': [
    'How does registration work?',
    'Как проходит регистрация?',
    'Como funciona a inscrição?',
  ],
  'communications.chips.event.access': [
    'Is the venue accessible?',
    'Место проведения доступно?',
    'O local é acessível?',
  ],
  'communications.chips.job.available': [
    'Hello, is the position still open?',
    'Здравствуйте, вакансия ещё открыта?',
    'Olá, a vaga ainda está disponível?',
  ],
  'communications.chips.job.cv': [
    'May I send my CV?',
    'Могу отправить резюме?',
    'Posso enviar o meu CV?',
  ],
  'communications.chips.job.process': [
    'What is the hiring process?',
    'Какой процесс найма?',
    'Qual é o processo de recrutamento?',
  ],
  'communications.chips.listing.available': [
    'Hello, is this listing still available?',
    'Здравствуйте, объявление ещё актуально?',
    'Olá, este anúncio ainda está disponível?',
  ],
  'communications.chips.listing.price': [
    'Is the price negotiable?',
    'Цена обсуждается?',
    'O preço é negociável?',
  ],
  'communications.chips.listing.details': [
    'Can you share more details?',
    'Можете рассказать подробнее?',
    'Pode partilhar mais detalhes?',
  ],
  'communications.chips.parcel.kg': [
    'Hello, how many kilos are still available?',
    'Здравствуйте, сколько кг ещё свободно?',
    'Olá, quantos quilos ainda estão disponíveis?',
  ],
  'communications.chips.parcel.delay': [
    'What is the expected timeline?',
    'Какой планируемый срок?',
    'Qual é o prazo previsto?',
  ],
  'communications.chips.parcel.items': [
    'What items do you accept?',
    'Что вы принимаете к перевозке?',
    'Que objetos aceitam?',
  ],
  'communications.chips.transfer.status': [
    'Hello, can you confirm the payment status?',
    'Здравствуйте, подтвердите статус оплаты?',
    'Olá, pode confirmar o estado do pagamento?',
  ],
  'communications.chips.transfer.proof': [
    'Is the payment proof enough?',
    'Достаточно ли доказательства оплаты?',
    'A prova de pagamento é suficiente?',
  ],
  'communications.chips.transfer.deadline': [
    'How much time is left to complete the transfer?',
    'Сколько времени осталось на завершение перевода?',
    'Qual é o prazo restante para finalizar a transferência?',
  ],
  'communications.chips.p2p.available': [
    'Hello, is this offer still available?',
    'Здравствуйте, предложение ещё актуально?',
    'Olá, esta oferta ainda está disponível?',
  ],
  'communications.chips.p2p.payment': [
    'Which payment method do you prefer?',
    'Какой способ оплаты вам удобнее?',
    'Que modo de pagamento prefere?',
  ],
  'communications.chips.p2p.rate': [
    'Can you confirm the rate?',
    'Подтвердите курс?',
    'Pode confirmar a taxa?',
  ],
  'communications.chips.general.more': [
    'Hello, I would like to know more.',
    'Здравствуйте, хочу узнать подробнее.',
    'Olá, gostaria de saber mais.',
  ],
  'communications.chips.general.thanks': [
    'Thank you for your message.',
    'Спасибо за сообщение.',
    'Obrigado pela sua mensagem.',
  ],
  'communications.chips.general.clarify': [
    'Could you clarify your request?',
    'Уточните, пожалуйста, ваш запрос.',
    'Pode precisar o seu pedido?',
  ],
  'messages.suggestions.fallback.listing': ['this listing', 'это объявление', 'este anúncio'],
  'messages.suggestions.fallback.job': ['this position', 'эту вакансию', 'este posto'],
  'messages.suggestions.fallback.parcel': ['this trip', 'этот маршрут', 'este trajeto'],
  'messages.suggestions.fallback.event': ['this event', 'это событие', 'este evento'],
  'messages.suggestions.fallback.business': ['your business', 'вашу компанию', 'a sua empresa'],
  'messages.suggestions.listing.owner.thanks': [
    'Hello, thank you for your interest in “{item}”.',
    'Здравствуйте, спасибо за интерес к «{item}».',
    'Olá, obrigado pelo interesse em «{item}».',
  ],
  'messages.suggestions.listing.owner.available': [
    'Hello {peer}, the item is still available.',
    'Здравствуйте, {peer}! Товар ещё доступен.',
    'Olá {peer}, o artigo ainda está disponível.',
  ],
  'messages.suggestions.listing.owner.price': [
    'The listed price ({subtitle}) still applies.',
    'Указанная цена ({subtitle}) актуальна.',
    'O preço indicado ({subtitle}) mantém-se válido.',
  ],
  'messages.suggestions.listing.owner.details': [
    'I can share more details about the item.',
    'Могу рассказать подробнее о товаре.',
    'Posso dar mais detalhes sobre o artigo.',
  ],
  'messages.suggestions.listing.owner.questions': [
    'Feel free to ask if you have more questions.',
    'Пишите, если остались вопросы.',
    'Não hesite se tiver outras perguntas.',
  ],
  'messages.suggestions.listing.contact.available': [
    'Hello, is “{item}” still available?',
    'Здравствуйте, «{item}» ещё доступно?',
    'Olá, «{item}» ainda está disponível?',
  ],
  'messages.suggestions.listing.contact.price': [
    'Hello, is the listed price ({subtitle}) negotiable?',
    'Здравствуйте, цена ({subtitle}) обсуждается?',
    'Olá, o preço indicado ({subtitle}) é negociável?',
  ],
  'messages.suggestions.listing.contact.details': [
    'Hello, can you give me more details?',
    'Здравствуйте, расскажите подробнее?',
    'Olá, pode dar-me mais detalhes?',
  ],
  'messages.suggestions.listing.contact.interest': [
    'Hello {peer}, I am interested in this listing.',
    'Здравствуйте, {peer}! Мне интересно это объявление.',
    'Olá {peer}, estou interessado(a) neste anúncio.',
  ],
  'messages.suggestions.listing.contact.visit': [
    'Would it be possible to arrange a visit or trial?',
    'Можно организовать осмотр или примерку?',
    'Seria possível organizar uma visita ou um ensaio?',
  ],
  'messages.suggestions.listing.contact.location': [
    'Where would handover take place?',
    'Где можно забрать товар?',
    'Qual é a localização para a entrega?',
  ],
  'messages.suggestions.listing.contact.payment': [
    'Do you accept secure payment via MOXT?',
    'Принимаете безопасную оплату через MOXT?',
    'Aceita pagamento seguro via MOXT?',
  ],
  'messages.suggestions.job.owner.thanks': [
    'Hello, thank you for applying to “{item}”.',
    'Здравствуйте, спасибо за отклик на «{item}».',
    'Olá, obrigado pela candidatura a «{item}».',
  ],
  'messages.suggestions.job.owner.open': [
    'Hello {peer}, the position is still open.',
    'Здравствуйте, {peer}! Вакансия ещё открыта.',
    'Olá {peer}, a vaga ainda está aberta.',
  ],
  'messages.suggestions.job.owner.cv': [
    'Could you send your CV and a short introduction?',
    'Пришлите резюме и краткое представление?',
    'Pode enviar o seu CV e uma breve apresentação?',
  ],
  'messages.suggestions.job.owner.sector': [
    'The sector we are looking for: {subtitle}.',
    'Искомый сектор: {subtitle}.',
    'O setor pretendido: {subtitle}.',
  ],
  'messages.suggestions.job.owner.profile': [
    'I am available to discuss the profile we need.',
    'Готов обсудить нужный профиль.',
    'Estou disponível para falar sobre o perfil pretendido.',
  ],
  'messages.suggestions.job.contact.available': [
    'Hello, is the “{item}” position still open?',
    'Здравствуйте, вакансия «{item}» ещё открыта?',
    'Olá, a vaga «{item}» ainda está disponível?',
  ],
  'messages.suggestions.job.contact.apply': [
    'Hello {peer}, I would like to apply for this role.',
    'Здравствуйте, {peer}! Хочу откликнуться на вакансию.',
    'Olá {peer}, gostaria de me candidatar a esta oferta.',
  ],
  'messages.suggestions.job.contact.process': [
    'Could you explain the hiring process?',
    'Расскажите о процессе найма?',
    'Pode precisar o processo de recrutamento?',
  ],
  'messages.suggestions.job.contact.sector': [
    'The “{subtitle}” field fits me well.',
    'Сфера «{subtitle}» мне подходит.',
    'A área «{subtitle}» encaixa bem comigo.',
  ],
  'messages.suggestions.job.contact.cv': [
    'I can send my CV right away.',
    'Могу сразу отправить резюме.',
    'Posso enviar o meu CV de imediato.',
  ],
  'messages.suggestions.parcel.owner.thanks': [
    'Hello, thank you for your message about {item}.',
    'Здравствуйте, спасибо за сообщение по {item}.',
    'Olá, obrigado pela mensagem sobre {item}.',
  ],
  'messages.suggestions.parcel.owner.space': [
    'Hello {peer}, there is still space available.',
    'Здравствуйте, {peer}! Место ещё есть.',
    'Olá {peer}, ainda há espaço disponível.',
  ],
  'messages.suggestions.parcel.owner.rate': [
    'Current rate: {subtitle}.',
    'Текущий тариф: {subtitle}.',
    'Tarifa atual: {subtitle}.',
  ],
  'messages.suggestions.parcel.owner.weight': [
    'Please tell me the weight and contents of your parcel.',
    'Укажите вес и содержимое посылки.',
    'Indique-me o peso e o conteúdo da sua encomenda.',
  ],
  'messages.suggestions.parcel.owner.deadlines': [
    'What are your drop-off and pick-up deadlines?',
    'Какие сроки сдачи и получения?',
    'Quais são os prazos de depósito e de levantamento?',
  ],
  'messages.suggestions.parcel.contact.space': [
    'Hello, do you still have space for {item}?',
    'Здравствуйте, есть ещё место для {item}?',
    'Olá, ainda tem espaço para {item}?',
  ],
  'messages.suggestions.parcel.contact.rate': [
    'The listed rate ({subtitle}) works for me.',
    'Тариф ({subtitle}) мне подходит.',
    'A tarifa indicada ({subtitle}) serve-me.',
  ],
  'messages.suggestions.parcel.contact.book': [
    'Hello {peer}, I would like to book a shipment.',
    'Здравствуйте, {peer}! Хочу забронировать отправку.',
    'Olá {peer}, gostaria de reservar um envio.',
  ],
  'messages.suggestions.parcel.contact.items': [
    'What types of items do you accept?',
    'Какие предметы вы принимаете?',
    'Que tipos de objetos aceitam?',
  ],
  'messages.suggestions.parcel.contact.dates': [
    'Can you confirm departure and arrival dates?',
    'Подтвердите даты отправления и прибытия?',
    'Pode confirmar as datas de partida e de chegada?',
  ],
  'messages.suggestions.event.owner.thanks': [
    'Hello, thank you for your interest in “{item}”.',
    'Здравствуйте, спасибо за интерес к «{item}».',
    'Olá, obrigado pelo interesse em «{item}».',
  ],
  'messages.suggestions.event.owner.seats': [
    'Hello {peer}, seats are still available.',
    'Здравствуйте, {peer}! Места ещё есть.',
    'Olá {peer}, ainda há lugares disponíveis.',
  ],
  'messages.suggestions.event.owner.access': [
    'Price / access: {subtitle}.',
    'Стоимость / доступ: {subtitle}.',
    'Preço / acesso: {subtitle}.',
  ],
  'messages.suggestions.event.owner.explain': [
    'I can explain how the event works.',
    'Могу рассказать, как проходит событие.',
    'Posso explicar o desenrolar do evento.',
  ],
  'messages.suggestions.event.owner.program': [
    'Would you like me to send the programme?',
    'Отправить программу?',
    'Quer que eu envie o programa?',
  ],
  'messages.suggestions.event.contact.seats': [
    'Hello, are there seats left for “{item}”?',
    'Здравствуйте, есть места на «{item}»?',
    'Olá, ainda há lugares para «{item}»?',
  ],
  'messages.suggestions.event.contact.register': [
    'Hello {peer}, how do I register for the event?',
    'Здравствуйте, {peer}! Как записаться на событие?',
    'Olá {peer}, como me inscrevo no evento?',
  ],
  'messages.suggestions.event.contact.access': [
    'About access: {subtitle}.',
    'По доступу: {subtitle}.',
    'Sobre o acesso: {subtitle}.',
  ],
  'messages.suggestions.event.contact.place': [
    'Could you confirm the venue and time?',
    'Уточните место и время?',
    'Pode precisar o local e o horário?',
  ],
  'messages.suggestions.event.contact.public': [
    'Is the event accessible and open to the public?',
    'Событие доступно и открыто для публики?',
    'O evento é acessível e aberto ao público?',
  ],
  'messages.suggestions.business.owner.thanks': [
    'Hello, thank you for your message.',
    'Здравствуйте, спасибо за сообщение.',
    'Olá, obrigado pela sua mensagem.',
  ],
  'messages.suggestions.business.owner.help': [
    'Hello {peer}, how can I help you?',
    'Здравствуйте, {peer}! Чем могу помочь?',
    'Olá {peer}, como posso ajudar?',
  ],
  'messages.suggestions.business.owner.about': [
    'We would be happy to answer your questions about {item}.',
    'С радостью ответим на вопросы о {item}.',
    'Teremos todo o gosto em responder às suas perguntas sobre {item}.',
  ],
  'messages.suggestions.business.owner.meeting': [
    'Would you like an appointment or a custom quote?',
    'Нужна встреча или индивидуальный расчёт?',
    'Gostaria de uma reunião ou de um orçamento personalizado?',
  ],
  'messages.suggestions.business.contact.services': [
    'Hello, what services does {item} offer?',
    'Здравствуйте, какие услуги предлагает {item}?',
    'Olá, que serviços oferece {item}?',
  ],
  'messages.suggestions.business.contact.hours': [
    'Hello {peer}, could you share your opening hours?',
    'Здравствуйте, {peer}! Подскажите график работы.',
    'Olá {peer}, pode indicar o horário?',
  ],
  'messages.suggestions.business.contact.quote': [
    'I would like a quote — is that possible?',
    'Можно получить коммерческое предложение?',
    'Gostaria de um orçamento — é possível?',
  ],
  'messages.suggestions.business.contact.custom': [
    'Do you offer a service tailored to my needs?',
    'Есть услуга под мой запрос?',
    'Oferecem um serviço adaptado à minha necessidade?',
  ],
  'messages.suggestions.transfer.owner.status': [
    'Hello {peer}, I am checking the status of your transfer.',
    'Здравствуйте, {peer}! Смотрю статус вашего перевода.',
    'Olá {peer}, estou a consultar o estado da sua transferência.',
  ],
  'messages.suggestions.transfer.owner.received': [
    'Can you confirm receipt of the funds?',
    'Подтвердите получение средств?',
    'Pode confirmar a receção dos fundos?',
  ],
  'messages.suggestions.transfer.owner.proof': [
    'Have you sent the payment proof?',
    'Вы отправили доказательство оплаты?',
    'Já enviou a prova de pagamento?',
  ],
  'messages.suggestions.transfer.owner.safe': [
    'I remain available to complete the operation safely.',
    'Готов безопасно завершить операцию.',
    'Mantenho-me disponível para finalizar a operação em segurança.',
  ],
  'messages.suggestions.transfer.contact.status': [
    'Hello, can you confirm the transfer status?',
    'Здравствуйте, подтвердите статус перевода?',
    'Olá, pode confirmar o estado da transferência?',
  ],
  'messages.suggestions.transfer.contact.proof': [
    'Hello {peer}, is the payment proof enough?',
    'Здравствуйте, {peer}! Достаточно ли доказательства оплаты?',
    'Olá {peer}, a prova de pagamento é suficiente?',
  ],
  'messages.suggestions.transfer.contact.deadline': [
    'How much time is left to complete the operation?',
    'Сколько времени осталось на завершение операции?',
    'Qual é o prazo restante para finalizar a operação?',
  ],
  'messages.suggestions.transfer.contact.update': [
    'Please keep me updated on progress.',
    'Держите меня в курсе прогресса.',
    'Obrigado por me manter informado(a) do andamento.',
  ],
  'messages.suggestions.p2p.owner.active': [
    'Hello {peer}, my offer is still active.',
    'Здравствуйте, {peer}! Предложение ещё активно.',
    'Olá {peer}, a minha oferta ainda está ativa.',
  ],
  'messages.suggestions.p2p.owner.rate': [
    'The proposed rate is {subtitle}.',
    'Предложенный курс: {subtitle}.',
    'A taxa proposta é {subtitle}.',
  ],
  'messages.suggestions.p2p.owner.terms': [
    'I can confirm the exchange terms.',
    'Могу подтвердить условия обмена.',
    'Posso confirmar as condições da troca.',
  ],
  'messages.suggestions.p2p.owner.payment': [
    'Which payment method do you prefer?',
    'Какой способ оплаты вам удобнее?',
    'Que modo de pagamento prefere?',
  ],
  'messages.suggestions.p2p.owner.safe': [
    'Let’s stay careful and exchange only via MOXT.',
    'Будьте осторожны и меняйтесь только через MOXT.',
    'Mantemo-nos atentos e trocamos apenas via MOXT.',
  ],
  'messages.suggestions.p2p.contact.available': [
    'Hello, is your offer still available?',
    'Здравствуйте, предложение ещё актуально?',
    'Olá, a sua oferta ainda está disponível?',
  ],
  'messages.suggestions.p2p.contact.rate': [
    'The listed rate ({subtitle}) works for me.',
    'Курс ({subtitle}) мне подходит.',
    'A taxa indicada ({subtitle}) serve-me.',
  ],
  'messages.suggestions.p2p.contact.exchange': [
    'Hello {peer}, I would like to exchange with you.',
    'Здравствуйте, {peer}! Хочу обменяться с вами.',
    'Olá {peer}, gostaria de trocar consigo.',
  ],
  'messages.suggestions.p2p.contact.payment': [
    'Which payment methods do you accept?',
    'Какие способы оплаты вы принимаете?',
    'Que modos de pagamento aceita?',
  ],
  'messages.suggestions.p2p.contact.confirm': [
    'Can you confirm the amount and terms?',
    'Подтвердите сумму и условия?',
    'Pode confirmar o montante e as condições?',
  ],
  'messages.suggestions.general.owner.thanks': [
    'Hello {peer}, thank you for your message.',
    'Здравствуйте, {peer}! Спасибо за сообщение.',
    'Olá {peer}, obrigado pela sua mensagem.',
  ],
  'messages.suggestions.general.owner.help': [
    'How can I help you?',
    'Чем могу помочь?',
    'Como posso ajudar?',
  ],
  'messages.suggestions.general.owner.available': [
    'I remain available to answer your questions.',
    'Готов ответить на ваши вопросы.',
    'Mantenho-me disponível para responder às suas perguntas.',
  ],
  'messages.suggestions.general.contact.more': [
    'Hello {peer}, I would like to know more.',
    'Здравствуйте, {peer}! Хочу узнать подробнее.',
    'Olá {peer}, gostaria de saber mais.',
  ],
  'messages.suggestions.general.contact.thanks': [
    'Thank you for your reply.',
    'Спасибо за ответ.',
    'Obrigado pelo seu retorno.',
  ],
  'messages.suggestions.general.contact.clarify': [
    'Could you clarify your request?',
    'Уточните, пожалуйста, ваш запрос.',
    'Pode precisar o seu pedido?',
  ],
}

const existing = JSON.parse(fs.readFileSync('key-overrides.json', 'utf8'))
Object.assign(existing, T)
fs.writeFileSync('key-overrides.json', JSON.stringify(existing))
console.log('overrides now', Object.keys(existing).length)

// rebuild g3
const fr = JSON.parse(fs.readFileSync('g3-fr.json', 'utf8'))
const partial = JSON.parse(fs.readFileSync('g3-partial-rows.json', 'utf8'))
const byKey = Object.fromEntries(partial.map((r) => [r[0], r]))
const rows = []
const missing = []
for (const key of Object.keys(fr)) {
  if (byKey[key]) rows.push(byKey[key])
  else if (existing[key]) rows.push([key, ...existing[key]])
  else if (T[key]) rows.push([key, ...T[key]])
  else missing.push(key)
}
console.log('g3', rows.length, 'missing', missing.length)
if (missing.length === 0) writeOverlay('g3', rows)
else console.log(missing.slice(0, 20))
