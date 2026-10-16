-- 0018 — Catálogo de presentes: cotas prontas que o casal adiciona à lista com um clique
-- em /presentes. Seguro para re-executar (o seed atualiza os itens pelo id).
--
-- O catálogo é só um ponto de partida: ao adicionar, o servidor copia o item para
-- weddings.content.gifts (como qualquer cota) e a cópia fica do casal, editável. Mudar ou
-- desativar um item aqui não mexe nas listas que já o usam.
--
-- Fotos: Pexels (licença Pexels: uso comercial livre, sem atribuição obrigatória), baixadas
-- e servidas pelo próprio Noivar em /assets/presentes — o site do casal não chama terceiros.
-- image_source guarda a página de origem de cada foto.
--
-- Leitura: qualquer conta logada (itens ativos). Escrita: só pelo SQL Editor / service_role.
-- Aplique no SQL Editor do Supabase antes do deploy que lê gift_catalog.

create table if not exists public.gift_catalog (
  id            text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  category      text not null check (char_length(category) between 2 and 40),
  title         text not null check (char_length(title) between 2 and 80),
  description   text not null default '' check (char_length(description) <= 200),
  price         numeric(10, 2) check (price > 0),  -- null = "Valor livre"
  image         text not null check (image like '/assets/presentes/%'),
  image_source  text not null,
  sort          integer not null default 0,
  active        boolean not null default true
);
create index if not exists gift_catalog_sort_idx on public.gift_catalog (sort);

alter table public.gift_catalog enable row level security;
revoke all on public.gift_catalog from anon, authenticated;
grant select on public.gift_catalog to authenticated;
grant all on public.gift_catalog to service_role;

drop policy if exists gift_catalog_read_active on public.gift_catalog;
create policy gift_catalog_read_active on public.gift_catalog
  for select to authenticated using (active);

comment on table public.gift_catalog is
  'Catálogo de cotas de presente sugeridas (painel /presentes). O casal só lê; ao adicionar, a cota é copiada para weddings.content.gifts.';

insert into public.gift_catalog (id, category, title, description, price, image, image_source, sort) values
  ('lua-passagens', 'Lua de mel', 'Passagens da lua de mel', 'Ida e volta para o destino que a gente escolheu a dedo.', 1500, '/assets/presentes/lua-passagens.webp', 'https://www.pexels.com/photo/aerial-view-of-clouds-and-airplane-wing-36705757/', 10),
  ('lua-diaria-hotel', 'Lua de mel', 'Uma diária no hotel', 'Mais uma noite no paraíso, por sua conta.', 650, '/assets/presentes/lua-diaria-hotel.webp', 'https://www.pexels.com/photo/a-couple-lying-on-the-bed-7368344/', 20),
  ('lua-upgrade-suite', 'Lua de mel', 'Upgrade para a suíte', 'Do quarto padrão para a suíte com vista.', 800, '/assets/presentes/lua-upgrade-suite.webp', 'https://www.pexels.com/photo/a-bedroom-with-a-large-glass-window-overlooking-the-sea-28054852/', 30),
  ('lua-cafe-no-quarto', 'Lua de mel', 'Café da manhã no quarto', 'Para começar o dia sem pressa nenhuma.', 180, '/assets/presentes/lua-cafe-no-quarto.webp', 'https://www.pexels.com/photo/meal-and-coffee-with-book-on-table-on-bed-7622591/', 40),
  ('lua-passeio-barco', 'Lua de mel', 'Passeio de barco', 'Um dia inteiro no mar, de praia em praia.', 450, '/assets/presentes/lua-passeio-barco.webp', 'https://www.pexels.com/photo/yellow-and-blue-motorboat-on-sea-12639034/', 50),
  ('lua-mergulho', 'Lua de mel', 'Mergulho para dois', 'Batismo de mergulho com instrutor, para ver os peixes de perto.', 520, '/assets/presentes/lua-mergulho.webp', 'https://www.pexels.com/photo/underwater-photography-of-person-3041867/', 60),
  ('lua-jantar-pe-na-areia', 'Lua de mel', 'Jantar pé na areia', 'Mesa posta na praia, com o pôr do sol de sobremesa.', 380, '/assets/presentes/lua-jantar-pe-na-areia.webp', 'https://www.pexels.com/photo/romantic-dinner-setting-at-sunset-beach-28408459/', 70),
  ('lua-massagem-casal', 'Lua de mel', 'Massagem para o casal', 'Uma hora de spa para descansar da festa.', 420, '/assets/presentes/lua-massagem-casal.webp', 'https://www.pexels.com/photo/white-candle-holder-on-wooden-surface-6186740/', 80),
  ('lua-aluguel-carro', 'Lua de mel', 'Aluguel de carro', 'Para explorar o destino no nosso ritmo.', 600, '/assets/presentes/lua-aluguel-carro.webp', 'https://www.pexels.com/photo/scenic-coastal-road-with-sea-view-and-cars-31881091/', 90),
  ('lua-drinks-piscina', 'Lua de mel', 'Drinks na beira da piscina', 'Uma rodada de drinks com os pés na água.', 150, '/assets/presentes/lua-drinks-piscina.webp', 'https://www.pexels.com/photo/refreshing-cocktails-by-the-pool-at-sunset-27176323/', 100),
  ('jantar-especial', 'Jantares e passeios', 'Jantar especial', 'Uma noite naquele restaurante que a gente sempre quis conhecer.', 280, '/assets/presentes/jantar-especial.webp', 'https://www.pexels.com/photo/white-candle-beside-two-clear-drinking-glasses-1850600/', 110),
  ('garrafa-vinho', 'Jantares e passeios', 'Uma garrafa de vinho', 'Para brindar a primeira noite de casados.', 150, '/assets/presentes/garrafa-vinho.webp', 'https://www.pexels.com/photo/wine-glasses-and-bottles-on-wooden-shelves-11851422/', 120),
  ('rodizio-japones', 'Jantares e passeios', 'Rodízio japonês', 'Sushi até não aguentar mais.', 220, '/assets/presentes/rodizio-japones.webp', 'https://www.pexels.com/photo/a-variety-of-sushi-on-a-plate-7719911/', 130),
  ('cinema-pipoca', 'Jantares e passeios', 'Cinema com pipoca', 'Dois ingressos, pipoca grande e refrigerante.', 90, '/assets/presentes/cinema-pipoca.webp', 'https://www.pexels.com/photo/close-up-shot-of-popcorns-beside-a-vintage-video-recorder-8652476/', 140),
  ('ingressos-show', 'Jantares e passeios', 'Ingressos para um show', 'Para cantar junto, desafinando, a nossa banda preferida.', 400, '/assets/presentes/ingressos-show.webp', 'https://www.pexels.com/photo/photo-of-concert-band-during-night-time-167605/', 150),
  ('piquenique', 'Jantares e passeios', 'Piquenique no parque', 'Toalha xadrez, cesta cheia e uma tarde à toa.', 120, '/assets/presentes/piquenique.webp', 'https://www.pexels.com/photo/picnic-in-a-park-16564695/', 160),
  ('pizza-sexta', 'Jantares e passeios', 'Um mês de pizza às sextas', 'Quatro sextas-feiras de pizza no sofá.', 300, '/assets/presentes/pizza-sexta.webp', 'https://www.pexels.com/photo/delicious-margherita-pizza-with-fresh-toppings-31596394/', 170),
  ('sofa-novo', 'Casa nova', 'Sofá novo', 'O lugar onde a gente vai assistir a todas as séries.', 2500, '/assets/presentes/sofa-novo.webp', 'https://www.pexels.com/photo/modern-apartment-with-stylish-couch-and-creative-decorative-elements-4846097/', 180),
  ('colchao-novo', 'Casa nova', 'Colchão novo', 'Noites bem dormidas pelos próximos dez anos.', 2000, '/assets/presentes/colchao-novo.webp', 'https://www.pexels.com/photo/white-bed-with-pillows-3755590/', 190),
  ('jogo-de-cama', 'Casa nova', 'Jogo de cama', 'Lençóis de algodão para a cama nova.', 350, '/assets/presentes/jogo-de-cama.webp', 'https://www.pexels.com/photo/stack-of-clean-white-bedding-linens-31902663/', 200),
  ('jogo-toalhas', 'Casa nova', 'Jogo de toalhas', 'Toalhas macias para o banheiro novo.', 220, '/assets/presentes/jogo-toalhas.webp', 'https://www.pexels.com/photo/white-and-maroon-rugs-45980/', 210),
  ('geladeira', 'Casa nova', 'Geladeira', 'A geladeira da casa nova, para encher de comida boa.', 3000, '/assets/presentes/geladeira.webp', 'https://www.pexels.com/photo/domestic-kitchen-4469164/', 220),
  ('maquina-lavar', 'Casa nova', 'Máquina de lavar', 'Porque a roupa não vai se lavar sozinha.', 2400, '/assets/presentes/maquina-lavar.webp', 'https://www.pexels.com/photo/washing-machines-in-house-17158638/', 230),
  ('smart-tv', 'Casa nova', 'Smart TV', 'Para as maratonas de série no fim de semana.', 2800, '/assets/presentes/smart-tv.webp', 'https://www.pexels.com/photo/tv-on-wall-in-room-10078142/', 240),
  ('aspirador-robo', 'Casa nova', 'Aspirador robô', 'Ele limpa, a gente descansa.', 1200, '/assets/presentes/aspirador-robo.webp', 'https://www.pexels.com/photo/white-round-robot-vacuum-on-gray-tiled-floor-7641488/', 250),
  ('plantas-casa', 'Casa nova', 'Plantas para a casa', 'Um pouco de verde em cada canto.', 160, '/assets/presentes/plantas-casa.webp', 'https://www.pexels.com/photo/green-potted-plants-on-a-window-11633598/', 260),
  ('tapete-sala', 'Casa nova', 'Tapete da sala', 'Para deixar a sala com cara de lar.', 600, '/assets/presentes/tapete-sala.webp', 'https://www.pexels.com/photo/brown-couch-in-the-living-room-8584020/', 270),
  ('air-fryer', 'Cozinha', 'Air fryer', 'Batata frita sem culpa, toda semana.', 450, '/assets/presentes/air-fryer.webp', 'https://www.pexels.com/photo/crispy-chicken-pieces-in-modern-air-fryer-35285814/', 280),
  ('jogo-panelas', 'Cozinha', 'Jogo de panelas', 'Para os almoços de domingo na casa nova.', 700, '/assets/presentes/jogo-panelas.webp', 'https://www.pexels.com/photo/two-pots-on-a-electric-cooker-18071812/', 290),
  ('cafeteira-espresso', 'Cozinha', 'Cafeteira espresso', 'O cafezinho de todo dia, do jeito certo.', 900, '/assets/presentes/cafeteira-espresso.webp', 'https://www.pexels.com/photo/coffee-making-process-in-modern-cafe-4349951/', 300),
  ('batedeira', 'Cozinha', 'Batedeira planetária', 'Para os bolos de aniversário que vêm por aí.', 650, '/assets/presentes/batedeira.webp', 'https://www.pexels.com/photo/stand-mixer-on-a-table-6996340/', 310),
  ('aparelho-jantar', 'Cozinha', 'Aparelho de jantar', 'Pratos bonitos para receber a família e os amigos.', 480, '/assets/presentes/aparelho-jantar.webp', 'https://www.pexels.com/photo/ceramic-plates-3847482/', 320),
  ('jogo-tacas', 'Cozinha', 'Jogo de taças', 'Taças para todos os brindes daqui para a frente.', 200, '/assets/presentes/jogo-tacas.webp', 'https://www.pexels.com/photo/clear-glasses-of-wines-in-close-up-shot-7270445/', 330),
  ('liquidificador', 'Cozinha', 'Liquidificador', 'Vitaminas, sucos e molhos sem complicação.', 250, '/assets/presentes/liquidificador.webp', 'https://www.pexels.com/photo/close-up-photo-of-glass-blender-6803737/', 340),
  ('jogo-facas', 'Cozinha', 'Jogo de facas', 'Facas boas fazem toda a diferença na cozinha.', 300, '/assets/presentes/jogo-facas.webp', 'https://www.pexels.com/photo/sharp-knives-and-a-sprig-of-tomatoes-16457323/', 350),
  ('dia-de-spa', 'Experiências', 'Dia de spa', 'Um dia inteiro de descanso, só nós dois.', 600, '/assets/presentes/dia-de-spa.webp', 'https://www.pexels.com/photo/close-up-shot-of-white-bathtowels-6188050/', 360),
  ('vinicola', 'Experiências', 'Visita a uma vinícola', 'Degustação para dois no meio dos vinhedos.', 500, '/assets/presentes/vinicola.webp', 'https://www.pexels.com/photo/rural-landscape-with-vineyard-14515698/', 370),
  ('aula-culinaria', 'Experiências', 'Aula de culinária a dois', 'Aprender um prato novo juntos (e lavar a louça depois).', 380, '/assets/presentes/aula-culinaria.webp', 'https://www.pexels.com/photo/homemade-ravioli-preparation-on-wooden-board-37000121/', 380),
  ('voo-balao', 'Experiências', 'Voo de balão', 'Ver o nascer do sol lá de cima.', 1400, '/assets/presentes/voo-balao.webp', 'https://www.pexels.com/photo/a-hot-air-balloon-flying-in-the-sky-with-a-blue-sky-27677381/', 390),
  ('aulas-danca', 'Experiências', 'Aulas de dança', 'Para dançar ainda melhor no próximo casamento.', 300, '/assets/presentes/aulas-danca.webp', 'https://www.pexels.com/photo/close-up-photo-of-black-shoes-8281154/', 400),
  ('fim-de-semana-serra', 'Experiências', 'Fim de semana na serra', 'Lareira, fondue e frio na medida.', 1200, '/assets/presentes/fim-de-semana-serra.webp', 'https://www.pexels.com/photo/houses-on-meadow-16698322/', 410),
  ('casa-propria', 'Para o futuro', 'Entrada da casa própria', 'Cada valor ajuda a gente a chegar na nossa casa.', null, '/assets/presentes/casa-propria.webp', 'https://www.pexels.com/photo/real-estate-concept-with-key-and-house-models-31424880/', 420),
  ('primeiro-pet', 'Para o futuro', 'Nosso primeiro pet', 'Vacinas, caminha e ração para o novo membro da família.', 500, '/assets/presentes/primeiro-pet.webp', 'https://www.pexels.com/photo/close-up-of-a-curious-brown-puppy-38344785/', 430),
  ('viagem-um-ano', 'Para o futuro', 'Viagem de um ano de casados', 'Para comemorar o primeiro aniversário de casamento viajando.', 1000, '/assets/presentes/viagem-um-ano.webp', 'https://www.pexels.com/photo/vintage-suitcases-stacked-outdoors-near-storefront-28539535/', 440),
  ('carro-novo', 'Para o futuro', 'Cota do carro novo', 'Um pedacinho do nosso próximo carro.', 1000, '/assets/presentes/carro-novo.webp', 'https://www.pexels.com/photo/car-keys-on-white-surface-842528/', 450),
  ('boleto-buffet', 'Cotas divertidas', 'Ajuda com o boleto do buffet', 'A festa foi linda. O boleto também.', 200, '/assets/presentes/boleto-buffet.webp', 'https://www.pexels.com/photo/elegant-wedding-reception-table-setting-29040997/', 460),
  ('uber-volta', 'Cotas divertidas', 'Uber da volta da festa', 'A gente também precisa voltar para casa depois da festa.', 80, '/assets/presentes/uber-volta.webp', 'https://www.pexels.com/photo/street-in-town-in-turkey-at-night-15423114/', 470),
  ('conta-de-luz', 'Cotas divertidas', 'Primeira conta de luz', 'A primeira de muitas contas da casa nova.', 250, '/assets/presentes/conta-de-luz.webp', 'https://www.pexels.com/photo/light-bulb-269318/', 480),
  ('hotel-pet', 'Cotas divertidas', 'Hotelzinho do pet', 'Para o pet ficar bem cuidado enquanto a gente viaja.', 300, '/assets/presentes/hotel-pet.webp', 'https://www.pexels.com/photo/close-up-shot-of-a-dog-8229711/', 490),
  ('kit-ressaca', 'Cotas divertidas', 'Kit ressaca do dia seguinte', 'Água de coco, café forte e silêncio absoluto.', 90, '/assets/presentes/kit-ressaca.webp', 'https://www.pexels.com/photo/fresh-coconuts-in-box-at-market-in-cartagena-colombia-16960976/', 500),
  ('musica-festa', 'Cotas divertidas', 'Escolha uma música da festa', 'Você escolhe, a banda toca e a gente dança.', 300, '/assets/presentes/musica-festa.webp', 'https://www.pexels.com/photo/outdoor-music-stage-with-drum-set-and-guitar-35985260/', 510)
on conflict (id) do update set
  category     = excluded.category,
  title        = excluded.title,
  description  = excluded.description,
  price        = excluded.price,
  image        = excluded.image,
  image_source = excluded.image_source,
  sort         = excluded.sort;
