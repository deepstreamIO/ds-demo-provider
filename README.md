Building a Data-Provider
===========================================

A provider is a client that listens to subscriptions created by other clients on
the system and provides data to them.

This provides an entry point to providers to minimize resources, since a provider
can cater for data that a client is currently interested in rather than providing
all possible updates at all times.

<a class="mega" href="https://github.com/hoxton-one/ds-demo-fxprovider"><i class="fa fa-github"></i>Checkout the provider tutorial code</a>

###Brief tutorial introduction

We're going to build a simple data provider for foreign exchange (FX) rates.

<div class="hint-box fa fa-lightbulb-o">

	<h3>Why FX?</h3>
	<ul>
		<li>
       Because it's a great example of data that is dynamically created when a client requests it.
		</li>
		<li>
      FX rates are usually stored as &lt;currency&gt; against Dollar. So if a client wants out how many Euro's we'd get for a Pound sterling, we would need to look up how many dollars we get for a pound.
		</li>
  	</ul>
</div>

We will need to create the following:
- A client that requests a currency pair with the format of 'FX/XXXYYY'. For example, GBPUSD.
- A client that listens to requests and sends prices.
- Deepstream to provide permissions that ensure only providers can update records that match the 'FX/XXXYYY'.

###Creating a Provider

A provider works by using **record.listen**. This works by providing a regex of a record name that a
provider is interested in and a callback for when the a subscription is requested or when the record is
no longer requested. The following code will allow all matching subjects to be notified.

    ds.record.listen( 'FX/.\*', onSubscription );

Once we are notified a subscription is received we will need to update the record whenever the price changes.
We have supplied a ***fx-price-generator*** class that requests the current market prices from ***finance.yahoo.com*** and adds a small difference to the prices to simulate market movement.

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

###Authenticate provider to make them the only source of prices

Visit the <a href="authentication.html">authentication tutorial</a> and <a href="permissioning.html">permissioning tutorial</a> for in depth description on this section.

We would need to:
- Ensure that providers login to avoid any other client trying to
masquerade as one
- Limit price modifications to the server to avoid any logged in client updating
the prices


    /**
     * Deny the provider from logging in if it doesn't have the correct credentials.
     *
     * @param {object} connectionData
     * @param {{username:string, password:string}} authData
     * @param {function} callback
     */
    PermissionHandler.prototype.isValidUser = function( connectionData, authData, callback ) {

      /**
       * If username matches that of a provider authenticate against provided password
       */
      if( this.isProvider( authData.username &&
          authData.password !== 'complicatedProviderPassword' ) ) {
        callback( 'Invalid credentials.' );
      }
      /**
       * Otherwise the username will be valid, to allow any client to login
       */
      else {
        callback( null, authData.username );
      }
    };

    /**
     * Only allow providers the ability to update prices, to avoid clients from trying
     * to spoof data.
     * @param {string} username
     * @param {object} message
     * @param {function} callback
     */
    PermissionHandler.prototype.canPerformAction = function( username, message, callback ) {
      /**
       * If the user is a provider, it has all permissions
       */
      if( this.isProvider( username ) ) {
    		callback( null, true );
    	}
      /**
       * Otherwise the client request is valid unless it's trying to make a change to a #
       * price record
       */
       else {
    		var messageObj = readMessage( message );
    		var isAllowed = !fxRecordNameRegex.test( messageObj.name ) || !messageObj.isChange;
    		var errorMessage = isAllowed ? null : 'Can\'t update FX prices from client';
    		callback( errorMessage, isAllowed );
    	}
    };


###Create a user to request the data

Now that we have both a permissioned price provider we can request the record from a client
and view streaming prices!

    /**
    * Login to deepstream as Frank
    */
    var ds = deepstream( 'localhost:6020' ).login({ username: 'Frank'});

    /**
    * Request an anonymous record, as we will be changing the currency pair
    * dynamically
    */
    var currencyPairRecord = ds.record.getAnonymousRecord();

    var bid = $('.streaming-prices .bid');
    var ask = $('.streaming-prices .ask');
    var currencyPair = $('.streaming-prices .currency-pair');

    /**
    * Update bid price whenever it changes
    */
    currencyPairRecord.subscribe( 'bid', function( bidPrice ){
      bid.text( bidPrice );
    });

    /**
    * Update ask price whenever it changes
    */
    currencyPairRecord.subscribe( 'ask', function( askPrice ){
      ask.text( askPrice );
    });

    /**
    * Set the new record name whenever the currency pair changes
    */
    currencyPair.change(function updateCurrencyPair() {
      currencyPairRecord.setName( 'FX/' + $( this ).val() );
    });
    currencyPair.trigger( "change" );


<div class="hint-box fa fa-lightbulb-o">

	<h3>Some considerations when using a provider</h3>
	<ul>
		<li>
      A client can still try to override a records contents if he is not permissioned.
      This will result in inconsistencies between the value in the clients local cache (as they can
      modify everything locally on their machine) and the server, which will deny the update
      from being applied to Deepstream.
		</li>
  	</ul>
</div>
