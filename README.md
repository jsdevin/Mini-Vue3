# 实现一个简易版的MVVN框架  
## 前言  
<!-- 待办事项的md语法：横框+ 空格+方括号（方括号中必须有空格或者x） + 空格+ 文本  
- [x] 已完成的待办1  
- [ ] 未完成的待办2 -->  
  
该mvvn框架是参考vue3实现的，包括如下内容：  
- [x] 渲染系统模块  
- [x] 可响应式系统模块  
- [ ] 应用程序入口模块  
  
## 渲染系统模块  
该模块主要包含三个功能.  
- 功能一是 h()函数,用于返回虚拟节点vNode对象, 该对象包含三样东西tag, props, children.  
- 功能二是 mount函数，用于将vNode挂载到DOM上  
- 功能三是 patch函数，用于对两个vNode进行对比，决定如何处理新的VNode  
  
1. h() 生成虚拟节点  
  通过h()函数将传入的三个参数渲染成一个虚拟DOM节点返回，h()函数的第一个参数是代表着**标签**的tag, 第二个参数是代表着**属性**的props, 第三个参数是children，代表的是第一个参数tag标签的**内容**，当然这个内容也可以是子节点。    
  ![](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207190122915.png)  
     
2. mount() 将虚拟节点按照children中父子关系挂载，形成虚拟DOM树  
  mount()是挂载方法，其有两个参数，第一个参数vnode是需要被挂载的虚拟DOM节点，第二个参数是容纳第一个参数vnode(虚拟节点)的容器节点container．当所有的虚拟节点都按照各自children中的父子关系挂载好之后，就形成了虚拟DOM树。  
  首先处理tag标签，利用h函数暴露出来的tag生成一个标签节点元素，并将元素存储到虚拟节点vnode中。  
  然后处理props属性，如果是on开头，就监听事件，如果是普通的属性，就直接使用setAttribute来创建属性即可。  
  最后处理children属性，如果是children是字符串，就直接设置textContent即可，如果是数组节点，就遍历调用mount函数，使其作为子节点挂载。  
  ![](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207190125663.png)  
  
3. patch(oldNode, newNode) 函数： 一个更新旧节点的函数. 实现思路如下  
- 比较tag:  
如果旧节点含有的标签元素类型和新节点含有的标签元素类型不相同，直接删掉旧节点的标签，然后将新节点的标签添加进去即可。如果旧节点含有的标签元素和新节点含有的标签元素相同, 进行下一步  
  
- 处理props:  
先无脑将新节点的props属性全添加到旧节点，在添加的过程中遍历新节点的props，  
如果新节点的props的属性和旧节点的props属性含有一样的属性，但是二者的属性值不相同,那么我们就用setAttribute新建一个属性添加到老节点中，  
如果二者属性值相同,不做处理. 不需要考虑覆盖的的情况.只有相同的属性且其属性值也相同才保留,待全部添加完毕后,在旧节点中删除只存在于旧节点props但不存在于新节点props的属性, 剩下的都是patch处理之后的属性了  
  
- 处理children:  
处理新节点的children需要先判断其类型,然后再进行处理,  
如果新节点的children是字符串,那就好办,直接使用innerHTML将字符串赋值给旧节点即可.无需考虑旧节点children的情况  
如果新节点的children是数组,就比较麻烦,我们就要依据旧节点的children的类型来进行处理  
    &nbsp;&nbsp;&nbsp;&nbsp;如果旧节点的children的类型是string, 简简单单,直接清空旧节点的children,然后挂载新节点的children即可(因为已知新节点的children为数组)  
    &nbsp;&nbsp;&nbsp;&nbsp;如果旧节点的children也是数组,此时新旧节点的children都是数组. 我们需要先判断新旧节点children的数组长度, 使用长度小的那个数组长度A作为遍历的判断停止条件, 来控制patch(oldchildren, newchildren)的执行次数.  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A次执行patch(oldchildren, newchildren)执行完之后,剩下的children数组元素就是仅存于一方的children中了,   
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;如果存在于新节点的children中(即newChildren.length > oldChildren.length),就需要添加到旧节点中,添加方法就是直接遍历然后使用mount()挂载方法  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;如果存在于旧节点的children中(即newChildren.length < oldChildren.length),就需要删去,删除方法就是直接遍历然后使用removeChild()挂载方法  
  
patch()实现代码:  
```js  
const patch = (oldNode, newNode) => {  
  // 1. 处理tag.  
  // 如果标签都不相同,直接获取旧节点标签的父元素,然后使用父元素的removeChild方法删除旧节点的标签,然后添加新的标签  
  // 如果标签相同,不用处理,进行下一步即可  
  if(oldNode.tag !== newNode.tag) {   
    const oldNodeParent = oldNode.el.parentElement  
    oldNodeParent.removeChild(oldNode.el)  
    mount(newNode, oldNodeParent)  
  } else {  
    // 取到el对象.  
    const el = newNode.el = oldNode.el  
    // 2. 处理props  
    // 2.1 将新节点的props全都添加到旧节点的props中,如果二者存在属性相同,但是属性值不相同的情况,就直接在旧节点中新建一个  
    for(const key in newNode.props) {  
      const oldValue =  oldNode.props[key]  
      const newValue =  newNode.props[key]  
      if(oldValue !== newValue) { // 属性相同,但是属性值不相同  
        el.setAttribute(key, newValue) // 直接新建一个好了,不使用覆盖的方法  
      }  
    }  
    // 2.2 删除只存在于旧节点props中但是不存在于新节点props中的属性  
    const oldProps = oldNode.props || {};  
    const newProps = newNode.props || {};  
    for(const key in oldProps) {  
      if(!(key in newProps)) {  
        el.removeAttribute(key)  
      }  
    }  
  
    // 3.处理children  
    const oldChildren = oldNode.children || []  
    const newChildren = newNode.children || []  
    // 3.1 新节点的children类型是字符串,直接innerHTML方法即可  
    if(typeof newChildren === 'string') { // 新节点的children类型是字符串  
      oldChildren.innerHTML = newChildren  
    } else { // 3.2 新节点的children类型是数组  
      // 3.2.1 如果旧节点的children的类型是string, 简简单单,直接清空旧节点的children,然后挂载新节点的children即可  
      if(typeof oldChildren === 'string') {  
        el.innerHTML = ''  
        newChildren.forEach(item => {  
          mount(item, el)  
        })  
      } else {   
      // 3.2.2 旧节点的children也是数组,此时新旧节点的children都是数组.我们需要先判断新旧节点children的数组长度,   
      // 使用长度小的那个数组长度commonLength作为遍历的判断停止条件, 来控制patch(oldchildren, newchildren)的执行次数  
        // 1) commonLength次执行patch(oldchildren, newchildren)执行完之后,  
        // 剩下的children数组元素就是仅存于一方的children中了,   
        const commonLength = Math.min(oldChildren.length, newChildren.length)  
        // 举例测试:  
          // oldChildren: [v1, v2, v3, v8, v9]  
          // newChildren: [v1, v5, v6]  
        for(let i = 0; i < commonLength; i++) {  
          patch(oldChildren[i], newChildren[i])  
        }  
  
        // 2) 如果存在于新节点的children中(即newChildren.length > oldChildren.length),  
        // 就需要添加到旧节点中,添加方法就是直接遍历然后使用mount()挂载方法  
        if(newChildren.length > oldChildren.length) {  
          newChildren.slice(commonLength).forEach(child => {  
            mount(child, el)  
          })  
        }  
  
        // 3) 如果存在于旧节点的children中(即newChildren.length < oldChildren.length),  
        // 就需要删去,删除方法就是直接遍历然后使用removeChild()挂载方法  
        if(newChildren.length < oldChildren.length) {  
          oldChildren.slice(commonLength).forEach(item => {  
            el.removeChild(item.el)  
          })  
        }  
      }  
    }  
  }  
}  
```  
渲染系统模块完成效果预览:  
![](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207190205314.gif)  
<!-- ![完成效果预览](./01-渲染模块/render.gif) -->
  
## 响应式系统模块  

### 前言：MVVM 模式
在讲述响应式系统模块前，我们需要先了解一下MVVM。
1. 什么是MVVM呢？ 
  MVVM 其实是一种思想，是一种生成模式。MVVM 表示的是 View-ViewModel-Model，就是视图层-视图模型层-模型层。View是作为视图层，简单来说可以把它理解为HTML页面；Model 是作为模型层，它是负责处理业务逻辑以及和服务器端进行交互的；ViewModel 是作为视图模型层，也就是 Vue 框架所起到的作用了，主要是作为 View 层和 Model 层之间的通信桥梁。
  ![mvvm作用过程](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207192320672.png)

2. vue 和 MVVM 的关系
  MVVM的设计思想是关注Model的变化，让MVVM框架去自动更新DOM的状态，从而把开发者从操作DOM的繁琐步骤中解脱出来。
  我们可以发现vue是符合mvvm的设计思想的。Vue将视图层View和模型层Model有效地分离开来，让我们只需要关心数据即可。基于这一点，**Vue 框架就是充当了 MVVM 开发模式中的 ViewModel 层**，负责 View 和 Model 之间通信的桥梁。我们在使用 Vue 框开发的时候，只需要关心 View 层的 HTML 代码和 Model 层的 JavaScript 逻辑就可以了。
  ![vue框架是ViewModel](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207200040761.png)

参考文章： [vue 与 mvvm 的关系](https://zhuanlan.zhihu.com/p/67960731)

### 响应式原理
在了解了mvvm模式之后，我们可以很清晰地了解到什么是响应式原理，响应式原理就是在改变数据的时候，视图会跟着更新。往大点说，响应系统是一种自动使数据源（模型）与数据表示（视图）层自动保持同步的机制。每次模型更改时，都会重新渲染视图。
同时我们需要了解的是，响应式原理就是双向绑定原理，二者是同样的东西，只是叫法不同。

1. 在vue2中用Object.defineProperty()来实现响应式原理
  Vue2的实现原理 是通过 Object.defineProperty 来劫持各个属性的setter、getter，在数据变动时发布消息给订阅者，触发相应的监听回调。
  vue2使用Object.defineProperty来实现响应式原理有着许多缺陷，比如不能监听数组，也无法检测到对象属性的添加和删除，并且只有data对象中的属性才能转化为响应式。

2. 在vue3中用Proxy来实现响应式原理
  Vue3中响应式原理就是当需要对某个对象操作时，会先生成一个代理对象，并且我们数据劫持时劫持到的也是代理对象，我们所有的操作都将会在代理对象中完成，然后返回。
  基于Proxy, 劫持的是一整个代理对象，并且Proxy提供了has()、deleteProperty等捕获器，可以非常轻易地去添加对象属性和删除对象属性。

- 思考： 为什么Vue3选择使用Proxy来实现响应式？
（1）Object.definedProperty 是劫持对象的属性时，如果新增元素，那么Vue2需要再次 调用definedProperty，而 Proxy 劫持的是整个对象，不需要做特殊处理。这是Proxy的第一个优势
（2）vue2使用Object.definedProperty，修改原本对象就能触发拦截，而Vue3使用Proxy，需要修改代理对象才能出发拦截，一切操作不通过原对象实现，这样子原对象就不会发生任何改变，保护了原对象。这是Proxy的第二个优势
（3）Proxy 能观察的类型比 defineProperty 更丰富，Proxy有has()方法和deleteProperty()方法，他们分别是in操作符的捕获器和delete 操作符的捕捉器。这是Proxy的第三个优势

参考文章：
[vue2、vue3响应式原理](https://juejin.cn/post/6982001553540382733#heading-1)
[什么是vue响应式系统？](https://www.yisu.com/zixun/457735.html)


### 实现响应式系统模块 
响应式系统模块的实现前需要先实现依赖收集系统，在没有考虑vue2的 Object.definedProperty 和vue3的 Proxy 的情况下，我们实现一个简单版的依赖收集模系统。
1. 简单版 - 依赖收集系统
    ```js
    // 简易版的依赖收集系统
    class Dep {
      constructor() {
        this.subscribers = new Set(); // 用集合来存储订阅事件。
      }

      depend() { // 将需要响应的事件设置为依赖，可以通过notify()来遍历依赖出来
        if (activeEffect) {
          this.subscribers.add(activeEffect); // 将需要响应的事件添加到集合中
        }
      }

      notify() { // 输出集合中的依赖
        this.subscribers.forEach(effect => { // 遍历集合并执行子项
          effect();
        })
      }
    }

    // 前言: 我们认为数据发生变化会引发事件发生响应的效果是副作用。 所以将变量名设置为effect

    let activeEffect = null; // 初始状态是没有副作用的，所以指向null
    function watchEffect(effect) { // 监听副作用，如果数据变化，就会有副作用的发生
      activeEffect = effect; // 将数据变化产生的副作用设置为当前的副作用
      effect();  // 副作用执行一下，在控制台输出原本的值用于比较.这一步可省略
      dep.depend() // 调用depend(), 将副作用添加到依赖中，会自动发生响应
      activeEffect = null; // 重新将当前的副作用设置为空，方便接待下一次的副作用传入
    }


    // 测试代码
    const info = {counter: 100, name: "why"};
    const foo = {height: 1.88};

    const dep = new Dep(); // watchEffect()执行需要用到dep

    // watchEffect1
    watchEffect(function () {
      console.log("effect1:", info.counter * 2, info.name);
    })

    // watchEffect2
    watchEffect(function () {
      console.log("effect2:", info.counter * info.counter);
    })

    // watchEffect3
    watchEffect(function () {
      console.log("effect3:", info.counter + 10, info.name);
    })

    watchEffect(function () {
      console.log("effect4:", foo.height);
    })

    // info.counter++;
    // info.name = "why";
    foo.height = 2; 

    dep.notify()
    ```
    // 无论`info.counter++; info.name = "why"; foo.height = 2; `这三个执行哪一个，notify()都会去遍历所有的依赖，然后执行。这是缺陷
    // 因为对于多个对象，如果我们只是改变其中一个对象的属性，我们当然只希望去响应当前的对象即可，不需要去响应其它对象的依赖。
    // 比如上面的info对象和foo对象, 我们改变了foo.height属性,我们只需要foo对象对应的依赖响应即可,不需要去响应info对象的依赖.
    // 但是这里notify()的设计原理是对this.subscribers集合进行forEach()遍历, 无论是任何对象的任何属性发生改变,势必都会使得所有的依赖被遍历出来并执行.
    // 所以这个是不合格的, 需要继续完善.

    // 打印结果:
    effect1: 200 why
    effect2: 10000
    effect3: 110 why
    effect4: 1.88
    effect1: 200 why
    effect2: 10000
    effect3: 110 why
    effect4: 2

    // 解析结果:
    // 前四行是在watchEffect()中执行effect()打印出来的原本的数据, 用作对比
    // 后四行是dep.notify()输出的响应结果

    // 总结:
    // 简单的依赖收集系统的思路到此结束.
    // 存在的缺陷: 使用dep.notify()只会一股脑地输出集合中所有对象的所有依赖, 不能实现改变A对象的属性, 就响应A对象该属性依赖

2. vue2 完善依赖收集系统 => 响应式系统
  添加下图这一块，实现响应式。基于 Object.defineProperty 劫持的是对象的某个属性，针对某个属性收集依赖，不影响到同一对象的其它属性，也不影响到其它对象。可以在文件中查看完整的源代码。
    ```js
    // Map({key: value}): key是一个字符串
    // WeakMap({key(对象): value}): key是一个对象, 弱引用, 方便设置为null进行垃圾回收
    const targetMap = new WeakMap(); // targetMap 用来存储所有对象的映射
    function getDep(target, key) {
      // 1.根据对象(target)取出对应的Map对象
      let depsMap = targetMap.get(target); // 用当前对象target作为key去查询所有映射targetMap中的value, 并将value赋值为depsMap
      if (!depsMap) { // 如果depsMap的值为空, 则表示没有此映射, 本次是第一次有关该对象target的依赖收集吗, 我们为value新建一个Map即可
        depsMap = new Map();
        targetMap.set(target, depsMap); // 给新的映射关系添加到所有对象的映射中
      }

      // 2.取出具体的dep对象
      let dep = depsMap.get(key); // 获取target对象的特定的属性对应的依赖
      if (!dep) { // 如果没有这个属性对应的依赖, 就新建一个
        dep = new Dep();
        depsMap.set(key, dep);
      }
      return dep;
    }

    // vue2对raw进行数据劫持
    function reactive(raw) { // raw 代表的是未加工过的数据
      Object.keys(raw).forEach(key => { // Object.keys(raw) 是获取raw的所有属性.
        const dep = getDep(raw, key); // 将对象和属性传入getDep()中, 就能获得该属性对应的响应依赖
        let value = raw[key];

        Object.defineProperty(raw, key, { // 加工.数据劫持
          get() {
            dep.depend(); // 将该响应依赖添加到依赖集合中
            return value;
          },
          set(newValue) {
            if (value !== newValue) {
              value = newValue;
              // 这个dep指的是const dep = getDep(raw, key) 创建出来的某个特定属性的响应依赖. 这里只会响应该依赖. 
              // 不会导致其它对象的依赖发生响应, 甚至不会使得同一个对象的其他属性的依赖响应
              dep.notify();
            }
          }
        })
      })
      return raw; // 返回的是加工后的整个对象
    }

    ```
    结果：
    ![结果](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207200035016.png)


3. vue3 完善依赖收集系统 => 响应式系统
  添加下图这一块，实现响应式。基于 Proxy 劫持的是整个对象。对对象进行操作都会引起劫持。
    ```js
    // Map({key: value}): key是一个字符串
    // WeakMap({key(对象): value}): key是一个对象, 弱引用, 方便设置为null进行垃圾回收
    const targetMap = new WeakMap(); // targetMap 用来存储所有对象的映射
    function getDep(target, key) { // 实现一个属性一个容器
      // 1.根据对象(target)取出对应的Map对象
      let depsMap = targetMap.get(target); // 用当前对象target作为key去查询所有映射targetMap中的value, 并将value赋值为depsMap
      if (!depsMap) { // 如果depsMap的值为空, 则表示没有此映射, 本次是第一次有关该对象target的依赖收集吗, 我们为value新建一个Map即可
        depsMap = new Map();
        targetMap.set(target, depsMap); // 给新的映射关系添加到所有对象的映射中
      }

      // 2.取出具体的dep对象
      let dep = depsMap.get(key); // 获取target对象的特定的属性对应的依赖
      if (!dep) { // 如果没有这个属性对应的依赖, 就新建一个
        dep = new Dep();
        depsMap.set(key, dep);
      }
      return dep;
    }

    // vue3对raw进行数据劫持.
    function reactive(raw) {
      return new Proxy(raw, { // 用Proxy创建一个代理对象
        get(target, key) {
          const dep = getDep(target, key); // 创建对象特定属性的依赖容器 -- 实现一个属性一个容器
          dep.depend(); // 将该响应添加到依赖容器中
          return target[key];
        },
        set(target, key, newValue) {
          const dep = getDep(target, key); // 创建对象特定属性对应的依赖容器
          target[key] = newValue; // 给属性设置新的值
          dep.notify(); // 给属性设置新的值使得属性值发生改变, 应该要响应告知并作响应处理.
        }
      })
    }
    ```
    结果： 
    ![](https://cdn.jsdelivr.net/gh/jsdevin/imgBed/img/202207200037945.png)

注意：这里的是vue响应式的核心代码，没有考虑边界情况，后续如果有机会回顾的话，可以考虑补充一下边界情况。

## 应用程序入口模块