const strAppPublicKey  = "BBUI47Q_otKLmRiRu0VNc2UpHJkV7kNvLJ9FbqIfJu_H0fg60iv0dHq81uVAb48stncMD8bkPdkMgWjw57Y1Gz0"
const strSubscriberURL = "/suscriptor"
const strDefTitle      = "Mensaje de Botaren"
const strDefIcon       = "./img/logo.png"

/**
 * encode the public key to Array buffer
 * @param {string} strBase64  -   key to encode
 * @return {Array} - UInt8Array
 */
function encodeToUint8Array(strBase64) {
	let strPadding = '='.repeat((4 - (strBase64.length % 4)) % 4)
	strBase64 = (strBase64 + strPadding).replace(/\-/g, '+').replace(/_/g, '/')
	let rawData = atob(strBase64);
	let rawDataLength = rawData.length
	var aOutput = new Uint8Array(rawDataLength)
	for (i = 0; i < rawDataLength; ++i) {
		aOutput[i] = rawData.charCodeAt(i)
	}
	return aOutput
}

/**
 * event listener to subscribe notifications and save subscription at server
 * @param {ExtendableEvent} event
 */
async function pnSubscribe(event) {
	//~ console.log
	try {
		var appPublicKey = encodeToUint8Array(strAppPublicKey)
		var opt = {
			applicationServerKey: appPublicKey,
			userVisibleOnly: true
		}

		self.registration.pushManager.subscribe(opt)
			.then((sub) => {
				// subscription succeeded - send to server
				pnSaveSubscription(sub)
					.then((response) => {
						console.log(response);
					}).catch((e) => {
						// registration failed
						console.log("SaveSubscription failed with: " + e)
					});
			} ).catch((e) => {
				// registration failed
				console.log('Subscription fallado por: ' + e)
			})

	} catch (e) {
		console.log('Error suscribiendo para notificar: ' + e)
	}
}

/**
 * event listener handling when subscription change
 * just re-subscribe
 * @param {PushSubscriptionChangeEvent} event
 */
async function pnSubscriptionChange(event) {
	console.log('Serviceworker: subscription change event: ' + event)
	try {
		// re-subscribe with old options
		self.registration.pushManager.subscribe(event.oldSubscription.options)
			.then((sub) => {
				// subscription succeeded - send to server
				pnSaveSubscription(sub)
					.then((response) => {
						console.log(response);
					}).catch((e) => {
						// registration failed
						console.log('SaveSubscription fallado: ' + e)
					});
			}, ).catch((e) => {
				// registration failed
				console.log('Subscription fallado: ' + e)
			})

	} catch (e) {
		console.log('Error al suscribir a notificaciones: ' + e)
	}
}

/**
 * event listener to show notification
 * @param {PushEvent} event
 */
function pnPushNotification(event) {
	console.log('evento push: ' + event);
	var strTitle = strDefTitle;
	var oPayload = null;
	var opt = { icon: strDefIcon };
	if (event.data) {
		// PushMessageData Object containing the pushed payload
		try {
			console.log(event.data.text())
			// try to parse payload JSON-string
			oPayload = JSON.parse(event.data.text())
		}
		catch(e) {
			// if no valid JSON Data take text as it is...
			// ... comes maybe while testing directly from DevTools
			opt = {
				icon: strDefIcon,
				body: event.data.text(),
			}
		}
		if(oPayload) {
			if (oPayload.title != undefined && oPayload.title != '') {
				strTitle = oPayload.title;
			}
			opt = oPayload.opt
			if (oPayload.opt.icon == undefined ||
				oPayload.opt.icon == null ||
				oPayload.icon == "") {
				// if no icon, use default
				opt.icon = strDefIcon;
			}
			switch(oPayload.action) {
				case "pila":
					coleccionarPila(opt.pila)
					break
				default:
			}
		}
	}
	var promise = self.registration.showNotification(strTitle, opt)
	event.waitUntil(promise);
}

/**
 * event listener to notification click
 * if URL passed, just open the window.
 * @param {NotificationClick} event
 */
function pnNotificationClick(event) {
	console.log('notificationclick event: ' + event)
	if (event.notification.data && event.notification.data.url) {
		event.waitUntil(async function() {
			const allClients = await clients.matchAll({
				includeUncontrolled: true
			})

			let chatClient

			// Let's see if we already have a chat window open:
			if( allClients.length > 0 ) {
				chatClient = allClients[0]
				chatClient.focus()
				chatClient.postMessage( {"action":"browse","url": event.notification.data.url} )
			}
			// If we didn't find an existing chat window
			else {
				// open a new one:
				chatClient = await clients.openWindow( event.notification.data.url )
			}
			// Message the client:
			//~ chatClient.postMessage( event.notification.data.url );
		}());
	}
	event.notification.close()

	if (event.action != "") {
		// add handler for user defined action here...
		// pnNotificationAction(event.action);
		console.log('notificationclick event.action: ' + event.action)
	}
}

/**
 * event listener to notification close
 * ... if you want to do something for e.g. analytics
 * @param {NotificationClose} event
 */
function pnNotificationClose(event) {
	console.log('notificationclose evento: ' + event)
}

/**=========================================================
 * add all needed event-listeners
 * - activate:  subscribe notifications and send to server
 * - push:      show push notification
 * - click:     handle click an notification and/or action
 *              button
 * - change:    subscription has changed
 * - close:     notification was closed by the user
 *=========================================================*/
// add event listener to subscribe and send subscription to server
//~ self.addEventListener("activate", pnSubscribe);
// and listen to incomming push notifications
self.addEventListener("push", pnPushNotification);
// ... and listen to the click
self.addEventListener("notificationclick", pnNotificationClick)
// subscription ha cambiado
self.addEventListener("pushsubscriptionchange", pnSubscriptionChange)
// notification was closed without further action
self.addEventListener("notificationclose", pnNotificationClose)

/**
 * Para almacenar y que sea instalable
 */
self.addEventListener("install", (event) => {
	console.log('ðŸ‘·', 'instalar', event)
	self.skipWaiting()
});

self.addEventListener("activate", (event) => {
	console.log('ðŸ‘·', 'activo', event)
	return self.clients.claim()
});

self.addEventListener("fetch", function(event) {
	// console.log('ðŸ‘·', 'fetch', event)
	event.respondWith(fetch(event.request))
})

