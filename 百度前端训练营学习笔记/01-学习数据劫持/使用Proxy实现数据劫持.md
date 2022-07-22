# 数据劫持的实现 - Proxy  
## 什么是数据劫持？  
数据劫持指的是在访问或者修改对象的某个属性时，除了执行基本的数据获取和修改操作以外，还基于数据的操作行为，以数据为基础去执行额外的操作。  
  
- 怎么理解呢？举个例子  
    
  比如foo对象有一个name属性，我们现在有一个需求，就是每次name值被改变的时候都需要在控制台打印出'name属性被改变了'。  
    
- 例子怎么实现呢？  
    
  使用数据劫持就能实现。通过对数据劫持的分析我们可以知道：如果使用数据劫持，在访问或修改对象的属性时，除了可以执行基本的数据获取和修改操作以外,还可以进行一系列额外的操作A。我们在控制台打印值这个需求就能在数据劫持的一系列额外操作A中完成。  
    ```js  
    let foo = {  
      name: 'lily'  
    }  
  
    // 为了便于理解, 不引入Reflect  
    let handle = {  
      get(target, key) {  
        return target[key]  
        // return Reflect.get(target, key)  
      },  
      set(target, key, newValue) {  
        console.log(key + '属性被改变了')  
        target[key] = newValue  
        // Reflect.set(target, key, newValue)  
      }  
    }  
  
    let proxyObj = new Proxy(foo, handle)  
    console.log(proxyObj.name) // lily  
    proxyObj.name = 'devin' // name属性被改变了  
    console.log(proxyObj.name) // devin  
  
    // 控制台打印结果:  
    lily  
    name属性被改变了  
    devin  
    ```  
  
## 为什么要有数据劫持？  
为了实现响应式!! 响应式的基础就是数据劫持,只有实现了数据劫持,才能将数据变成动态变化的响应式.  
- 怎么理解呢?  
  proxy代理data接收数据，然后通过reflect映射给data；然后，当有获取Data数据时，Proxy会将get操作拦截下来，再通过reflect映射出data的真实数据。  
  解读: 每当数据data发生变化, proxy代理器都会通过set捕获器将数据改变后Reflect映射到data中, 当下一次需要获取data数据时, 就会Reflect映射出data的最新值.  
  ![proxy](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207210052284.png)  
  
  我们知道在前端页面渲染中，最经典的触发渲染方案必然是**基于事件机制**实现，这种实现渲染的方案有个很大的闭端就是需要通过事件监听机制触发JS事件，然后JS通过document获取需要**重新渲染的DOM**，然后在js的DOM模型上修改数据触发document渲染页面。  
  ![前端页面渲染](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207210049728.png)  
  
  在浏览器中document只是提供给JS操作文档模型的接口，双方通讯通道资源有限，基于事件机制触发页面渲染会消耗这个这个通道的大量资源，降低浏览器性能，下面来看看基于数据劫持实现数渲染的模型图（JS与document通讯仅仅只需要一次，而且基于虚拟DOM的支持还可以实现最精准的DOM渲染）：  
  ![浏览器](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207210050964.png)  
  
  
  
## 怎么实现数据劫持?   
### 劫持数组  
```js  
const arr = [];  
const handle = {  
  get(target, key) {  
    console.log('劫持数组, 调用了get()')  
    return target[key];  
  },  
  set(target, key, value) {  
    console.log('劫持数组, 调用了set()')  
    return Reflect.set(target, key, value); // 会将数据(target.key的值)修改后重新映射到target对象中  
  }  
}  
const arrProxy = new Proxy(arr, handle); // new Proxy() 返回值的类型是对象.  
  
arrProxy[0] = 66;  
arrProxy[1] = 9999;  
console.log(arrProxy) // Proxy {0: 66, 1: 9999}   
```  
打印结果:  
> 劫持数组, 调用了set()  
> 劫持数组, 调用了set()  
> Proxy {0: 66, 1: 9999}  
  
### 劫持对象  
需要深度遍历对象的每个属性, 因为可能对象的属性的属性值也是对象. 当对象的属性是深度嵌套的时候，只会触发 getter，并不会触发setter，所以需要对深度嵌套的属性进一步使用 proxy  
```js  
onst toProxy = new WeakMap() // WeakMap的 key是对象, value是任意值  
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
```  
  
打印结果:  
> 劫持对象, 调用了get()  
> abc  
> 劫持对象, 调用了set()  
  
**参考文章**:  
  
[参考1: 学习使用Proxy-Reflect](https://github.com/jsdevin/Study-notes/blob/main/04-JS%E9%AB%98%E7%BA%A7/%E7%AC%AC17%E8%8A%82%20Proxy-Reflect-vue%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86.md)  
[参考2: 什么是数据劫持? 为什么要有数据劫持?](https://zhuanlan.zhihu.com/p/47041290#tocbar--1aqj2ue)  
[参考3: 什么是数据劫持? 为什么要有数据劫持?](https://zhuanlan.zhihu.com/p/60791215)  
[参考4: 实现数据劫持?](https://www.cnblogs.com/yangzhou33/p/13772074.html)  
[参考5: 实现数据劫持?](https://www.cnblogs.com/ZheOneAndOnly/p/11404109.html#tocbar-1m42r84)  
  