var deepstreamClient = require( 'deepstream.io-client-js' ),
	ds = deepstreamClient( 'localhost:6022' ),
	PriceGenerator = require( './fx-price-generator' ),
	priceGenerator = new PriceGenerator();

priceGenerator.on( 'ready', function(){
	ds.login( null, listenForSubscriptions );
});

function listenForSubscriptions() {
	ds.record.listen( 'FX/.*', onSubscription );
}

function onSubscription( recordName, isSubscribed ) {
	var record = ds.record.getRecord( recordName ),
		currencyPair = recordName.substr(3);

	if( isSubscribed === false ) {
		record.set( 'stale', true );
		record.discard();
		priceGenerator.discardPrices( currencyPair );
	} else {
		record.set( 'stale', false );
		priceGenerator.getPrices( currencyPair, function(bid, ask) {
			record.set( 'bid', bid );
			record.set( 'ask', ask );
		});
	}
}
