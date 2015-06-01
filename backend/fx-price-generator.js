var http = require( 'http' ),
	events = require( 'events' ),
	util = require( 'util' );

function FXPriceGenerator() {
	this._url = 'http://finance.yahoo.com/webservice/v1/symbols/allcurrencies/quote?format=json';
	this._intervals = {};
	this._rates = {};
	http.get( this._url, this._onResponse.bind( this ) );
}
util.inherits( FXPriceGenerator, events.EventEmitter );

FXPriceGenerator.prototype._onResponse = function( response ) {
	var data = '';

	response.on( 'data', function( chunk ) {
		data += chunk.toString( 'utf8' );
	} );

	response.on( 'end', function() {
		this._parseData( data );
	}.bind( this ) );

	response.on( 'error', function( e ) {
		console.log( 'Error ' + e.toString() );
	} );
};

FXPriceGenerator.prototype._parseData = function( data ) {

	var currencyData = JSON.parse( data ),
		resources = currencyData.list.resources,
		termCurrency,
		i;

	for( i = 0; i < resources.length; i++ ) {
		currencyData = resources[ i ].resource.fields;
		termCurrency = currencyData.symbol.substr( 0, 3 );
		this._rates[ termCurrency ] = parseFloat( currencyData.price );
	}

	this.emit( 'ready' );
};

FXPriceGenerator.prototype.getPrices = function( currencyPair, callback ) {
	var baseCurrency = currencyPair.substr( 0, 3 ),
		termCurrency = currencyPair.substr( 3, 3 ),
		sendPriceUpdate = this._sendPriceUpdate.bind( this, baseCurrency, termCurrency, callback );

	this._intervals[ currencyPair ] = setInterval( sendPriceUpdate, 500 );
	this._sendPriceUpdate( baseCurrency, termCurrency, callback );
};

FXPriceGenerator.prototype._sendPriceUpdate = function( baseCurrency, termCurrency, callback ) {
	this._rates[ baseCurrency ] += 0.9999 + ( Math.random() * 0.0005 );
	this._rates[ termCurrency ] += 0.9999 + ( Math.random() * 0.0005 );

	var rate = ( 1 / this._rates[ baseCurrency ] ) * this._rates[ termCurrency ];
	callback( ( rate + Math.random() / 1000 ).toFixed( 4 ), ( rate - Math.random() / 1000 ).toFixed( 4 ) );
};

FXPriceGenerator.prototype.discardPrices = function( currencyPair ) {
	clearInterval( this._intervals[ currencyPair ] );
	delete this._intervals[ currencyPair ];
};

module.exports = FXPriceGenerator;
