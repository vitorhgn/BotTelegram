# Bot de Apostas Esportivas no Telegram

Este bot fornece odds e probabilidades em tempo real para eventos esportivos, especificamente para o Campeonato Brasileiro de Futebol (Brasileirão).

## Requisitos

- Node.js
- NPM ou Yarn

## Iniciando

### 1. Clonar o Repositório

```bash
git clone https://github.com/vitorhgn/BotTelegram.git
cd BotTelegram
```

### 2. Instalar Dependências

```bash
npm install
```
ou
```bash
yarn install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` copiando o `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e substitua os placeholders pelos seus tokens de API.

### 4. Gerar os Tokens de API

#### 4.1 Token do Bot no Telegram
- No Telegram, procure por `@BotFather`.
- Inicie uma conversa com o BotFather e crie um novo bot usando o comando `/newbot`.
- Siga as instruções para receber o token do seu bot.
- Substitua `TELEGRAM_BOT_TOKEN` no arquivo `.env` pelo token gerado.

#### 4.2 Token da API-SPORTS
- Inscreva-se no [API-SPORTS](https://www.api-football.com/).
- Após se inscrever, você receberá uma chave de API.
- Substitua `API_FOOTBALL_TOKEN` no arquivo `.env` pela chave gerada.

#### 4.3 Token da The Odds API
- Inscreva-se no [The Odds API](https://the-odds-api.com/).
- Após se inscrever, você receberá uma chave de API.
- Substitua `ODDS_API_TOKEN` no arquivo `.env` pela chave gerada.

### 5. Iniciar o Bot

Finalmente, inicie o bot com:

```bash
npm run dev
```
ou
```bash
yarn dev
```

## Uso

O bot agora irá automaticamente buscar e enviar as melhores odds para os próximos jogos do Campeonato Brasileiro para o grupo ou canal especificado no Telegram.

## Licença

Este projeto é licenciado sob a Licença MIT.
