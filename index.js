var through = require('through')
  , duplexer = require('duplexer')
  , equal = require('deep-equal')

var DEFAULT_SIZE = 100

module.exports = evidence

function evidence(_size) {
  var stack = []
    , stackOffset = 0
    , size = _size || DEFAULT_SIZE
    , input = through(write)
    , output = through()
    , duplex

  duplex = duplexer(input, output)

  duplex.get = get

  // define our length property on the duplex object and the older browser
  // fallback
  try {
    Object.defineProperty(duplex, 'length', {
        get: getLength
    })
    Object.defineProperty(duplex, 'offset', {
        get: getOffset
      , set: setOffset
    })
  } finally {
    duplex.getLength = getLength
    duplex.getOffset = getOffset
    duplex.setOffset = setOffset
  }

  return duplex

  function write(data) {
    var removed
      , insert = JSON.parse(JSON.stringify(data))

    // if what's written is equal to the stack HEAD, don't save it
    if(equal(insert, stack[stackOffset])) {
      return
    }

    // remove items newer than HEAD if a new value is written to an already
    // offset stack.
    if(stackOffset) {
      removed = stack.splice(0, stackOffset)
      stackOffset = 0
    }

    // insert the new value
    stack.splice(0, 0, insert)

    // truncate any values that have pushed the stack over size
    if(stack.length > size) {
      removed = stack.splice(-1, stack.length - size)
    }

    // queue the new data to be emit on the stream
    output.queue(insert)

    // emit any elements that were truncated
    if(removed) {
      duplex.emit('truncated', removed)
    }
  }

  function get(_idx) {
    var idx = _idx || 0

    return stack[stackOffset + idx]
  }

  function getLength() {
    return stack.length - stackOffset
  }

  function getOffset() {
    return stackOffset
  }

  function setOffset(_idx) {
    var err

    if(_idx >= stack.length) {
      err = 'offset is greater than the stack length'
    } else if(_idx < 0) {
      err = 'offset cannot be less than 0'
    }

    if(err) {
      duplex.emit('error', new Error(err))
      throw new Error(err)
    }

    stackOffset = _idx
    output.queue(stack[stackOffset])

    return stack[stackOffset]
  }
}
