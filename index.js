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

    if(equal(insert, stack[stackOffset])) {
      return
    }

    if(stackOffset) {
      removed = stack.splice(0, stackOffset)
      stackOffset = 0
    }

    stack.splice(0, 0, insert)

    if(stack.length > size) {
      removed = stack.splice(-1, stack.length - size)
    }

    output.queue(insert)

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
    stackOffset = _idx
    output.queue(stack[stackOffset])

    return stack[stackOffset]
  }
}
