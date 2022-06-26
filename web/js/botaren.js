var botaren
const esRemoto = true
const CONEXION_INCONECTABLE = "Sin conexión con servidor."
const CONEXION_CONECTABLE = "Estableciendo conexión\u2026"
const WS_PORT = "666"

//Para manejar el aviso de instalaciÃ³n
let deferredPrompt = null
const addBtn = document.getElementById("instalador")
window.addEventListener('appinstalled', function(event) {
	if(analisis) {
		// Track event: The app was installed (banner or manual installation)
		gtag("config", "UA-68444309-11", {"page_path": "/instalacion/2"})
	}
})
window.addEventListener("beforeinstallprompt", function(e) {
	e.preventDefault();
	deferredPrompt = e;
	if(addBtn.classList.contains("d-none")) {
		addBtn.classList.remove("d-none")
		const instalabilizador = document.getElementById("instalabilizador")
		if(instalabilizador) {
			instalabilizador.classList.remove("d-none")
		}
	}

	addBtn.addEventListener("click", instalabilizar)
})

function instalabilizar(e) {
	const instalabilizador = document.getElementById("instalabilizador")
	if(instalabilizador) {
		instalabilizador.classList.add("d-none")
	}
	addBtn.classList.add("d-none")
	deferredPrompt.prompt()
	deferredPrompt.userChoice.then(function(choiceResult) {
		if(choiceResult.outcome === "accepted") {
			Notiflix.Report.Success("Efectibit instalado", "Ahora estamos entre tus demÃ¡s aplicaciones.<br>Toca el Ã­cono del cerdo verde (Efectipig) para lanzar esta aplicaciÃ³n en cualquier momento.","Aceptar")
		}
		else {
		    Notiflix.Notify.Warning("Te olvidaste instalarnos.")
		}
		deferredPrompt = null
	})
}

var Botaren = function() {
	console.log("Botarenizado")
	var conn

	this.inicializar = function() {
		this.token = window.localStorage.getItem("token")
		this.sesion = uuidv4()
	}

	this.productoElegido = parseInt(window.localStorage.getItem("producto"))//identidad

	var wsMensajeado = function(e) {
		let respuesta = JSON.parse(e.data)

		switch(respuesta.action) {
			case 1:
				manejarAcceso(respuesta.cheveridad, respuesta.params)
				break
			case 3:
				manejarCompra(respuesta.cheveridad, respuesta.params)
				break
			case 600:
				manejarTokenAlterado(respuesta.params)
				break
			case 1000:
				manejarMensaje(respuesta.params)
				break
		}
	}

	this.enlazar = function() {
		try {
			conn = new ReconnectingWebSocket("wss://" + location.hostname + ":" + WS_PORT)
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
		//Deshabilitar el cuadro de escritura
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

	var manejarTokenAlterado = function(parametros) {
		window.sessionStorage.removeItem("token")
		window.localStorage.removeItem("token")
		botaren.token = null
		manejarMensaje(parametros)
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
		image.src = "img/bot.png"
		image.alt = "bot"
		photo.appendChild(image)
		const message = document.createElement("div")
		message.setAttribute("class", "received_msg")
		outgoingMessage.appendChild(message)
		const receivedMessage = document.createElement("div")
		receivedMessage.setAttribute("class", "received_withd_msg")
		message.appendChild(receivedMessage)

		switch(parametros.anexo) {
			case 1: {
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
						product.onclick = function() {
							fs(this)
						}
						columna.appendChild(product)

						const price = document.createElement("button")
						price.type = "buttton"
						price.setAttribute("class", "btn btn-primary")
						price.appendChild(document.createTextNode("T: " + producto.talla + " - S/" + producto.precio))
						price.onclick = function() {
							encestar(producto.identidad)
						}
						columna.appendChild(price)
					}
					break
			}	
			case 3: {
				for(let seguimiento of parametros.seguimientos) {
					const contenedorPedido = document.createElement("div")
					const contenedorEstado = document.createElement("div")
					contenedorEstado.setAttribute("class", "progressbar-wrapper clearfix")
					console.log(seguimiento.instante)
					const identificacion = document.createElement("p")
					identificacion.appendChild(document.createTextNode("Pedido N°: " + seguimiento.identidad))
					identificacion.appendChild(document.createElement("br"))
					identificacion.appendChild(document.createTextNode("Fecha: " + imprimirFecha(new Date(seguimiento.instante*1000), true)))
					const fila = document.createElement("ul")
					fila.setAttribute("class", "progressbar")
					contenedorEstado.appendChild(fila)
					const columnaR = document.createElement("li")
					columnaR.appendChild(document.createTextNode("Reservado"))
					const columnaP = document.createElement("li")
					columnaP.appendChild(document.createTextNode("Pagado"))
					const columnaE = document.createElement("li")
					columnaE.appendChild(document.createTextNode("Entregado"))
					if(seguimiento.estado == 0) {
						columnaR.setAttribute("class", "active")
					}
					if(seguimiento.estado == 1) {
						columnaP.setAttribute("class", "active")
					}
					if(seguimiento.estado > 1) {
						columnaE.setAttribute("class", "active")
					}
					fila.appendChild(columnaR)
					fila.appendChild(columnaP)
					fila.appendChild(columnaE)
					const contenedorDetalle = document.createElement("div")
					contenedorDetalle.appendChild(identificacion)
					contenedorPedido.appendChild(contenedorEstado)
					contenedorPedido.appendChild(contenedorDetalle)
					receivedMessage.appendChild(contenedorPedido)
				    }
				    break
			}
		}

		const text = document.createElement("p")
		if(!esRemoto) {
			text.appendChild(document.createTextNode("Soy el bot."))
		}
		else {
			if(parametros.texto != '') {
				text.appendChild(document.createTextNode(parametros.texto))
			}
			else {
				const vacio = document.createElement("i")
				vacio.appendChild(document.createTextNode("Sin respuesta textual."))
				text.appendChild(vacio)
			}
		}
		receivedMessage.appendChild(text)
		const date = document.createElement("span")
		date.setAttribute("class", "time_date")
		date.appendChild(document.createTextNode(imprimirFecha(new Date(), true)))
		receivedMessage.appendChild(date)

		historial.appendChild(outgoingMessage)
		historial.scrollTo(0, historial.scrollHeight)
	}

	var encestar = function(identidad) {
		if(identidad <= 0) {
			Notiflix.Notify.Failure("La referencia del producto no existe.")
			return
		}

		botaren.productoElegido = identidad
		window.localStorage.setItem("producto", identidad)
		Notiflix.Notify.Success("Producto escogido: " + identidad)
	}

	/**
	 * Revisa si hay identidad de producto y manda orden para comprarlo.
	 */
	this.comprar = function() {
		if(isNaN(this.productoElegido)) {
			Notiflix.Notify.Warning("No hay producto elegido.")
			return
		}

		if(esRemoto) {
			const mensaje = {
				action: 3,
				token: this.token,
				params: {
					producto: this.productoElegido
				}
			}

			//Enviar
			if( ! mensajear(JSON.stringify(mensaje)) ) {
				return
			}
		}
	}

	var manejarCompra = function(cheveridad, parametros) {
		if(cheveridad) {
			Notiflix.Report.Success("Comprado", parametros.texto, "Aceptar")
			manejarMensaje(parametros)
			botaren.productoElegido = NaN
			mostrarCarro()
		}
		else {
			Notiflix.Report.Failure("No comprado", parametros.texto, "Aceptar")
		}
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

			if(this.token) {
				mensaje.token = this.token
			}
			else {
				mensaje.params.session = this.sesion
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
		date.appendChild(document.createTextNode(imprimirFecha(new Date(), true)))
		message.appendChild(date)

		historial.appendChild(outgoingMessage)
		historial.scrollTo(0, historial.scrollHeight);
	}

	this.acceder = function(formulario) {
		if(conn.readyState != WebSocket.OPEN) {
			Notiflix.Notify.Failure(CONEXION_INCONECTABLE)
			return
		}

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
		case "perfil":
			mostrarPerfil();break
		case "carro":
			mostrarCarro()
	}
}

function mostrarCarro() {
	const contenedor = document.getElementById("sidebar-contenido")
	while(contenedor.firstChild) {
		contenedor.firstChild.remove()
	}

	if(isNaN(botaren.productoElegido)) {
		contenedor.appendChild(document.createTextNode("Aún no has elegido algún producto."))
		return
	}

	const product = document.createElement("img")
	product.src = "img/producto/" + botaren.productoElegido + ".jpg"
	product.width = 256
	product.height = 256
	product.alt = "imagen de jean"
	product.onclick = function() {
		fs(this)
	}
	contenedor.appendChild(product)

	const enviador = document.createElement("button")
	enviador.type = "button"
	enviador.setAttribute("class", "btn btn-success btn-lg btn-block mt-2")
	enviador.appendChild(document.createTextNode("Comprar"))
	enviador.onclick = function() {
		botaren.comprar()
	}
	contenedor.appendChild(enviador)
}

function mostrarPerfil() {
	const contenedor = document.getElementById("sidebar-contenido")
	while(contenedor.firstChild) {
		contenedor.firstChild.remove()
	}

	const logotipo = document.createElement("img")
	logotipo.src = "img/bot.png"
	logotipo.alt = "Botaren"
	logotipo.width = "200"
	contenedor.appendChild(logotipo)

	if(botaren.token) {
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

	const entradaEmail = document.createElement("input")
	entradaEmail.type = "email"
	entradaEmail.name = "email"
	entradaEmail.setAttribute("class", "form-control bg-white")
	entradaEmail.setAttribute("id", "nuntii")
	entradaEmail.placeholder = "Correo electrónico"
	grupoEmail.appendChild(entradaEmail)

	const grupoClave = document.createElement("div")
	grupoClave.setAttribute("class", "form-group bg-white")
	formulario.appendChild(grupoClave)

	const entradaClave = document.createElement("input")
	entradaClave.type = "password"
	entradaClave.name = "clave"
	entradaClave.setAttribute("class", "form-control bg-white")
	entradaClave.setAttribute("id", "clavis")
	entradaClave.placeholder = "Contraseña"
	grupoClave.appendChild(entradaClave)

	const enviador = document.createElement("button")
	enviador.type = "submit"
	enviador.setAttribute("class", "btn btn-primary btn-lg btn-block mt-2")
	enviador.appendChild(document.createTextNode("Iniciar Sesión"))
	formulario.appendChild(enviador)

	const mensaje = document.createElement("p")
	mensaje.appendChild(document.createTextNode("© 2022 - Botaren - Empresa Zarga SAC."))
}

function parseJwt(token) {
	let base64Url = token.split('.')[1];
	let base64 = base64Url.replace('-', '+').replace('_', '/');
	return JSON.parse(window.atob(base64));
}

function imprimirFecha(fecha, conHora = true) {
	let dateString = ("0" + fecha.getDate()).slice(-2) + "/" + ("0" + (fecha.getMonth()+1)).slice(-2) + "/" + fecha.getFullYear()
	if(conHora) {
		dateString += " " + ("0" + fecha.getHours()).slice(-2) + ":" + ("0" + fecha.getMinutes()).slice(-2) + ":" + ("0" + fecha.getSeconds()).slice(-2)
	}

	return dateString
}

//Se podría usar esto Crypto.randomUUID(), pero...
function uuidv4() {//https://stackoverflow.com/a/2117523
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	)
}

function fs(imagen) {
	if(document.fullscreenElement != null || document.webkitFullscreenElement != null) {
		if (document.exitFullscreen) {
			document.exitFullscreen()
		}
		else {
			document.webkitCancelFullScreen()
		}
	}
	else {
		if(imagen.requestFullscreen) {
			imagen.requestFullscreen()
		}
		else {
			imagen.webkitRequestFullScreen()
		}
	}
}

window.onload = function() {
	botaren = new Botaren()
	botaren.inicializar()
	if(esRemoto) {
		botaren.enlazar()
	}
if("serviceWorker" in navigator) {
	navigator.serviceWorker.register("/service-worker.js").then(function(registro) {
		registro.onupdatefound = function() {
			let installingWorker = registro.installing;
			installingWorker.onstatechange = function() {
				switch (installingWorker.state) {
					case "installed":
						if(navigator.serviceWorker.controller) {
							console.log("Contenido nuevo o actualizado estÃ¡ disponible.")
						}
						else {
							console.log("El contenido estÃ¡ ahora disponible offline.")
						}
						break

					case "redundant":
						console.error("Se estÃ¡ repitiendo la instalaciÃ³n del service worker.")
						break
					}
				};
		}
		console.log("SW Registrao")
	}).catch(function(e) {
		console.error("Error durante registro de SW:", e)
	})

	navigator.serviceWorker.addEventListener("message", event => {
		switch(event.data.action) {
			case "browse":
				app.navigate( event.data.url )
				break
		}
	})
}
}



// Auspiciado por efectibit.com y terexor.com
