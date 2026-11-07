const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const { parseChannels, dedupeChannels } = require("./parse-m3u");

const PORT = process.env.PORT || 7000;
const LOGO = "https://i.imgur.com/bKRaWKQ.jpeg";
const DEFAULT_LIST = "https://iptv-org.github.io/iptv/countries/br.m3u";

// Listas M3U configuradas (aceita varias, separadas por virgula)
const M3U_URLS = process.env.M3U_URLS
  ? process.env.M3U_URLS.split(",").map((u) => u.trim()).filter(Boolean)
  : [];

const SINGLE_URL = process.env.M3U_URL;
if (SINGLE_URL && !M3U_URLS.includes(SINGLE_URL)) M3U_URLS.push(SINGLE_URL);

if (!M3U_URLS.length) M3U_URLS.push(DEFAULT_LIST);

const manifest = {
  id: "com.drinkzin.zintvbr",
  version: "1.1.0",
  name: "ZinTV BR",
  description: "Canais de TV aberta do Brasil ao vivo. Feito por drinkzin.",
  logo: LOGO,
  resources: ["catalog", "meta", "stream"],
  types: ["tv"],
  idPrefixes: ["zintv:"],
  catalogs: [
    {
      type: "tv",
      id: "zintv_catalog",
      name: "ZinTV BR",
      extra: [
        { name: "search", isRequired: false },
        { name: "skip", isRequired: false }
      ]
    }
  ]
};

const builder = new addonBuilder(manifest);

let channels = [];
let lastLoad = 0;

function channelId(c) {
  return "zintv:" + Buffer.from(c.name + "|" + c.url).toString("base64url");
}

function channelFromId(id) {
  const raw = id.startsWith("zintv:") ? id.slice(6) : id;
  let decoded = "";
  try {
    decoded = Buffer.from(raw, "base64url").toString("utf8");
  } catch (e) {
    return null;
  }
  const [name, ...rest] = decoded.split("|");
  const url = rest.join("|");
  return channels.find((c) => c.name === name && c.url === url) || null;
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
      console.log(`✅ ${parsed.length} canais em ${url}`);
      all.push(...parsed);
    } catch (err) {
      console.error(`❌ Erro baixando ${url}:`, err.message);
    }
  }
  channels = dedupeChannels(all);
  lastLoad = Date.now();
  console.log(`📺 Total: ${channels.length} canais carregados`);
}

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type !== "tv" || id !== "zintv_catalog") return { metas: [] };

  if (!channels.length) await loadList();

  const search = extra && extra.search ? extra.search.toLowerCase() : "";
  const skip = parseInt((extra && extra.skip) || "0", 10);
  const PAGE = 100;

  let list = channels;
  if (search) {
    list = list.filter((c) => c.name.toLowerCase().includes(search));
  }

  const page = list.slice(skip, skip + PAGE);

  return {
    metas: page.map((c) => ({
      id: channelId(c),
      type: "tv",
      name: c.name,
      poster: c.logo || LOGO,
      posterShape: "square",
      genres: [c.group]
    }))
  };
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== "tv") return { meta: null };
  if (!channels.length) await loadList();

  const c = channelFromId(id);
  if (!c) return { meta: null };

  return {
    meta: {
      id: channelId(c),
      type: "tv",
      name: c.name,
      poster: c.logo || LOGO,
      posterShape: "square",
      description: `Canal ao vivo • ${c.group}`,
      genres: [c.group]
    }
  };
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== "tv") return { streams: [] };
  if (!channels.length) await loadList();

  const c = channelFromId(id);
  if (!c) return { streams: [] };

  return {
    streams: [
      {
        title: c.name,
        url: c.url
      }
    ]
  };
});

(async () => {
  await loadList();
  serveHTTP(builder.getInterface(), { port: PORT });
  console.log(`📺 ZinTV BR rodando na porta ${PORT}`);

  // Atualiza a lista a cada 30 minutos
  setInterval(() => {
    loadList().catch((e) => console.error("Erro ao atualizar lista:", e.message));
  }, 30 * 60 * 1000);
})();
