import axios from "axios";
import { Client, MessageEmbed } from "discord.js-light";
import fs from "fs";

const client = new Client();

client.on("ready", async () => {
  console.log("Bot is online");

  let _: number = 0;

  setInterval(async () => {
    let rates = await getRates();

    if (rates) {
      await setEUR(rates.eur);
      setTimeout(async () => (rates ? await setUSD(rates.usd) : ""), 8000);

      _++;
    }
  }, 16000);
});

client.on("message", async (message) => {
  if (message.content == "!borsa") {
    await message.channel.send("Retrieving exchange rates...");

    let rates = await getRates();

    const ratesFailed = typeof rates == "string";

    let usd: string = rates?.usd || "ERROR";
    let eur: string = rates?.eur || "ERROR";

    if (ratesFailed) {
      await message.channel.send(
        "Failed to retrieve both foreign currency and crypto currency rates."
      );
      return;
    } else if (ratesFailed)
      await message.channel.send("Failed to retrieve foreign currency rates.");

    await message.channel.send(
      new MessageEmbed()
        .setTitle("Exchange rates")
        .setDescription([`**Dolar**: ${usd}₺`, `**Euro**: ${eur}₺`])
        .setColor(0x228d57)
    );
  } else if (message.content.startsWith("!coin")) {
    await message.channel.send("Retrieving crypto currency data...");

    let crypto = await getCrypto(message.content.split(" ")[1]);

    if (typeof crypto == "string") {
      await message.channel.send(crypto as string);
    } else if (!crypto) {
      await message.channel.send(
        "Couldn't get the coin. It may not exists in the watchlist of the API."
      );
    } else {
      await message.channel.send(
        new MessageEmbed()
          .setTitle(crypto.symbol)
          .setDescription([
            `**Symbol:** ${crypto.symbol}`,
            `**Name:** ${crypto.name}`,
            `**Contract Addresses:** ${JSON.stringify(
              crypto.contractAddresses,
              null,
              2
            )}`,
            `**Price:** ${crypto.price}`,
            `**Volume:** ${crypto.volume}`,
            `**Difference (1H):** ${crypto.change1h}`,
            `**Difference:** ${crypto.change24h}`,
          ])
      );
    }
  }
});

client.login(process.env.TOKEN);

async function getCrypto(symbol: string) {
  try {
    if (!/^([A-Za-z])+$/g.test(symbol)) return "Invalid symbol";

    symbol = symbol.toLowerCase();

    const coinRequest = await axios.get(
      `https://data.messari.io/api/v1/assets/${symbol}/metrics/market-data`
    );

    let coinData = {
      symbol: coinRequest.data.data.symbol as string,
      name: coinRequest.data.data.name as string,

      contractAddresses: [] as any[],

      price: `${coinRequest.data.data.market_data.price_usd.toFixed(2)}$`,
      volume: `${coinRequest.data.data.market_data.volume_last_24_hours.toFixed(
        2
      )}$`,
      change1h: `${coinRequest.data.data.market_data.percent_change_usd_last_1_hour.toFixed(
        2
      )}%`,
      change24h: `${coinRequest.data.data.market_data.percent_change_usd_last_24_hours.toFixed(
        2
      )}%`,
    };

    // Add contract addresses to the coinData object
    coinRequest.data.data.contract_addresses.forEach((contract: any) => {
      coinData.contractAddresses.push(contract);
    });

    return coinData;
  } catch (err: any) {
    fs.writeFileSync(`./logs/log - ${getDate()}`, err.stack);
    return null;
  }
}
async function getRates() {
  try {
    let usdReq = await axios.get(
      "https://www.freeforexapi.com/api/live?pairs=USDTRY"
    );
    let eurusdReq = await axios.get(
      "https://www.freeforexapi.com/api/live?pairs=EURUSD"
    );

    let _usd: number = usdReq.data.rates.USDTRY.rate;
    let _eur: number = eurusdReq.data.rates.EURUSD.rate * _usd;

    const usdP: string = String(_usd).split(".")[0];
    const eurP: string = String(_eur).split(".")[0];

    const usdS: string = String(_usd).split(".")[1].substring(0, 2);
    const eurS: string = String(_eur).split(".")[1].substring(0, 2);

    let usd: string = `${usdP}.${usdS}`;
    let eur: string = `${eurP}.${eurS}`;

    return { usd, eur };
  } catch (err: any) {
    fs.writeFileSync(`./logs/log - ${getDate()}`, err.stack);
    return null;
  }
}
async function setUSD(usd: string): Promise<void> {
  await client.user!.setActivity({ name: `$ = ${usd}₺` });
}
async function setEUR(eur: string): Promise<void> {
  await client.user!.setActivity({ name: `€ = ${eur}₺` });
}

function getDate(): string {
  const date: Date = new Date();

  const year: number = date.getFullYear();
  const month: number = date.getMonth() + 1;
  const day: number = date.getDate();

  const hour: number = date.getHours();
  const minute: number = date.getMinutes();

  return `${day}.${month}.${year} - ${hour}:${minute}`;
}
