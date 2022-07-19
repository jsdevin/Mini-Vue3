class Dep {
  constructor() {
    this.subscribers = new Set(); // 用集合来存储订阅事件。
  }

  depend() { // 将需要响应的事件设置为依赖，一旦事件发生变化，依赖就会自动响应
    if (activeEffect) {
      this.subscribers.add(activeEffect); // 将需要响应的事件添加到集合中
    }
  }

  notify() { // 告知效果
    this.subscribers.forEach(effect => { // 遍历集合并执行子项
      effect();
    })
  }
}

// 我们认为数据发生变化会引发事件发生响应的效果是副作用。 
let activeEffect = null;
function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}

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


// 测试代码
const info = reactive({counter: 100, name: "why"});
const foo = reactive({height: 1.88});

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
// info.name = "why222";

foo.height = 1000;

// 打印结果:
effect1: 200 why
effect2: 10000
effect3: 110 why
effect4: 1.88
effect4: 1000

// 解析结果:
// 前四行是在watchEffect()中执行effect()打印出来的原本的数据, 用作对比.
// 第五行的 effect4: 1000 是改变foo.height引起的响应. 

// 总结:
// 在简单版依赖收集系统中, 遗留下来的缺陷是改变某个对象的属性, 然后使用notify()会导致依赖集合中所有对象的依赖全都执行.
// 在这里,就完美解决了前面简单版依赖收集系统遗留下来的缺陷.
// 使用Vue2中的 Object.defineProperty()进行数据劫持, 为对象的每一个属性都是设置一个依赖收集Map, 
// 使得该映射集合的depend()只会收集自己属性的依赖,notify()也只会执行遍历自己映射集合中的依赖进行响应.
// 这样子就不会导致其它属性的依赖响应,也不会导致其它对象的依赖响应.从而完善前面简单版依赖收集系统的缺陷.
