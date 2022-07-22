
// 劫持对象
const toProxy = new WeakMap() 
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
    if(typeof target === Array) {
        return new Proxy(target, {
            get(target, key) {
                console.log('劫持数组,调用get') 
                return target[key]
            },
            set(target, key, value) {
                console.log('劫持数组,调用set') 
                return Reflect.set(target, key, value)
            }
        })
    }else {
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
    
}

