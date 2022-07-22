// 劫持数组
const arr = []
const handle = {
  get(target, key) {
    console.log('劫持数组, 调用了get()')
    return target[key]
  },
  set(target, key, value) {
    console.log('劫持数组, 调用了set()')
    return Reflect.set(target, key, value)
  }
}
const arrProxy = new Proxy(arr, handle) // new Proxy() 返回值的类型是对象.

// arrProxy[0] = 66
// arrProxy[1] = 9999
// console.log(arrProxy) // Proxy {0: 66, 1: 9999}

// console.log('------------')

// 劫持对象
// 需要深度遍历对象的每个属性, 因为如果对象的属性的属性值也是对象的话, 一次劫持不行.
// 当属性是深度嵌套的时候，只会触发 getter，并不会触发setter，所以需要对深度嵌套的属性进一步使用 proxy
const toProxy = new WeakMap() // WeakMap的 key是对象, value是任意值
const toRaw = new WeakMap()
const isObject = val => typeof val === 'object' && val !== null
const handle2 = {
    get(target, key) {
        const res = Reflect.get(target, key)
        if (isObject(res)) {
            return reactive(res)
        }

        console.log('劫持对象, 调用了get()')
        return res
    },
    set(target, key, value) {
        console.log('劫持对象, 调用了set()')
        return Reflect.set(target, key, value)
    }
}

function reactive(target) {
    const res = toProxy.get(target)

    if (res) {
        return res
    }

    if (toRaw.get(target)) {
        return target
    }

    const observed = new Proxy(target, handle2)
    toProxy.set(target, observed)
    toRaw.set(observed, target)
    return observed
}

const test = {
    a: 2,
    b: {
        c: 'abc',
    }
}
const testProxy = reactive(test)
console.log(testProxy.b.c)
testProxy.b.d = 3
