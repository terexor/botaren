# Botaren
El programa tiene dos partes divididas en cliente y servidor.
El servidor sirve de enlace entre el cliente y Dialogflow.
El servidor ejecuta un programa para mantener conexiones WebSocket y dentro se llaman a las funciones para conectar a Dialogflow. Todo esto usando PHP.
El cliente es simplemente un navegador con una ventana grande de chat.
## Instalar
Instalación de componentes necesarios con Composer dentro de la carpeta *api*:

    php ~/composer.phar require cboden/ratchet
    php ~/composer.phar composer require google/cloud-dialogflow
También conseguir las credenciales en JSON para usar con la API de Dialogflow. Alojarlo en una archivo llamado *dialogflow-client-secret.json* dentro de carpeta *api*.
### WebSocket seguro
Crear un archivo llamado *ws-certs-path.php* dentro de la carpeta *api* con el siguiente contenido:

    return [
     'local_cert' => 'ruta/archivo.crt',
     'local_pk' => 'ruta/archivo.key',
     'verify_peer' => false
    ];
## Uso
Simplemente iniciar el programa servidor que usará el puerto 666 de la carpeta *api*:

    php Botaren.php
Y luego de alojar en un servidor web la carpeta *web*, en un navegador simplemente acceder para empezar a hablar con el bot.
