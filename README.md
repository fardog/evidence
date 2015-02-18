# evidence

Track the history of an object.

[![Build Status](http://img.shields.io/travis/fardog/evidence/master.svg?style=flat)](https://travis-ci.org/fardog/evidence)
[![npm install](http://img.shields.io/npm/dm/evidence.svg?style=flat)](https://www.npmjs.org/package/evidence)

A stream that takes any objects written to it, and saves them into a history
stack. Works in node, or with [browserify][browserify].

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
      objects are discarded. Defaults to `100`.

### Methods and Properties

- `instance.write([data])` - Write a new object to the stack. Any item written
  is deep-copied before insertion into the stack.
- `instance.get([index])` - Get the item saved at `index`, and get the last
  item written if `index` isn't provided. New items written are saved to the
  front of the stack, so index `0` is the latest, `1` is the item that was
  written prior to `0`, and so on.

The following properties use [getters][getters] and [setters][setters], so
they won't be available in Internet Explorer 8:

- `instance.offset` - Sets the new head element, or gets the current head. Any
  further `get` calls will act as though the element you set is `0`; then `1`
  will be the item saved prior to the new `0`, and so on.
- `instance.length` - Get current length of the stack.

If you do need support for IE8, use these; they'll work in all browsers, and
are what the properties above use to do their work:

- `instance.getOffset()`
- `instance.setOffset([index])`
- `instance.getLength()`

### Events

- Emits a `data` event, like any stream. The value emitted is the last-written
  object. Any time the head element changes (like if the `offset` was changed),
  the new head element will be emitted.
- Emits a `truncated` event when any item is truncated from the stack due to
  the stack outgrowing the specified `size`, or due to a new state being saved
  when an offset has been set. Emitted with the event will be an array of the
  removed items.

## Notes

- For performance reasons, deep copy is implemented using
  `JSON.parse(JSON.stringify(data))`, which will fail for anything that cannot
  be encoded to or parsed from JSON.
- When understanding this module, think about it in terms of undo/redo. Take
  the following example:
    1. You write three different states to the module. The length of the stack
       is now `3`. The last state written is at the top of the stack.
    2. You increment the offset with `offset++`: this is like an "undo"; the
       head of the stack is now at the second to last item written.
    3. You decrement the offset with `offset--`: this is like a "redo"; the
       head of the stack is now at the item it was in step 1 above.
    4. You increment the head again with `offset++`, and then you write a new
       value to it. You lose the item that was originally at the head, since
       you've effectively done an "undo" step, and then written new history to
       the stack. In this process, the stream emits a `truncate` even that
       contains the item that was removed from history with your latest write.
- Writing to a stack that has been `offset()` will truncate any elements newer
  than `offset` when written to.

## License

MIT. See [LICENSE](./LICENSE) for details.

[browserify]: http://browserify.org/
[getters]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
[setters]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set
