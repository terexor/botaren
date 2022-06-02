var botaren
const esRemoto = true
const CONEXION_INCONECTABLE = "Sin conexión con servidor."
const CONEXION_CONECTABLE = "Estableciendo conexión\u2026"

var Botaren = function() {
	console.log("Botarenizado")
	var conn

	this.token = window.localStorage.getItem("token")

	var wsMensajeado = function(e) {
		let respuesta = JSON.parse(e.data)

		switch(respuesta.action) {
			case 1:
				manejarAcceso(respuesta.cheveridad, respuesta.params)
				break
			case 1000:
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

	var manejarAcceso = function(cheveridad, parametros) {
		if(cheveridad) {
			botaren.token = parametros.token
			window.localStorage.setItem("token", botaren.token)

			//Dibujar datos de perfil
			mostrarPerfil()
		}
		else {
			Notiflix.Notify.Warning(parametros.info)
		}
	}

	/**
	 * Dibuja todo lo necesario en el historial del chat.
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
				action: 1000,
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

	this.acceder = function(formulario) {
		if(conn.readyState != WebSocket.OPEN) {
			Notiflix.Notify.Failure(CONEXION_INCONECTABLE);
			return
		}

		//~ Notiflix.Block.Standard("#formulario-accesador", "Iniciando\u2026")

		formulario.elements.email.blur()
		formulario.elements.clave.blur()
		const credencial = new Object()
		credencial.action = 1
		credencial.params = {
			email: formulario.elements.email.value.trim().toLowerCase(),
			password: formulario.elements.clave.value.trim(),
			//~ persistencia: formulario.elements.persistencia.checked
		}

		if(! (credencial.params.email.length && credencial.params.password.length ) ) {
			Notiflix.Notify.Warning("Credenciales incompletas")
			//~ Notiflix.Block.Remove("#formulario-accesador")
			return
		}

		mensajear( JSON.stringify( credencial ) )
	}

	this.salir = function() {
		Notiflix.Confirm.Show("Cerrando sesión","¿Desea cerrar su sesión?","Sí","No",
			function() {
				const solicitud = new Object()
				solicitud.action = -1
				solicitud.token = botaren.token

				mensajear( JSON.stringify( solicitud ) )

				botaren.token = null
				window.localStorage.removeItem("token")
				mostrarPerfil()
			}
		)
	}
}

function toggleNav(tipo) {
	const sidebar = document.getElementById("mySidebar")
	if(sidebar.classList.contains("d-none") ) {
		sidebar.classList.remove("d-none")
	}
	else {
		sidebar.classList.add("d-none")
		return
	}

	switch(tipo) {
		case 'perfil':
			mostrarPerfil()
	}
}

function mostrarPerfil() {
	const contenedor = document.getElementById("sidebar-contenido")
	while(contenedor.firstChild) {
		contenedor.firstChild.remove()
	}

	if(botaren.token) {
		debugger
		const datos = parseJwt(botaren.token)

		contenedor.appendChild(document.createTextNode("Hola, " + datos.alias + '.'))

		const enlaceCerrador = document.createElement("button")
		enlaceCerrador.setAttribute("class", "btn btn-secondary btn-lg btn-block mt-2")
		enlaceCerrador.onclick = function() {
			botaren.salir()
		}
		enlaceCerrador.appendChild(document.createTextNode("Salir"))
		contenedor.appendChild(enlaceCerrador)

		return
	}

	const formulario = document.createElement("form")
	formulario.onsubmit = function() {
		botaren.acceder(this)
		return false
	}
	contenedor.appendChild(formulario)

	const grupoEmail = document.createElement("div")
	grupoEmail.setAttribute("class", "form-group")
	formulario.appendChild(grupoEmail)

	const etiquetaEmail = document.createElement("label")
	etiquetaEmail.for = "nuntii"
	etiquetaEmail.appendChild(document.createTextNode("Email:"))
	grupoEmail.appendChild(etiquetaEmail)

	const entradaEmail = document.createElement("input")
	entradaEmail.type = "email"
	entradaEmail.name = "email"
	entradaEmail.setAttribute("class", "form-control")
	entradaEmail.setAttribute("id", "nuntii")
	entradaEmail.placeholder = "Correo electrónico"
	grupoEmail.appendChild(entradaEmail)

	const grupoClave = document.createElement("div")
	grupoClave.setAttribute("class", "form-group")
	formulario.appendChild(grupoClave)

	const etiquetaClave = document.createElement("label")
	etiquetaClave.for = "clavis"
	etiquetaClave.appendChild(document.createTextNode("Clave:"))
	grupoClave.appendChild(etiquetaClave)

	const entradaClave = document.createElement("input")
	entradaClave.type = "password"
	entradaClave.name = "clave"
	entradaClave.setAttribute("class", "form-control")
	entradaClave.setAttribute("id", "clavis")
	entradaClave.placeholder = "Contraseña"
	grupoClave.appendChild(entradaClave)

	const enviador = document.createElement("button")
	enviador.type = "submit"
	enviador.setAttribute("class", "btn btn-success btn-lg btn-block mt-2")
	enviador.appendChild(document.createTextNode("Acceder"))
	formulario.appendChild(enviador)
}

function parseJwt(token) {
	let base64Url = token.split('.')[1];
	let base64 = base64Url.replace('-', '+').replace('_', '/');
	return JSON.parse(window.atob(base64));
}

window.onload = function() {
	botaren = new Botaren()
	if(esRemoto) {
		botaren.enlazar()
	}
}
