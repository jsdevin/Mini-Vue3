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
// 无论54-56行的代码执行哪一行，都会调用使得notify()去遍历所有的依赖，然后执行。这是缺陷
// 因为对于多个对象，如果我们只是改变其中一个对象的属性，我们当然只希望去响应当前的对象即可，不需要去响应其它对象的依赖。
// 比如上面的info对象和foo对象, 我们在56行改变了foo.height属性,我们只需要foo对象对应的依赖响应即可,不需要去响应info对象的依赖.
// 但是这里notify()的设计原理是对依赖进行this.subscribers集合进行forEach()遍历, 无论是任何对象的任何属性发生改变,势必都会使得所有的依赖被遍历出来并执行.
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

// 前四行是在watchEffect()中执行effect()打印出来的原本的数据,
// 后四行是dep.notify()输出的响应结果

// 简单的依赖收集系统的思路到此结束.