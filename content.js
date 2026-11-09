// Conteudo curado do ZinTV BR
// ---------------------------------------------------------------------------
// CINEMA: filmes em dominio publico / licenca livre (Archive.org)
// TV: emissoras publicas/internacionais com sinal HLS oficial e aberto
// ---------------------------------------------------------------------------

const FILMS = [
  { id: "Night.Of.The.Living.Dead_1080p", file: "NightOfTheLivingDead.mp4", name: "A Noite dos Mortos-Vivos", year: 1968, genre: "Terror", desc: "O clássico que inventou o zumbi moderno. Sete desconhecidos presos numa casa isolada enquanto os mortos caminham lá fora." },
  { id: "Nosferatu_most_complete_version_93_mins.", file: "Nosferatu_1922_Symphony_of_Horror_512kb.mp4", name: "Nosferatu", year: 1922, genre: "Terror", desc: "O vampiro silencioso de Murnau, com a versão mais completa já restaurada (93 minutos)." },
  { id: "DasKabinettdesDoktorCaligariTheCabinetofDrCaligari", file: "The_Cabinet_of_Dr._Caligari_512kb.mp4", name: "O Gabinete do Dr. Caligari", year: 1919, genre: "Terror", desc: "Expressionismo alemão puro: cenários tortos, sombras pintadas e um sonâmbulo assassino." },
  { id: "Metropolis1927EnglishVersion", file: "Metropolis_1927_English_Version.mp4", name: "Metrópolis", year: 1927, genre: "Ficção científica", desc: "A cidade futurista de Fritz Lang, com ricos no céu e operários no subsolo. Base de quase toda a sci-fi moderna." },
  { id: "his_girl_friday", file: "his_girl_friday.mp4", name: "Jejum de Amor", year: 1940, genre: "Comédia", desc: "Comédia de diálogo afiadíssimo de Howard Hawks: jornalista tenta impedir que a ex-mulher se case de novo." },
  { id: "charade-1963-cary-grant-audrey-hepburn-comedy-mystery-romance-thriller-full-movie", file: "Charade_READY.mp4", name: "Charada", year: 1963, genre: "Suspense", desc: "Audrey Hepburn e Cary Grant num thriller elegante de perseguição por um tesouro escondido em Paris." },
  { id: "Detour", file: "Detour.mp4", name: "Desvio", year: 1945, genre: "Noir", desc: "Noir de estrada, barato e brutal: um pianista pega carona e a vida desanda de vez." },
  { id: "The_General_Buster_Keaton", file: "The_General.mp4", name: "O General", year: 1926, genre: "Comédia", desc: "Buster Keaton perseguindo um trem roubado. Considerado um dos melhores filmes de ação de todos os tempos." },
  { id: "774-plan-9-from-outer-space", file: "774-Plan9FromOuterSpace.mp4", name: "Plano 9 do Espaço Sideral", year: 1959, genre: "Ficção científica", desc: "O 'pior filme de todos os tempos' de Ed Wood — e por isso mesmo, imperdível." },
  { id: "CarnivalofSouls", file: "CarnivalOfSouls.mp4", name: "Carnaval das Almas", year: 1962, genre: "Terror", desc: "Uma mulher sobrevive a um acidente e é atraída por um pavilhão abandonado. Terror atmosférico de baixo orçamento." },
  { id: "Little_ShopOf_Horrors.avi", file: "The_Little_Shop_of_Horrors.mp4", name: "A Pequena Loja dos Horrores", year: 1960, genre: "Comédia", desc: "O original de Roger Corman com Jack Nicholson: um florista descobre que sua planta come gente." },
  { id: "mclintok_widescreen", file: "McLintock.mp4", name: "McLintock!", year: 1963, genre: "Faroeste", desc: "John Wayne e Maureen O'Hara numa comédia faroeste de brigas, lama e casamento." },
  { id: "sherlockjr1924_201909", file: "Sherlock Jr. - Buster Keaton (1924) HD [720p].mp4", name: "Sherlock Jr.", year: 1924, genre: "Comédia", desc: "Keaton entra literalmente dentro da tela do cinema. 45 minutos de genialidade." },
  { id: "gullivers_travels1939", file: "gullivers_travels1939.mp4", name: "As Viagens de Gulliver", year: 1939, genre: "Animação", desc: "Longa de animação dos irmãos Fleischer, colorido e cheio de gigantes." },
  { id: "ThePhantomoftheOpera", file: "Phantom_of_the_Opera_512kb.mp4", name: "O Fantasma da Ópera", year: 1925, genre: "Terror", desc: "Lon Chaney e a maquiagem mais famosa do cinema mudo." },
  { id: "white_zombie", file: "white_zombie.mp4", name: "Zumbi Branco", year: 1932, genre: "Terror", desc: "Bela Lugosi faz um bruxo vudu no Haiti. O primeiro longa de zumbis do cinema." },
  { id: "TheStranger_0", file: "The_Stranger.mp4", name: "O Estranho", year: 1946, genre: "Noir", desc: "Orson Welles dirige e atua como um nazista escondido numa cidade pequena dos EUA." },
  { id: "doa_ipod", file: "doa.mp4", name: "D.O.A. — Morto ao Chegar", year: 1955, genre: "Noir", desc: "Um homem descobre que foi envenenado e tem poucas horas para achar o culpado." },
  { id: "Hitch_Hiker", file: "Hitch-Hiker.mp4", name: "O Carona", year: 1953, genre: "Noir", desc: "Ida Lupino dirige este noir sufocante: dois amigos dão carona a um assassino." },
  { id: "suddenly", file: "suddenly.mp4", name: "De Repente", year: 1954, genre: "Suspense", desc: "Frank Sinatra como atirador de elite que toma uma casa para matar o presidente." },
  { id: "kansascityconfidencial", file: "kansascityconfidencial.mp4", name: "Confidencial de Kansas City", year: 1952, genre: "Noir", desc: "Assalto a banco, máscaras e um ex-detento no meio do golpe." },
  { id: "ScarletStreet", file: "Scarlet_Street.mp4", name: "Rua Escarlate", year: 1945, genre: "Noir", desc: "Fritz Lang e Edward G. Robinson num noir sobre obsessão, mentira e crime." },
  { id: "thewomaninthewindow1944", file: "The Woman in the Window (1944, USA) Director Fritz Lang Stars Joan Bennett - Film Noir Full Movie.mp4", name: "A Mulher na Janela", year: 1944, genre: "Noir", desc: "Outro Fritz Lang: um professor se envolve com uma mulher e acaba com um crime nas mãos." },
  { id: "the-39-steps_202306", file: "The 39 Steps.mp4", name: "Os 39 Degraus", year: 1935, genre: "Suspense", desc: "Hitchcock clássico: um homem comum foge acusado de assassinato, de Londres à Escócia." },
  { id: "GangaBrutaHumbertoMauro1933Drama", file: "Ganga Bruta (Humberto Mauro, 1933, Drama).mp4", name: "Ganga Bruta", year: 1933, genre: "Nacional", desc: "Marco do cinema brasileiro de Humberto Mauro: um engenheiro se muda para o interior e se envolve com a família do dono da fazenda." }
];

const TV = [
  { name: "DW English", country: "Alemanha", url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8", site: "dw.com" },
  { name: "NASA TV", country: "EUA", url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8", site: "nasa.gov" },
  { name: "France 24 (English)", country: "França", url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8", site: "france24.com" },
  { name: "France 24 (Français)", country: "França", url: "https://static.france24.com/live/F24_FR_LO_HLS/live_web.m3u8", site: "france24.com" },
  { name: "France 24 (Español)", country: "França", url: "https://static.france24.com/live/F24_ES_LO_HLS/live_web.m3u8", site: "france24.com" },
  { name: "Al Jazeera Arabic", country: "Catar", url: "https://live-hls-web-aja.getaj.net/AJA/01.m3u8", site: "aljazeera.net" },
  { name: "TRT World", country: "Turquia", url: "https://tv-trtworld.medya.trt.com.tr/master.m3u8", site: "trtworld.com" },
  { name: "Arirang TV", country: "Coreia do Sul", url: "https://amdlive-ch01-ctnd-com.akamaized.net/arirang_1ch/smil:arirang_1ch.smil/playlist.m3u8", site: "arirang.com" },
  { name: "CNA", country: "Singapura", url: "https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8", site: "channelnewsasia.com" },
  { name: "Bloomberg TV", country: "EUA", url: "https://bloomberg.com/media-manifest/streams/us.m3u8", site: "bloomberg.com" }
];

module.exports = { FILMS, TV };
