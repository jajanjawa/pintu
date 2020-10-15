/**
 * estimasi harga beli dan jual
 * @param symbol simbol koin huruf besar
 * @returns {Promise<{buy: number, sell: number}>}
 */
async function fetchPrice(symbol) {
    let server = 'https://api.pintukripto.com';
    let buy = fetch(`${server}/v1/trade/price/buy/${symbol}`, {cache: 'no-cache'});
    let sell = fetch(`${server}/v1/trade/price/sell/${symbol}`, {cache: 'no-cache'});
    let res = await Promise.all([buy, sell]);
    let price = {buy: 0, sell: 0};
    if (res[0].ok) {
        let data = await res[0].json();
        price.buy = parseInt(data.payload.price.close);
    }
    if (res[1].ok) {
        let data = await res[1].json();
        price.sell = parseInt(data.payload.price.close);
    }
    return price;
}

/**
 * harga koin pada waktu itu
 * @param symbol simbol koin
 * @param block
 * @returns {Promise<{block: number, close: number}>}
 */
async function fetchRate(symbol, block) {
    let server = `https://api.pintu.co.id/v1/trade/exchange-rate/${symbol}`;
    if (block) {
        server += `?block=${block}`;
    }
    let res = await fetch(server, {cache: "no-cache"});
    if (res.ok) {
        res = await res.json();
        let price = res.payload.price;
        return {
            close: parseInt(price.close),
            block: price.block
        };
    }
    return {close: 0, block: 0};
}

async function fetchChart(symbol, interval) {
    let server = `https://api.pintu.co.id/v1/trade/chart/${symbol}?interval=${interval}`;
    let res = await fetch(server, {cache: "no-cache"});
    if (res.ok) {
        res = await res.json();
        return res.payload.chart;
    }
    return [];
}

/**
 * harga tinggi dan rendah
 * @param chart
 * @returns {{high: number, low: number}}
 */
function getHighLow(chart) {
    let high = 0, low = parseInt(chart[0].close);
    for (const it of chart) {
        let price = parseInt(it.close);
        if (price > high) high = price;
        if (price < low) low = price;
    }
    return {high, low};
}

/**
 * perubahan harga dalam persen
 * @param newPrice
 * @param oldPrice
 * @returns {number}
 */
function calcPriceChange(newPrice, oldPrice) {
    if (oldPrice === '0') return 0;
    let change = newPrice - oldPrice;
    return (change / oldPrice) * 100;
}