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
		$this->sessionsClient = new SessionsClient( array('credentials' => 'client-secret.json') );
		$this->bd = new \mysqli("localhost", "root", "", "botaren");
		echo("Bot encendido.\n");
	}

	public function __destruct() {
		$this->sessionsClient->close();
		$this->bd->close();
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
			//Del 10 al 999 son acciones de ida y vuelta.
			//Del 1000 hacia arriba son asíncronas.
			switch($datos['action']) {
				case 10:
					//~ $respuesta['cheveridad'] = true;
					$queryResult = $this->detectIntentTexts('karen-fnkq', $datos['params']['texto'],'930793 94770rr');
					$this->procesarSalida( $queryResult, $from, $respuesta );
					//~ $from->send( json_encode( $respuesta ) );
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
	}

	public function onClose(ConnectionInterface $conn) {
	}

	public function onError(ConnectionInterface $conn, \Exception $e) {
	}

	private function detectIntentTexts($projectId, $text, $sessionId, $languageCode = 'es-PE') {
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
			echo "/ntipo: " . $queryResult->getOutputContexts()->getType();
			echo "/nclase: " . $queryResult->getOutputContexts()->getClass();
			echo "/ncuenta: " . $queryResult->getOutputContexts()->count();

			return $queryResult;
		}
		catch(Exception $e) {
			echo $e->what();
			return null;
		}
	}

	private function procesarSalida( $queryResult, $from, &$respuesta ) {
		$respuesta['cheveridad'] = true;
		$respuesta['params']['texto'] = $queryResult->getFulfillmentText();
		$from->send( json_encode( $respuesta ) );
		return;
		//~ switch( $intent ) {
			//~ case 'bot.producto.muestra':
				$this->mostrarProductos( $modelo, $talla, $color, $precio );
				//~ break;
			//~ default:
				//mostrar inconsistencia
	}

	/**
	 * Manda al cliente una lista de productos.
	 * Esa lista puede contener uno o más productos.
	 */
	private function mostrarProductos( $modelo, $talla, $color, $precio ) {
		$sentenciaSeleccionadora = $bd->prepare('SELECT campo1, campo2 FROM Tabla WHERE condicionInt = ?, condicionString = ?');
		$sentenciaSeleccionadora->bind_param('is', $condicionInt, $condicionString);
		$resultado = $sentenciaSeleccionadora->execute();
		if($resultado) {
			//Ejecución correcta
			$resultado = $sentenciaSeleccionadora->get_result();
			while($fila = $resultado->fetch_assoc()) {
				$variableParaCampo1 = $fila['campo1'];
				$variableParaCampo2 = $fila['campo2'];

				$respuesta['cheveridad'] = true;
				$respuesta['action'] = 1000;
				$respuesta['params']['producto']['modelo'] = 'No existe opción';
			}
		}
		else {
			//'No se encontró nada.'
		}
		$sentenciaSeleccionadora->close();

		$from->send( json_encode( $respuesta ) );
	}
}
