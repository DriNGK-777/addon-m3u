# ZinTV BR

Addon de **TV aberta do Brasil ao vivo** para o Stremio. Feito por **drinkzin**.

## O que ele faz

- Lista canais de TV aberta/pública brasileiros a partir de listas M3U (por padrão, a lista do iptv-org Brasil).
- Mostra os canais em uma grade no Stremio, com logo, nome e grupo.
- Reproduz o canal ao vivo ao clicar.

## Instalação no Stremio

Depois do deploy no Render, adicione este link em **Stremio → Addons → Adicionar addon**:

```
https://SEU-SERVICO.onrender.com/manifest.json
```

## Configuração (variáveis de ambiente)

| Variável | Descrição |
|----------|-----------|
| `M3U_URL` | URL de uma lista M3U (opcional — se vazio, usa a lista do iptv-org Brasil) |
| `M3U_URLS` | Várias listas separadas por vírgula (opcional) |

Exemplos de listas de canais abertos do Brasil:

- `https://iptv-org.github.io/iptv/countries/br.m3u`
- `https://github.com/iptv-com/iptv/raw/refs/heads/main/lists/brazil.m3u`

## Rodar localmente

```bash
npm install
npm start
```

Depois abra `http://127.0.0.1:7000/manifest.json` no Stremio.

## Observações

- Apenas canais abertos/públicos. Canais fechados (Globo, SBT, ESPN, Telecine etc.) não estão em listas gratuitas legais.
- Alguns links de canais podem cair com o tempo, pois as listas são mantidas pela comunidade.
- No plano gratuito do Render, o serviço "hiberna" após inatividade (a primeira abertura pode demorar ~50s).

Feito por **drinkzin**.
