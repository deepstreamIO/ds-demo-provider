var Deepstream = require( 'deepstream.io' );
var fxRecordNameRegex = new RegExp( /^FX\/.*/ );

function PermissionHandler() {
}

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
		var messageObj = Deepstream.readMessage( message );
		var isAllowed = !fxRecordNameRegex.test( messageObj.name ) || !messageObj.isChange;
		var errorMessage = isAllowed ? null : 'Can\'t update FX prices from client';
		callback( errorMessage, isAllowed );
	}
};

var providers = [ 'fx-provider' ];
PermissionHandler.prototype.isProvider = function( username ) {
	return providers.indexOf( username ) > -1;
};

module.exports = PermissionHandler;
