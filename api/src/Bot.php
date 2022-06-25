<?php
namespace Botaren;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Psr\Http\Message\RequestInterface;

use Google\Cloud\Dialogflow\V2\SessionsClient;
use Google\Cloud\Dialogflow\V2\TextInput;
use Google\Cloud\Dialogflow\V2\QueryInput;

class Bot implements MessageComponentInterface {

	public function __construct($credentials, $dialogflowSecretPath, $dialogflowToken) {
		$this->sessionsClient = new SessionsClient( array('credentials' => $dialogflowSecretPath) );
		$this->sessionDialogflow = $dialogflowToken;
		$this->bd = new \mysqli($credentials['host'], $credentials['user'], $credentials['password'], $credentials['db']);
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

		//El token puede que venga o no.
		if( isset($datos['token']) && $datos['token'] != null) {
			try {
				$token = JWT::decode($datos['token'], CLAVE_JWT);
			}
			catch(\Exception $e) {
				$respuesta['action'] = 600;
				$respuesta['cheveridad'] = false;
				$respuesta['params']['texto'] = 'Token de sesión modificado.';

				$from->send( json_encode( $respuesta ) );
				return;
			}
		}

		try {
			//De menor que 0 al 999 son acciones de ida y vuelta.
			//Del 1000 hacia arriba son asíncronas.
			switch($datos['action']) {
				case -2:
					//Usado cuando se perdió la conexión, pero aún hay un token válido en uso y se añade en los vectores al usuario.
					$this->reingresar($datos, $token, $from, $respuesta);
					return;
				case -1:
					$this->cerrarSesion($datos, $token, $from, $respuesta);
					return;
				case 0:
					$this->registrar($datos, $from, $respuesta);
					return;
				case 1:
					$this->iniciarSesion($datos, $from, $respuesta);
					break;
				case 3:
					$this->comprar($datos, $token, $from, $respuesta);
					break;
				case 1000:
					$queryResult = $this->detectIntentTexts( $datos, $token->botkn??null);
					$this->procesarSalida( $queryResult, $from, $respuesta, $token->uid??null );
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

	private function detectIntentTexts($datos, $token, $languageCode = 'es-PE') {
		$text = $datos['params']['texto'];
		if(!isset($text)) {
			return null;
		}

		try {
			$session = $this->sessionsClient->sessionName('karen-fnkq', $token ?? $datos['params']['session'] ?? $this->sessionDialogflow);
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

	private function procesarSalida( $queryResult, $from, &$respuesta, $tokenUid ) {
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
				else {
					$cantidadDeProductos = count($estructura);
					if( $cantidadDeProductos == 0 ) {
						$respuesta['cheveridad'] = false;
						$respuesta['params']['texto'] = 'No se hallaron productos.';
					}
					else {
						$respuesta['cheveridad'] = true;
						$respuesta['params']['anexo'] = 1;
						$respuesta['params']['texto'] = $cantidadDeProductos == 1 ? 'Encontré este jean.' : 'Se hallaron estos jeans.';
						$respuesta['params']['productos'] = $estructura;
					}
				}

				$from->send( json_encode( $respuesta ) );
				return;
			case 'bot.pedidos.busqueda.codigo':
				$campos = json_decode( $queryResult->getParameters()->serializeToJsonString(), true );
				var_dump($campos);
				$estructura = $this->mostrarSeguimientos( $campos['pedido'], $tokenUid );
				if($estructura == null ) {
					$respuesta['cheveridad'] = false;
					$respuesta['params']['texto'] = 'Ingresa más datos.';
				}
				else {
					$cantidadDeSeguimientos = count($estructura);
					if( $cantidadDeSeguimientos == 0 ) {
						$respuesta['cheveridad'] = false;
						$respuesta['params']['texto'] = 'No se hallaron pedidos.';
					}
					else {
						$respuesta['cheveridad'] = true;
						$respuesta['params']['anexo'] = 3;
						$respuesta['params']['texto'] = $cantidadDeSeguimientos == 1 ? 'Un pedido hallado.' : 'Seguimientos hallados.';
						$respuesta['params']['seguimientos'] = $estructura;
					}
				}

				$from->send( json_encode( $respuesta ) );
				return;
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
			$sColores[] = _color($color);
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
		$typesModelos = str_repeat('s', count($sModelos));

		$sentenciaSeleccionadora->bind_param($typesColores.$typesTallas.$typesModelos, ...$sColores, ...$sTallas, ...$sModelos);

		$resultado = $sentenciaSeleccionadora->execute();

		$productos = [];

		if($resultado) {
			//Ejecución correcta
			$resultado = $sentenciaSeleccionadora->get_result();
			while($fila = $resultado->fetch_assoc()) {
				//Asignación de los campos consultados
				$productos[] = $fila;
			}
		}
		//~ else {
			//'No se encontró nada.'
		//~ }
		$sentenciaSeleccionadora->close();

		return $productos;
	}

	private function iniciarSesion($datos, $from, $respuesta) {
		$respuesta['params'] = [];

		$email = strtolower( $datos['params']['email'] );
		if( false === filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {//El texto sí es un correo electrónico
			$respuesta['cheveridad'] = false;
			$respuesta['params']['info'] = 'Correo electrónico mal escrito.';
			$from->send( json_encode( $respuesta ) );
			return;
		}
		$clave = $datos['params']['password'];

		//Se busca en la base de datos
		$sentenciaSeleccionadora = $this->bd->prepare('SELECT identidad, configuracion, hash, nombre, documento FROM Cliente WHERE email = ? LIMIT 1');
		$sentenciaSeleccionadora->bind_param('s', $email);
		$sentenciaSeleccionadora->execute();
		$resultado = $sentenciaSeleccionadora->get_result();
		$sentenciaSeleccionadora->close();

		//Si no hay usuario es porque el correo electrónico no existe entonces en el cliente invitar a registrarse
		if($resultado->num_rows == 0) {
			$respuesta['cheveridad'] = false;
			$respuesta['params']['nivel'] = 0;
			$respuesta['params']['info'] = "Correo electrónico $email no registrado.";
			$from->send( json_encode( $respuesta ) );
			//break;
			return;
		}

		//Si hemos llegado hasta acá toca comparar los datos con los del registro obtenido
		$usuario = $resultado->fetch_assoc();

		if( password_verify($clave, $usuario['hash']) ) {
			$configuracion = $usuario['configuracion'];

			$recordarlo = isset( $datos['params']['persistencia'] ) && $datos['params']['persistencia'];// ? true : false;

			//Se obtiene un token para decirle que puede usar el programa
			$datos = array();
			$datos['email'] = $email;
			$datos['uid'] = $usuario['identidad'];
			$datos['alias'] = "{$usuario['nombre']}";
			$datos['botkn'] = hash_hmac("sha256", $email, '8==D && 0 > 1 > 2');
			$datos['tiempo'] = $recordarlo ? time() + 31104000 : 86400;//Agregar más tiempo si hay persistencia


			$respuesta['cheveridad'] = true;
			$respuesta['params']['configuracion'] = $configuracion;
			$respuesta['params']['token'] = JWT::encode($datos, CLAVE_JWT);
			$respuesta['params']['persistencia'] = $recordarlo;
			//Envío de lo correcto
			$from->send(json_encode($respuesta));
		}
		else {//Contraseña incorrecta
			$respuesta['cheveridad'] = false;
			$respuesta['params']['info'] = 'Credenciales incorrectas.';
			$from->send(json_encode($respuesta));
		}
	}

	private function cerrarSesion(&$datos, &$token, &$from, $respuesta) {
	}

	private function comprar(&$datos, &$token, &$from, $respuesta) {
		if( is_null( $token ) ) {
			$respuesta['cheveridad'] = false;
			$respuesta['params']['texto'] = 'Debes iniciar sesión.';
			$from->send( json_encode( $respuesta ) );
			return;
		}
		$sentenciaInsertadora = $this->bd->prepare('INSERT INTO ventarapida VALUES(0, 0, ?, ?, UNIX_TIMESTAMP(NOW()), 0, 1)');
		$sentenciaInsertadora->bind_param('ii', $token->uid, $datos['params']['producto']);
		$sentenciaInsertadora->execute();

		//Si no se insertó entonces no debe haber ninguna fila
		$identidad = $this->bd->insert_id;

		if($identidad == 0) {
			$respuesta['cheveridad'] = false;
			$respuesta['params']['texto'] = 'No se pudo registrar compra.';
		}
		else {
			$respuesta['cheveridad'] = true;
			$respuesta['params']['texto'] = "Producto comprado con N° de transacción: $identidad.";
		}
		$from->send( json_encode( $respuesta ) );
	}

	private function mostrarSeguimientos( $pedido, $cliente ) {
		$identidad = intval( $pedido );
		if( $identidad <= 0 ) {
			return null;
		}

		$sentenciaSeleccionadora = $this->bd->prepare('SELECT ventarapida.identidad, ventarapida.configuracion, _Jean, instante, estado, cantidad, precio FROM ventarapida INNER JOIN jean ON _Jean = jean.identidad WHERE identidad = ? AND _Cliente = ?');
		$sentenciaSeleccionadora->bind_param('ii', $identidad, $cliente);
		$sentenciaSeleccionadora->execute();
		$resultado = $sentenciaSeleccionadora->get_result();
		$sentenciaSeleccionadora->close();

		$seguimientos = [];

		if($resultado) {
			//Ejecución correcta
			$resultado = $sentenciaSeleccionadora->get_result();
			while($fila = $resultado->fetch_assoc()) {
				//Asignación de los campos consultados
				$seguimientos[] = $fila;
			}
		}

		return $seguimientos;
	}
}

function _color( $color ) {
	return match( $color ) {
		'rojo' => 1,
		'verde' => 2,
		'azul' => 3,
		'negro' => 4,
		'marrón' => 5,
		default => 0
	};
}
