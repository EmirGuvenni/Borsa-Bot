import axios from "axios";
import { Client, Message, MessageEmbed } from "discord.js-light";
import fs from "fs";

const client = new Client();

client.on('ready', async () => {
	console.log('Bot is online');

	let _: number = 0;

	setInterval(async () => {
		let rates = await getRates();

		if (rates) {
			await setEUR(rates.eur);
			setTimeout(async () => rates ? await setUSD(rates.usd) : '', 8000);

			_++;
		}
	}, 16000);
})

client.on('message', async (message) => {
	await filterTiktokLinks(message);

	if (message.content == '!borsa') {
		await message.channel.send('Retrieving exchange rates...');

		let rates = await getRates();
		let crypto = await getCrypto();

		const ratesFailed = typeof rates == 'string';
		const cryptoFailed = typeof crypto == 'string';

		let usd: string = rates?.usd || 'ERROR';
		let eur: string = rates?.eur || 'ERROR';
		let btc: string = crypto?.btc || 'ERROR';
		let bat: string = crypto?.bat || 'ERROR';
		let eth: string = crypto?.eth || 'ERROR';

		if (ratesFailed && cryptoFailed) {
			await message.channel.send('Failed to retrieve both foreign currency and crypto currency rates.');
			return;
		}
		else if (ratesFailed)
			await message.channel.send('Failed to retrieve foreign currency rates.');

		else if (cryptoFailed)
			await message.channel.send('Failed to retrieve crypto currency rates.');

		await message.channel.send(new MessageEmbed().setTitle('Exchange rates')
			.setDescription(
				[
					`**Dolar**: ${usd}₺`,
					`**Euro**: ${eur}₺`,
					`**BTC**: ${btc}$`,
					`**BAT**: ${bat}$`,
					`**ETH**: ${eth}$`
				]
			).setColor(0x228D57)
		);
	}
})

client.on('messageUpdate', async (a, newMessage) => await filterTiktokLinks(newMessage as Message));

client.login(process.env.TOKEN);

async function getCrypto() {
	try {
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
	catch (err) {
		fs.writeFileSync(`./logs/log - ${getDate()}`, err.stack);
		return null;
	}
}
async function getRates() {
	try {
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
	catch (err) {
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
	const month: number = (date.getMonth() + 1);
	const day: number = date.getDate();

	const hour: number = date.getHours();
	const minute: number = date.getMinutes();

	return `${day}.${month}.${year} - ${hour}:${minute}`;
}

async function filterTiktokLinks(message: Message): Promise<void> {
	if (message.channel.id === '850701388359139328') return;

	let args: string[] = message.content.split(' ');

	let isTiktok: boolean = message.content.includes('http') && message.content.includes('tiktok');
	let isMusically: boolean = message.content.includes('http') && message.content.includes('musical');

	if (isTiktok || isMusically) message.delete();

	// look at each string and delete the message 
	// if there's a link and it redirects to tiktok
	for (let arg of args) {
		if (arg.startsWith('http') && arg.includes('.') && arg.includes('://')) {
			await axios.get(arg).then((response) => {
				let url: string = response.request.res.responseUrl;

				if (url.includes('tiktok') || url.includes('musical'))
					message.delete();
			});
		}
	}
}