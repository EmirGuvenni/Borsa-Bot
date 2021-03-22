import axios from "axios";
import { Client } from "discord.js-light";
import config from "./config.json";

const client = new Client();

client.on('ready', async () => {
	console.log('Bot is online');

	let _: number = 0;

	setInterval(async () => {
		let rates = await getRates();

		setTimeout(async () => await setUSD(rates.usd), 8000);
		await setEUR(rates.eur);

		_++;
	}, 16000);
})

client.on('message', async (message) => {
	if (message.content == '!borsa') {
		let rates = await getRates();

		await message.channel.send([
			`Dolar: ${rates.usd}₺`,
			`Euro: ${rates.eur}₺`
		]);
	}
})

client.login(config.token);

async function getRates() {
	let usdReq = await axios.get('https://www.freeforexapi.com/api/live?pairs=USDTRY');
	let eurusdReq = await axios.get('https://www.freeforexapi.com/api/live?pairs=EURUSD');

	let _usd: number = usdReq.data.rates.USDTRY.rate;
	let _eur: number = eurusdReq.data.rates.EURUSD.rate * _usd;

	let usd: string = String(_usd).slice(0, 4);
	let eur: string = String(_eur).slice(0, 4);

	return { usd, eur };
}
async function setUSD(usd: string): Promise<void> {
	await client.user!.setActivity({ name: `$ = ${usd}₺` });
}
async function setEUR(eur: string): Promise<void> {
	await client.user!.setActivity({ name: `€ = ${eur}₺` });
}