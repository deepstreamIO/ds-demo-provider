var deepstreamClient = require( 'deepstream.io-client-js' );
var	PriceGenerator = require( './fx-price-generator' );

var ds = deepstreamClient( 'localhost:6022' );
var priceGenerator = new PriceGenerator();

priceGenerator.on( 'ready', function() {
	ds.login( { username: 'fx-provider', password: 'complicatedProviderPassword' }, listenForSubscriptions );
} );

function listenForSubscriptions() {
	ds.record.listen( 'FX/.*', onSubscription );
}

/**
 * @param {string} recordName The name of the record that has been subscribed to
 * @param {boolean} isSubscribed Whether the subject is being subscribed too or disposed of.
 */
function onSubscription( recordName, isSubscribed ) {
  /**
   * Get the record from your cache
   */
	var record = ds.record.getRecord( recordName );

  /**
   * Extract the currency pair from the record name
   */
	var currencyPair = recordName.substr( 3 );

  /**
   * If isSubscribed is false no clients are interested in this
   * currency pair so stop generating prices
   */
	if( isSubscribed === false ) {
		record.discard();
		priceGenerator.discardPrices( currencyPair );
	}
  /**
   * If isSubscribed is true the currency pair has been requested by a client
   * so start generating prices accordingly
   */
  else {
		priceGenerator.getPrices( currencyPair, function( bid, ask ) {
			record.set( 'bid', bid );
			record.set( 'ask', ask );
		} );
	}
}
