var test = require('tape')
  , through = require('through')

var evidence = require('./')

var one = {item: 'One'}
  , two = {item: 'Two'}
  , three = {item: 'Three'}
  , four = {item: 'Four'}
  , five = {item: 'Five'}

test('exports a duplex stream', function(t) {
  t.plan(1)

  var input = through()
    , output = through()

  t.doesNotThrow(function() {
    input.pipe(evidence()).pipe(output)
  })
})

test('saves each object written', function(t) {
  t.plan(2)

  var instance = evidence()

  instance.write(one)
  instance.write(two)

  t.deepEqual(instance.get(0), two)
  t.deepEqual(instance.get(1), one)
})

test('removes old states over size', function(t) {
  t.plan(3)

  var instance = evidence(2)

  instance.write(one)
  instance.write(two)
  instance.write(three)

  t.deepEqual(instance.get(0), three)
  t.deepEqual(instance.get(1), two)
  t.notOk(instance.get(2))
})

test('emits when an old state is removed', function(t) {
  t.plan(1)

  var instance = evidence(2)

  instance.on('truncated', function(data) {
    t.deepEqual(one, data[0])
  })

  instance.write(one)
  instance.write(two)
  instance.write(three)
})

test('does not save the last value when equivalent', function(t) {
  t.plan(2)

  var instance = evidence()

  instance.write(one)
  instance.write(two)
  instance.write(two)

  t.deepEqual(instance.get(0), two)
  t.deepEqual(instance.get(1), one)
})

test('emits values that were written to it', function(t) {
  t.plan(2)

  var instance = evidence()

  instance.once('data', function(data) {
    t.deepEqual(data, one)

    instance.once('data', function(data) {
      t.deepEqual(data, two)
    })
  })

  instance.write(one)
  instance.write(two)

})

test('emits only once for duplicate values', function(t) {
  t.plan(2)

  var instance = evidence()

  instance.once('data', function(data) {
    t.deepEqual(data, one)

    instance.once('data', function() {
      t.fail()
    })

    setTimeout(function() {
      t.pass()
    }, 10)

    instance.write(one)
  })

  instance.write(one)
})

test('length is set properly', function(t) {
  t.plan(2)

  var instance = evidence()

  instance.write(one)

  instance.once('data', function() {
    t.equal(instance.length, 2)
    t.equal(instance.getLength(), 2)
  })

  instance.write(two)
})

test('can offset the current head index', function(t) {
  t.plan(2)

  var instance = evidence()

  instance.write(one)
  instance.write(two)
  instance.write(three)

  t.deepEqual(instance.offset(1), two)
  t.equal(instance.length, 2)
})

test('writing to an offset stack removes old elements', function(t) {
  t.plan(5)

  var instance = evidence()

  instance.write(one)
  instance.write(two)
  instance.write(three)
  instance.write(four)

  instance.once('truncated', function(data) {
    t.deepEqual(data[0], four)
  })

  t.deepEqual(instance.offset(1), three)

  instance.write(five)

  t.deepEqual(instance.length, 4)
  t.deepEqual(instance.get(0), five)
  t.deepEqual(instance.get(1), three)
})
