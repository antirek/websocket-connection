const getUniqId = () => Date.now().toString() + '#' + Math.random().toString(36).substring(2, 9)

const ws = new WebSocket("ws://localhost:3001")

const serverExceedTimeout = 2

ws.onmessage = e => {
  try {
    // Parse JSON data from server
    const { id, data, error } = JSON.parse(e.data)
    // we generate event that our id came from server
    emitter.emit(id, { data, error })
  } catch (e) {
    console.warn('onmessage error: ', e)
  }
}

// implementation of out WS functionality
const WS = (method, params) => new Promise((resolve, reject) => {
  // create unique id
  const id = getUniqId()
  // Send id, params and method to the server.
  // By the name of the method on the server, we understand what data
  // you need to receive or what other actions you need to execute.
  // There will be routing.
  ws.send(JSON.stringify({ id, method, params }))
  // We once time subscribe to the event.
  // check if an error is received from the server then we call reject
  // else we received data and call resolve
  emitter.once(id, ({ data, error}) => {
    data
      ? resolve(data)
      : reject(error || new Error('Unexpected server response.'))
  })

  // Waiting for some time and if the server did not answer
  // we call reject and unsubscribe id
  setTimeout(() => {
    if (hasListeners(emitter, id)) {
      reject(new Error(`Timeout exceed, ${serverExceedTimeout} sec`))
      emitter.off(id, resolve)
    }
  }, serverExceedTimeout * 1000)
})

