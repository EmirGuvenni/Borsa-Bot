import axios from "axios";
import { Client, MessageEmbed } from "discord.js-light";

const client = new Client();

client.on('ready', async () => {
	console.log('Bot is online');

	let _: number = 0;

	setInterval(async () => {
		let rates = await getRates();

		await setEUR(rates.eur);
		setTimeout(async () => await setUSD(rates.usd), 8000);

		_++;
	}, 16000);
})

client.on('message', async (message) => {
	if (message.content == '!borsa') {
		await message.channel.send('Retrieving exchange rates...');

		let rates = await getRates();
		let crypto = await getCrypto();



		await message.channel.send(new MessageEmbed().setTitle('Exchange rates')
			.setDescription(
				[
					`**Dolar**: ${rates.usd}₺`,
					`**Euro**: ${rates.eur}₺`,
					`**BTC**: ${crypto.btc}$`,
					`**BAT**: ${crypto.bat}$`,
					`**ETH**: ${crypto.eth}$`
				]
			).setColor(0x228D57)
		);
	}
})

client.login(process.env.TOKEN);

async function getCrypto() {
	const btcReq = await axios.get('https://data.messari.io/api/v1/assets/btc/metrics/market-data');
	const batReq = await axios.get('https://data.messari.io/api/v1/assets/bat/metrics/market-data');
	const ethReq = await axios.get('https://data.messari.io/api/v1/assets/eth/metrics/market-data');

	const btc: string = btcReq.data.data.market_data.price_usd;
	const bat: string = batReq.data.data.market_data.price_usd;
	const eth: string = ethReq.data.data.market_data.price_usd;

	const btcDollar = String(btc).split('.')[0];
	const batDollar = String(bat).split('.')[0];
	const ethDollar = String(eth).split('.')[0];


	const btcCents = String(btc).split('.')[1].substring(0, 2);
	const batCents = String(bat).split('.')[1].substring(0, 2);
	const ethCents = String(eth).split('.')[1].substring(0, 2);

	return {
		btc: `${btcDollar}.${btcCents}`,
		bat: `${batDollar}.${batCents}`,
		eth: `${ethDollar}.${ethCents}`
	}

}
async function getRates() {
	let usdReq = await axios.get('https://www.freeforexapi.com/api/live?pairs=USDTRY');
	let eurusdReq = await axios.get('https://www.freeforexapi.com/api/live?pairs=EURUSD');

	let _usd: number = usdReq.data.rates.USDTRY.rate;
	let _eur: number = eurusdReq.data.rates.EURUSD.rate * _usd;

	const usdP: string = String(_usd).split('.')[0];
	const eurP: string = String(_eur).split('.')[0];

	const usdS: string = String(_usd).split('.')[1].substring(0, 2);
	const eurS: string = String(_eur).split('.')[1].substring(0, 2);

	let usd: string = `${usdP}.${usdS}`;
	let eur: string = `${eurP}.${eurS}`;

	return { usd, eur };
}
async function setUSD(usd: string): Promise<void> {
	await client.user!.setActivity({ name: `$ = ${usd}₺` });
}
async function setEUR(eur: string): Promise<void> {
	await client.user!.setActivity({ name: `€ = ${eur}₺` });
}