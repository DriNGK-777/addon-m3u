# ZinTV BR

Addon de **TV aberta e rádios do Brasil ao vivo** para o Stremio. Feito por **drinkzin**.

## O que ele faz

- Lista canais de TV aberta/pública brasileiros a partir de listas M3U (por padrão, a lista do iptv-org Brasil).
- Mostra os canais em uma grade no Stremio, com logo, nome e grupo.
- Reproduz o canal ao vivo ao clicar.
- **📻 Rádios ao Vivo**: mais de 1.100 rádios brasileiras, vindas da API pública Radio Browser (sem chave, sem custo).
- **Catálogos dos streamings**: fileiras de filmes e séries da Netflix, Globoplay, Max, Disney+, Prime Video e Pluto TV, com dados públicos do JustWatch (sem chave).
- **🤝 Apoie o ZinTV BR**: card fixo no topo de todos os catálogos e primeiro item da lista de streams, levando ao LivePix.

> Os catálogos dos streamings são só de **descoberta**: eles mostram o que está disponível em cada serviço, mas não entregam o vídeo. Para assistir, use o serviço oficial ou outro addon de sua escolha.

## Capas das rádios

Cada rádio recebe capa em 3 camadas, para nenhuma ficar vazia:

1. Logo oficial cadastrado na API (testado antes de usar)
2. Favicon do site da própria rádio
3. Capa gerada com as iniciais da rádio

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
| `STREAMING_PROVIDERS` | Quais streamings aparecem (padrão: `nfx,gop,mxx,dnp,prv,ptv`). Opções: `nfx` Netflix, `gop` Globoplay, `mxx` Max, `dnp` Disney+, `prv` Prime Video, `atp` Apple TV+, `pmp` Paramount+, `ptv` Pluto TV, `cru` Crunchyroll, `lke` Looke |

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
- As rádios vêm da API pública Radio Browser e são apenas as que respondem em **HTTPS** (rádios só-HTTP costumam falhar no Stremio).
- Alguns links de canais podem cair com o tempo, pois as listas são mantidas pela comunidade.
- No plano gratuito do Render, o serviço "hiberna" após inatividade (a primeira abertura pode demorar ~50s).

Feito por **drinkzin**.
