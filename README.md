# Botaren
El programa tiene dos partes divididas en cliente y servidor.
El servidor sirve de enlace entre el cliente y Dialogflow.
El servidor ejecuta un programa para mantener conexiones WebSocket y dentro se llaman a las funciones para conectar a Dialogflow. Todo esto usando PHP.
El cliente es simplemente un navegador con una ventana grande de chat.
## Instalar
Instalación de componentes necesarios con Composer dentro de la carpeta *api*:

    php ~/composer.phar require cboden/ratchet
    php ~/composer.phar require google/cloud-dialogflow
También conseguir las credenciales en JSON para usar con la API de Dialogflow. Alojarlo en una archivo llamado *dialogflow-client-secret.json* dentro de carpeta *api*.
### Constantes para usar los recursos propios
Crear un archivo llamado *global-vars.php* dentro de la carpeta *api* con el siguiente contenido modificado al gusto:

    <?php
    return
    [
     'allowed-origins' => [
      'localhost', 'other-ip'
     ],
     'db' => [
      'host' => '',
      'user' => '',
      'password' => '',
      'db' => 'botaren'
     ],
     'dialogflow-secret-path' => 'ruta/dialogflow-client-secret.json',
     'ws-port' => '666',
     'ws-certs-path' => [
      'local_cert' => 'ruta/archivo.crt',
      'local_pk' => 'ruta/archivo.key',
      'verify_peer' => false
     ],
     'dialogflow-session' => 'xyz-temporal'
    ];
La última variable que define la sesión de Dialogflow es para que se mantenga la conversación cuando el cliente no mande ninguna.

## Encedido del servidor
Simplemente iniciar el programa servidor que usará el puerto definido en el archivo anterior de la carpeta *api*:

    php Botaren.php
Y luego de alojar en un servidor web la carpeta *web*, en un navegador simplemente acceder para empezar a hablar con el bot.
