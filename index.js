var through = require('through')
  , duplexer = require('duplexer')
  , objectstate = require('objectstate')

var DEFAULT_SIZE = 100

module.exports = evidence

function evidence(_size) {
  var stack = []
    , stackOffset = 0
    , size = _size || DEFAULT_SIZE
    , last = objectstate()
    , input = through()
    , output = through(write)
    , duplex

  input.pipe(last).pipe(output)

  duplex = duplexer(input, output)

  duplex.get = get
  duplex.offset = offset

  // define our length property on the duplex object and the older browser
  // fallback
  try {
    Object.defineProperty(duplex, 'length', {
        get: getLength
    })
    Object.defineProperty(duplex, 'currentOffset', {
        get: currentOffset
    })
  } finally {
    duplex.getLength = getLength
    duplex.getCurrentOffset = currentOffset
  }

  return duplex

  function write(data) {
    var removed

    if(stackOffset) {
      removed = stack.splice(0, stackOffset)
      stackOffset = 0
    }

    stack.splice(0, 0, data)

    if(stack.length > size) {
      removed = stack.splice(-1, stack.length - size)
    }

    output.queue(data)

    if(removed) {
      duplex.emit('truncated', removed)
    }
  }

  function get(_idx) {
    var idx = _idx || 0

    return stack[stackOffset + idx]
  }

  function offset(_idx) {
    stackOffset += _idx
    output.queue(stack[stackOffset])

    return stack[stackOffset]
  }

  function getLength() {
    return stack.length - stackOffset
  }

  function currentOffset() {
    return stackOffset
  }
}
