var botaren
const esRemoto = true
var Botaren = function() {
	console.log("Botarenizado")
	var conn

	var wsMensajeado = function(e) {
		let respuesta = JSON.parse(e.data)

		switch(respuesta.action) {
			case 1:
				manejarAcceso(respuesta.params)
				break
			case 10:
				manejarMensaje(respuesta.params)
				break
		}
	}

	this.enlazar = function() {
		try {
			conn = new ReconnectingWebSocket("wss://" + location.hostname + ":666")
			conn.debug = false
			conn.reconnectInterval = 3666
			conn.reconnectDecay = 3.255
			conn.onopen = wsEnchufado
			conn.onmessage = wsMensajeado
			conn.onclose = wsDesenchufado
			conn.onerror = wsHorrorizado
		}
		catch(e) {
			wsHorrorizado()
		}
	}

	var wsHorrorizado = function() {
		if( this.readyState == WebSocket.CONNECTING ) {
			Notiflix.Notify.Info(CONEXION_CONECTABLE);
		}
		else {
			Notiflix.Notify.Failure(CONEXION_INCONECTABLE);
		}
	}

	var wsDesenchufado = function() {
	}

	var wsEnchufado = function() {
		//Habilitar el cuadro de escritura
	}

	var mensajear = function(json) {
		//Cotejar si la conexión al WebSocket está abierta
		if(conn.readyState != WebSocket.OPEN) {
			Notiflix.Notify.Failure("Imposible enviar datos al servidor.")
			return false
		}
		conn.send(json)
		return true
	}

	/**
	 * @param parametros.anexo es el tipo de objeto que se puede añadir:
	 *  anexo 1: producto,
	 *  anexo 2: audio,
	 *  anexo 3: sticker
	 */
	var manejarMensaje = function(parametros) {
		const outgoingMessage = document.createElement("div")
		outgoingMessage.setAttribute("class", "outgoing_msg")
		const photo = document.createElement("div")
		photo.setAttribute("class", "incoming_msg_img")
		outgoingMessage.appendChild(photo)
		const image = document.createElement("img")
		image.src = "img/bot.jpg"
		image.alt = "bot"
		photo.appendChild(image)
		const message = document.createElement("div")
		message.setAttribute("class", "received_msg")
		outgoingMessage.appendChild(message)
		const receivedMessage = document.createElement("div")
		receivedMessage.setAttribute("class", "received_withd_msg")
		message.appendChild(receivedMessage)

		switch(parametros.anexo) {
			case 1:
				const contenedor = document.createElement("div")
				contenedor.setAttribute("class", "container")
				receivedMessage.appendChild(contenedor)
				const fila = document.createElement("div")
				fila.setAttribute("class", "row")
				contenedor.appendChild(fila)
					for(let producto of parametros.productos) {
						const columna = document.createElement("div")
						columna.setAttribute("class", "col-12 col-sm-6 col-md-3 col-lg-2")
						fila.appendChild(columna)
						const product = document.createElement("img")
						product.src = "img/producto/" + producto.identidad + ".jpg"
						product.width = 100
						product.height = 100
						product.alt = "imagen de jean"
						columna.appendChild(product)

						const price = document.createElement("button")
						price.type = "buttton"
						price.setAttribute("class", "btn btn-primary")
						price.appendChild(document.createTextNode("T: " + producto.talla + " - S/" + producto.precio))
						columna.appendChild(price)
					}
					break
		}

		const text = document.createElement("p")
		if(!esRemoto) {
			text.appendChild(document.createTextNode("Soy el bot"))
		}
		else {
			text.appendChild(document.createTextNode(parametros.texto))
		}
		receivedMessage.appendChild(text)
		const date = document.createElement("span")
		date.setAttribute("class", "time_date")
		date.appendChild(document.createTextNode("Ahora"))
		receivedMessage.appendChild(date)

		historial.appendChild(outgoingMessage)
		historial.scrollTo(0, historial.scrollHeight);
	}

	this.teclear = function() {
		const texto = mensajero.value.trim()
		if(texto.length == 0) {
			return
		}

		if(esRemoto) {
			const mensaje = {
				action: 10,
				params: {
					texto: texto
				}
			}

			//Enviar
			if( ! mensajear(JSON.stringify(mensaje)) ) {
				return
			}
		}

		mensajero.value = ""

		const outgoingMessage = document.createElement("div")
		outgoingMessage.setAttribute("class", "outgoing_msg")
		const message = document.createElement("div")
		message.setAttribute("class", "sent_msg")
		outgoingMessage.appendChild(message)
		const text = document.createElement("p")
		text.appendChild(document.createTextNode(texto))
		message.appendChild(text)
		const date = document.createElement("span")
		date.setAttribute("class", "time_date")
		date.appendChild(document.createTextNode("Ahora"))
		message.appendChild(date)

		historial.appendChild(outgoingMessage)
		historial.scrollTo(0, historial.scrollHeight);
	}
}

window.onload = function() {
	botaren = new Botaren()
	if(esRemoto) {
		botaren.enlazar()
	}
}
