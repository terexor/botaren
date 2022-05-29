<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\Http\OriginCheck;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;

use Botaren\Bot;

require __DIR__ . '/vendor/autoload.php';

$loop = Factory::create();

$oc = new OriginCheck(
	new WsServer(
		new Bot()
	)
);
$oc->allowedOrigins[] = 'localhost';
$oc->allowedOrigins[] = '192.168.1.46';

$app = new HttpServer($oc);

$secure_websockets = new \React\Socket\Server('0.0.0.0:666', $loop);
$secure_websockets = new \React\Socket\SecureServer($secure_websockets, $loop, [
	'local_cert' => '/etc/apache2/certificate/apache-certificate.crt',
	'local_pk' => '/etc/apache2/certificate/apache.key',
	'verify_peer' => false
]);

$secure_websockets_server = new \Ratchet\Server\IoServer($app, $secure_websockets, $loop);
$secure_websockets_server->run();
