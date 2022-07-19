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

// 测试代码
// info 和 foo 都是代理对象
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

foo.height = 9999;

// 打印结果:
effect1: 200 why
effect2: 10000
effect3: 110 why
effect4: 1.88
effect4: 9999

// 解析:
// 前四行是在watchEffect()中执行effect()打印出来的原本的数据, 用作对比.
// 第五行是改变foo.height做出的响应。

// 总结：
// 使用Vue3中的Proxy思想也能解决简单版依赖收集系统的缺陷。而且Proxy更有优势