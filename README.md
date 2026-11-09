# ZinTV BR

Addon de **TV aberta, rádios, cinema grátis e TV do mundo** para o Stremio. Feito por **drinkzin**.

## O que ele faz

- Lista canais de TV aberta/pública brasileiros a partir de listas M3U (por padrão, a lista do iptv-org Brasil).
- Mostra os canais em uma grade no Stremio, com logo, nome e grupo.
- Reproduz o canal ao vivo ao clicar.
- **📻 Rádios ao Vivo**: mais de 1.100 rádios brasileiras, vindas da API pública Radio Browser (sem chave, sem custo).
- **📼 Cinema Grátis**: filmes em domínio público ou licença livre do Archive.org, com vídeo real (MP4) e filtro por gênero.
- **🌍 TV do Mundo**: emissoras públicas/internacionais que transmitem HLS aberto (DW, NASA TV, France 24, Al Jazeera, TRT World, Arirang, CNA, Bloomberg).
- **Catálogos dos streamings**: fileiras de filmes e séries da Netflix, Globoplay, Max, Disney+, Prime Video e Pluto TV, com dados públicos do JustWatch (sem chave).
- **🤝 Apoie o ZinTV BR**: card fixo no topo de todos os catálogos e primeiro item da lista de streams, levando ao LivePix.

> Os catálogos dos streamings são só de **descoberta**: eles mostram o que está disponível em cada serviço, mas não entregam o vídeo. Para assistir, use o serviço oficial ou outro addon de sua escolha.

## Cinema Grátis

Filmes cuja obra já caiu em domínio público (ou tem licença livre), hospedados no Archive.org. Como são arquivos MP4 diretos, o Stremio reproduz com imagem normalmente — sem a tela preta das rádios.

Gêneros disponíveis: Comédia, Terror, Noir, Suspense, Ficção científica, Faroeste, Animação e Nacional.

## TV do Mundo

Emissoras públicas e internacionais que publicam o próprio sinal em HLS aberto. São canais legais, sem IPTV pirata. A lista pode mudar com o tempo, pois as emissoras trocam as URLs de tempos em tempos.

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
- O Cinema Grátis usa apenas obras em domínio público/licença livre do Archive.org; o primeiro play pode demorar alguns segundos, pois o arquivo vem de um servidor público.
- Os canais da TV do Mundo são sinais oficiais das próprias emissoras; algumas URLs podem mudar sem aviso.
- Alguns links de canais podem cair com o tempo, pois as listas são mantidas pela comunidade.
- No plano gratuito do Render, o serviço "hiberna" após inatividade (a primeira abertura pode demorar ~50s).

Feito por **drinkzin**.
