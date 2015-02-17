# evidence

Track the history of an object.

[![Build Status](http://img.shields.io/travis/fardog/evidence/master.svg?style=flat)](https://travis-ci.org/fardog/evidence)
[![npm install](http://img.shields.io/npm/dm/evidence.svg?style=flat)](https://www.npmjs.org/package/evidence)

## Example

At its simplest, you simply write a value to the history, and it's saved as the
latest state. Any previous values pushed further down the stack.

```javascript
var evidence = require('evidence')

var instance = evidence()

instance.write({item: 'One'})
instance.get(0) // {item: 'One'}
instance.write({item: 'Two'})
instance.get(1) // {item: 'Two'}
instance.length // 2
```

But being a stream, you can pipe data directly to it:

```javascript
var evidence = require('evidence')
  , stream = require('through')()

var instance = evidence()

stream.pipe(instance)
stream.write({item: 'One'})

instance.get(0) // {item: 'One'}
```

History is only saved if the last value written isn't the same as the item in
the top of the stack.

## API

- `evidence([size])` -> Duplex Stream: Instantiates a new instance, and returns
  a duplex stream that saves objects written to it into its internal state, and
  emits that state so long as it's changed.
    - `size` (Number): The number of objects that should be saved before older
      objects are discarded. Defaults to `20`.

### Methods and Properties

- `instance.get([index])` - Get the item saved at `index`, and get the last
  item written if `index` isn't provided. New items written are saved to the
  front of the stack, so index `0` is the latest, `1` is the item that was
  written prior to `0`, and so on.
- `instance.length` - The current length of the stack.

### Events

- Emits a `data` event, like any stream. The value emitted is the last-written
  object.
- Emits a `truncated` event when any item is truncated from the stack due to
  the stack outgrowing the specified `size`. Emits the item that was removed.

## License

MIT. See [LICENSE](./LICENSE) for details.
