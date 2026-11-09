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
const CATALOG_RADIOS = "zintv_radios"; // radios brasileiras ao vivo

const extra = [
  { name: "search", isRequired: false },
  { name: "skip", isRequired: false }
];

const manifest = {
  id: "com.drinkzin.zintvbr",
  version: "1.6.0",
  name: "ZinTV BR",
  description: "Canais de TV aberta e rádios do Brasil ao vivo. Feito por drinkzin.",
  logo: LOGO,
  resources: ["catalog", "meta", "stream"],
  types: ["tv", "movie", "series"],
  idPrefixes: ["zintv:"],
  catalogs: [
    { type: "tv", id: CATALOG_DONATE, name: "🤝 Apoie o ZinTV BR" },
    { type: "tv", id: CATALOG_CHANNELS, name: "ZinTV BR", extra },
    { type: "tv", id: CATALOG_RADIOS, name: "📻 Rádios ao Vivo", extra },
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
let radios = []; // type tv (radios)
const episodeUrl = new Map(); // videoId -> url
const radioPosters = new Map(); // radioId -> capa resolvida
const posterPending = new Set(); // ids com capa sendo testada

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
// RADIOS BRASILEIRAS (Radio Browser API - publica, sem chave)
// ---------------------------------------------------------------------------
const RADIO_API = [
  "https://de1.api.radio-browser.info",
  "https://all.api.radio-browser.info",
  "https://nl1.api.radio-browser.info"
];

const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const radioId = (r) => "zintv:radio:" + b64(r.name + "|" + r.url);

function radioRef(id) {
  if (!id || !id.startsWith("zintv:radio:")) return null;
  try {
    const d = unb64(id.slice("zintv:radio:".length));
    const i = d.indexOf("|");
    if (i === -1) return null;
    return { name: d.slice(0, i), url: d.slice(i + 1) };
  } catch (e) {
    return null;
  }
}

// camada 3: capa gerada com as iniciais (nunca quebra)
function initialsPoster(name) {
  const clean =
    name.replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim().slice(0, 20) ||
    "Rádio";
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(clean) +
    "&size=512&background=1f6feb&color=ffffff&bold=true&font-size=0.33"
  );
}

async function isImage(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(9000)
    });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    return (r.ok || r.status === 206) && ct.startsWith("image/");
  } catch (e) {
    return false;
  }
}

// camada 1: logo oficial | camada 2: favicon do site
async function resolvePoster(r) {
  if (r.favicon && (await isImage(r.favicon))) return r.favicon;
  try {
    const dom = new URL(r.homepage).hostname;
    const g = "https://www.google.com/s2/favicons?domain=" + dom + "&sz=256";
    if (await isImage(g)) return g;
  } catch (e) {}
  return initialsPoster(r.name);
}

function posterFor(r) {
  const id = radioId(r);
  if (radioPosters.has(id)) return radioPosters.get(id);
  if (!posterPending.has(id)) {
    posterPending.add(id);
    resolvePoster(r)
      .then((p) => radioPosters.set(id, p))
      .catch(() => {})
      .finally(() => posterPending.delete(id));
  }
  // enquanto testa, mostra a capa gerada (nunca fica vazio)
  return initialsPoster(r.name);
}

async function warmCovers(limit) {
  const list = radios.filter((r) => !radioPosters.has(radioId(r))).slice(0, limit || 150);
  let i = 0;
  const workers = Array.from({ length: 12 }, async () => {
    while (i < list.length) {
      const r = list[i++];
      try {
        radioPosters.set(radioId(r), await resolvePoster(r));
      } catch (e) {}
    }
  });
  await Promise.all(workers);
  console.log(`🎨 Capas de rádio prontas: ${radioPosters.size}`);
}

let radioTask = null;

function loadRadios() {
  if (radioTask) return radioTask;
  radioTask = (async () => {
    for (const base of RADIO_API) {
      try {
        console.log(`📻 Buscando rádios em ${base}`);
        const res = await fetch(
          base +
            "/json/stations/search?countrycode=BR&hidebroken=true&limit=5000&order=clickcount&reverse=true",
          {
            headers: {
              "User-Agent": "ZinTVBR/1.6 (+https://streambr.onrender.com)"
            },
            signal: AbortSignal.timeout(25000)
          }
        );
        if (!res.ok) {
          console.error(`❌ Rádios HTTP ${res.status} em ${base}`);
          continue;
        }
        const data = await res.json();
        const seen = new Set();
        const out = [];
        for (const s of data) {
          const url = String(s.url_resolved || "").trim();
          if (!/^https:\/\//i.test(url)) continue; // HTTP puro costuma falhar
          const name = String(s.name || "").replace(/\s+/g, " ").trim();
          if (!name) continue;
          const key = norm(name) + "|" + url;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            name,
            url,
            codec: s.codec || "",
            bitrate: s.bitrate || 0,
            city: s.state || s.country || "Brasil",
            favicon: s.favicon || "",
            homepage: s.homepage || ""
          });
        }
        radios = out;
        console.log(`📻 ${radios.length} rádios carregadas`);
        warmCovers(150); // só a primeira página, em segundo plano
        return;
      } catch (err) {
        console.error(`❌ Erro nas rádios (${base}):`, err.message);
      }
    }
    console.log("⚠️ Nenhuma rádio carregada");
  })();
  radioTask.then(
    () => (radioTask = null),
    () => (radioTask = null)
  );
  return radioTask;
}

function radioQuality(r) {
  return [r.codec, r.bitrate ? r.bitrate + " kbps" : ""].filter(Boolean).join(" ");
}

function metaOfRadio(r) {
  return {
    id: radioId(r),
    type: "tv",
    name: r.name,
    poster: posterFor(r),
    posterShape: "square",
    description: `📻 Rádio ao vivo • ${radioQuality(r) || "áudio"} • ${r.city}`,
    genres: ["📻 Rádios"]
  };
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

  const isRadio = type === "tv" && id === CATALOG_RADIOS;
  if (isRadio) {
    if (!radios.length) await loadRadios();
  } else if (!channels.length) {
    await loadList();
  }

  const search = ex && ex.search ? String(ex.search) : "";
  const skip = parseInt((ex && ex.skip) || "0", 10) || 0;
  const PAGE = 100;
  const s = search.toLowerCase();

  let source;
  let toMeta;

  if (type === "tv" && (id === CATALOG_CHANNELS || id === CATALOG_CHANNELS_OLD)) {
    source = channels;
    toMeta = metaOfChannel;
  } else if (isRadio) {
    source = radios;
    toMeta = metaOfRadio;
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
  if (s) {
    const q = norm(s);
    list = list.filter((x) => norm(x.name).includes(q));
  }

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
    // Radio
    const rr = radioRef(id);
    if (rr) {
      if (!radios.length) await loadRadios();
      const r = radios.find((x) => x.name === rr.name && x.url === rr.url);
      if (!r) return { meta: null };
      const m = metaOfRadio(r);
      return {
        meta: {
          ...m,
          background: m.poster,
          links: DONATE_LINKS
        }
      };
    }

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

  // Radio ao vivo
  const rr = radioRef(id);
  if (rr) {
    if (!radios.length) await loadRadios();
    const r = radios.find((x) => x.name === rr.name && x.url === rr.url);
    if (!r) return { streams: [donateStream] };
    return {
      streams: [
        { ...donateStream },
        {
          name: "📻 Ao vivo",
          title: `${r.name}\n${radioQuality(r)}`,
          url: r.url
        }
      ]
    };
  }

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

  // radios carregam em segundo plano (nao atrasam o boot)
  loadRadios().catch((e) => console.error("Erro ao carregar rádios:", e.message));

  setInterval(() => {
    loadList().catch((e) => console.error("Erro ao atualizar lista:", e.message));
    loadRadios().catch((e) => console.error("Erro ao atualizar rádios:", e.message));
  }, 30 * 60 * 1000);
})();
