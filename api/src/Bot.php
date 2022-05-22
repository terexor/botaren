<?php
namespace Botaren;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Psr\Http\Message\RequestInterface;

use Google\Cloud\Dialogflow\V2\SessionsClient;
use Google\Cloud\Dialogflow\V2\TextInput;
use Google\Cloud\Dialogflow\V2\QueryInput;

class Bot implements MessageComponentInterface {

	public function __construct() {
		$this->sessionsClient = new SessionsClient( array('credentials' => 'dialogflow-client-secret.json') );
		echo("Bot encendido.\n");
	}

	public function __destruct() {
		$this->sessionsClient->close();
		echo("Bot apagado.\n");
	}

	public function onOpen(ConnectionInterface $conn) {
		echo "Conexión nueva ({$conn->resourceId})\n";
	}

	public function onMessage(ConnectionInterface $from, $msg) {
		$respuesta['params'] = [];//Para enviar al navegador
		$datos = json_decode($msg, true);

		//Siempre debe haber una reacción de igual magnitud (y en sentido contrario).
		$respuesta['action'] = $datos['action'];

		try {
			switch($datos['action']) {
				case 10:
					$respuesta['cheveridad'] = true;
					$respuesta['params']['texto'] = $this->detect_intent_texts('karen-fnkq', $datos['params']['texto'],'930793 94770');
					$from->send( json_encode( $respuesta ) );
					return;
				default:
					$respuesta['cheveridad'] = false;
					$respuesta['params']['info'] = 'No existe opción';
					$from->send( json_encode( $respuesta ) );
			}
		}
		catch(\Exception $e) {
			echo $e->getMessage();

			$respuesta['cheveridad'] = false;
			$respuesta['params']['info'] = 'Servidor no pudo procesar.';

			$from->send( json_encode( $respuesta ) );
		}

		//~ detect_intent_texts('karen-fnkq', $mensaje,'930793 94770');
	}

	public function onClose(ConnectionInterface $conn) {
	}

	public function onError(ConnectionInterface $conn, \Exception $e) {
	}

	private function detect_intent_texts($projectId, $text, $sessionId, $languageCode = 'es-PE') {
		// new session
		try {
			//~ $sessionsClient = new SessionsClient( array('credentials' => 'dialogflow-client-secret.json') );
			$session = $this->sessionsClient->sessionName($projectId, $sessionId ?: uniqid());
			printf('Session path: %s' . PHP_EOL, $session);

			// create text input
			$textInput = new TextInput();
			$textInput->setText($text);
			$textInput->setLanguageCode($languageCode);

			// create query input
			$queryInput = new QueryInput();
			$queryInput->setText($textInput);

			// get response and relevant info
			$response = $this->sessionsClient->detectIntent($session, $queryInput);
			$queryResult = $response->getQueryResult();
			$queryText = $queryResult->getQueryText();
			$intent = $queryResult->getIntent();
			$displayName = $intent->getDisplayName();
			$confidence = $queryResult->getIntentDetectionConfidence();
			$fulfilmentText = $queryResult->getFulfillmentText();

			// output relevant info
			//~ print(str_repeat("=", 20) . PHP_EOL);
			//~ printf('Query text: %s' . PHP_EOL, $queryText);
			//~ printf('Detected intent: %s (confidence: %f)' . PHP_EOL, $displayName,
				//~ $confidence);
			//~ print(PHP_EOL);
			//~ printf('Fulfilment text: %s' . PHP_EOL, $fulfilmentText);

			//~ $sessionsClient->close();
			return $fulfilmentText;
		}
		catch(Exception $e) {
			echo $e-what();
			return null;
		}
	}
}
