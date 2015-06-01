var PermissionHandler = require( './permission-handler' );
var Deepstream = require( 'deepstream.io' );
var server = new Deepstream();

server.set( 'tcpHost', '0.0.0.0' );
server.set( 'tcpPort', '6022' );
server.set( 'permissionHandler', new PermissionHandler() );

// server.set( 'cache', new RedisCacheConnector({
//     port: 6379,
//     host: '178.62.87.119'
// }));

server.start();
