const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const { parseChannels, dedupeChannels } = require("./parse-m3u");

const PORT = process.env.PORT || 7000;
const LOGO = "https://i.imgur.com/bKRaWKQ.jpeg";
const DEFAULT_LIST = "https://iptv-org.github.io/iptv/countries/br.m3u";

// ---------------------------------------------------------------------------
// BOTAO DE DOACAO (LivePix) - aparece no TOPO de tudo
// ---------------------------------------------------------------------------
const DONATE_URL = "https://livepix.gg/drinkzin";
const DONATE_ID = "zintv:doacao";
const DONATE_NAME = "🤝 ZINTV BR - APOIE O CANAL";
const DONATE_DESC =
  "🤝 ESTE ADDON É MANTIDO POR DOAÇÕES DOS USUÁRIOS. ACESSE: LIVEPIX.GG/DRINKZIN E FAÇA SUA CONTRIBUIÇÃO PARA CONTINUARMOS DE PÉ! ✨🙏";
const DONATE_GENRE = "💸 Apoie o ZinTV BR";

const DONATE_LINKS = [
  { name: "💸 Apoiar via LivePix", category: "Donation", url: DONATE_URL }
];

// Stream do LivePix - sempre o PRIMEIRO da lista
const donateStream = {
  externalUrl: DONATE_URL,
  name: "💸 LivePix",
  title: DONATE_NAME,
  description: "Apoie o ZinTV BR com uma doação via LivePix 💚"
};

function donateMeta(type) {
  return {
    id: DONATE_ID,
    type: type || "tv",
    name: DONATE_NAME,
    poster: LOGO,
    background: LOGO,
    posterShape: "square",
    description: DONATE_DESC,
    genres: [DONATE_GENRE],
    links: DONATE_LINKS
  };
}

const donateQuery = (search) =>
  !!search && /(apoie|apoiar|doa|doac|doaç|pix|livepix|contribu|zintv)/i.test(search);

// ---------------------------------------------------------------------------
// LISTAS M3U
// ---------------------------------------------------------------------------
const M3U_URLS = process.env.M3U_URLS
  ? process.env.M3U_URLS.split(",").map((u) => u.trim()).filter(Boolean)
  : [];

const SINGLE_URL = process.env.M3U_URL;
if (SINGLE_URL && !M3U_URLS.includes(SINGLE_URL)) M3U_URLS.push(SINGLE_URL);

if (!M3U_URLS.length) M3U_URLS.push(DEFAULT_LIST);

// ---------------------------------------------------------------------------
// MANIFEST
// ---------------------------------------------------------------------------
const CATALOG_CHANNELS = "zintv_canais"; // id atual
const CATALOG_CHANNELS_OLD = "zintv_catalog"; // id antigo (cache de clientes)
const CATALOG_DONATE = "zintv_apoie"; // catalogo so com o botao de doacao
const CATALOG_MOVIES = "zintv_filmes";
const CATALOG_SERIES = "zintv_series";

const extra = [
  { name: "search", isRequired: false },
  { name: "skip", isRequired: false }
];

const manifest = {
  id: "com.drinkzin.zintvbr",
  version: "1.5.0",
  name: "ZinTV BR",
  description: "Canais de TV aberta do Brasil ao vivo. Feito por drinkzin.",
  logo: LOGO,
  resources: ["catalog", "meta", "stream"],
  types: ["tv", "movie", "series"],
  idPrefixes: ["zintv:"],
  catalogs: [
    { type: "tv", id: CATALOG_DONATE, name: "🤝 Apoie o ZinTV BR" },
    { type: "tv", id: CATALOG_CHANNELS, name: "ZinTV BR", extra },
    { type: "movie", id: CATALOG_MOVIES, name: "🎬 Filmes", extra },
    { type: "series", id: CATALOG_SERIES, name: "📺 Séries", extra }
  ]
};

const builder = new addonBuilder(manifest);

// ---------------------------------------------------------------------------
// DADOS
// ---------------------------------------------------------------------------
let channels = []; // type tv
let movies = []; // type movie
let seriesList = []; // type series (com videos)
const episodeUrl = new Map(); // videoId -> url

const b64 = (s) => Buffer.from(s).toString("base64url");
const unb64 = (s) => Buffer.from(s, "base64url").toString("utf8");

const itemId = (name, url) => "zintv:" + b64(name + "|" + url);

function fromId(id) {
  const raw = id.startsWith("zintv:") ? id.slice(6) : id;
  try {
    const decoded = unb64(raw);
    const i = decoded.indexOf("|");
    if (i === -1) return null;
    return { name: decoded.slice(0, i), url: decoded.slice(i + 1) };
  } catch (e) {
    return null;
  }
}

const EP_RE = /(?:[Ss](\d{1,2})\s*[Ee](\d{1,2}))|(?:(\d{1,2})\s*x\s*(\d{1,2}))/;

function isVod(url) {
  return /\.(mp4|mkv|avi|mov|webm|m4v)(\?|$)/i.test(url);
}

function splitEpisode(name) {
  const m = name.match(EP_RE);
  if (!m) return null;
  const season = parseInt(m[1] || m[3] || "1", 10);
  const episode = parseInt(m[2] || m[4] || "1", 10);
  const base = name.replace(EP_RE, "").replace(/[\s\-_.:]+$/, "").trim() || name;
  return { base, season, episode };
}

async function loadList() {
  const all = [];
  for (const url of M3U_URLS) {
    try {
      console.log(`📡 Baixando lista: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`❌ HTTP ${res.status}: ${url}`);
        continue;
      }
      const text = await res.text();
      const parsed = parseChannels(text);
      console.log(`✅ ${parsed.length} itens em ${url}`);
      all.push(...parsed);
    } catch (err) {
      console.error(`❌ Erro baixando ${url}:`, err.message);
    }
  }

  const entries = dedupeChannels(all);

  const ch = [];
  const mv = [];
  const se = new Map(); // base -> series
  episodeUrl.clear();

  for (const e of entries) {
    // VOD (filmes/series) so quando o link e arquivo de video
    if (isVod(e.url)) {
      const ep = splitEpisode(e.name);
      if (ep) {
        let s = se.get(ep.base);
        if (!s) {
          s = {
            id: "zintv:serie:" + b64(ep.base),
            name: ep.base,
            poster: e.logo || LOGO,
            group: e.group,
            videos: []
          };
          se.set(ep.base, s);
        }
        const videoId = s.id + ":" + ep.season + ":" + ep.episode;
        s.videos.push({
          id: videoId,
          title: `T${ep.season}E${ep.episode}`,
          season: ep.season,
          episode: ep.episode,
          released: new Date("2020-01-01T00:00:00.000Z").toISOString()
        });
        episodeUrl.set(videoId, e.url);
      } else {
        mv.push({
          id: itemId(e.name, e.url),
          name: e.name,
          poster: e.logo || "",
          group: e.group,
          url: e.url
        });
      }
      continue;
    }

    ch.push(e);
  }

  channels = ch;
  movies = mv;
  seriesList = [...se.values()].map((s) => ({
    ...s,
    videos: s.videos.sort(
      (a, b) => a.season - b.season || a.episode - b.episode
    )
  }));

  console.log(
    `📺 Total: ${channels.length} canais | 🎬 ${movies.length} filmes | 📽️ ${seriesList.length} séries`
  );
}

// ---------------------------------------------------------------------------
// CATALOGO
// ---------------------------------------------------------------------------
function metaOfChannel(c) {
  return {
    id: itemId(c.name, c.url),
    type: "tv",
    name: c.name,
    poster: c.logo || LOGO,
    posterShape: "square",
    genres: [c.group]
  };
}

function metaOfMovie(m) {
  return {
    id: m.id,
    type: "movie",
    name: m.name,
    poster: m.poster || LOGO,
    posterShape: "poster",
    genres: [m.group]
  };
}

function metaOfSeries(s) {
  return {
    id: s.id,
    type: "series",
    name: s.name,
    poster: s.poster || LOGO,
    posterShape: "poster",
    genres: [s.group]
  };
}

builder.defineCatalogHandler(async ({ type, id, extra: ex }) => {
  // Catalogo dedicado: so o botao de doacao
  if (id === CATALOG_DONATE) return { metas: [donateMeta(type)] };

  if (!channels.length) await loadList();

  const search = ex && ex.search ? String(ex.search) : "";
  const skip = parseInt((ex && ex.skip) || "0", 10) || 0;
  const PAGE = 100;
  const s = search.toLowerCase();

  let source;
  let toMeta;

  if (type === "tv" && (id === CATALOG_CHANNELS || id === CATALOG_CHANNELS_OLD)) {
    source = channels;
    toMeta = metaOfChannel;
  } else if (type === "movie" && id === CATALOG_MOVIES) {
    source = movies;
    toMeta = metaOfMovie;
  } else if (type === "series" && id === CATALOG_SERIES) {
    source = seriesList;
    toMeta = metaOfSeries;
  } else {
    return { metas: [] };
  }

  let list = source;
  if (s) list = list.filter((x) => x.name.toLowerCase().includes(s));

  const page = list.slice(skip, skip + PAGE);
  const metas = page.map(toMeta);

  // LivePix SEMPRE no topo
  if (skip === 0 && (!s || donateQuery(search))) {
    metas.unshift(donateMeta(type));
  }

  return { metas };
});

// ---------------------------------------------------------------------------
// META
// ---------------------------------------------------------------------------
builder.defineMetaHandler(async ({ type, id }) => {
  if (id === DONATE_ID) return { meta: donateMeta(type) };

  if (!channels.length) await loadList();

  if (type === "tv") {
    const ref = fromId(id);
    const c = ref && channels.find((x) => x.name === ref.name && x.url === ref.url);
    if (!c) return { meta: null };
    return {
      meta: {
        id: itemId(c.name, c.url),
        type: "tv",
        name: c.name,
        poster: c.logo || LOGO,
        posterShape: "square",
        description: `Canal ao vivo • ${c.group}`,
        genres: [c.group],
        links: DONATE_LINKS
      }
    };
  }

  if (type === "movie") {
    const ref = fromId(id);
    const m = ref && movies.find((x) => x.name === ref.name && x.url === ref.url);
    if (!m) return { meta: null };
    return {
      meta: {
        id: m.id,
        type: "movie",
        name: m.name,
        poster: m.poster || LOGO,
        posterShape: "poster",
        description: `Filme • ${m.group}`,
        genres: [m.group],
        links: DONATE_LINKS
      }
    };
  }

  if (type === "series") {
    const s = seriesList.find((x) => x.id === id);
    if (!s) return { meta: null };
    return {
      meta: {
        id: s.id,
        type: "series",
        name: s.name,
        poster: s.poster || LOGO,
        posterShape: "poster",
        description: `Série • ${s.group}`,
        genres: [s.group],
        videos: s.videos,
        links: DONATE_LINKS
      }
    };
  }

  return { meta: null };
});

// ---------------------------------------------------------------------------
// STREAM  (LivePix sempre em primeiro)
// ---------------------------------------------------------------------------
builder.defineStreamHandler(async ({ type, id }) => {
  // O proprio botao de doacao
  if (id === DONATE_ID) return { streams: [donateStream] };

  if (!channels.length) await loadList();

  if (type === "series") {
    const url = episodeUrl.get(id);
    return { streams: [{ ...donateStream }, ...(url ? [{ url, title: "Assistir" }] : [])] };
  }

  const ref = fromId(id);
  if (!ref) return { streams: [donateStream] };

  return {
    streams: [
      { ...donateStream },
      { title: ref.name, url: ref.url }
    ]
  };
});

// ---------------------------------------------------------------------------
// START
// ---------------------------------------------------------------------------
(async () => {
  await loadList();
  serveHTTP(builder.getInterface(), { port: PORT });
  console.log(`📺 ZinTV BR rodando na porta ${PORT}`);

  setInterval(() => {
    loadList().catch((e) => console.error("Erro ao atualizar lista:", e.message));
  }, 30 * 60 * 1000);
})();
