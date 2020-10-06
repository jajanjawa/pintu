function initCoin() {
    return {price: {}, day: {}, week: {}, month: {}}
}

new Vue({
    el: '#app',
    data: {
        btc: initCoin(),
        eth: initCoin(),
        bnb: initCoin(),
        link: initCoin(),
        snx: initCoin(),
        comp: initCoin()
    },
    mounted() {
        this.loadCoin('btc');
        this.loadCoin('eth');
        this.loadCoin('bnb');
        this.loadCoin('link');
        this.loadCoin('snx');
        this.loadCoin('comp');
    },
    methods: {
        async loadCoin(symbol) {
            let data = localStorage.getItem(symbol);
            if (data) {
                // baca data tersimpan
                this.$set(this, symbol, JSON.parse(data));
                await this.priceChange(symbol);
            } else {
                let price = await this.fetchPrice(symbol.toUpperCase());
                this.$set(this[symbol], 'price', price);
            }
        },
        saveCoin(symbol) {
            localStorage.setItem(symbol, JSON.stringify(this[symbol]));
        },
        /**
         * estimasi harga beli dan jual
         * @param symbol simbol koin huruf besar
         * @returns {Promise<{buy: number, sell: number}>}
         */
        async fetchPrice(symbol) {
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
        },
        async fetchRate(symbol, block) {
            let server = `https://api.pintu.co.id/v1/trade/exchange-rate/${symbol}`;
            if (block) {
                server += `?block=${block}`;
            }
            let res = await fetch(server, {cache: "no-cache"});
            if (res.ok) {
                res = await res.json();
                let price = res.payload.price;
                return {
                    close: price.close,
                    block: price.block
                };
            }
            return {close: 0, block: 0};
        },
        async fetchChart(symbol, interval) {
            let server = `https://api.pintu.co.id/v1/trade/chart/${symbol}?interval=${interval}`;
            let res = await fetch(server, {cache: "no-cache"});
            if (res.ok) {
                res = await res.json();
                return res.payload.chart;
            }
            return [];
        },
        copyText(text) {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        },
        openPintu() {
            window.open('pintu://', '_self');
        },
        contact() {
            this.copyText('@jajanjawa');
            M.toast({
                html: 'username disalin', displayLength: 1700, completeCallback: () => {
                    window.open('pintu://', '_self');
                }
            });
        },
        invite() {
            this.copyText('EXPLO190');
            M.toast({
                html: 'kode undangan disalin', displayLength: 1700, completeCallback: () => {
                    window.open('pintu://', '_self');
                }
            });
        },
        refresh(symbol) {
            this.fetchPrice(symbol.toUpperCase()).then(price => {
                this.$set(this[symbol], 'price', price);
                return this.priceChange(symbol);
            }).then(() => this.saveCoin(symbol));
        },
        async priceChange(symbol) {
            let last = this[symbol].day;
            let result = await this.fetchRate(symbol);
            let change = 0;
            if (last) {
                change = result.close - last.high;
                let percent = (change / result.close) * 100;
                change = percent.toFixed(2);
            }
            if (!isNaN(change)) {
                this.$set(this[symbol], 'diff', change);
            }
        },
        async priceHighLow(symbol, interval) {
            let chart = await this.fetchChart(symbol, interval);
            let high = 0, low = 0;
            if (chart.length > 0) {
                low = chart[0].close;
            }
            for (const data of chart) {
                if (data.close > high) high = data.close;
                if (data.close < low) low = data.close;
            }
            this.$set(this[symbol], interval, {high, low});

            this.saveCoin(symbol);
        }
    },
    filters: {
        fmtNumber(value) {
            if (value === undefined) return '0';
            if (typeof value === "string") {
                value = parseInt(value);
            }
            return value.toLocaleString();
        }
    }
});
