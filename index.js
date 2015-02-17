var through = require('through')
  , duplexer = require('duplexer')
  , objectstate = require('objectstate')

var DEFAULT_SIZE = 20

module.exports = evidence

function evidence(_size) {
  var stack = []
    , size = _size || DEFAULT_SIZE
    , last = objectstate()
    , input = through()
    , output = through(write)
    , duplex

  input.pipe(last).pipe(output)

  duplex = duplexer(input, output)

  duplex.get = get

  // define our length property on the duplex object
  Object.defineProperty(duplex, 'length', {
      get: function() {
        return stack.length
      }
  })

  return duplex

  function write(data) {
    var removed

    stack.splice(0, 0, data)

    if(stack.length > size) {
      removed = stack.splice(-1, stack.length - size)
      duplex.emit('truncated', removed.length === 1 ? removed[0] : removed)
    }

    output.queue(data)
  }

  function get(_idx) {
    var idx = _idx || 0

    return stack[idx]
  }
}
