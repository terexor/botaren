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
		$this->bd = new \mysqli("localhost", "root", "root", "botaren");
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
					$queryResult = $this->detectIntentTexts('karen-fnkq', $datos['params']['texto'],'930793 94770rr');
					$this->procesarSalida( $queryResult, $from, $respuesta );
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
			//~ $queryText = $queryResult->getQueryText();
			//~ $intent = $queryResult->getIntent();
			//~ $displayName = $intent->getDisplayName();
			//~ $confidence = $queryResult->getIntentDetectionConfidence();
			//~ $fulfilmentText = $queryResult->getFulfillmentText();

			// output relevant info
			//~ print(str_repeat("=", 20) . PHP_EOL);
			//~ printf('Query text: %s' . PHP_EOL, $queryText);
			//~ printf('Detected intent: %s (confidence: %f)' . PHP_EOL, $displayName,
				//~ $confidence);
			//~ print(PHP_EOL);
			//~ printf('Fulfilment text: %s' . PHP_EOL, $fulfilmentText);

			//~ $sessionsClient->close();
			echo "\ntipo: " . $queryResult->getOutputContexts()->getType();
			echo "\nclase: " . $queryResult->getOutputContexts()->getClass();
			echo "\ncuenta: " . $queryResult->getOutputContexts()->count();

			return $queryResult;
		}
		catch(Exception $e) {
			echo $e->what();
			return null;
		}
	}

	private function procesarSalida( $queryResult, $from, &$respuesta ) {
		//~ $respuesta['cheveridad'] = true;
		//~ $respuesta['params']['texto'] = $queryResult->getFulfillmentText();
		//~ $from->send( json_encode( $respuesta ) );
		//~ return;
		$intent = $queryResult->getIntent()->getDisplayName();
		echo "\n$intent\n";
		switch( $intent ) {
			case 'bot.producto.busqueda':
				$campos = json_decode( $queryResult->getParameters()->serializeToJsonString(), true );

				//~ var_dump( $campos );
				$estructura = $this->mostrarProductos( $campos['producto-modelo'], $campos['talla'], $campos['color'] );

				if($estructura == null) {
					$respuesta['cheveridad'] = false;
					$respuesta['params']['texto'] = 'Ingresa más datos.';
				}
				elseif( count($estructura) == 0 ) {
					$respuesta['cheveridad'] = false;
					$respuesta['params']['texto'] = 'No se hallaraon productos.';
				}
				else {
					$respuesta['cheveridad'] = true;
					$respuesta['params']['anexo'] = 1;
					$respuesta['params']['texto'] = 'Se hallaron estos jeans.';
					$respuesta['params']['productos'] = $estructura;
				}

				$from->send( json_encode( $respuesta ) );
				break;
			case 'smalltalk.greetings.hello':
			default:
				$respuesta['cheveridad'] = true;
				$respuesta['params']['texto'] = $queryResult->getFulfillmentText();

				$from->send( json_encode( $respuesta ) );
		}
	}

	/**
	 * Manda al cliente una lista de productos.
	 * Esa lista puede contener uno o más productos.
	 */
	private function mostrarProductos( $modelos, $tallas, $colores ) {
		if( ( count($modelos) + count($tallas) + count($colores) ) == 0 ) {
			return null;
		}
	
		$sTallas[]= 0;
		$sModelos[]= "";
		$sColores[] = 0;
		
		foreach($colores as $color) {
			$sColores[] = $this->_color($color);
		}

		foreach($tallas as $talla) {
		    $sTallas[] = intval($talla); 
		}

		foreach($modelos as $modelo) {
		    $sModelos[] = $modelo;
		}
		
		$inColores  = str_repeat('?,', count($sColores) - 1) . '?';
		$inTallas  = str_repeat('?,', count($sTallas) - 1) . '?';
		$inModelos  = str_repeat('?,', count($sModelos) - 1) . '?';
		
		$sentenciaSeleccionadora = $this->bd->prepare("SELECT identidad, modelo, talla, color, precio FROM jean WHERE (color IN ($inColores) ".(count($sColores) > 1? "AND": "OR")." color LIKE '%') AND (talla IN ($inTallas) ".(count($sTallas) > 1? "AND": "OR")." talla LIKE '%') AND (modelo IN ($inModelos) ".(count($sModelos) > 1? "AND": "OR")." modelo LIKE '%')");
			
		$typesColores = str_repeat('i', count($sColores));
		$typesTallas = str_repeat('i', count($sTallas));
		$typesModelos = str_repeat('s'c count($sModelos));
		
		$sentenciaSeleccionadora->bind_param($typesColores.$typesTallas.$typesModelos, ...$sColores, ...$sTallas, ...$sModelos);
		
		$resultado = $sentenciaSeleccionadora->execute();

		$productos = [];

		if($resultado) {
			//Ejecución correcta
			$resultado = $sentenciaSeleccionadora->get_result();
			while($fila = $resultado->fetch_assoc()) {
				//~ echo "modelo: {$fila['modelo']}, color: {$fila['color']}, talla: {$fila['talla']}, precio: {$fila['precio']}\n";
				$productos[] = $fila;
			}
		}
		//~ else {
			//'No se encontró nada.'
		//~ }
		$sentenciaSeleccionadora->close();

		return $productos;
	}

	private static function _color( $color ) {
		return match( $color ) {
			'rojo' => 1,
			'verde' => 2,
			'azul' => 3,
			'negro' => 4,
			'marrón' => 5,
			default => 0
		};
	}
}
