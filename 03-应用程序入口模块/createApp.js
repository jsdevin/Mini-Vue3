function createApp(rootComponent) { // rootComponent参数传入的是根组件
  return { // 返回的是一个对象，然后用这个对象去挂载根节点
    mount(selector) { // selector参数会传入根节点
      const container = document.querySelector(selector); // 搜索这个根节点。并将之作为容器接纳后面的子节点
      let isMounted = false; // 判断是不是第一次进入这里，如果是第一次进入这里，就是挂载根节点(根组件)。如果不是第一次进入这里，就是重新渲染根组件
      let oldVNode = null;

      watchEffect(function() { // watchEffect 负责监听副作用
        if (!isMounted) { // 第一次使用createApp()进入这里，需要将根组件中render()的返回值渲染成为虚拟节点，然后挂载到根节点中(此时真实DOM只有根结点，直接挂载即可)
          oldVNode = rootComponent.render(); 
          mount(oldVNode, container); 
          isMounted = true; // 将isMounted设置为true， 代表的是已经进入过这里了，后面就是要比较新旧节点了
        } else {
          const newVNode = rootComponent.render();
          patch(oldVNode, newVNode);
          oldVNode = newVNode;
        }
      })
    }
  }
}