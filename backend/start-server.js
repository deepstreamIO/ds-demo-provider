var Deepstream = require( 'deepstream.io' ),
	server = new Deepstream();

server.set( 'tcpHost', '0.0.0.0' );
server.set( 'tcpPort', '6022' );

server.start();