<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\Http\OriginCheck;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;

use Botaren\Bot;

$vars = include 'global-vars.php';

require __DIR__ . '/vendor/autoload.php';

$loop = Factory::create();

$oc = new OriginCheck(
	new WsServer(
		new Bot($vars['db'], $vars['dialogflow-secret-path'], $vars['dialogflow-session'])
	)
);
$oc->allowedOrigins = $vars['allowed-origins'];

$app = new HttpServer($oc);

$secure_websockets = new \React\Socket\Server('0.0.0.0:' . $vars['ws-port'], $loop);
$secure_websockets = new \React\Socket\SecureServer($secure_websockets, $loop, $vars['ws-certs-path']);

$secure_websockets_server = new \Ratchet\Server\IoServer($app, $secure_websockets, $loop);
$secure_websockets_server->run();
