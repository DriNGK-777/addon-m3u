/**
 * parse-m3u.js
 * Parser de listas M3U de CANAIS DE TV AO VIVO.
 * Retorna { name, logo, group, url } de cada canal.
 */

function parseChannels(text) {
  const lines = String(text || "").split(/\r?\n/);
  const channels = [];
  let cur = null;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);

      cur = {
        name: (nameMatch ? nameMatch[1] : (tvgNameMatch ? tvgNameMatch[1] : "")).trim(),
        logo: logoMatch ? logoMatch[1].trim() : "",
        group: groupMatch ? groupMatch[1].trim() : "Geral"
      };
      continue;
    }

    if (line.startsWith("#EXTGRP:") && cur) {
      cur.group = line.replace("#EXTGRP:", "").trim() || "Geral";
      continue;
    }

    if (line.startsWith("#")) continue;

    // linha de URL do stream
    if (cur) {
      if (cur.name) {
        channels.push({
          name: cur.name,
          logo: cur.logo,
          group: cur.group,
          url: line
        });
      }
      cur = null;
    }
  }

  return channels;
}

/**
 * Remove canais duplicados (mesmo nome + mesma URL).
 */
function dedupeChannels(channels) {
  const seen = new Set();
  const out = [];
  for (const c of channels) {
    const key = (c.name + "|" + c.url).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

module.exports = { parseChannels, dedupeChannels };
