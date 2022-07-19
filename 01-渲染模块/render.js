// h函数: 返回一个对象,该对象包含三样东西：标签、属性、子标签
// 将代表着生成一个虚拟节点的三样东西：标签、属性、子标签，全都暴露出去
const h = (tag, props, children) => { 
  return {
    tag,
    props,
    children
  }
}


// mount() 函数：将虚拟节点挂载到DOM上
// 首先处理tag标签，利用h函数暴露出来的tag生成一个标签节点元素，并将元素存储到虚拟节点vnode中。
// 然后处理props属性，如果是on开头，就监听事件，如果是普通的属性，就直接使用setAttribute来创建属性即可。
// 最后处理children属性，如果是children是字符串，就直接设置textContent即可，如果是数组节点，就遍历调用mount函数，使其作为子节点挂载。
const mount = (vnode, container) => {
  // 1.处理tag
  const el = vnode.el = document.createElement(vnode.tag)
  // 2.处理props
  if(vnode.props) { // 如果props存在，直接遍历创建属性即可，默认props只有一个属性也使用遍历来创建
    for(const key in vnode.props) { // 遍历属性
      const value = vnode.props[key] // 获得属性值
      if(key.startsWith("on")) { // 事件
        el.addEventListener(key.slice(2).toLowerCase, value)
      }else {
        el.setAttribute(key, value)
      }
    }
  }
  // 3.处理children
  if(vnode.children) { // children不为空
    if(typeof vnode.children === 'string') { // 并且children类型为字符串
      el.textContent = vnode.children
    } else { // 数组，其元素为子节点
      vnode.children.forEach(child => { // 挂载为子节点
        mount(child, el)
      })
    }
  }

  container.appendChild(el) // 将虚拟节点挂载到容器中
}


// patch(oldNode, newNode) 函数： 一个更新旧节点的函数
// 比较tag:
// 如果旧节点含有的标签元素类型和新节点含有的标签元素类型不相同，直接删掉旧节点的标签，然后将新节点的标签添加进去即可。
// 如果旧节点含有的标签元素和新节点含有的标签元素相同, 进行下一步
// 处理props:
// 先无脑将新节点的props属性全添加到旧节点，在添加的过程中遍历新节点的props，
  // 如果新节点的props的属性和旧节点的props属性含有一样的属性，但是二者的属性值不相同,那么我们就用setAttribute新建一个属性添加到老节点中，如果二者属性值相同,不做处理. 
  // 不需要考虑覆盖的的情况.只有相同的属性且其属性值也相同才保留,待全部添加完毕后,在旧节点中删除只存在于旧节点props但不存在于新节点props的属性, 剩下的都是patch处理之后的属性了
// 处理children:
// 处理新节点的children需要先判断其类型,然后再进行处理,
  // 如果新节点的children是字符串,那就好办,直接使用innerHTML将字符串赋值给旧节点即可.无需考虑旧节点children的情况
  // 如果新节点的children是数组,就比较麻烦,我们就要依据旧节点的children的类型来进行处理
    // 如果旧节点的children的类型是string, 简简单单,直接清空旧节点的children,然后挂载新节点的children即可(因为已知新节点的children为数组)
    // 旧节点的children也是数组,此时新旧节点的children都是数组. 我们需要先判断新旧节点children的数组长度, 使用长度小的那个数组长度A作为遍历的判断停止条件, 来控制patch(oldchildren, newchildren)的执行次数.
      // A次执行patch(oldchildren, newchildren)执行完之后,剩下的children数组元素就是仅存于一方的children中了, 
      // 如果存在于新节点的children中(即newChildren.length > oldChildren.length),就需要添加到旧节点中,添加方法就是直接遍历然后使用mount()挂载方法
      // 如果存在于旧节点的children中(即newChildren.length < oldChildren.length),就需要删去,删除方法就是直接遍历然后使用removeChild()挂载方法

const patch = (oldNode, newNode) => {
  // 1. 处理tag.
  // 如果标签都不相同,直接获取旧节点标签的父元素,然后使用父元素的removeChild方法删除旧节点的标签,然后添加新的标签即可.
  // 如果标签相同,不用处理,进行下一步即可
  if(oldNode.tag !== newNode.tag) { 
    const oldNodeParent = oldNode.el.parentElement
    oldNodeParent.removeChild(oldNode.el)
    mount(newNode, oldNodeParent)
  } else {
    // 取到el对象.
    const el = newNode.el = oldNode.el
    // 2. 处理props
    const oldProps = oldNode.props || {};
    const newProps = newNode.props || {};
    // 2.1 将新节点的props添加到旧节点的props中,如果二者存在属性相同,但是属性值不相同的情况,就直接在旧节点中新建一个即可
    for(const key in newProps) {
      const oldValue =  oldProps[key]
      const newValue =  newProps[key]
      if(oldValue !== newValue) { // 属性相同,但是属性值不相同
        if(key.startsWith("on")) { // 对事件监听的判断
          el.addEventListener(key.slice(2).toLowerCase(), newValue)
        } else {
          el.setAttribute(key, newValue) // 直接新建一个好了,不使用覆盖的方法
        }
      }
    }
    // 2.2 删除只存在于旧节点props中但是不存在于新节点props中的属性
    for(const key in oldProps) {
      if(key.startsWith("on")) { // 对事件监听的判断
        const value = oldProps[key]
        el.removeEventListener(key.slice(2).toLowerCase(), value)
      }
      if(!(key in newProps)) {
        el.removeAttribute(key)
      }
    }

    // 3.处理children
    const oldChildren = oldNode.children || []
    const newChildren = newNode.children || []
    // 3.1 新节点的children类型是字符串,直接innerHTML方法即可
    if(typeof newChildren === 'string') { // 新节点的children类型是字符串
      // 边界情况
      if(typeof oldChildren === 'string') {
        if(newChildren !== oldChildren) {
          el.textContent = newChildren
        }
      } else {
        el.innerHTML = newChildren
      }
    } else { // 3.2 新节点的children类型是数组
      // 3.2.1 如果旧节点的children的类型是string, 简简单单,直接清空旧节点的children,然后挂载新节点的children即可
      if(typeof oldChildren === 'string') {
        el.innerHTML = ''
        newChildren.forEach(item => {
          mount(item, el)
        })
      } else { // 3.2.2 旧节点的children也是数组,此时新旧节点的children都是数组.我们需要先判断新旧节点children的数组长度, 使用长度小的那个数组长度commonLength作为遍历的判断停止条件, 来控制patch(oldchildren, newchildren)的执行次数
        // 1) commonLength次执行patch(oldchildren, newchildren)执行完之后,剩下的children数组元素就是仅存于一方的children中了, 
        const commonLength = Math.min(oldChildren.length, newChildren.length)
        // 举例测试:
          // oldChildren: [v1, v2, v3, v8, v9]
          // newChildren: [v1, v5, v6]
        for(let i = 0; i < commonLength; i++) {
          patch(oldChildren[i], newChildren[i])
        }

        // 2) 如果存在于新节点的children中(即newChildren.length > oldChildren.length),就需要添加到旧节点中,添加方法就是直接遍历然后使用mount()挂载方法
        if(newChildren.length > oldChildren.length) {
          newChildren.slice(oldChildren.length).forEach(child => {
            mount(child, el)
          })
        }

        // 3) 如果存在于旧节点的children中(即newChildren.length < oldChildren.length),就需要删去,删除方法就是直接遍历然后使用removeChild()挂载方法
        if(newChildren.length < oldChildren.length) {
          oldChildren.slice(newChildren.length).forEach(item => {
            el.removeChild(item.el)
          })
        }
      }
    }
  }

  
}


