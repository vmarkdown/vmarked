# 数据

## 数据模型适配器
在 MINA 中，[动态数据只允许使用可以被转换成 JSON 的格式：字符串、数字、布尔值、对象、数组](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/page.html#初始化数据)。
尽管 Tina.js 本身并不具备扩展 wxml 语言的能力，但借助数据模型适配器 (DataAdapter)，你可以在逻辑层 (JavaScript) 中使用不同的数据类型，比如 React 中常用的 [Immutable.js](https://github.com/facebook/immutable-js)。

> 使用不同的数据模型，是 Tina.js 中一项 **可选** 的功能。你不必马上熟悉这一特性 —— 因为即使使用默认的数据模型，Tina.js 也可以很好地为你工作。

### 使用数据模型适配器
通过 ``adapters.data`` 参数设置页面或组件的数据模型适配器:

```javascript
import { Page } from '@tinajs/tina'

// ... import MyDataAdapter
// ...

Page.define({
  adapters: {
    data: MyDataAdapter,
  },
})
```

或借助混合设置全局数据模型适配器:
```javascript
import { Page, Component } from '@tinajs/tina'

// ... import MyDataAdapter
// ...

const mixin = {
  adapters: {
    data: MyDataAdapter,
  },
}

Page.mixin(mixin)
Component.mixin(mixin)
```

更多关于混合的介绍，请阅读下一章节 —— [混合](/guide/mixin)。

### 编写数据模型适配器
数据模型适配器应继承于 Tina.js 内置的 ``BasicDataAdapter``，并重写以下静态方法：

- isData(object)

  接收一个 object, 返回 object 是否为期望的数据模型。

- fromPlainObject(plain)

  接受一个可转换为 JSON 的对象，返回一个经期望数据模型封装的实例。

- merge(original, extra)

  接受两个期望数据模型实例，返回后者浅合并入前者的新实例。

- diff(original, extra)

  接受两个期望数据模型实例，返回前者中相比后者不同部分的新实例。

- toPlainObject(data)

  接受一个期望数据模型实例，返回一个可以转换为 JSON 的对象

你可以查看 [Tina.js 集成的数据模型适配器源码](https://github.com/tinajs/tina/tree/master/src/adapters/data)，参考更多关于编写数据模型适配器的细节。


## 不可变数据
在小程序开发中，[应尽量避免直接修改 ``this.data``](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/page.html#pageprototypesetdata)。

大多数情况下，你可以使用 ``Object.assign`` 或者 [ES2015 - Spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator)：

**Object.assign:**
```html
<template>
  <view>
    <text>Hi {{ user.name }}!</text>
  </view>
</template>

<script>
import { Page } from '@tinajs/tina'

Page.define({
  data: {
    user: {
      name: 'yoga',
    },
  },
  methods: {
    rename (name) {
      this.setData({
        user: Object.assign({}, this.data.user, {
          name,
        })
      })
    },
  },
  // ...
})
</script>
```

**ES2015 - Spread operator:**
```javascript
// ...
    rename (name) {
      this.setData({
        user: { ...this.data.user, { name } }
      })
    },
// ...
```

但在面对复杂的数据结构时，也许便是时候考虑如何更简洁地更新数据了：

```html
<template>
  <view>
    <view wx:for="{{ user.devices }}" wx:for-item="device">
      <view wx:for="{{ device.buttons }}" wx:for-item="button">
        <view>{{ button.label }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import { Page } from '@tinajs/tina'

Page.define({
  data: {
    user: {
      devices: [
        {
          buttons: [
            {
              label: 'keep calm',
            },
            {
              label: 'git commit',
            },
            {
              label: 'run',
            },
          ],
        },
      ],
    },
  },
  methods: {
    fix () {
      this.setData({
        user: {
          ...this.data.user, {
            devices: [
              {
                ...this.data.user.devices[0],
                {
                  buttons: [
                    ...this.data.user.devices[0].buttons.slice(0, 2),
                    {
                      ...this.data.user.devices[0].buttons[2],
                      {
                        label: 'git push',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      })
    },
  },
  // ...
})
</script>
```

<del>这样的操作令人窒息。</del>

你可以引入一些工具简化这一操作，比如使用 [immutability-helper](https://github.com/kolodny/immutability-helper):
```javascript
// ...
import update from 'immutability-helper'
// ...
    fix () {
      this.setData({
        user: update(this.data.user, {
          devices: {
            0: {
              buttons: {
                2: {
                  label: { $set: 'git push' },
                },
              },
            },
          },
        }),
      })
    },
// ...
```

或者借助 [tina-immutable](https://github.com/tinajs/tina-immutable) 插件提供的 ImmutableDataAdapter，在基于 Tina.js 驱动的项目中使用 [Immutable.js](https://github.com/facebook/immutable-js):
```javascript
/**
 * app.js or <script> in app.mina
 */
import Tina from '@tinajs/tina'
import ImmutablePlugin from '@tinajs/tina-immutable'

Tina.use(ImmutablePlugin)
// ...
```

```javascript
// ...
    fix () {
      this.setData({
        user: this.data.get('user').setIn(['devices', 0, 'buttons', 2, 'label'], 'git push'),
      })
    },
// ...
```

代码是不是变得清爽了？

> 你可以通过查看 [tina-immutable](https://github.com/tinajs/tina-immutable) 及其 [示例](https://github.com/tinajs/tina-immutable/tree/master/example)，更深入地了解如何在 Tina.js 中使用 Immutable.js。

## 性能优化
就目前的小程序基础库版本 (1.9.0) 而言，其实直接修改 ``this.data`` 并不是完全严格被禁止的操作 —— 虽然某些情况下会造成视图 (View Thread) 的数据与逻辑层 (AppService Thread) 的不一致，但只要你将改变后的数据放入 ``setData`` 中执行，数据还是会重新向视图同步。

!> 但即便如此，我们还是建议你不要直接修改 ``this.data`` —— 因为这是一个行为不明确的反模式的操作。

为了兼容上述在 MINA 中直接修改 ``this.data`` 的特殊用例，在 Tina.js 中，``setData`` 的默认去重算法便无法简单地只做浅比较 —— 这也就给更新数据带来了不必要的性能损耗。

> Tina.js 默认使用 SigmundData 数据模型封装 data —— 一个基于 [isaacs/sigmund](https://github.com/isaacs/sigmund)，通过对数据签名实现脏检查的数据模型；其检查效率高于深对比，但代价是牺牲了少数场景下的准确度。

如果你严格地保持以不可变数据看待 ``this.data``，不直接对其进行修改，那么你还可以选择将数据模型适配器设置为 Tina.js 集成的 PlainDataAdapter —— 让去重算法仅做简单的浅比较，从而提高性能 ：

```javascript
// ...
import { Page, PlainDataAdapter } from '@tinajs/tina'

Page.define({
  // ...
  adatpers: {
    data: PlainDataAdapter,
  },
})
// ...
```

## 为什么不是 setData({ [path]: value })
在 MINA 中，``setData`` 方法中的 [key 支持使用数据路径](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/page.html#setdata-参数格式)，如 ``array[2].message``。虽然这样的设计同样可以简化更新复杂数据结构的操作，但 Tina.js 中默认并不支持这一方法。原因主要是：

1. ``setData({ [path]: value })`` 的 API 设计稍显粗暴，不容易被代理（重新实现），同时也隐含了 ``data`` 中 key 不能含 ``.`` 和 ``[]`` 的副作用。如果是类似 ``setData(path, value)`` 的重载设计，则更为优雅和更容易被接受。
2. 在复杂项目中，经常需要引入如 Redux 的全局状态管理器；在这种情况下，更新数据的操作大多发生在全局状态管理器，而非页面和组件中，这时仅依靠 ``setData`` 便稍显无力。相反，直接使用 **immutability-helper**、**Immutable.js** 或者类似的工具，则可以满足所有场景。


# 包管理和构建工具
在传统小程序项目中，如果想使用第三方库，开发者必须先手动地将文件拷贝进项目。相比现代的 web 前端开发，这种刀耕火种的方式一方面增加了复杂项目的工作量，另一方面也使得第三方独立组件难以传播和应用。

于是，结合上一章节的单文件组件，我们也准备了一套使用 webpack 开发小程序的工具链 —— [mina-webpack](https://github.com/tinajs/mina-webpack)。

> mina-webpack 在 [wxapp-boilerplate](https://github.com/cantonjs/wxapp-boilerplate) 和 [wxapp-webpack-plugin](https://github.com/Cap32/wxapp-webpack-plugin) 当中得到了大量启发。如果你不喜欢单文件组件的想法，也不妨试试以上两个了不起的项目。

引入 webpack 之后，我们的小程序项目获得了这些能力：
- 不受环境限制的 es2015+
- 使用 npm 包
- mina 单文件组件
- 文件预处理器
- 代码混淆 / 压缩
- 以及更多 Webpack 附带的功能

## 使用项目模板
如果你已经等不及了，使用 [template-mina](https://github.com/tinajs/template-mina) 项目模板可以帮助你快速地搭建好基于 mina-webpack 的小程序项目：

```bash
npm i -g sao

sao mina my-app
cd my-app
```

然后便可以 [安装 Tina](guide/installation?id=webpack) 并开始开发：

```bash
npm i --save @tinajs/tina
npm start
```

> 编译生产环境版本时，请使用 ``npm run build``。

## 与预处理器一起工作
**mina-loader** 是 mina-webpack 项目的核心组成部分。除了正常地解析 [mina 单文件组件](/guide/single-file-component) 外，mina-loader 还支持与其他预处理器一起工作。

比如我们常使用 Babel 预处理 ``<script>`` 部块，并使用 PostCSS 预处理 ``<style>``:

```javascript
// ... webpack.config.js
      {
        test: /\.mina$/,
        use: [{
          loader: '@tinajs/mina-loader',
          options: {
            loaders: {
              script: 'babel-loader',
              style: 'postcss-loader',
            },
          },
        }],
      },
// ...
```

你可以设置 loader 的自定义选项 (options)，格式与 webpack 中的 [Rule.use](https://webpack.js.org/configuration/module/#rule-use) 一致：

```javascript
// ... webpack.config.js
      {
        test: /\.mina$/,
        use: [{
          loader: '@tinajs/mina-loader',
          options: {
            loaders: {
              script: 'babel-loader',
              style: {
                loader: 'postcss-loader',
                options: {
                  config: {
                    path: __dirname + '/postcss.config.js',
                  },
                },
              },
            },
          },
        }],
      },
// ...
```

当然，得益于 webpack 成熟的社区，你同样可以自由地选择任何其它 loaders，比如 Buble、Less：

```javascript
// ... webpack.config.js
      {
        test: /\.mina$/,
        use: [{
          loader: '@tinajs/mina-loader',
          options: {
            loaders: {
              script: 'buble-loader',
              style: 'less-loader',
            },
          },
        }],
      },
// ...
```

## 了解更多
除了 mina-loader，mina-webpack 中还包含两个 webpack 插件。如果你感兴趣，同样欢迎访问 [项目仓库](https://github.com/tinajs/mina-webpack/) 了解更多信息。


# 页面

## 基础
Tina 高度保持了传统小程序 (MINA) 页面原有的设计，并在其身上附加了新的能力。有关 MINA 页面的基本介绍，请查阅微信官方的文档 ——
[MINA - 注册页面](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/page.html)。

## 定义一个新页面
在使用 Tina 定义一个新的页面时，与 MINA 并没有太大的区别：

**传统小程序 (MINA) 项目：**
```javascript
/*
 * /demo-page.js
 */
Page({
  data: {
    count: 0,
  },
  onLoad () {
    console.log(this.data.count)
  },
  handleTapButton () {
    console.log(this.data.count)
  },
})
```

**使用 Tina 的项目**：
```javascript
/**
  * /demo-page.js or <script> in demo-page.mina
  */
import { Page } from '@tinajs/tina'

Page.define({
  data: {
    count: 0,
  },
  onLoad () {
    console.log(this.data.count)
  },
  methods: {
    handleTapButton () {
      console.log(this.data.count)
    },
  },
})
```

**对比：**
```diff
@@ -1,11 +1,15 @@
-Page({
+import { Page } from '@tinajs/tina'
+
+Page.define({
   data: {
     count: 0,
   },
   onLoad () {
     console.log(this.data.count)
   },
-  handleTapButton () {
-    console.log(this.data.count)
+  methods: {
+    handleTapButton () {
+      console.log(this.data.count)
+    },
   },
 })
```

## 更新数据
与使用 MINA 一样，你可以在页面实例中调用 ``this.setData(data)`` 更新数据。

除此以外，由于 MINA 限制了每次 setData 的数据量 —— [单次设置的数据不能超过 1024kB](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/page.html#pageprototypesetdata)，所以在 Tina 的内部，传入 ``setData`` 的数据都会自动经过 *diff* 处理，以助减轻数据传至 MINA 时的大小。

## 方法
Tina 将页面实例的方法折叠进了 ``methods`` 参数中，而这也是 Tina 和 MINA 在定义页面时传参的最大区别。

## 生命周期 / 页面事件
Tina Page 保持了 MINA Page 的所有生命周期和页面事件，并额外增加 ``beforeLoad`` 钩子，即：

- 生命周期钩子
  - **beforeLoad**
  - onLoad
  - onReady
  - onShow
  - onHide
  - onUnload
- 页面事件
  - onPullDownRefresh
  - onReachBottom
  - onShareAppMessage
  - onPageScroll

!> ``beforeLoad`` 钩子主要用于注入一般扩展的加载函数，并约定在该钩子的处理函数中不应访问 ``this.data`` 或调用 ``this.setData()`` 操作数据。

## 计算属性
MINA 的 wxml 语言提供了 [简单的表达式运算能力](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/view/wxml/data.html#运算)，但冗长的表达式和过于简单的运算能力往往也无法满足项目的实际需求。

为此，Tina Page 中集成了计算属性的能力。

### 示例
```html
<template>
  <view>Today: {{ today }}</view>
</template>

<script>
import { Page } from '@tinajs/tina'
import fecha from 'fecha'

Page.define({
  data: {
    now: new Date(),
  },
  compute ({ now }) {
    return {
      today: fecha.format(now, 'YYYY-MM-DD'),
    }
  },
  onLoad () {
    console.log(this.data.today)
  },
})
</script>
```

通过 ``compute(data)`` 方法计算返回的值，将被合并入实例的 ``data`` 属性中。你可以在模板或者实例方法中通过读取 ``data`` 使用。


## getCurrentPages
当使用 Tina 后，你依旧可以通过小程序自身暴露的全局 API [`getCurrentPages()`](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html#getcurrentpages) 获取当前页面栈。
但需要注意的是，该 API 返回的页面栈并非 `Tina.Page.define(...)` 中的实例，这可能会让你感到困扰；因此我们也提供了与之相应的 `getCurrentPages()` API，帮助你访问 **当前通过 Tina Page 构造的页面栈** ：

```javascript
/**
 * 从 `@tinajs/tina` 中引入 `getCurrentPages`，而非直接使用全局暴露的 API
 */
import { Page, getCurrentPages } from '@tinajs/tina'

Page.define({
  onLoad () {
    console.log(getCurrentPages())
  },
})
```

> 但通常来说，对于跨页面操作数据的场景，我们更推荐你使用 [全局状态管理器](/guide/state-management)。


## 为什么是 Page.define
*为什么是 ``Page.define()``，而不是 ``Page()`` 或 ``new Page()`` ？*

因为在调用微信小程序中集成的 ``Page()`` 方法时，其实际的作用是 **定义/声明/注册一个页面** ，而非创建一个页面实例。由于首字母大写的命名，容易与 ``new Page()`` 混淆。所以在 tina 中，该行为的方法名被明确为 ``Page.define()``。

> 当然，在这个问题上还有更高明的设计，例如 [Vue SFC](https://vuejs.org/v2/guide/single-file-components.html) 中的 ``module.exports = ...`` :wink:。




# 插件
为了让你能够更轻松地使用扩展功能，Tina 提供了一套与 [**Vue** 相似的](https://cn.vuejs.org/v2/guide/plugins.html) 插件机制。

## 安装插件
使用 ``Tina.use`` 方法安装指定插件：

```javascript
/**
 * /app.js or <script> in /app.mina
 */
import Tina from '@tinajs/tina'
import loading from '@tinajs/tina-loading'
import modal from '@tinajs/tina-modal'

Tina.use(loading)
Tina.use(modal, { alertTitle: 'Hey!' })

App({
  // ...
})
```

在重复安装相同插件时，``Tina.use`` 将保证插件只被安装一次。


## 开发插件
与 [Vue 的插件机制](https://cn.vuejs.org/v2/guide/plugins.html#开发插件) 类似，Tina.js 插件的范围没有任何限制。例如你可以在插件中使用 [混合](/guide/mixin)、扩展新的 [数据模型适配器](/guide/data?数据模型适配器)，或者直接添加全局属性、方法。

我们约定 Tina 的插件对象应实现 ``install`` 方法。该方法接受第一个参数是 ``Tina`` 类，你可以从中访问 ``Page``、``Component`` 等变量；剩余参数均为可选，并与用户调用 ``Tina.use`` 时第二个起的所有参数一致。

例如：
```javascript
/**
 * /libraries/my-plugin.js
 */
const MyPlugin = {
  // ...
}

MyPlugin.install = function (Tina, options) {
  const { Page, Component } = Tina

  /**
   * 使用混合
   */

  Page.mixin({
    // ...
  })

  Component.mixin({
    // ...
  })
}

export default MyPlugin
```

```javascript
/**
 * /app.js or <script> in /app.min
 */
import Tina from '@tinajs/tina'
import MyPlugin from './libraries/my-plugin'

const options = {
  // ...
}

Tina.use(MyPlugin, options)

App({
  // ...
})
```

## 推荐使用的扩展
基于 Tina.js 灵活的插件能力，我们为你准备好了 [<i class="iconfont icon-crown"></i>几款 Tina.js 的扩展模块](/guide/state-management) 。你现在就可以开始在实际项目中使用它们；或者也可以从中参考源代码，了解更多编写混合、插件的细节。






# 路由增强
微信官方小程序框架 (MINA) 中集成了基础的 [路由功能](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/route.html)。在 Tina 中，你可以毫无疑问地直接使用官方接口，同时也可以借助插件扩展这一能力。

## tina-router
我们推荐使用 [@tinajs/tina-router](https://github.com/tinajs/tina-router) 库。在安装 **tina-router** 后，你将可以在页面或组件的实例中更优雅地读取和使用路由。

```javascript
/**
 * /app.js or <script> in /app.mina
 */
import Tina from '@tinajs/tina'
import router from '@tinajs/tina-router'

Tina.use(router)
```

```javascript
/**
 * /pages/user.js or <script> in /pages/user.mina
 *
 * 当前路径: /pages/user?id=4310
 */
import { Page } from '@tinajs/tina'
import { api } from '../api'

Page.define({
  onLoad () {
    api.fetchUser({ id: this.$route.query.id }).then((data) => this.setData(data))
  },
  methods: {
    toLogin () {
      this.$router.navigate(`/pages/login?from=${this.$route.fullPath}`)
    },
  }
})
```

> [查看完整的示例项目 —— tina-hackernews](https://github.com/imyelo/tina-hackernews)


如果你对 tina-router 感兴趣，欢迎访问 [@tinajs/tina-router](https://github.com/tinajs/tina-router) 了解更多信息。

或者你有更好的路由扩展，也欢迎提交 [Pull Request](https://github.com/tinajs/tina/pulls) 告诉我们。














# 单文件组件
在传统小程序项目中，一个页面或组件 [由多个文件名相同而后缀类型不同的文件组成](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/config.html#pages) 。虽然这样的设定足以应对一般项目的需要，但在开发和维护的过程中，繁琐的操作还是显得十分麻烦。如果我们拥有一个类似 [Vue.js - 单文件组件](https://cn.vuejs.org/v2/guide/single-file-components.html) 的模式，便可以更优雅地管理小程序项目中的文件，也可以更轻松地分享独立组件。

基于这样的想法，我们定义了 Mina 文件 (``.mina``)。

!> 虽然我们统称为 **单文件组件**，但一个 Mina 文件除了可以是小程序概念中的 **组件** 以外，也可以是 **页面**。

> 关于 *单文件组件* 和 *分离多个独立文件* 两种模式间的权衡，推荐阅读 [Vue.js - 怎么看待关注点分离](https://cn.vuejs.org/v2/guide/single-file-components.html#怎么看待关注点分离？) 。


## 文件结构
一个 Mina 文件由四个部块组成：

- **config** : 对应 ``${basename}.json``
- **template** : 对应 ``${basename}.wxml``
- **script** : 对应 ``${basename}.js``
- **style** : 对应 ``${basename}.wxss``

编写格式与 ``.vue`` 类似，例如以下示例：
```html
<config>
{
  "component": true,
  "usingComponents": {
    "logo": "./logo.mina"
  }
}
</config>

<template>
  <view>
    <view wx:if="{{ isLoading }}" class="loading">
      Loading...
    </view>
    <logo />
  </view>
</template>

<script>
import { Component } from '@tinajs/tina'

Component.define({
  properties: {
    isLoading: {
      type: Boolean,
      value: false,
    },
  },
})
</script>

<style>
.loading {
  font-size: 12px;
}
</style>
```

## 页面和组件引用
小程序中规定，[全局配置的 ``pages`` 项](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/config.html#pages) 决定了项目应引用哪些页面；在页面或组件中，[设置配置项 ``usingComponents``](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/custom-component/#使用自定义组件) 则声明了应引用哪些组件。

通过观察示例，我们不难发现 Mina 文件的 ``config`` 部块延续了以上设定；但与传统小程序规则不同的是，我们还约定文件路径 **不应省略文件后缀**。

也就是说，除了 ``.mina``，你也可以根据你的喜好，在你的项目中自由地使用其他后缀名编写 Mina 文件，比如 ``.wx``、``.page``、``.component`` 等。

> 得益于这一设定的改变，使用 Mina 单文件组件格式，你可以更加轻松地引用 NPM 上的独立组件。

### 从 NPM 引用独立组件
由于 ``config`` 部块里的无前缀路径 (如 ``"components/spinner"``) 在原小程序框架中代表相对路径，所以我们在不破坏其原设定的基础上，额外约定使用 ``~`` 前缀表示引用 *node_modules* 中的独立组件（或页面）。

比如引入 [@tinajs/tina-logo.mina](https://www.npmjs.com/package/@tinajs/tina-logo.mina)：

```html
<config>
{
  "usingComponents": {
    "tina-logo": "~@tinajs/tina-logo.mina"
  }
}
</config>
```

[查看从 NPM 引用独立组件的示例](https://github.com/tinajs/tina-examples/tree/master/packages/counter)

### 引用组件的所有路径规则
| 路径前缀 |              含义              |      示例 (假定当前文件为 ``/cabin/page.mina``)      |
| -------- | ------------------------------ | ---------------------------------------------------- |
| *无*     | 从当前目录开始的相对路径       | ``octocat.mina`` -> ``/cabin/octocat.mina``          |
| ``./``   | 从当前目录开始的相对路径       | ``./octocat.mina`` -> ``/cabin/octocat.mina``        |
| ``../``  | 从上级目录开始的相对路径       | ``../octocat.mina`` -> ``/octocat.mina``             |
| ``/``    | 从应用根目录开始的绝对路径     | ``/octocat.mina`` -> ``/octocat.mina``               |
| ``~``    | 从 node_modules 开始的绝对路径 | ``~octocat-mina`` -> ``(node_modules/)octocat-mina`` |

## 预处理器
与 Vue.js 不同，Mina 文件没有内置预处理器。但借助 webpack 或 gulp 等构建工具，你可以更加灵活地处理文件中的各个部块。

> 对于一般项目的构建，推荐使用 [mina-webpack](https://github.com/tinajs/mina-webpack) ；而对于构建独立组件库，则推荐使用 [gulp-mina](https://github.com/tinajs/gulp-mina)。

我们将在下一章节为你介绍更多关于在项目中使用构建工具的细节。

## 语法高亮
在编辑器中，目前建议借助 **Vue** 的插件实现语法高亮功能。

例如在 VSCode 中：
1. 安装 [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur)
2. 打开 Mina 文件 (``.mina``)
3. 按下 ``Ctrl+K``, ``M``
4. 弹出菜单中选择 ``".mina"的配置文件关联``
5. 弹出菜单中选择 ``Vue``。

由于使用的是 **Vue** 的插件，你可以为文件中的部块设置 ``lang`` 属性，进一步高亮预处理器语法（虽然这一属性并不会在构建时产生实质作用）：

```html
...
<style lang="less">
.container {
  .content {
    font-size: 12px;
  }
}
</style>
```

你还可以通过配置 Vetur 的 [``vetur.grammar.customBlocks``](https://vuejs.github.io/vetur/highlighting.html#custom-block) 为 ``<config>`` 部块也设置语法高亮：

1. 在 VSCode 中按下 ``Ctrl+,`` 打开用户设置 (User Settings)
2. 在用户设置中追加如下配置并保存

  ```json
  "vetur.grammar.customBlocks": {
      "config": "json"
  }
  ```

3. 通过 ``Ctrl+Shift+P`` 唤起命令面板，执行 ``Vetur: Generate grammar from vetur.grammar.customBlocks``
4. 通过 ``Ctrl+Shift+P`` 唤起命令面板，执行 ``Reload Window``，或直接重启 VSCode









# 状态管理

在构建复杂应用时，随着页面和组件的增加，维护跨组件 (或页面) 状态的复杂度也会快速地增长。在 web 前端领域，解决该难题的常见思路是使用由 Facebook 提出的 [Flux 架构](https://facebook.github.io/flux/)；具体到 [React](https://reactjs.org/) 和 [Vue](https://vuejs.org) 中，则分别主流使用 [Redux](https://redux.js.org/) 和 [Vuex](https://vuex.vuejs.org/) 作为其 Flux 实现。

## Redux
> You can use Redux together with React, or with any other view library.
>
> —— https://redux.js.org/

没错！Redux 当然可以与 Tina.js 一起使用。

我们建议你首先阅读 [Redux 官方文档](https://cn.redux.js.org/)，了解 Redux 中的概念以及基础的使用方法。如果你在以往的 Web 项目中已经使用过 Redux 就更好了！

在 Tina.js 中，编写和组织 Action、Reducer、Store 的方式与一般 Web 项目并无差异；剩余需要做的，只是使用 [tina-redux](https://github.com/tinajs/tina-redux) 代理 store，并通过 [Mixin](/guide/mixin) 的方式将 Redux 绑定到 Page 或 Component 上：

```javascript
/**
 * /store.js
 */
import { createStore } from 'redux'
import todoApp from './reducers'
import TinaRedux from '@tinajs/tina-redux'

let reduxStore = createStore(todoApp)

let store = new TinaRedux(reduxStore)

export default store
```

```javascript
/**
 * /pages/home.js or <script> in /page/home.mina
 */
import { Page } from '@tinajs/tina'
import { addTodo, setVisibilityFilter } from '../actions'
import store from '../store'

const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'SHOW_COMPLETED':
      return todos.filter(t => t.completed)
    case 'SHOW_ACTIVE':
      return todos.filter(t => !t.completed)
    case 'SHOW_ALL':
    default:
      return todos
  }
}

function mapState (state) {
  return {
    todos: state.todos,
    filter: state.visibilityFilter,
    filtered: getVisibleTodos(state.todos, state.visibilityFilter),
  }
}
function mapDispatch (dispatch) {
  return {
    tapFilter (event) {
      dispatch(setVisibilityFilter(event.currentTarget.dataset.filter))
    },
    addTodo (event) {
      dispatch(addTodo(event.detail.value))
      this.setData({
        input: '',
      })
    },
  }
}

Page.define({
  mixins: [store.connect(mapState, mapDispatch)],
  data: {},
  methods: {
    clear () {
      this.$dispatch({ type: 'CLEAR_COMPLETED_TODOS' })
    }
  },
})
```

[查看完整的示例](https://github.com/tinajs/tina-redux/tree/master/example)。

### 参考更多关于 Tina-Redux 的资料
- [tina-redux 仓库](https://github.com/tinajs/tina-redux)
- [对比 Redux 在 React 中的示例](http://cn.redux.js.org/docs/basics/ExampleTodoList.html)
- [查看在 Tina.js 中同时使用 Redux 和 Immutable.js 的示例](https://github.com/tinajs/tina-examples/tree/master/packages/todomvc-lite-redux-immutable)。

## Tinax
如果你不喜欢 Redux，并且更喜爱 Vuex 的设计，我们则推荐使用 [Tinax](https://github.com/tinajs/tinax) 作为你的状态管理器。

尽管 Tinax 的 API 与 Vuex 并不完全一致，但毫无疑问 Tinax 受到了 Vuex 的启发，并学习了 Vuex 的核心概念 —— ``state``, ``getter``, ``mutation``, ``action``, ``module``；如果你还没有使用过 Vuex，在此建议你先了解 [Vuex 的核心概念](https://vuex.vuejs.org/zh-cn/core-concepts.html)。

示例：

```javascript
/**
 * /store/session.js
 */

import types from '../types'
import api from '../../api'

const initialState = {
  expiredAt: null,
}

const getters = {
  isExpired: (state) => state.expiredAt < Date.now(),
}

const actions = {
  fetchSession ({ commit, state }, { key }) {
    api.fetchSession(key).then((session) => commit(types.SET_SESSION, { session }))
  },
}

const mutations = {
  [types.SET_SESSION] (state, { session }) {
    return session
  },
}

export default {
  state: initialState,
  getters,
  actions,
  mutations,
}
```

```javascript
/**
 * /demo-page.js or <script> in /demo-page.mina
 */

import { Page } from '@tinajs/tina'
import { store } from './store'

Page.define({
  mixins: [
    store.connect({
      getters (getters) {
        return {
          isExpired: getters.isExpired(),
        }
      },
      actions ({ fetchSession }) {
        return {
          fetchSession,
        }
      },
    }),
  ],
  onLoad () {
    console.log(this.data.isExpired)
    this.fetchSession()
  },
})
```

> [查看完整的示例项目 —— tina-hackernews](https://github.com/imyelo/tina-hackernews)

如果你对 Tinax 感兴趣，欢迎访问 [@tinajs/tinax](https://github.com/tinajs/tinax) 了解更多信息。

## 更多状态管理扩展
你有更好的状态管理扩展，也欢迎提交 [Pull Request](https://github.com/tinajs/tina/pulls) 告诉我们。








# 界面反馈
得益于插件和混合能力，我们为你准备了常用的几种界面反馈插件。

## 弹窗
基于微信官方的接口 (``showModal``、``hideModal``)，[tina-modal](https://github.com/tinajs/tina-modal) 提供了使用方便的 Promise 风格的 ``alert``、``confirm`` 方法。

```javascript
/**
 * /app.js or <script> in /app.mina
 */
import Tina from '@tinajs/tina'
import modal from '@tinajs/tina-modal'

Tina.use(modal)
```

```javascript
/**
 * /demo-page.js or <script> in /demo-page.mina
 */
import { Page } from '@tinajs/tina'

Page.define({
  onLoad () {
    this.$confirm({ content: 'say hi?' })
      .then(() => this.$alert({ content: 'hi' }))
  },
})
```

!> 如果你不喜欢这样的设计，除了直接调用微信官方的接口外，使用 [wxio](https://github.com/imyelo/wxio) 也是一个不错的选择。

> [查看完整的示例项目 —— tina-hackernews](https://github.com/imyelo/tina-hackernews)

如果你对 tina-modal 感兴趣，欢迎访问 [@tinajs/tina-modal](https://github.com/tinajs/tina-modal) 了解更多信息。

## 加载状态
微信官方的接口提供了两种反馈加载状态的方式：``show (hide) Loading`` (强反馈) 和 ``show (hide) NavigationBarLoading`` (弱反馈)。使用 [tina-loading](https://github.com/tinajs/tina-loading) 并结合 ``Promise.prototype.finally``，可以很轻松地管理 ``NavigationBarLoading``。


```javascript
/**
 * /app.js or <script> in /app.mina
 */
import Tina from '@tinajs/tina'
import { loading } from '@tinajs/tina-loading'

Tina.use(loading)
```

```javascript
/**
 * /demo-page.js or <script> in /demo-page.mina
 */
import { Page } from '@tinajs/tina'
import { fetchData } from './api'
Page.define({
  methods: {
    usageA () {
      fetchData()
        .then((data) => {
          // ...balabala
        })
        .finally(this.$loading())
      },
    async usageB () {
      this.$loading.push()
      try {
        const data = await fetchData()
        // ...balabala
      } catch () {}
      this.$loading.pop()
    },
  },
})
```

> [查看完整的示例项目 —— tina-hackernews](https://github.com/imyelo/tina-hackernews)

如果你对 tina-loading 感兴趣，欢迎访问 [@tinajs/tina-loading](https://github.com/tinajs/tina-loading) 了解更多信息。

## 更多界面反馈扩展
或者你有更好的界面反馈扩展，也欢迎提交 [Pull Request](https://github.com/tinajs/tina/pulls) 告诉我们。



本期精读的文章是：[best practices for modals overlays dialog windows](https://uxplanet.org/best-practices-for-modals-overlays-dialog-windows-c00c66cddd8c)。

# 1 引言

<img src="assets/2/modal.png" alt="logo" width="500" />

我为什么要选这篇文章呢？

1. 前端工程师今天在外界是怎么定位的。很多人以为前端都应该讨论架构层面的问题，其实不仅仅在此，我们不应该忽视交互体验这件事。
2. 对于用户体验的追求前端工程师从来没有停止过，而模态框在产品中的出现出现过很多争议，我想知道我们是怎么思考这件事的。

# 2 内容概要

来自 Wikipedia 的定义：模态框是一个定位于应用视窗定层的元素。它创造了一种模式让自身保持在一个最外层的子视察下显示，并让主视窗失效。用户必须在回到主视窗前在它上面做交互动作。

**模态框用处**

- 抓住用户的吸引力
- 需要用户输入
- 在上下文下显示额外的信息
- 不在上下文下显示额外的信息

不要用模态框显示错误、成功或警告的信息。保持它们在页面上。

**模态框的组成**

- 退出的方式。可以是模态框上的一个按钮，可以是键盘上的一个按键，也可以是模态框外的区域。
- 描述性的标题。标题其实给了用户一个上下文信息。让用户知道他现在在哪个位置作操作。
- 按钮的内容。它一定要是可行动的，可以理解的。不要试图让按钮的内容让用户迷惑，如果你尝试做一个取消动作，但框内有一个取消的按钮，那么我是要取消一个取消呢，还是继续我的取消。
- 大小与位置。模态框的大小不要太大或太小，不应该。模态框的位置建议在视窗中间偏上的位置，因为在移动端如果太低的话会失去很多信息。
- 焦点。模态框的出现一定要吸引你的注意力，建议键盘的焦点也切换到框内。
- 用户发起。不要对用户造成惊吓。用用户的动作，比如一个按钮的点击来触发模态框的出现。

**模态框在移动端**

模态框在移动端总是不是玩转得很好。其中一个原因是一般来说模态框都太大了，占用了太多空间。建议增加设备的按键或内置的滚动条来操作，用户可以左移或放大缩小来抓住模态框。

**无障碍访问**

1. 快捷键。我们应该考虑在打开，移动，管理焦点和关闭时增加对模态框的快捷键。
2. ARIA。在前端代码层面加上 aria 的标识，如 Role = “dialog” , aria-hidden, aria-label

# 3 精读

### 模态框定位

首先，Model 与 Toast、Notification、Message 以及 Popover 都会在某个时间点被触发弹出一个浮层，但与 Modal（模态框）还是有所不同的。定义上看，上述组件都不属于模态框，因为模态框有一个重要的特性，即阻塞原来主视窗下的操作，只能在框内作后续动作。也就是说模态框从界面上彻底打断了用户心流。

当然，这也是我们需要讨论的问题，如果只是一般的消息提醒，可以用信息条、小红点等交互形式，至少是不阻塞用户操作的。在原文末引用的 10 Guidelines to Consider when using Overlays 一文中，第 8 条强调了模态框不到万不得以不应该使用。这时我们应该思考什么情况下你非常希望他不要离开页面，来读框内的信息或作操作呢？

反过来说，模态框有什么优点呢？要知道比起页面跳转来说，模态框的体验还是要轻量的多。例如，用户在淘宝上看中了一款商品，想登陆购买，此时弹出登陆模态框的体验就要远远好于跳转到登陆页面，因为用户在模态框中登陆后，就可以直接购买了。其次，模态框的内容对于当前页面来说是一种衍生或补充，可以让用户更为专注去阅读或者填写一些内容。

也就是说，当我们设计好模态框出现的时机，流畅的弹出体验，必要的上下文信息，以及友好的退出反馈，还是完全可以提升体验的。模态框的目的在于吸引注意，但一定需要提供额外的信息，或是一个重要的用户操作，或是一份重要的协议确认。在本页面即可完成流程或信息告知。

### 合理的使用模态框

我们也总结了一些经验，更好地使用模态框。

- 内容是否相关。模态框是作为当前页面的一种衍生或补充，如果其内容与当前内容毫不相干，那么可以使用其他操作（如新页面跳转）来替代模态框；
- 模态框内部应该避免有过多的操作。模态框应该给用户一种看完即走，而且走的流畅潇洒的感觉，而不是利用繁杂的交互留住或牵制住用户；
- 避免出现一个以上的模态框。出现多个模态框会加深了产品的垂直深度，提高了视觉复杂度，而且会让用户烦躁起来；
- 不要突然打开或自动打开模态框，这个操作应该是用户主动触发的；

还有两种根据实际情况来定义：

- 大小。对于模态框的大小应该要有相对严格的限制，如果内容过多导致模态框或页面出现滚动条，一般来说这种体验很糟糕，但如果用于展示一些明细内容，我们可能还是会考虑使用滚动条来做；
- 开启或关闭动画。现在有非常多的设计倾向于用动画完成流畅的过渡，让 Modal 变得不再突兀，[dribble 上有很多相关例子](https://dribbble.com/shots/3206370-Coverage-Modal-Motion-Study)。但在一些围绕数据来做复杂处理的应用中，如 ERP、CRM 产品中用户通常关注点都在一个表单和围绕表单做的一系列操作，页面来回切换或复杂的看似酷炫的动画可能都会影响效率。用户需要的是直截了当的完成操作，这时候可能就不需要动画，用户想要的就是快捷的响应。

举两个例子，Facebook 在这方面给我们很好的 demo，它的分享模态框与主视窗是在同一个位置，给人非常流畅的体验。还看到一个细节，从主视窗到模态框焦点上的字体会变大。对比微博，它就把照片等分享形式直接展示出来，焦点在输入框上时也没有变化。

第二个例子是 Quora，Quora 主页呈现的是 Feed 流，点击标题就会打开一个模态框展示它回答的具体内容，内容里面是带有滚动条的，按 ESC 键就可以关闭。非常流畅的体验。相比较之下知乎首页想要快速看内容得来回切换。

### 可访问性的反思

Accessibility 翻译过来是『无障碍访问』，是对不同终端用户的体验完善。每一个模态框，都要有通过键盘关闭的功能，通常使用ESC键。似乎我们程序员多少总会把我们自我的惯性思维带进实现的产品，尤其是当我们敲着外置的键盘，用着 PC 的时候。

下面的这些问题都是对可访问性的反思：

- 用户可能没有鼠标，或者没有键盘，甚至可能既没有鼠标也没有键盘，只使用的是语音控制？你让这些用户如何退出
- 很多的 Windows PC 都已经获得了很好的触屏支持，而你的网页依旧只支持了键盘跟鼠标？
- 在没有苹果触摸板的地方，横向滚动条是不是一个逆天的设计？
- 在网页里，使用 Command(Ctrl) and +/- 和使用触摸板的缩放事件是两个不同的表现？
- 如果你的终端用户没有好用的触摸板，但是他的确看不清你的网页上的内容。如果他用了前者，你能不能保证你的网页依然能够正常展示内容？

可访问性一直都是产品极其忽视的，在文章的最佳实践最后特别强调了它是怎么做的，对我们这些开发者是很好的督促。

### 模态框代码实现层面

前端开发还是少不了代码层面的实现，**业务代码对于有状态或无状态模态框的使用方式存在普遍问题**。

对有状态模态框来说，很多库会支持 `.show` 直接调用的方式，那么模态框内部渲染逻辑，会在此方法执行时执行，没有什么问题。不过现在流行无状态模态框(Stateless Modal)，模态框的显示与否交由父级组件控制，我们只要将模态框代码预先写好，由外部控制是否显示。

这种无状态模态框的方式，在模态框需要显示复杂逻辑的场景中，会自然将初始化逻辑写在父级，当模态框出现在循环列表中，往往会引发首屏触发 2-30 次模态框初始化运算，而这些运算最佳状态是模态框显示时执行一次，由于模态框同一时间只会出现一个，最次也是首屏初始化一次，但下面看似没问题的代码往往会引发性能危机：

```js
const TdElement = data.map(item => {
  return (
    <Td>
      <Button>详情</Button>
      <Modal show={item.show} />
    </Td>
  )
});
```

上面代码初始化执行了 N 个模态框初始化代码，显然不合适。对于 table 操作列中触发的模态框，所有行都对应一个模态框，通过父级中一个状态变量来控制展示的内容：

```js
class Table extends Component {
  static state = {
    activeItem: null,
  };

  render() {
    const { activeItem } = this.state;

    return (
      <div>
        <Modal show={!!activeItem} data={activeItem} />
      </div>
    );
  }
}
```

这种方案减少了节点数，但是可能会带来的问题是，每次模态框被展示的时候，触发是会是模态框的更新 (componentDidUpdate) 而不是新增。当然结合 table 中操作的特点，我们可以这样优化：

```js
{activeItem ? <Modal show={true} data={activeItem} /> : null}
```

### 补充阅读

# 总结

这篇讲的是最佳实践，而且是 UX 层面的。但我们还是看到一些同学提出了相反的意见，我总结下就是不同的产品或不同的用户带给我们不同的认识。这时候是不是要死守着『最佳实践』呢？这时候，对于产品而言，我们可以采集用户研究的方法去判断，用数据结论代替感官上的结论。

另外，可访问性在这两年时不时会在一些文章中看到，但非常少。这是典型的长尾需求，很多研发在做产品只考虑 90% 的用户，不清楚我们放弃的一部分用户的需求。这是从产品到研发整体的思考的缺失。

**如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。**






本期精读的文章是：[Here's why Client-side Rendering Won](https://medium.freecodecamp.com/heres-why-client-side-rendering-won-46a349fadb52)

# 1 引言

<img src="assets/3/ssr.png" alt="logo" width="500" />

我为什么要选这篇文章呢？

十年前，几乎所有网站都使用 ASP、Java、PHP 这类做后端渲染，但后来随着 jQuery、Angular、React、Vue 等 JS 框架的崛起，开始转向了前端渲染。从 2014 年起又开始流行了同构渲染，号称是未来，集成了前后端渲染的优点，但转眼间三年过去了，很多当时壮心满满的框架（[rendr](https://github.com/rendrjs/rendr)、[Lazo](https://github.com/lazojs/lazo)）从先驱变成了先烈。同构到底是不是未来？自己的项目该如何选型？我想不应该只停留在追求热门和拘泥于固定模式上，忽略了前后端渲染之“争”的“核心点”，关注如何提升“用户体验”。

原文分析了前端渲染的优势，并没有进行深入探讨。我想以它为切入口来深入探讨一下。

> 明确三个概念：「后端渲染」指传统的 ASP、Java 或 PHP 的渲染机制；「前端渲染」指使用 JS 来渲染页面大部分内容，代表是现在流行的 SPA 单页面应用；「同构渲染」指前后端共用 JS，首次渲染时使用 Node.js 来直出 HTML。一般来说同构渲染是介于前后端中的共有部分。

# 2 内容概要

**前端渲染的优势**

- 局部刷新。无需每次都进行完整页面请求
- 懒加载。如在页面初始时只加载可视区域内的数据，滚动后rp加载其它数据，可以通过 react-lazyload 实现
- 富交互。使用 JS 实现各种酷炫效果
- 节约服务器成本。省电省钱，JS 支持 CDN 部署，且部署极其简单，只需要服务器支持静态文件即可
- 天生的关注分离设计。服务器来访问数据库提供接口，JS 只关注数据获取和展现
- JS 一次学习，到处使用。可以用来开发 Web、Serve、Mobile、Desktop 类型的应用

**后端渲染的优势**

- 服务端渲染不需要先下载一堆 js 和 css 后才能看到页面（首屏性能）
- SEO
- 服务端渲染不用关心浏览器兼容性问题（随意浏览器发展，这个优点逐渐消失）
- 对于电量不给力的手机或平板，减少在客户端的电量消耗很重要

以上服务端优势其实只有首屏性能和 SEO 两点比较突出。但现在这两点也慢慢变得微不足道了。React 这类支持同构的框架已经能解决这个问题，尤其是 Next.js 让同构开发变得非常容易。还有静态站点的渲染，但这类应用本身复杂度低，很多前端框架已经能完全囊括。

# 3 精读

本次提出独到观点的同学有：[@javie007](http://link.zhihu.com/?target=https%3A//github.com/javie007) [@杨森](https://www.zhihu.com/people/c93b7957f6308990c7e3b16103c9356b) [@流形](https://www.zhihu.com/people/6c772f9726a914ed4a4b90c88010461c) [@camsong](https://www.zhihu.com/people/078cc0fb15845759ad8295b0f0e50099) [@Turbe Xue](https://www.zhihu.com/people/turbe-xue) [@淡苍](https://www.zhihu.com/people/5ac53c9c0484e83672e1c1716bdf0ff9) [@留影](https://www.zhihu.com/people/38c3c75795824de1bc5d99cff904a832) [@FrankFang](http://link.zhihu.com/?target=https%3A//github.com/FrankFang) [@alcat2008](http://link.zhihu.com/?target=https%3A//github.com/alcat2008) [@xile611](http://link.zhihu.com/?target=https%3A//github.com/xile611) [@twobin](http://link.zhihu.com/?target=https%3A//github.com/twobin) [@黄子毅](https://www.zhihu.com/people/3ec85a04bc9eaa35b1830874cc463a52) 精读由此归纳。

大家对前端和后端渲染的现状基本达成共识。即前端渲染是未来趋势，但前端渲染遇到了首屏性能和SEO的问题。对于同构争议最多，在此我归纳一下。

### 前端渲染遇到的问题

前端渲染主要面临的问题有两个 **SEO**、**首屏性能**。

SEO 很好理解。由于传统的搜索引擎只会从 HTML 中抓取数据，导致前端渲染的页面无法被抓取。前端渲染常使用的 SPA 会把所有 JS 整体打包，无法忽视的问题就是文件太大，导致渲染前等待很长时间。特别是网速差的时候，让用户等待白屏结束并非一个很好的体验。

### 同构的优点

同构恰恰就是为了解决前端渲染遇到的问题才产生的，至 2014 年底伴随着 React 的崛起而被认为是前端框架应具备的一大杀器，以至于当时很多人为了用此特性而[放弃 Angular 1 而转向 React](http://link.zhihu.com/?target=https%3A//blog.risingstack.com/from-angularjs-to-react-the-isomorphic-way/)。然而近3年过去了，很多产品逐渐从全栈同构的理想化逐渐转到首屏或部分同构。让我们再一次思考同构的优点真是优点吗？

1. 有助于 SEO

首先确定你的应用是否都要做 SEO，如果是一个后台应用，那么只要首页做一些静态内容宣导就可以了。如果是内容型的网站，那么可以考虑专门做一些页面给搜索引擎
时到今日，谷歌已经能够可以在爬虫中执行 JS [像浏览器一样理解网页内容](http://link.zhihu.com/?target=https%3A//webmasters.googleblog.com/2014/05/understanding-web-pages-better.html)，只需要往常一样使用 JS 和 CSS 即可。并且尽量使用新规范，使用 pushstate 来替代以前的 hashstate。不同的搜索引擎的爬虫还不一样，要做一些配置的工作，而且可能要经常关注数据，有波动那么可能就需要更新。第二是该做 sitemap 的还得做。相信未来即使是纯前端渲染的页面，爬虫也能很好的解析。

2. 共用前端代码，节省开发时间

其实同构并没有节省前端的开发量，只是把一部分前端代码拿到服务端执行。而且为了同构还要处处兼容 Node.js 不同的执行环境。有额外成本，这也是后面会具体谈到的。

3. 提高首屏性能

由于 SPA 打包生成的 JS 往往都比较大，会导致页面加载后花费很长的时间来解析，也就造成了白屏问题。服务端渲染可以预先使到数据并渲染成最终 HTML 直接展示，理想情况下能避免白屏问题。在我参考过的一些产品中，很多页面需要获取十几个接口的数据，单是数据获取的时候都会花费数秒钟，这样全部使用同构反而会变慢。

### 同构并没有想像中那么美

1. 性能

把原来放在几百万浏览器端的工作拿过来给你几台服务器做，这还是花挺多计算力的。尤其是涉及到图表类需要大量计算的场景。这方面调优，可以参考 [walmart的调优策略](https://medium.com/walmartlabs/reactjs-ssr-profiling-and-caching-5d8e9e49240c)。

个性化的缓存是遇到的另外一个问题。可以把每个用户个性化信息缓存到浏览器，这是一个天生的分布式缓存系统。我们有个数据类应用通过在浏览器合理设置缓存，双十一当天节省了 70% 的请求量。试想如果这些缓存全部放到服务器存储，需要的存储空间和计算都是很非常大。

2. 不容忽视的服务器端和浏览器环境差异

前端代码在编写时并没有过多的考虑后端渲染的情景，因此各种 BOM 对象和 DOM API 都是拿来即用。这从客观层面也增加了同构渲染的难度。我们主要遇到了以下几个问题：

* document 等对象找不到的问题
* DOM 计算报错的问题
* 前端渲染和服务端渲染内容不一致的问题

由于前端代码使用的 `window` 在 node 环境是不存在的，所以要 mock window，其中最重要的是 cookie，userAgent，location。但是由于每个用户访问时是不一样的 `window`，那么就意味着你得每次都更新 `window`。
而服务端由于 js require 的 cache 机制，造成前端代码除了具体渲染部分都只会加载一遍。这时候 `window` 就得不到更新了。所以要引入一个合适的更新机制，比如把读取改成每次用的时候再读取。
```js
export const isSsr = () => (
  !(typeof window !== 'undefined' && window.document && window.document.createElement && window.setTimeout)
);
```
原因是很多 DOM 计算在 SSR 的时候是无法进行的，涉及到 DOM 计算的的内容不可能做到 SSR 和 CSR 完全一致，这种不一致可能会带来页面的闪动。

3. 内存溢出

前端代码由于浏览器环境刷新一遍内存重置的天然优势，对内存溢出的风险并没有考虑充分。
比如在 React 的 `componentWillMount` 里做绑定事件就会发生内存溢出，因为 React 的设计是后端渲染只会运行 `componentDidMount` 之前的操作，而不会运行 `componentWillUnmount` 方法（一般解绑事件在这里）。

4. 异步操作

前端可以做非常复杂的请求合并和延迟处理，但为了同构，所有这些请求都在预先拿到结果才会渲染。而往往这些请求是有很多依赖条件的，很难调和。纯 React 的方式会把这些数据以埋点的方式打到页面上，前端不再发请求，但仍然再渲染一遍来比对数据。造成的结果是流程复杂，大规模使用成本高。幸运的是 Next.js 解决了这一些，后面会谈到。

5. simple store（redux）

这个 store 是必须以字符串形式塞到前端，所以复杂类型是无法转义成字符串的，比如function。

总的来说，同构渲染实施难度大，不够优雅，无论在前端还是服务端，都需要额外改造。

### 首屏优化

再回到前端渲染遇到首屏渲染问题，除了同构就没有其它解法了吗？总结以下可以通过以下三步解决

1. 分拆打包

现在流行的路由库如 react-router 对分拆打包都有很好的支持。可以按照页面对包进行分拆，并在页面切换时加上一些 loading 和 transition 效果。

2. 交互优化

首次渲染的问题可以用更好的交互来解决，先看下 linkedin 的渲染

![Linkin render](https://camo.githubusercontent.com/f3ffed6cb07455f16cf492517537abd05985aac2/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f5442314a6a6b5151705858585858536158585858585858585858582d323535342d313430302e706e67)

![Linkin render](https://camo.githubusercontent.com/58cf0fd1fb24d213d9084c4ed5c4caaa611502c2/68747470733a2f2f696d672e616c6963646e2e636f6d2f7466732f54423169614d4d51705858585858766158585858585858585858582d323535342d313335342e706e67)

有什么感受，非常自然，打开渲染并没有白屏，有两段加载动画，第一段像是加载资源，第二段是一个加载占位器，过去我们会用 loading 效果，但过渡性不好。近年流行 Skeleton Screen 效果。其实就是在白屏无法避免的时候，为了解决等待加载过程中白屏或者界面闪烁造成的割裂感带来的解决方案。

3. 部分同构

部分同构可以降低成功同时利用同构的优点，如把核心的部分如菜单通过同构的方式优先渲染出来。我们现在的做法就是使用同构把菜单和页面骨架渲染出来。给用户提示信息，减少无端的等待时间。

相信有了以上三步之后，首屏问题已经能有很大改观。相对来说体验提升和同构不分伯仲，而且相对来说对原来架构破坏性小，入侵性小。是我比较推崇的方案。

# 3 总结

我们赞成客户端渲染是未来的主要方向，服务端则会专注于在数据和业务处理上的优势。但由于日趋复杂的软硬件环境和用户体验更高的追求，也不能只拘泥于完全的客户端渲染。同构渲染看似美好，但以目前的发展程度来看，在大型项目中还不具有足够的应用价值，但不妨碍部分使用来优化首屏性能。做同构之前 ，一定要考虑到浏览器和服务器的环境差异，站在更高层面考虑。


### 附：Next.js 体验

Next.js 是时下非常流行的基于 React 的同构开发框架。作者之一就是大名鼎鼎的 Socket.io 的作者 [Guillermo Rauch](http://link.zhihu.com/?target=https%3A//github.com/rauchg)。它有以下几个亮点特别吸引我：

1. 巧妙地用标准化的解决了请求的问题。同构和页面开发类似，异步是个大难题，异步中难点又在接口请求。Next.js 给组件新增了 getInitialProps 方法来专门处理初始化请求，再也不用手动往页面上塞 DATA 和调用 ReactDOMServer.renderToString
2. 使用 [styled-jsx](https://github.com/zeit/styled-jsx) 解决了 css-in-js 的问题。这种方案虽然不像 styled-component 那样强大，但足够简单，可以说是最小的成本解决了问题
3. Fast by default。页面默认拆分文件方式打包，支持Prefetch页面预加载

全家桶式的的解决方案。简洁清晰的目录结构，这一点 Redux 等框架真应该学一学。不过全家桶的方案比较适合全新项目使用，旧项目使用要评估好成本

> 讨论地址是：[前后端渲染之争 · Issue #5 · dt-fe/weekly](http://link.zhihu.com/?target=https%3A//github.com/dt-fe/weekly/issues/5)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




本期精读的文章是：[6 Reasons Why JavaScript’s Async/Await Blows Promises Away](https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9)

# 1 引言

<img src="assets/4/async.png" alt="logo" width="500" />

我为什么要选这篇文章呢？

前端异步问题处理一直是一个老大难的问题，前有 Callback Hell 的绝望，后有 Promise/Deferred 的规范混战，从 Generator 配合 co 所向披靡，到如今 Async/Await 改变世界。为什么异步问题如此难处理，Async/Await 又能在多大程度上解决我们开发和调试过程中遇到的难点呢？希望这篇文章能给我们带来一些启发。

当然，本文不是一篇针对前端异步问题综合概要性的文章，更多的是从 Async/Await 的优越性谈起。但这并不妨碍我们从 Async/Await 的特点出发，结合自己在工作、开发过程中的经验教训，认真的思考和总结如何更优雅、更高效的处理异步问题。

# 2 内容概要

Async/Await 的优点：

 - 语法简洁清晰，节省了很多不必要的匿名函数
 - 直接使用 try...catch... 进行异常处理
 - 添加条件判断更符合直觉
 - 减少不必要的中间变量
 - 更清晰明确的错误堆栈
 - 调试时可以轻松给每个异步调用加断点

Async/Await 的局限：

 - 降低了我们阅读理解代码的速度，此前看到 `.then()` 就知道是异步，现在需要识别 `async` 和 `await` 关键字
 - 目前支持 Async/Await 的 Node.js 版本（Node 7）并非 LTS 版本，但是下一个 LTS 版本很快将会发布

可以看出，文中提到 Async/Await 的优势大部分都是从开发调试效率提升层面来讲的，提到的问题或者说局限也只有不痛不痒的两点。

让我们来看看参与精读的同学都提出了哪些深度观点：

# 3 精读

本次提出独到观点的同学有：[@javie007](http://link.zhihu.com/?target=https%3A//github.com/javie007)  [@流形](https://www.zhihu.com/people/6c772f9726a914ed4a4b90c88010461c) [@camsong](https://www.zhihu.com/people/078cc0fb15845759ad8295b0f0e50099) [@Turbe Xue](https://www.zhihu.com/people/turbe-xue) [@淡苍](https://www.zhihu.com/people/5ac53c9c0484e83672e1c1716bdf0ff9) [@留影](https://www.zhihu.com/people/38c3c75795824de1bc5d99cff904a832)  [@黄子毅](https://www.zhihu.com/people/3ec85a04bc9eaa35b1830874cc463a52) 精读由此归纳。

### Async/Await 并不是什么新鲜概念

参与精读的很多同学都提出来，Async/Await 并不是什么新鲜的概念，事实的确如此。

早在 2012 年微软的 C# 语言发布 5.0 版本时，就正式推出了 Async/Await 的概念，随后在 Python 和 Scala 中也相继出现了 Async/Await 的身影。再之后，才是我们今天讨论的主角，ES 2016 中正式提出了 Async/Await 规范。

以下是一个在 C# 中使用 Async/Await 的示例代码：

```c-sharp
public async Task<int> SumPageSizesAsync(IList<Uri> uris)
{
    int total = 0;
    foreach (var uri in uris) {
        statusText.Text = string.Format("Found {0} bytes ...", total);
        var data = await new WebClient().DownloadDataTaskAsync(uri);
        total += data.Length;
    }
    statusText.Text = string.Format("Found {0} bytes total", total);
    return total;
}
```

再看看在 JavaScript 中的使用方法：

```javascript
async function createNewDoc() {
  let response = await db.post({}); // post a new doc
  return await db.get(response.id); // find by id
}
```

不难看出两者单纯在异步语法上，并没有太多的差异。这也是为什么 Async/Await 推出后，获得不少赞许和亲切感的原因之一吧。

其实在前端领域，也有不少类 Async/Await 的实现，其中不得不提到的就是知名网红之一的老赵写的 [wind.js](https://github.com/JeffreyZhao/wind)，站在今天的角度看，windjs 的设计和实现不可谓不超前。

### Async/Await 是如何实现的

根据 [Async/Await 的规范](https://tc39.github.io/ecmascript-asyncawait/) 中的描述 —— 一个 Async 函数总是会返回一个 Promise —— 不难看出 Async/Await 和 Promise 存在千丝万缕的联系。这也是为什么不少参与精读的同学都说，Async/Await 不过是一个语法糖。

单谈规范太枯燥，我们还是看看实际的代码。下面是一个最基础的 Async/Await 例子：

```javascript
async function test() {
  const img = await fetch('tiger.jpg');
}
```

使用 Babel 转换后：

```javascript
'use strict';

var test = function() {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var img;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return fetch('tiger.jpg');

                    case 2:
                        img = _context.sent;

                    case 3:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function test() {
        return _ref.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) {
    return function() {
        var gen = fn.apply(this, arguments);
        return new Promise(function(resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (info.done) {
                    resolve(value);
                } else {
                    return Promise.resolve(value).then(function(value) {
                        step("next", value);
                    }, function(err) {
                        step("throw", err);
                    });
                }
            }
            return step("next");
        });
    };
}
```

不难看出，Async/Await 的实现被转换成了基于 Promise 的调用。值得注意的是，原来只需 3 行代码即可解决的问题，居然被转换成了 52 行代码，这还是基于执行环境中已经存在 regenerator 的前提之一。如果要在兼容性尚不是非常理想的 Web 环境下使用，代码 overhead 的成本不得不纳入考虑。

### Async/Await 真的是更优秀的替代方案吗

不知道是个人观察偏差，还是大家普遍都有这样的看法。在国内前端圈子里，并没有对 Async/Await 的出现表现出多么大的兴趣，几种常见的观点是：「还不是基于 Promise 的语法糖，没什么意思」、「现在使用 co 已经能完美解决异步问题，不需要再引入什么新的概念」、「浏览器兼容性这么差，用 Babel 编译又需要引入不少依赖，使用成本太高」等等。

在本次精读中，也有不少同学指出了使用 Async/Await 的局限性。

比如，使用 Async/Await 并不能很好的支持异步并发。考虑下面这种情况，一个模块需要发送 3 个请求并在获得结果后才能进行渲染，3 个请求之间没有依赖关系。如果使用 Async/Await，写法如下：

```javascript
async function mount() {
  const result1 = await fetch('a.json');
  const result2 = await fetch('b.json');
  const result3 = await fetch('c.json');

  render(result1, result2, result3);
}
```

这样的写法在异步上确实简洁不少，但是 3 个异步请求是顺序执行的，并没有充分利用到异步的优势。要想实现真正的异步，还是需要依赖 `Promise.all` 封装一层：

```javascript
async function mount() {
  const result = await Promise.all(
    fetch('a.json'),
    fetch('b.json'),
    fetch('c.json')
  );

  render(...result);
}
```

此外，正如在上文中提到的，async 函数默认会返回一个 Promise，这也意味着 Promise 中存在的问题 async 函数也会遇到，那就是 —— 默认会静默的吞掉异常。

所以，虽然 Async/Await 能够使用 try...catch... 这种符合同步习惯的方式进行异常捕获，你依然不得不手动给每个 await 调用添加 try...catch... 语句，否则，async 函数返回的只是一个 reject 掉的 Promise 而已。


### 异步还有哪些问题需要解决

虽然处理异步问题的技术一直在进步，但是在实际工程实践中，我们对异步操作的需求也在不断扩展加深，这也是为什么各种 flow control 的库一直兴盛不衰的原因之一。

在本次精读中，大家肯定了 Async/Await 在处理异步问题的优越性，但也提到了其在异步问题处理上的一些不足：

 - 缺少复杂的控制流程，如 always、progress、pause、resume 等
 - 缺少中断的方法，无法 abort

当然，站在 EMCA 规范的角度来看，有些需求可能比较少见，但是如果纳入规范中，也可以减少前端程序员在挑选异步流程控制库时的纠结了。


# 3 总结

Async/Await 的确是更优越的异步处理方案，但我们相信这一定不是终极处理方案。随着前端工程化的深入，一定有更多、更复杂、更精细的异步问题出现，同时也会有迎合这些问题的解决方案出现，比如精读中很多同学提到的 RxJS 和 js-csp。


> 讨论地址是：[那些年我们处理过的异步问题 · Issue #6 · dt-fe/weekly](http://link.zhihu.com/?target=https%3A//github.com/dt-fe/weekly/issues/6)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




本周精读文章：[单页应用的数据流方案探索](https://zhuanlan.zhihu.com/p/26426054)

# 1 引言

<img src="assets/5/data-stream.jpeg" alt="logo" width="500" />

> 前几期精读了前端模块化、语法相关的文章，这次讨论另一个举足轻重的话题：数据流。
> 数据流在前端的地位与工程化、可视化、组件化是一样重要的，没有好的数据流框架与思想的指导，业务代码长期肯定倾向于不可维护的状态，当项目不断增加功能后，管理数据变得更加重要。

早期前端是没有数据流概念的，因为前端非常薄，每个页面只要展示请求数据，不需要数据流管理。

随着前端越来越复杂，框架越来越内聚，数据流方案由分到合，由合又到了分，如今数据流逐渐从框架中解绑，形成了一套通用体系，供各个框架使用。

虽然数据流框架很多，但基本上可以分为 `双向数据流党`、`单向数据流党`、`响应式数据流党`，分别以 `Mobx`、`Redux`、`Rxjs` 为代表呈现三国鼎立之状，顺带一提，对 `css` 而言也有 `css in js` 和纯 `css党` 势均力敌，前端真是不让人省心啊。这次我们来看看民工叔徐飞在 **QConf** 分享的主题：**单页应用的数据流方案探索**。

# 2 内容概要

文中主要介绍了响应式编程理念，提到的观点，主要有：

1. `Reactive` 数据封装
2.  数据源，数据变更的归一
3.  局部与全局状态的归一
4.  分形思想
5.  action 分散执行
5.  app级别数据处理，推荐前端 `Orm`

整体来看，核心思路是推荐组件内部完成数据流的处理，不用关心使用了 `Redux` `Mobx` 或者 `Rxjs`，也不用关心这些库是否有全局管理的野心，如果全局管理那就挂载到全局，但组件内部还是局部管理。

最后谈到了 `Rxjs`、`xstream` 响应式数据流的优势，但并未放出框架，仅仅指点了思想，让一些读者心里痒痒。但现在太多”技术大牛“把”业界会议“当成了打广告，或者工作汇报的机会，所谓授人以鱼不如授人以渔，这篇文章卓尔不群。

# 3 精读

一切技术都要看业务场景，民工叔的 **单页应用数据流方案** 解决的是重前端的复杂业务场景，虽然现在前端几乎全部单页化，但单页也不能代表业务数据流是复杂的，比如偏数据展示型的中台单页应用就不适合使用这套方案。

此文讨论的是纯数据流方案，与 `Dom` 结合的方案可以参考 [cyclejs](https://cycle.js.org/)，但这个库主要搭建了 `Reactive` -> `Dom` 的桥梁，使用起来还要参考此文的思路。

## 3.1 响应式数据流是最好的方案吗？

我认为前端数据流方案迭代至今，并不存在比如：面向对象 -> 函数式 -> 响应式，这种进化链路，不同业务场景下都有各自优势。

#### 面向对象

以 Mobx 为代表，轻前端用的较多，因为复杂度集中在后端，前端做好数据展示即可，那么直接拥抱 js 这种基于对象的语言，结合原生 `Map` `Proxy` `Reflect` 将副作用进行到底，开发速度快得飞起。

数据存储方式按照视图形态来，因为视图之间几乎毫无关联，而且特别是数据产品，后端数据量巨大，把数据处理过程搬到前端是不可能的（为了推导出一个视图形态数据，需要动辄几GB的原始数据运算，存储和性能都不适合在前端做）。

#### 函数式

以 Haskell 为代表，金融行业用的比较多，可能原因是金融对数据正确性非常敏感，不仅函数式适合分布式计算，更重要的是**无副作用**让数据计算更安全可靠。

个人认为最重要的原因是，**金融行业本来很少有副作用**，像前端天天与 `Dom` 打交道的，副作用完全逃不了。

#### 响应式

以 Rxjs 为代表，重前端更适合使用。对于 `React native` 等 App 级别的开发，考虑到数据一致性（比如修改昵称后回退到文章详情，需同步作者修改后的昵称），优先考虑原始类型存储，更适合抽象出前端 `Orm` 作为数据源。

其实 `Orm` 作为数据源，面向对象也很适合，但响应式编程的高层次抽象，使其对数据源、数据变动的依赖可插拔，中等规模使用大对象作为数据源，App 级别使用 `Orm` 作为数据源，因地制宜。

## 3.2 分形思想

分形思想即充血组件的升级版，特点是同时支持贫血组件的被外部控制能力。

### 分形的优点

分形保证了两点：

1. 组件和数据流融为整体，与外部数据流**隔离**，甚至将数据处理也融合在数据管道中，便于调试。
2. 便于组件复用，因为数据流作为组件的一部分。

如果结合文中的 **本地状态** 概念，局部数据也放在全局，就出现了第三点好处：

3. 创建局部数据等于创建了全局数据，这样代码调试可局部，可整体，更加灵活。

**本地状态** 可以参考 dva 框架的设计，如果没有全局 `Redux` 就创建一个，否则就挂载到全局 `Redux` 上。

### 分形的缺点

对于聊天室或者在线IDE等，全局数据居多，很多交叉绑定的情况，就不适合分形思想，反而纯 Redux 思想更合适。

## 3.3 数据形态，是原始数据还是视图数据？

我认为这也是分业务场景，文章提到不应该太偏向视图结构数据，是有道理的，意思是说，在适合原始结构数据时，就不要倾向于视图结构数据了。但有必要补充一下，在后端做了大量工作的中台场景，前端数据层非常薄，同时拿到的数据也是后端服务集群计算后的离线数据，显然原始数据结构不可能放在前端，这时候就不要使用原始数据存储了。

## 3.4 从原始数据到视图数据的处理过程放在哪

文中推荐放在 `View` 中处理，因为考虑到不想增加额外的 `Store`，但不知道这个 `Store` 是否包含组件局部的 `Store`。业务组件推荐使用内部数据流操作，但最终还是会将视图数据存在全局 `Store` 中，只是对组件而言，是局部的，对项目而言是全局的，而且这样对特定的情况，比如其他组件复用数据变更的监听可以支持到。

# 总结

我们到头来还是没有提供一个完美的解决方案，但提供了一个完整的思路，即在不同场景下，如何选择最合适的数据流方案。

最后，不要盲目选型，就像上面提到的，这套方案对复杂场景非常棒，但也许你的业务完全不适合。不要纠结于文中为何没有给出系统化解决方案的 Coding 库，我们需要了解响应式数据流的优势，同时要看清自己的业务场景，打造一套合适的数据流方案。

最后的最后，如有不错的数据流方案，解决了特定场景的痛点，欢迎留言。

**如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。**


本期精读文章：[JavaScript-Errors-and-Stack-Traces](http://lucasfcosta.com/2017/02/17/JavaScript-Errors-and-Stack-Traces.html?utm_source=javascriptweekly&utm_medium=email)

[中文版译文](https://zhuanlan.zhihu.com/p/25338849)

# 1. 引言

<img src="assets/5/logo.gif" alt="logo" width="500" />

错误处理无论对那种语言来说，都至关重要。在 JavaScript 中主要是通过 Error 对象和 Stack Traces 提供有价值的错误堆栈，帮助开发者调试。在服务端开发中，开发者可以将有价值错误信息打印到服务器日志中，而对于客户端而言就很难重现用户环境下的报错，我们团队一直在做一个错误监控的应用，在这里也和大家一起讨论下 js 异常监控的常规方式。

# 2. 内容概要

## 了解 Stack

Stack 部分主要在阐明 js 中函数调用栈的概念，它符合栈的基本特性『当调用时，压入栈顶。当它执行完毕时，被弹出栈』，简单看下面的代码：

```
function c() {
	try {
		var bar = baz;
    throw new Error()
	} catch (e) {
		console.log(e.stack);
	}
}

function b() {
	c();
}

function a() {
	b();
}

a();
```
上述代码中会在执行到 c 函数的时候跑错，调用栈为 `a -> b -> c`，如下图所示：

![](https://img.alicdn.com/tfs/TB1hqekQVXXXXa1XVXXXXXXXXXX-734-256.png)

很明显，错误堆栈可以帮助我们定位到报错的位置，在大型项目或者类库开发时，这很有意义。

## 认知 Error 对象

紧接着，原作者讲到了 Error 对象，主要有两个重要属性 message 和 name 分别表示错误信息和错误名称。实际上，除了这两个属性还有一个未被标准化的 stack 属性，我们上面的代码也用到了 `e.stack`，这个属性包含了错误信息、错误名称以及错误栈信息。在 chrome 中测试打印出 `e.stack` 于 `e` 类似。感兴趣的可以了解下 Sentry 的 [stack traces](https://sentry.io/features/stacktrace/)，它集成了 TraceKit，会对 Error 对象进行规范化处理。

## 如何使用堆栈追踪

该部分以 NodeJS 环境为例，讲解了 `Error.captureStackTrace `，将 stack 信息作为属性存储在一个对象当中，同时可以过滤掉一些无用的堆栈信息。这样可以隐藏掉用户不需要了解的内部细节。作者也以 Chai 为例，内部使用该方法对代码的调用者屏蔽了不相关的实现细节。通过以 Assertion 对象为例，讲述了具体的内部实现，简单来说通过一个 addChainableMethod 链式调用工具方法，在运行一个 Assertion 时，将它设为标记，其后面的堆栈会被移除；如果 assertion 失败移除起后面所有内部堆栈；如果有内嵌 assertion，将当前 assertion 的方法放到 ssfi 中作为标记，移除后面堆栈帧；

# 3. 精读
参与本次精读的同学有：[范洪春](https://www.zhihu.com/people/fanhc/activities)、[黄子毅](https://www.zhihu.com/people/huang-zi-yi-83/answers)、[杨森](https://www.zhihu.com/people/yangsen/answers)、[camsong](https://www.zhihu.com/people/camsong/answers)，该部分由他们的观点总结而出。

## captureStackTrace 方法优劣

captureStackTrace 方法通过截取有意义报错堆栈，并统计上报，有助于排查问题。常用的断言库 chai 就是通过此方式屏蔽了库自身的调用栈，仅保留了用户代码的调用栈，这样用户会清晰的看到自己代码的调用栈。不过 Chai 的断言方式过分语义化，代码不易读。而实际上，现在有另外一款更黑科技的断言库正在崛起，那就是 [power-assert](https://github.com/power-assert-js/power-assert)。

直观的看一下 Chai.js 和 power-assert 的用法及反馈效果（以下代码及截图来自[小菜荔枝](http://www.jianshu.com/p/41ced3207a0c）：

```js
const assert = require('power-assert');
const should = require('should');      // 别忘记 npm install should
const obj = {
  arr: [1,2,3],
  number: 10
};

describe('should.js和power-assert的区别', () => {
  it('使用should.js的情况', () => {
    should(obj.arr[0]).be.equal(obj.number);      // should api
  });

  it('使用power-assert的情况', () => {
    assert(obj.arr[0] === obj.number);      // 用assert就可以
  });
});
```
![](https://cloud.githubusercontent.com/assets/1336484/25432441/0696cda2-2ab7-11e7-94a7-6719acdcb7af.png)

## 抛 Error 对象的正确姿势

在我们日常开发中一定要抛出标准的 Error 对象。否则，无法知道抛出的类型，很难对错误进行统一处理。正确的做法应该是使用 throw new Error(“error message here”)，这里还引用了 Node.js 中推荐的异常[处理方式](https://www.joyent.com/node-js/production/design/errors):

- 区分操作异常和程序员的失误。操作异常指可预测的不可避免的异常，如无法连接服务器
- 操作异常应该被处理。程序员的失误不需要处理，如果处理了反而会影响错误排查
- 操作异常有两种处理方式：同步 (try…catch) 和异步（callback, event - emitter）两种处理方式，但只能选择其中一种。
- 函数定义时应该用文档写清楚参数类型，及可能会发生的合理的失败。以及错误是同步还是异步传给调用者的
- 缺少参数或参数无效是程序员的错误，一旦发生就应该 throw。
传递错误时，使用标准的 Error 对象，并附件尽可能多的错误信息，可以使用标准的属性名

## 异步（Promise）环境下错误处理方式

在 Promise 内部使用 reject 方法来处理错误，而不要直接调用 `throw Error`，这样你不会捕捉到任何的报错信息。

reject 如果使用 Error 对象，会导致捕获不到错误的情况，在我的博客中有讨论过这种情况：Callback Promise Generator Async-Await 和异常处理的演进，我们看以下代码：

```js
function thirdFunction() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('我可以被捕获')
      // throw Error('永远无法被捕获')
    })
  })
}

Promise.resolve(true).then((resolve, reject) => {
  return thirdFunction()
}).catch(error => {
  console.log('捕获异常', error) // 捕获异常 我可以被捕获
});
```

我们发现，在 macrotask 队列中，`reject` 行为是可以被 catch 到的，而此时 throw Error 就无法捕获异常，大家可以贴到浏览器运行试一试，第二次把 `reject('我可以被捕获')` 注释起来，取消 `throw Error('永远无法被捕获')` 的注释，会发现异常无法 catch 住。

这是因为 setTimeout 中 throw Error 无论如何都无法捕获到，而 reject 是 Promise 提供的关键字，自己当然可以 catch 住。

## 监控客户端 Error 报错

文中提到的 `try...catch` 可以拿到出错的信息，堆栈，出错的文件、行号、列号等，但无法捕捉到语法错误，也没法去捕捉全局的异常事件。此外，在一些古老的浏览器下 `try...catch` 对 js 的性能也有一定的影响。

这里，想提一下另一个捕捉异常的方法，即 `window.onerror`，这也是我们在做错误监控中用到比较多的方案。它可以捕捉语法错误和运行时错误，并且拿到出错的信息，堆栈，出错的文件、行号、列号等。不过，由于是全局监测，就会统计到浏览器插件中的 js 异常。当然，还有一个问题就是浏览器跨域，页面和 js 代码在不同域上时，浏览器出于安全性的考虑，将异常内容隐藏，我们只能获取到一个简单的 `Script Error` 信息。不过这个解决方案也很成熟：

- 给应用内所需的 <script> 标签添加 crossorigin 属性；
- 在 js 所在的 cdn 服务器上添加 `Access-Control-Allow-Origin: *` HTTP 头；

# 4. 总结

Error 和 Stack 信息对于日常开发来说，尤为重要。如果可以将 Error 统计并上报，更有助于我们排查信息，发现在用户环境下到底触发了什么错误，帮助我们提升产品的稳定性。

> 讨论地址是：[JavaScript 中错误堆栈处理 · Issue #9 · dt-fe/weekly](https://github.com/dt-fe/weekly/issues/9)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




本周精读文章：[请停止 css-in-js 的行为](https://hackernoon.com/stop-using-css-in-javascript-for-web-development-fa32fb873dcc)

# 1 引言

<img src="assets/7/css-in-js.png" alt="logo" width="500" />

> 这篇文章表面是在讲 CSS in JS，实际上是 CSS Modules 支持者与 styled-components 拥趸之间的唇枪舌剑、你来我往。从 2014 年 Vjeux 的演讲开始，css-in-js 的轮子层出不穷。终于过了三年，鸡血时期已经慢慢过去，大家开始冷静思考了。

# 2 内容概要

## styled-components

styled-components 利用 ES6 的 tagged template 语法创建 react 纯样式组件。消除了人肉在 dom 和 css 之间做映射和切换的痛苦，并且有大部分编辑器插件的大力支持（语法高亮等）。此外，styled-components 在 ReactNaive 中尤其适用。

styled-components 简单易学，引用官方源码：

```jsx
import React from 'react';

import styled from 'styled-components';

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

<Title>
  Hello World, this is my first styled component!
</Title>
```

## css-modules

顾名思义，css-modules 将 css 代码模块化，可以很方面的避免本模块样式被污染。并且可以很方便的复用 css 代码。

```css
// 全局变量
:global(.className) {
  background-color: blue;
}

// 本地变量，其它模块无法污染
.className {
  background-color: blue;
}

.title {
  // 复用 className 类的样式
  composes: className;
  color: red;
}
```

## react-css-modules

值得一提的是，文章的作者也是 [react-css-modules](https://github.com/gajus/react-css-modules) 的作者。

react-css-modules 代码示例：

```jsx
import React from 'react';
import CSSModules from 'react-css-modules';
import styles from './table.css';

class Table extends React.Component {
    render () {
        return <div styleName='table'>
            <div styleName='row'>
                <div styleName='cell'>A0</div>
                <div styleName='cell'>B0</div>
            </div>
        </div>;
    }
}

export default CSSModules(Table, styles);
```

react-css-modules 引入了 styleName，将本地变量和全局变量很清晰的分开。并且也避免了每次对 styles 对象的引用，本地 className 名也不用总是写成 camelCase。

另外，使用 react-css-modules，可以方便的覆盖本地变量的样式：

```
import customStyles from './table-custom-styles.css';

<Table styles={customStyles} />;
```

## 文章内容

# 3 精读

参与本次精读的同学有 [黄子毅](https://www.zhihu.com/people/huang-zi-yi-83/answers)，[杨森](https://www.zhihu.com/people/yangsen/answers) 和 [camsong](https://www.zhihu.com/people/camsong/answers)。该部分由他们的观点总结而出。

CSS 本身有不少缺陷，如书写繁琐（不支持嵌套）、样式易冲突（没有作用域概念）、缺少变量（不便于一键换主题）等不一而足。为了解决这些问题，社区里的解决方案也是出了一茬又一茬，从最早的 CSS prepocessor（SASS、LESS、Stylus）到后来的后起之秀 PostCSS，再到 CSS Modules、Styled-Components 等。更有甚者，有人维护了一份完整的 [CSS in JS 技术方案的对比](https://github.com/MicheleBertoli/css-in-js)。截至目前，已有 49 种之多。

## Styled-components 优缺点

### 优点

##### 使用成本低

如果是要做一个组件库，让使用方拿着 npm 就能直接用，样式全部自己搞定，不需要依赖其它组件，如 react-dnd 这种，比较适合。

##### 更适合跨平台

适用于 react-native 这类本身就没有 css 的运行环境。

### 缺陷

##### 缺乏扩展性

样式就像小孩的脸，说变就变。比如是最简单的 button，可能在用的时候由于场景不同，就需要设置不同的 font-size，height，width，border 等等，如果全部使用 css-in-js 那将需要把每个样式都变成 props，如果这个组件的 dom 还有多层级呢？你是无法把所有样式都添加到 props 中。同时也不能全部设置成变量，那就丧失了单独定制某个组件的能力。css-in-js 生成的 className 通常是不稳定的随机串，这就给外部想灵活覆盖样式增加了困难。

## css-modules 优缺点

### 优点

1、CSS Modules 可以有效避免全局污染和样式冲突，能最大化地结合现有 CSS 生态和 JS 模块化能力

2、与 SCSS 对比，可以避免 className 的层级嵌套，只使用一个 className 就能把所有样式定义好。

### 缺点：

1、与组件库难以配合

2、会带来一些使用成本，本地样式覆盖困难，写到最后可能一直在用 :global。


## 关于 scss/less

无论是 sass 还是 less 都有一套自己的语法，postcss 更支持了自定义语法，自创的语法最大特点就是雷同，格式又不一致，增加了无意义的学习成本。我们更希望去学习和使用万变不离其宗的东西，而不愿意使用各种定制的“语法糖”来“提高效率”。

就 css 变量与 js 通信而言，虽然草案已经考虑到了这一点，通过表达式与 attribute 通信，使用 js 与 attribute 同步。不难想象，这种情况维护的变量值最终是存储在 js 中更加妥当，然而 scss 给大家带来的 css first 思想根深蒂固，导致许多基础库的变量完全存储在 _variable.scss 文件中，现在无论是想适应 css 的新特性，还使用 css-in-js 都有巨大的成本，导致项目几乎无法迁移。反过来，如果变量存储在 js 中，就像草案中说的一样轻巧，你只要换一种方式实现 css 就行了。

# 总结

在众多解决方案中，没有绝对的优劣。还是要结合自己的场景来决定。

我们团队在使用过 scss 和 css modules 后，仍然又重新选择了使用 scss。css modules 虽然有效解决了样式冲突的问题，但是带来的使用成本也很大。尤其是在写动画（keyframe）的时候，语法尤其奇怪，总是出错，难以调试。并且我们团队在开发时，因为大家书写规范，也从来没有碰到过样式冲突的问题。

Styled-components 笔者未曾使用过，但它消除人肉在 dom 和 css 之间做映射的优点，非常吸引我。而对于样式扩展的问题，其实也有[比较优雅的方式](https://github.com/styled-components/styled-components#user-content-overriding-component-styles)。

```jsx
const CustomedButton = styled(Button)`
  color: customedColor;
`;
```

**如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。**


本期精读的文章是一个组合：

一篇是 Gianluca Guarini 写的 《[Things nobody will tell you about React.js](https://medium.com/@gianluca.guarini/things-nobody-will-tell-you-about-react-js-3a373c1b03b4)》，我将它译作 《那些入坑 React 前没有人会提醒你的事》，因为作者行文中明显带着对 React 的批判和失望。

另一篇则是 Facebook 员工，也是 Redux 作者的 Dan Abramov 针对上文的回复 《[Hey, thanks for feedback!](https://medium.com/@dan_abramov/hey-thanks-for-feedback-bf9502689ca4)》。

# 1 引言

<img src="assets/8/react.jpg" width="500" alt="logo" />

我为什么要选这篇文章呢？

我们团队最早在 2014 年中就确定了 React 作为未来的发展方向，那个时候很多人都还在感叹 Angular（那时候还是 Angular 1）是一个多么超前的框架，很多人甚至听都没有听说过 React。

在不到三年的时间里，React 社区迅速的发展壮大，许多 Angular、Ember、Knockout 等框架的拥趸，或主动或被动的都逐渐开始向 React 看齐。

站在 React 已经繁荣昌盛、无需四处布道宣传的今天，我们不妨冷静下来问问自己，React 真的是一个完美的框架吗？社区里一直不缺少吐槽的声音，这周我们就来看看，React 到底有哪些槽点。


# 2 内容概要

Gianluca Guarini 着重吐槽的点在于：

 - React 项目文件组织规范不统一，社区中 Starter Kit 太多（100+），新手不知道该怎么组织文件
 - 由于 React 只关心 View 层，开发者就要面临选择 mobx 还是 redux 的纠结，无论选择哪种都会带来一系列的问题（重新配置构建脚本，更新 eslint 规则等）
 - 如果选了 mobx，会发现 mobx 无法保证自己的 store 不被外部更新（官方建议是加上特殊的前缀）
 - 如果选了 redux，会发现要实现同样的功能需要写很多的重复代码（这也是为什么社区中有海量的 redux helper 存在）
 - 路由用起来也很蛋疼，因为 React Router 几乎是社区中唯一的选择，但是这货版本更新太快，一不小心就用了废弃的 API
 - 用 JSX 的时候总是要嵌很多没必要的 `div` 或 `span`
 - 要上手一个 React 应用，要配置很多的构建工具和规则才能看到效果
 - ...

Dan Abramov 的回复：

 - 「React 16.0 引入的 Fiber 架构会导致现有代码全部需要重构」的说法是不对的，因为新的架构做到了向后兼容，而且 Facebook 内部超过 3 万个组件都能无痛迁移到新架构上
 - 缺少统一脚手架的问题，可以通过 create-react-app 解决
 - 觉得 redux 和 mobx 繁琐的话，对于刚刚上手的小应用不建议使用
 - React Router 升级太频繁？2015 年发布的 1.0，2016 年 2 月发布的 2.0，2016 年 10 月发布的 3.0。虽然 4.0 紧接着 3.0 马上就发布了，但是 React Router 很早就已经公布了这样的升级计划。
 - ...


# 3 精读

本次提出独到观点的同学有：[@rccoder](https://www.zhihu.com/people/rccoder/answers)  [@Turbe Xue](https://www.zhihu.com/people/turbe-xue) [@Pines-Cheng](https://github.com/Pines-Cheng) [@An Yan](https://github.com/jin5354) [@淡苍](https://www.zhihu.com/people/5ac53c9c0484e83672e1c1716bdf0ff9)  [@黄子毅](https://www.zhihu.com/people/3ec85a04bc9eaa35b1830874cc463a52) [@宾彬](https://www.zhihu.com/people/twobin/pins/posts) [@cisen](https://github.com/cisen) [@Bobo](https://github.com/ybning) 精读由此归纳。

很高兴能看到不少新同学积极参与到精读的讨论中来，每一个人的声音都是社区发展的一份力量。

### React 上手困难

很早之前我们去四处布道 React 的时候，都会强调 React 很简单，因为它的 public API 非常之少，React 完整的文档 1 个小时就能看完。

那么说「React 上手困难」又是从何谈起呢？参与精读的同学中有不少都有 Vue 的使用经验（包括本周吐槽文的作者），所以不免会把两个框架上手的难易程度放在心里做个对比。

都说没有对比就没有伤害，大家普遍的观点是 Vue 上手简单、文档清晰、构建工具完善、脚手架统一……再反观 React，虽然 Dan 在文章里做了不少解释，但引用 @An Yan 的原话，『他也只是在说「事情没有那么糟糕」』。

所以说，大家认为的 React 上手困难，很大程度上不是 React 本身，而是 React 附带的生态圈野蛮发展太快，导致新人再进入的时候普遍感觉无所适从。虽然官方的 create-react-app 缓解了这一问题，但还没有从根本程度上找到解法。

### 状态管理的迷思

在今时今日的前端圈子里，说 React 不说 Redux 就像说 Ruby 却不说 Rails 一样，总感觉缺点儿什么。

因为 React 将自己定位成 View 层的解决方案，所以对于中大型业务来说一个合适的状态管理方案是不可或缺的。从最早的 Backbone Model，到 Flux，再到 reflux、Redux，再到 mobx 和 redux-observable，你不得不感叹 React 社区的活力是多么强大。

然而当你真正开始做新项目架构的时候，你到底是选 Redux 还是 Mobx，疑惑是封装解决方案如 dva 呢？ @淡苍 认为，Redux 与 MobX，React 两大状态管理方案，各有千秋，Redux 崇尚自由，扩展性好，却也带来了繁琐，一个简单的异步请求都必须引入中间件才能解决，MobX 上手容易，Reactive 避免不必要的渲染，带来性能提升，但相对封闭，不利于业务抽象，缺少最佳实践。至于如何选择？根据具体场景与需求判断。

不难看出，想要做好基于 React 的前端架构，你不仅需要对自己的业务了如指掌，还需要对各种解决方案的特性以及适合怎样的业务形态了如指掌。在 React 社区，永远没有标准解决方案。

### Redux 亦非万能解

Redux 在刚刚推出的时候凭借酷炫的 devtool 和时间旅行功能，瞬间俘获了不少工程师的心。

但当你真正开始使用 Redux 的时候，你会发现你不仅需要学习很多新的概念，如 reducer、store、dispatch、action 等，还有很多基础的问题都没有标准解法，最典型的例子就是异步 action。虽然 Redux 的 middleware 机制提供了实现异步 action 的可能性，但是对于小白来说去 dispatch 一个非 Object 类型的 action 之前需要先了解 thunk 的概念，还要给 Redux 添加一个 redux-thunk 中间件实属难题。

不仅如此，在前端工程中常见的表单处理，Redux 社区也一直没有给出完美的解法。前有简单的 util 工具 redux-form-utils，后有庞大复杂的 redux-form，还有 rc-component 实现的一套基于 HOC 的解决方案。若没有充分的了解和调研，你将如何选择？

这还没有提到最近非常火热的 redux-saga 和 redux-observable，虽然 Dan 说如果你不需要的话完全可以不用了解，但是如果你不了解他们的话怎么知道自己需不需要呢？

### React 与 Vue 之争

Vue 之所以觉得入门简单，因为一开始就提供了 umd 的引入方式，这与传统 js 开发的习惯一致，以及 Avalon 多年布道的铺垫，大家可以很快接受一个不依赖于构建的 Vue。

React 因为引入了 JSX 概念，本可以以 umd 方式推广，但为了更好的 DX 所以上来就推荐大家使用 JSX，导致新手觉得门槛高。

React + Mobx 约等于一个复杂的 Vue，但这不是抛弃 React 的理由。为什么大家觉得 Vuex 比 Redux 更适合 Vue 呢？因为 Vuex 简单，而 Redux 麻烦，这已经将两个用户群划分开了。

一个简单的小公司，就是需要这种数据流简单，不需要编译，没有太多技术选型要考虑的框架，他们看中的是开发效率，可维护性并不是第一位，这点根本性的导致了这两类人永远也撮合不到一块。

而 Vue 就是解决了这个问题，帮助了那么多开发者，仅凭这点就非常值得称赞，而我们不应该从 React 维护性的角度去抨击谁好谁坏，因为站在我们的角度，大部分中小公司的开发者是不 care 的。

React 用户圈汇集了一批高端用户，他们不断探索技术选型，为开源社区迸发活力，如果大家都转向 Vue，这块摊子就死了，函数式、响应式编程的演进也会从框架的大统一而暂时终止，起码这是不利于技术进步的，也是不可能发生的。Vue 在自己的领域做好，将 React 敏捷思想借鉴过来，帮助更多适合场景的开发者，应该才是作者的目的。

### 小贴士：如何在开源社区优雅的撕逼

开源社区撕逼常有，各种嘴炮也吃充斥在社区里，甚至有人在 Github 上维护了一份开源社区撕逼历史。虽然说做技术的人有争论很正常，但是撕的有理有据令人信服的案例却不多。这次 Facebook 的员工 Dan Abramov 就做出了很好的表率。面对咄咄逼人的文章，逐条回复，不回避、不扯淡且态度保持克制，实属难能可贵。

# 3 总结

React 开发者们也不要因为产生了 Mobx 这种亲 Vue 派而产生焦虑，这也是对特定业务场景的权衡，未来更多更好的数据流方案还会继续诞生，技术社区对技术的优化永无止尽。

比如 [mobx-state-tree](https://github.com/mobxjs/mobx-state-tree) 就是一种 redux 与 mobx 结合的大胆尝试，作者在很早之前也申明了，Mobx 一样可以做时间旅行，只要遵守一定的开发规范。

最后打个比方：安卓手机在不断进步，体验越来越逼近苹果，作为一个逼格高的用户，果断换苹果吧。但作为 java 开发人员的你，是否要为此换到 oc 流派呢？换，或者不换，其实都一样，安卓和苹果已经越来越像了。


> 讨论地址是：[那些入坑 React 前没有人会提醒你的事 · Issue #13 · dt-fe/weekly](http://link.zhihu.com/?target=https%3A//github.com/dt-fe/weekly/issues/13)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




本期精读的文章是：[Immutable 结构共享是如何实现的](https://medium.com/@dtinth/immutable-js-persistent-data-structures-and-structural-sharing-6d163fbd73d2)

鉴于 [mobx-state-tree](https://github.com/mobxjs/mobx-state-tree) 的发布，实现了 mutable 到 immutable 数据的自由转换，将 mobx 写法的数据流，无缝接入 redux 生态，或继续使用 mobx 生态。

这是将事务性，可追溯性与依赖追踪特性的结合，同时解决开发体验与数据流可维护性。万一这种思路火了呢？我们先来预热下其重要特征，结构共享。

# 1 引言

<img src="assets/9/share.jpeg" width="500" alt="logo" />

结构共享不仅仅是 “结构共享” 那么简单，背后包含了 Hash maps tries 与 vector tries 结构的支持，如果让我们设计一个结构共享功能，需要考虑哪些点呢？本期精读的文章给了答案。

# 2 内容概要

使用 Object.assign 作用于大对象时，速度会成为瓶颈，比如拥有 `100,000` 个属性的对象，这个操作耗费了 134ms。性能损失主要原因是 “结构共享” 操作需要遍历近10万个属性，而这些引用操作耗费了100ms以上的时间。

解决办法就是减少引用指向的操作数量，而且由于引用指向到任何对象的损耗都几乎一致（无论目标对象极限小或者无穷大，引用消耗时间都几乎没有区别），我们需要一种精心设计的树状结构将打平的引用建立深度，以减少引用操作次数，`vector tries` 就是一种解决思路：

<img src="assets/9/tire.png" width="500" alt="tires" />

上图的 key: `t0143c274`，通过 hash 后得到的值为 621051904（与 md5 不同，比如 hash("a") == 0，hash("c") == 2），转化为二进制后，值是 `10010 10000 01001 00000 00000 00000`，这个路径是唯一的，同时，为了减少树的深度，按照 5bit 切分，切分后的路径也是唯一的。因此寻址路径就如上图所示。

因此结构共享的核心思路是**以空间换时间**。

# 3 精读

本精读由 [rccoder](https://github.com/rccoder) [ascoders](https://github.com/ascoders) [cisen](https://github.com/cisen) [BlackGanglion](https://github.com/BlackGanglion) [jasonslyvia](https://github.com/jasonslyvia) [TingGe](https://github.com/TingGe) [twobin](https://github.com/twobin) [camsong](https://github.com/camsong) 讨论而出，以及我个人的吐血阅读论文原文总结而成。

## Immutable 树结构的特性

以 [camsong](https://github.com/camsong/blog/issues/3) 的动态图形象介绍一下共享的操作流程：

<img src="assets/9/share.gif" width="500" alt="share" />

但是，当树越宽（子节点越多）时，相应树的高度会下降，随之查询效率会提高，但更新效率则会下降（试想一下极限情况，就相当于线性结构）。为寻求更新与查询的平衡，我们便选择了 5bit 一分割。

因此最终每个节点拥有 2^5=32 个子节点，同时通过 Vector trie 和 Hash maps trie 压缩空间结构，使其深度最小，性能最优。

### Vector trie

通过这篇文章查看[详细介绍](http://www.hypirion.com/musings/understanding-persistent-vector-pt-1)。

其原理是，使用二叉树，**将所有值按照顺序，从左到右存放于叶子节点**，当需要更新数据时，只将其更新路径上的节点生成新的对象，没有改变的节点继续共用。

<img src="assets/9/vector-tire.png" width="500" alt="vector-tire" />

### Hash maps trie

Immutablejs 对于 Map，使用了这种方式优化，并且通过树宽与树高的压缩，形成了文中例图中的效果（`10010 10000` 聚合成了一个节点，并且移除了同级的空节点）。

树宽压缩：

<img src="assets/9/hash-maps-tire-1.png" width="500" alt="vhash-maps-tire-1" />

树高压缩：

<img src="assets/9/hash-maps-tire-2.png" width="500" alt="hash-maps-tire-2" />

再结合 Vector trie，实现结构共享，保证其更新性能最优，同时查询路径相对较优。

## Object.assign 是否可替代 Immutable？

> 结构共享指的是，根节点的引用改变，但对没修改的节点，引用依然指向旧节点。所以`Object.assign` 也能实现结构共享

见如下代码：

```javascript
const objA = { a: 1, b: 2, c: 3 }
const objB = Object.assign({}, objA, { c: 4 })
objA === objB     // false
objA.a === objB.a // true
objA.b === objB.b // true
```

证明 Object.assign 完全可以胜任 Immutable 的场景。但正如文章所述，当对象属性庞大时， Object.assign 的效率较低，因此在特殊场景，不适合使用 Object.assign 生成 immutable 数据。但是大部分场景还是完全可以使用 Object.assign 的，因为性能不是瓶颈，唯一繁琐点在于深层次对象的赋值书写起来很麻烦。

## Map 性能比 Object.assign 更好，是否可以替代 Immutable？

> 当一层节点达到 1000000 时，immutable.get 查询性能是 object.key 的 10 倍以上。

就性能而言可以替代 Immutable，但就结合 redux 使用而言，无法替代 Immutable。

redux 判断数据更新的条件是，对象引用是否变化，而且要满足，**当修改对象子属性时，父级对象的引用也要一并修改**。Map 跪在这个特性上，它无法使 set 后的 map 对象产生一份新的引用。

这样会导致，Connect 了 style 对象，其 backgroundColor 属性变化时，不会触发 reRender。因此虽然 Map 性能不错，但无法胜任 Object.assign 或 immutablejs 库对 redux 的支持。

# 3 总结

数据结构共享要达到真正可用，需要借助 Hash maps tries 和 vector tries 数据结构的帮助，在上文中已经详细阐述。既然清楚了结构共享怎么做，就更加想知道 mobx-state-tree 是如何做到 mutable 数据到 immutable 数据转换了，敬请期待下次的源码分析（不一定在下一期）。

如何你对原理不是很关心，那拿走这个结论也不错：在大部分情况可以使用 Object.assign 代替 Immutablejs，只要你不怕深度赋值的麻烦语法；其效果与 Immutablejs 一模一样，唯一，在数据量巨大的字段上，可以使用 Immutablejs 代替以提高性能。

> 讨论地址是：[Immutable 结构共享是如何实现的？ · Issue #14 · dt-fe/weekly](http://github.com/dt-fe/weekly/issues/14)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。





本期精读的文章是：[The broken promise of Web Components
](https://dmitriid.com/blog/2017/03/the-broken-promise-of-web-components/)

以及对这篇文章的回应: [Regarding the broken promise of Web Components](https://robdodson.me/regarding-the-broken-promise-of-web-components/)

# 1 引言

我为什么要选这篇文章呢？

就在前几天的 Google I/O 2017上, Polymer 正式发布了 [Polymer 2.0](https://www.polymer-project.org/blog/2017-05-15-time-for-two) 版本.

来看一下 Polymer 2.0 的一些变化:
- 使用  Shadow DOM v1 代替 Polymer.dom.  Shady DOM从 Polymer 中分离出来。
- 使用 标准的 ES6 类和 Custom Elements v1 来自定义元素.
- 还有数据系统的改进和生命周期的变更.

可以看到, Polymer 的这次升级主要是将 Shadow Dom 和 Custom Elements 升级到 v1 版本, 以获得更多浏览器的原生支持.  下一 代Web Components － v1规范，Chrome 已经支持了，Web Components 规范中的2个主要部分 － [Shadow Dom](https://www.chromestatus.com/feature/4667415417847808) 和 [Custom Elements](https://www.chromestatus.com/feature/4696261944934400). Safari在10版本中, 支持了 [Shadow DOM v1](https://webkit.org/status/#feature-shadow-dom) 规范并且完成了在Webkit内核中对 [Custom Elements v1](https://webkit.org/blog/7027/introducing-custom-elements/) 规范的实现；Firefox对 [Shadow DOM](https://platform-status.mozilla.org/#shadow-dom) 和 [Custom Elements v1规范](https://platform-status.mozilla.org/#custom-elements) 支持正在开发中；Edge也将对 [Shadow DOM](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/shadowdom/) 和 [Custom Elements](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/customelements/) 支持规划到他们的开发roadmap中。

这段时间, 大家都在讨论 react, vue, angular, 这些框架. 或者 该使用 redux 还 是 mobx 做数据管理. 在这个契机下, 我想我们可以不单单去思考这些框架, 也可以更多地去思考和了解 Web Components 标准. 对于 Web Components标准有一些思考. 所以我选了一篇关于 Web Components 的文章, 想让大家对于 Web Components 的发展, 和 Web Componets 与现在的主流框架如何协作有更多的思考和讨论.


# 2 内容概要

**The broken promise of Web Components**
原文作者dmitriid主要是在喷Web Components从2011年到2017年这6年间毫无进展, 一共产出了6份标准, 其中两份已经被弃用. 几乎只有一个主流浏览器(chrome) 支持.

![image](https://dmitriid.com/assets/img/blog/web-components-support.png)


- Web Components 这些规范强依赖 JS 的实现
    - Custom Elements 是 JS 脚本的一部分
    - HTML Templates 的出现就是为了被JS 脚本使用
    - Shadow Dom 也需要配合 JS 脚本使用
    - 只有 HTML imports 可以脱离 JS 脚本使用
- Web Components 操作 DOM
    - 属性都是字符串
    - 元素的内容模型(Content Model)比较奇怪
- 为了突破限制使用不同的方法来传递数据
- CSS 作用域, 可以见上次精读[《请停止 css-in-js 的行为》](https://github.com/dt-fe/weekly/issues/12)

**来看一下Polymer 的 核心成员 Rob Dodson 对于本文的回应: Regarding the broken promise of Web Components**

- Web Components 特性需要被浏览器支持，必须有平缓的过渡，良好的兼容，以及成熟的方案，因此推进速度会比较慢一些。
- React 很棒, 但是也不要忽略其他基于 Web Components 的优秀库比如 [Amp](https://www.ampproject.org/)
- 对于 DOM 更新的抽象比如 React/JSX很赞, 但是也带来了一些损耗. 在旧的移动设备上, 加载一个大的js 包性能依旧不理想, 最佳的做法是拆分你的 JS 包, 按需加载.
- 使用 JSX 和 虚拟 DOM是很酷, 也可以直接把 JSX 用在 Web Components 内, 像[SkateJS](https://github.com/skatejs/skatejs)库, 已经在做这个事情了.
- 没有标准的数据绑定, Polymer的数据绑定, 现在是基于[MDV](https://github.com/toolkitchen/mdv), 很多开发者更倾向于基于 Observables或者 ES6 Proxies的数据绑定方案.
- 处理组件的字符串属性是很烦人, 但是由于每一个组件都是一个类的实例, 可以利用ES6 的 getters/setters来改变属性.

Rob Dodson对于 Web Components 依然充满信心, 但是也承认推进标准总会有各种阻碍, 不可能像推荐框架一样快速把事情解决.

# 3 精读

本次提出独到观点的同学有：
[@camsong](https://www.zhihu.com/people/078cc0fb15845759ad8295b0f0e50099)  [@黄子毅](https://github.com/ascoders) [@杨森](https://www.zhihu.com/people/c93b7957f6308990c7e3b16103c9356b) [@rccoder](https://github.com/rccoder) [@alcat2008](https://github.com/alcat2008)精读由此归纳。

### 标准与框架
Web Components 作为一个标准，骨子里的进度就会落后于当前可行的技术体系。正如文中所说，浏览器厂商 ship 一个新功能是很严肃的，很可能会影响到一票的线上业务，甚至会影响到一个产业（遥想当年 [Chrome Extension 禁用 NPAPI](https://blog.chromium.org/2013/09/saying-goodbye-to-our-old-friend-npapi.html)时的一片哀鸿遍野，许多返利插件都使用了这种技术）。那么 Web Components的缓慢推进也在情理之中了.
即使真的有一天这个标准建立起来，Web Components作为浏览器底层特性不应该拿出来和React这类应用层框架相比较. 未来Web Components会做为浏览器非常重要的特性存在。API偏低层操作，会易用性不够. 在很长时间内开发者依旧会使用 React/Vue/Angular/Polymer 这样的框架，Web Components可能会做为这些框架的底层做一些 浏览器层面上的支持.

### 不需要 vendor 的自定义组件间调用
在 Webpack 大行其道的时代，想在运行时做到组件即引即用变得很困难，因为这些组件大多是通过 React/Vue/Angular 开发的。不得不考虑引入一大堆 Vendor 包，这些 Vendor 里可能还必须包含 React 这类两个版本不能同时使用的库。目前我们团队在做组件化方案时就遇到这个问题，只能想办法避免两个版本的出现。你可以说这是 React 或 Webpack 引入的问题，但并没有看到 Web Compnents 标准化的解决方案。我想未来Web Components可能会作为浏览器的底层, 出现基于底层的标准方案来做组件间的相互应用的方法.


### 为什么对 Web components 讨论不断

俗话说，成也萧何，败也萧何。正如原文提及的，现在网页规模越来越大，需求也越来越灵活，html 与 css 的能力已经严重不足，我们才孤注一掷的上了 js 的贼船：JSX 和 Css module，因为 Web components 依托在 html 模版语言上，当然没办法与 js 的灵活性媲美。

但使用前端框架的问题也日益暴露，随着前端框架种类的增多，同一个框架不同版本之间无法共存，导致组件无法跨框架复用，甚至只能固定在框架的某个版本，这与前端未来的模块化发展是相违背的，我们越是与之抗衡，就越希望 Web components 能站出来解决这个问题，因为浏览器原生支持模块化，相当于将 react angular vue 的能力内置在浏览器中，而且一定会向前兼容（这也是 Web components 推进缓慢的原因）。

# 4 总结
我觉得 Web Components作为浏览器底层特性不应该拿出来和React, vue 这类应用层框架相比较. Web Components 的方向以及提供的价值都不会跟 应用框架一致. 而 Web Components 作为未来的 Web 组件标准 , 它在任何生态中都可以运行良好. 我倒是更加期待应用层去基于 Web Components 去做更多的实现, 让组件超越框架存在, 可以在不同技术栈中使用.


> 讨论地址是：[精读《Web Components 的困境》 · Issue #15 · dt-fe/weekly](https://github.com/dt-fe/weekly/issues/15)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




本期精读的文章是：[debugging-tips-tricks](https://css-tricks.com/debugging-tips-tricks/?utm_source=javascriptweekly&utm_medium=email)

编码只是开发过程中的一小部分，为了使我们工作更加高效，我们必须学会调试，并擅长调试。

# 1 引言

<img src="assets/11/coffee.jpg" width="500" alt="logo" />

梵高这幅画远景漆黑一片，近景的咖啡店色彩却反差很大，他只是望着黑夜中温暖的咖啡馆，交织着矛盾与孤独。代码不可能没有 BUG，调试与开发也始终交织在一起，我们在这两种矛盾中不断成长。

# 2 内容概要

文中列举了常用调试技巧，如下：

### Debugger

在代码中插入 `debugger` 可以在其位置触发断点调试。

### Console.dir

使用 `console.dir` 命令，可以打印出对象的结构，而 `console.log` 仅能打印返回值，在打印 `document` 属性时尤为有用。

> ps: 大部分时候，对象返回值就是其结构

### 使用辅助工具，语法高亮、linting

它可以帮助我们快速定位问题，其实 flow 与 typescript 也起到了很好的调试作用。

### 浏览器拓展

使用类似 [ReactDTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) [VueDTools](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 调试对应框架。

### 借助 DevTools

Chrome Dev Tools 非常强大，[dev-tips](https://umaar.com/dev-tips/) 列出了 100 多条它可以做的事。

### 移动端调试工具

最靠谱的应该是 [eruda](http://eruda.liriliri.io/)，可以内嵌在任何 h5 页面，充当 DevTools 控制台的作用。

### 实时调试

不需要预先埋点，比如 `document.activeElement` 可以打印最近 focus 过的元素，因为打开控制台导致失去焦点，但我们可以通过此 api 获取它。

### 结构化打印对象瞬时状态

`JSON.stringify(obj, null, 2)` 可以结构化打印出对象，因为是字符串，不用担心引用问题。

### 数组调试

通过 `Array.prototype.find` 快速寻找某个元素。

# 3 精读

本精读由 [rccoder](https://github.com/rccoder) [ascoders](https://github.com/ascoders) [NE-SmallTown](https://github.com/NE-SmallTown) [BlackGanglion](https://github.com/BlackGanglion) [jasonslyvia](https://github.com/jasonslyvia) [alcat2008](https://github.com/alcat2008) [DanielWLam](https://github.com/DanielWLam) [HsuanXyz](https://github.com/HsuanXyz) [huxiaoyun](https://github.com/huxiaoyun) [vagusX](https://github.com/vagusX) 讨论而出。

### 移动端真机测试

由于 webview 不一定支持连接 chrome 控制台调试，只有真机测试才能复现真实场景。

[browserstack](https://www.browserstack.com/) [dynatrace](https://www.dynatrace.com/platform/offerings/customer-experience-monitoring/) 都是真机测试平台，公司内部应该也会搭建这种平台。

### 移动端控制台

- [Chrome远程调试](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/webviews) app 支持后，连接 usb 或者局域网，即可通过 Dev Tools 调试 webview 页面。
- [Weinre](http://people.apache.org/~pmuellr/weinre/docs/latest/Home.html) 通过页面加载脚本，与 pc 端调试器通信。
- 通过内嵌控制台解决，比如 [eruda](http://eruda.liriliri.io/) [VConsole](https://github.com/WechatFE/vConsole)
- [Rosin](http://alloyteam.github.io/Rosin/) fiddler 的一个插件，协助移动页面调试。
- [jsconsole](https://jsconsole.com/) 在本地部署后，手机访问对应 ip，可以测试对应浏览器的控制台。

### 请求代理

[charles](http://www.charlesproxy.com/) [Fiddler](http://www.telerik.com/fiddler) 可以抓包，更重要是可以代理请求。假数据、边界值测试、开发环境代码加载，每一项都非常有用。

### 定制 Chrome 拓展

对于特定业务场景也可以通过开发 chrome 插件来做，比如分析自己网站的结构、版本、代码开发责任人、一键切换开发环境。

### 在用户设备调试

把控制台输出信息打到服务器，本地通过与服务器建立 socket 链接实时查看控制台信息。要知道实时根据用户 id 开启调试信息，并看用户真是环境的控制台打印信息是非常有用的，能解决很多难以复现问题。

代码中可以使用封装过的 `console.log`，当服务端开启调试状态后，对应用户网页会源源不断打出 log。

### DOM 断点、事件断点

- DOM 断点，在 dom 元素右键，选择 （Break on subtree modifications），可以在此 dom 被修改时触发断点，在不确定 dom 被哪段 js 脚本修改时可能有用。
- Event Listener Breakpoints，神器之一，对于任何事件都能进入断点，比如 click，touch，script 事件统统能监听。

### 使用错误追踪平台

对错误信息采集、分析、报警是很必要的，这里有一些对外服务：[sentry](https://sentry.io/welcome/) [trackjs](https://trackjs.com/)

### 黑盒调试

SourceMap 可以精准定位到代码，但有时候报错是由某处代码统一抛出的，比如 [invariant](https://github.com/zertosh/invariant) 让人又爱又恨的库，所有定位全部跑到这个库里了（要你有何用），这时候，可以在 DevTools 源码中右键，选中 `BlackBox Script`，它就变成黑盒了，下次 log 的定位将会是准确的。

[FireFox](https://hacks.mozilla.org/2013/08/new-features-of-firefox-developer-tools-episode-25/)、[Chrome](https://umaar.com/dev-tips/128-blackboxing/)。

### 删除无用的 css

Css 不像 Js 一样方便分析规则是否存在冗余，Chrome 帮我们做了这件事：[CSS Tracker](https://umaar.com/dev-tips/126-css-tracker/)。

### 在 Chrome 快速查找元素

Chrome 会记录最后插入的 5 个元素，分别以 `$0` ~ `$4` 的方式在控制台直接输出。

<img src="assets/11/last-item.png" width="500" alt="last-items" />

### Console.table

以表格形式打印，对于对象数组尤为合适。

### 监听特定函数调用

`monitor` 有点像 `proxy`，用 `monitor` 包裹住的 function，在其调用后，会在控制台输出其调用信息。

```javascript
> function func(num){}
> monitor(func)
> func(3)
// < function func called with arguments: 3
```

### 模拟发送请求利器 PostMan

[PostMan](https://www.getpostman.com/products), FireFox 控制台 Network 也支持此功能。

### 找到控制台最后一个对象

有了 `$_`，我们就不需要定义新的对象来打印值了，比如：

```javascript
> [1, 2, 3, 4]
< [1, 2, 3, 4]
> $_.length
// < 4
```

更多控制台相关技巧可以查看：[command-line-reference](https://developers.google.com/web/tools/chrome-devtools/console/command-line-reference?utm_source=dcc&utm_medium=redirect&utm_campaign=2016q3)。

# 3 总结

虽然在抛砖引玉，但整理完之后发现仍然是块砖头，调试技巧繁多，里面包含了通用的、不通用的，精读不可能一一列举。希望大家能根据自己的业务场景，掌握相关的调试技巧，让工作更加高效。

> 讨论地址是：[精读《前端调试技巧》 · Issue #17 · dt-fe/weekly](http://github.com/dt-fe/weekly/issues/17)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




本期精读文章是：[React Higher Order Components in depth](https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e)

# 1 引言

高阶组件（ higher-order component ，HOC ）是 React 中复用组件逻辑的一种进阶技巧。它本身并不是 React 的 API，而是一种 React 组件的设计理念，众多的 React 库已经证明了它的价值，例如耳熟能详的 react-redux。

高阶组件的概念其实并不难，我们能通过类比高阶函数迅速掌握。高阶函数是把函数作为参数传入到函数中并返回一个新的函数。这里我们把函数替换为组件，就是高阶组件了。

`const EnhancedComponent = higherOrderComponent(WrappedComponent);`

当然了解高阶组件的概念只是万里长征第一步，精读文章在阐述其概念与实现外，也强调了其重要性与局限性，以及与其他方案的比较，让我们一起来领略吧。

# 2 内容概要

高阶组件常见有两种实现方式，一种是 Props Proxy，它能够对 WrappedComponent 的 props 进行操作，提取 WrappedComponent state 以及使用其他元素来包裹 WrappedComponent。Props Proxy 作为一层代理，具有隔离的作用，因此传入 WrappedComponent 的 ref 将无法访问到其本身，需要在 Props Proxy 内完成中转，具体可参考以下代码，react-redux 也是这样实现的。

此外各个 Props Proxy 的默认名称是相同的，需要根据 WrappedComponent 来进行不同命名。

```javascript
function ppHOC(WrappedComponent) {
  return class PP extends React.Component {
    // 实现 HOC 不同的命名
    static displayName = `HOC(${WrappedComponent.displayName})`;

    getWrappedInstance() {
      return this.wrappedInstance;
    }

    // 实现 ref 的访问
    setWrappedInstance(ref) {
      this.wrappedInstance = ref;
    }

    render() {
      return <WrappedComponent {
        ...this.props,
        ref: this.setWrappedInstance.bind(this),
      } />
    }
  }
}

@ppHOC
class Example extends React.Component {
  static displayName = 'Example';
  handleClick() { ... }
  ...
}

class App extends React.Component {
  handleClick() {
    this.refs.example.getWrappedInstance().handleClick();
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick.bind(this)}>按钮</button>
        <Example ref="example" />
      </div>
    );
  }
}
```

另一种是 Inheritance Inversion，HOC 类继承了 WrappedComponent，意味着可以访问到 WrappedComponent 的 state、props、生命周期和 render 等方法。如果在 HOC 中定义了与 WrappedComponent 同名方法，将会发生覆盖，就必须手动通过 super 进行调用了。通过完全操作 WrappedComponent 的 render 方法返回的元素树，可以真正实现渲染劫持。这种方案依然是继承的思想，对于 WrappedComponent 也有较强的侵入性，因此并不常见。

```javascript
function ppHOC(WrappedComponent) {
  return class ExampleEnhance extends WrappedComponent {
    ...
    componentDidMount() {
      super.componentDidMount();
    }
    componentWillUnmount() {
      super.componentWillUnmount();
    }
    render() {
      ...
      return super.render();
    }
  }
}
```

# 3 精读

本次提出独到观点的同学有：
[@monkingxue](https://www.zhihu.com/people/turbe-xue) [@alcat2008](https://github.com/alcat2008) [@淡苍](https://www.zhihu.com/people/BlackGanglion) [@camsong](https://www.zhihu.com/people/camsong)，精读由此归纳。

## HOC 的适用范围

对比 HOC 范式 `compose(render)(state)` 与父组件（Parent Component）的范式 `render(render(state))`，如果完全利用 HOC 来实现 React 的 implement，将操作与 view 分离，也未尝不可，但却不优雅。HOC 本质上是统一功能抽象，强调逻辑与 UI 分离。但在实际开发中，前端无法逃离 DOM ，而逻辑与 DOM 的相关性主要呈现 3 种关联形式：

* 与 DOM 相关，建议使用父组件，类似于原生 HTML 编写
* 与 DOM 不相关，如校验、权限、请求发送、数据转换这类，通过数据变化间接控制 DOM，可以使用 HOC 抽象
* 交叉的部分，DOM 相关，但可以做到完全内聚，即这些 DOM 不会和外部有关联，均可

DOM 的渲染适合使用父组件，这是 React JSX 原生支持的方式，清晰易懂。最好是能封装成木偶组件（Dumb Component）。HOC 适合做 DOM 不相关又是多个组件共性的操作。如 Form 中，validator 校验操作就是纯数据操作的，放到了 HOC 中。但 validator 信息没有放到 HOC 中。但如果能把 Error 信息展示这些逻辑能够完全隔离，也可以放到 HOC 中（可结合下一小节 Form 具体实践详细了解）。
数据请求是另一类 DOM 不相关的场景，[react-refetch](https://github.com/heroku/react-refetch) 的实现就是使用了 HOC，做到了高效和优雅：

```javascript
connect(props => ({
  usersFetch: `/users?status=${props.status}&page=${props.page}`,
  userStatsFetch: { url: `/users/stats`, force: true }
}))(UsersList)
```

## HOC 的具体实践

HOC 在真实场景下的运行非常多，之前笔者在 [基于Decorator的组件扩展实践](https://zhuanlan.zhihu.com/p/22054582) 一文中也提过使用高阶组件将更细粒度的组件组合成 Selector 与 Search。结合精读文章，这次让我们通过 Form 组件的抽象来表现 HOC 具有的良好扩展机制。

Form 中会包含各种不同的组件，常见的有 Input、Selector、Checkbox 等等，也会有根据业务需求加入的自定义组件。Form 灵活多变，从功能上看，表单校验可能为单组件值校验，也可能为全表单值校验，可能为常规检验，比如：非空、输入限制，也可能需要与服务端配合，甚至需要根据业务特点进行定制。从 UI 上看，检验结果显示的位置，可能在组件下方，也可能是在组件右侧。

直接裸写 Form，无疑是机械而又重复的。将 Form 中组件的 value 经过 validator，把 value，validator 产生的 error 信息储存到 state 或 redux store 中，然后在 view 层完成显示。这条路大家都是相同的，可以进行复用，只是我们面对的是不同的组件，不同的 validator，不同的 view 而已。对于 Form 而言，既要满足通用，又要满足部分个性化的需求，以往单纯的配置化只会让使用愈加繁琐，我们所需要抽象的是 Form 功能而非 UI，因此通过 HOC 针对 Form 的功能进行提取就成为了必然。

![image](https://user-images.githubusercontent.com/9314735/27116337-3f1f16a8-5103-11e7-8dc6-c7197e1b1eab.png)

至于 HOC 在 Form 上的具体实现，首先将表单中的组件（Input、Selector...）与相应 validator 与组件值回调函数名（trigger）传入 Decorator，将 validator 与 trigger 相绑定。Decorator 完成了各种不同组件与 Form 内置 Store 间 value 的传递、校验功能的抽象，即精读文章中提到 Props Proxy 方式的其中两种作用：**提取state** 与 **操作props**

```javascript
function formFactoryFactory({
  validator,
  trigger = 'onChange',
  ...
}) {
  return FormFactory(WrappedComponent) {
    return class Decorator extends React.Component {
      getBind(trigger, validator) {
        ...
      }
      render() {
        const newProps = {
          ...this.props,
          [trigger]: this.getBind(trigger, validator),
          ...
        }
        return <WrappedComponent {...newProps} />
      }
    }
  }
}

// 调用
formFactoryFactory({
  validator: (value) => {
    return value !== '';
  }
})(<Input placeholder="请输入..." />)
```

当然为了考虑个性化需求，Form Store 也向外暴露很多 API，可以直接获取和修改 value、error 的值。现在我们需要对一个表单的所有值提交到后端进行校验，根据后端返回，分别列出各项的校验错误信息，就需要借助相应项的 setError 去完成了。

这里主要参考了 [rc-form](https://github.com/react-component/form) 的实现方式，有兴趣的读者可以阅读其源码。

```javascript
import { createForm } from 'rc-form';

class Form extends React.Component {
  submit = () => {
    this.props.form.validateFields((error, value) => {
      console.log(error, value);
    });
  }

  render() {
    const { getFieldError, getFieldDecorator } = this.props.form;
    const errors = getFieldError('required');
    return (
      <div>
        {getFieldDecorator('required', {
          rules: [{ required: true }],
        })(<Input />)}
        {errors ? errors.join(',') : null}
        <button onClick={this.submit}>submit</button>
      </div>
    );
  }
}

export createForm()(Form);
```

# 4 总结

React 始终强调组合优于继承的理念，期望通过复用小组件来构建大组件使得开发变得简单而又高效，与传统面向对象思想是截然不同的。高阶函数（HOC）的出现替代了原有 Mixin 侵入式的方案，对比隐式的 Mixin 或是继承，HOC 能够在 Devtools 中显示出来，满足抽象之余，也方便了开发与测试。当然，不可过度抽象是我们始终要秉持的原则。希望读者通过本次阅读与讨论，能结合自己具体的业务开发场景，获得一些启发。

> 讨论地址是：[精读《深入理解 React 高阶组件》 · Issue #18 · dt-fe/weekly](http://github.com/dt-fe/weekly/issues/18)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。


# 1 引言

<img src="assets/13/logo.jpeg" width="500" alt="logo" />

javascript 的 this 是个头痛的话题，本期精读的文章更是引出了一个观点，避免使用 this。我们来看看是否有道理。

本期精读的文章是：[classes-complexity-and-functional-programming](https://medium.com/@kentcdodds/classes-complexity-and-functional-programming-a8dd86903747)

# 2 内容概要

javascript 语言的 this 是个复杂的设计，相比纯对象与纯函数，this 带来了如下问题：

```javascript
const person = new Person('Jane Doe')
const getGreeting = person.getGreeting
// later...
getGreeting() // Uncaught TypeError: Cannot read property 'greeting' of undefined at getGreeting
```

初学者可能突然将 this 弄丢导致程序出错，甚至在 react 中也要使用 `bind` 的方式，使回调可以访问到 `setState` 等函数。

this 也不利于测试，如果使用纯函数，可以通过入参出参做测试，而不需要预先初始化环境。

**所以我们可以避免使用 this**，看如下的例子：

```javascript
function setName(person, strName) {
  return Object.assign({}, person, {name: strName})
}

// bonus function!
function setGreeting(person, newGreeting) {
  return Object.assign({}, person, {greeting: newGreeting})
}

function getName(person) {
  return getPrefixedName('Name', person.name)
}

function getPrefixedName(prefix, name) {
  return `${prefix}: ${name}`
}

function getGreetingCallback(person) {
  const {greeting, name} = person
  return (subject) => `${greeting} ${subject}, I'm ${name}`
}

const person = {greeting: 'Hey there!', name: 'Jane Doe'}
const person2 = setName(person, 'Sarah Doe')
const person3 = setGreeting(person2, 'Hello')
getName(person3) // Name: Sarah Doe
getGreetingCallback(person3)('Jeff') // Hello Jeff, I'm Sarah Doe
```

<img src="assets/13/1.png" width="500" alt="demo1" />

这样 person 实例是个纯对象，没有将方法挂载到原型链上，简单易懂。

或者可以将属性放在上级作用域，避免使用 this，就避免了 this 丢失带来的隐患：

```javascript
function getPerson(initialName) {
  let name = initialName
  const person = {
    setName(strName) {
      name = strName
    },
    greeting: 'Hey there!',
    getName() {
      return getPrefixedName('Name')
    },
    getGreetingCallback() {
      const {greeting} = person
      return (subject) => `${greeting} ${subject}, I'm ${name}`
    },
  }
  function getPrefixedName(prefix) {
    return `${prefix}: ${name}`
  }
  return person
}
```

以上代码没有用到 this，也不会因为 this 产生的问题所困扰。

# 3 精读

本文作者认为，class 带来的困惑主要在于 this，这主要因为成员函数会挂到 prototype 下，虽然多个实例共享了引用，但因此带来的隐患就是 this 的不确定性。js 有许多种 this 丢失情况，比如 `隐式绑定` `别名丢失隐式绑定` `回调丢失隐式绑定` `显式绑定` `new绑定` `箭头函数改变this作用范围` 等等。

由于在 prototype 中的对象依赖 this，如果 this 丢了，就访问不到原型链，不但会引发报错，在写代码时还需要注意 this 的作用范围是很头疼的事。因此作者有如下解决方案：

```javascript
function getPerson(initialName) {
  let name = initialName
  const person = {
    setName(strName) {
      name = strName
    }
  }
  return person
}
```

由此生成的 person 对象不但是个简单 object，由于没有调用 this，也不存在 this 丢失的情况。

这个观点我是不认可的。当然做法没有问题，代码逻辑也正确，也解决了 this 存在的原型链访问丢失问题，但这并不妨碍使用 this。我们看以下代码：

```javascript
class Person {
  setName = (name) => {
    this.name = name
  }
}

const person = new Person()
const setName = person.setName
setName("Jane Doe")
console.log(person)
```

这里用到了 this，也产生了别名丢失隐式绑定，但 this 还能正确访问的原因在于，没有将 setName 的方法放在原型链上，而是放在了每个实例中，因此无论怎么丢失 this，也仅仅丢失了原型链上的方法，但 this 无论如何会首先查找其所在对象的方法，只要方法不放在原型链上，就不用担心丢失的问题。

至于放在原型链上会节约多个实例内存开销问题，函数式也无法避免，如果希望摆脱 this 带来的困扰，class 的方式也可以解决问题。

## 3.1 this 丢失的情况

### 3.1.1 默认绑定

在严格模式与非严格模式下，默认绑定有所区别，非严格模式 this 会绑定到上级作用域，而 `use strict` 时，不会绑定到 window。

```javascript
function foo(){
  console.log(this.count) // 1
  console.log(foo.count) // 2
}
var count = 1
foo.count = 2
foo()
```

```javascript
function foo(){
  "use strict"
  console.log(this.count) // TypeError: count undefined
}
var count = 1
foo()
```

### 3.1.2 隐式绑定

当函数被对象引用起来调用时，this 会绑定到其依附的对象上。

```javascript
function foo(){
  console.log(this.count) // 2
}
var obj = {
  count: 2,
  foo: foo
}
obj.foo()
```

### 3.1.3 别名丢失隐式绑定

调用函数引用时，this 会根据调用者环境而定。

```javascript
function foo(){
  console.log(this.count) // 1
}
var count = 1
var obj = {
  count: 2,
  foo: foo
}
var bar = obj.foo // 函数别名
bar()
```

### 3.1.4 回调丢失隐式绑定

这种情况类似 react 默认的情况，将函数传递给子组件，其调用时，this 会丢失。

```javascript
function foo(){
  console.log(this.count) // 1
}
var count = 1
var obj = {
  count: 2,
  foo: foo
}
setTimeout(obj.foo)
```

## 3.2 this 绑定修复

### 3.2.1 bind 显式绑定

使用 bind 属于显示绑定。

```javascript
function foo(){
  console.log(this.count) // 1
}
var obj = {
  count: 1
}
foo.call(obj)

var bar = foo.bind(obj)
bar()
```

### 3.2.2 es6绑定

这种情况类似使用箭头函数创建成员变量，以下方式等于创建了没有挂载到原型链的匿名函数，因此 this 不会丢失。

```javascript
function foo(){
  setTimeout(() => {
    console.log(this.count) // 2
  })
}
var obj = {
  count: 2
}
foo.call(obj)
```

### 3.2.3 函数 bind

除此之外，我们还可以指定回调函数的作用域，达到 this 指向正确原型链的效果。

```javascript
function foo(){
  setTimeout(function() {
    console.log(this.count) // 2
  }.bind(this))
}
var obj = {
  count: 2
}
foo.call(obj)
```

关于块级作用域也是 this 相关的知识点，由于现在大量使用 `let` `const` 语法，甚至在 `if` 块下也存在块级作用域：

```javascript
if (true) {
  var a = 1
  let b = 2
  const c = 3
}
console.log(a) // 1
console.log(b) // ReferenceError
console.log(c) // ReferenceError
```

# 4 总结

要正视 this 带来的问题，不能因为绑定丢失，引发非预期的报错而避免使用，其根本原因在于 javascript 的原型链机制。这种机制是非常好的，将对象保存在原型链上，可以方便多个实例之间共享，但因此不可避免带来了原型链查找过程，如果对象运行环境发生了变化，其原型链也会发生变化，此时无法享受到共享内存的好处，我们有两种选择：一种是使用 bind 将原型链找到，一种是比较偷懒的将函数放在对象上，而不是原型链上。

自动 bind 的方式 react 之前在框架层面做过，后来由于过于黑盒而取消了。如果为开发者隐藏 this 细节，框架层面自动绑定，看似方便了开发者，但过分提高开发者对 this 的期望，一旦去掉黑魔法，就会有许多开发者不适应 this 带来的困惑，所以不如一开始就将 this 问题透传给开发者，使用自动绑定的装饰器，或者回调处手动 `bind(this)`，或将函数直接放在对象中都可以解决问题。



# Dillinger

[![N|Solid](https://cldup.com/dTxpPi9lDf.thumb.png)](https://nodesource.com/products/nsolid)

Dillinger is a cloud-enabled, mobile-ready, offline-storage, AngularJS powered HTML5 Markdown editor.

  - Type some Markdown on the left
  - See HTML in the right
  - Magic

# New Features!

  - Import a HTML file and watch it magically convert to Markdown
  - Drag and drop images (requires your Dropbox account be linked)


You can also:
  - Import and save files from GitHub, Dropbox, Google Drive and One Drive
  - Drag and drop markdown and HTML files into Dillinger
  - Export documents as Markdown, HTML and PDF

Markdown is a lightweight markup language based on the formatting conventions that people naturally use in email.  As [John Gruber] writes on the [Markdown site][df1]

> The overriding design goal for Markdown's
> formatting syntax is to make it as readable
> as possible. The idea is that a
> Markdown-formatted document should be
> publishable as-is, as plain text, without
> looking like it's been marked up with tags
> or formatting instructions.

This text you see here is *actually* written in Markdown! To get a feel for Markdown's syntax, type some text into the left window and watch the results in the right.

### Tech

Dillinger uses a number of open source projects to work properly:

* [AngularJS] - HTML enhanced for web apps!
* [Ace Editor] - awesome web-based text editor
* [markdown-it] - Markdown parser done right. Fast and easy to extend.
* [Twitter Bootstrap] - great UI boilerplate for modern web apps
* [node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework [@tjholowaychuk]
* [Gulp] - the streaming build system
* [Breakdance](http://breakdance.io) - HTML to Markdown converter
* [jQuery] - duh

And of course Dillinger itself is open source with a [public repository][dill]
 on GitHub.

### Installation

Dillinger requires [Node.js](https://nodejs.org/) v4+ to run.

Install the dependencies and devDependencies and start the server.

```sh
$ cd dillinger
$ npm install -d
$ node app
```

For production environments...

```sh
$ npm install --production
$ NODE_ENV=production node app
```

### Plugins

Dillinger is currently extended with the following plugins. Instructions on how to use them in your own application are linked below.

| Plugin | README |
| ------ | ------ |
| Dropbox | [plugins/dropbox/README.md][PlDb] |
| Github | [plugins/github/README.md][PlGh] |
| Google Drive | [plugins/googledrive/README.md][PlGd] |
| OneDrive | [plugins/onedrive/README.md][PlOd] |
| Medium | [plugins/medium/README.md][PlMe] |
| Google Analytics | [plugins/googleanalytics/README.md][PlGa] |


### Development

Want to contribute? Great!

Dillinger uses Gulp + Webpack for fast developing.
Make a change in your file and instantanously see your updates!

Open your favorite Terminal and run these commands.

First Tab:
```sh
$ node app
```

Second Tab:
```sh
$ gulp watch
```

(optional) Third:
```sh
$ karma test
```
#### Building for source
For production release:
```sh
$ gulp build --prod
```
Generating pre-built zip archives for distribution:
```sh
$ gulp build dist --prod
```
### Docker
Dillinger is very easy to install and deploy in a Docker container.

By default, the Docker will expose port 8080, so change this within the Dockerfile if necessary. When ready, simply use the Dockerfile to build the image.

```sh
cd dillinger
docker build -t joemccann/dillinger:${package.json.version}
```
This will create the dillinger image and pull in the necessary dependencies. Be sure to swap out `${package.json.version}` with the actual version of Dillinger.

Once done, run the Docker image and map the port to whatever you wish on your host. In this example, we simply map port 8000 of the host to port 8080 of the Docker (or whatever port was exposed in the Dockerfile):

```sh
docker run -d -p 8000:8080 --restart="always" <youruser>/dillinger:${package.json.version}
```

Verify the deployment by navigating to your server address in your preferred browser.

```sh
127.0.0.1:8000
```

#### Kubernetes + Google Cloud

See [KUBERNETES.md](https://github.com/joemccann/dillinger/blob/master/KUBERNETES.md)


### Todos

 - Write MORE Tests
 - Add Night Mode

License
----

MIT


**Free Software, Hell Yeah!**

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)


   [dill]: <https://github.com/joemccann/dillinger>
   [git-repo-url]: <https://github.com/joemccann/dillinger.git>
   [john gruber]: <http://daringfireball.net>
   [df1]: <http://daringfireball.net/projects/markdown/>
   [markdown-it]: <https://github.com/markdown-it/markdown-it>
   [Ace Editor]: <http://ace.ajax.org>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [jQuery]: <http://jquery.com>
   [@tjholowaychuk]: <http://twitter.com/tjholowaychuk>
   [express]: <http://expressjs.com>
   [AngularJS]: <http://angularjs.org>
   [Gulp]: <http://gulpjs.com>

   [PlDb]: <https://github.com/joemccann/dillinger/tree/master/plugins/dropbox/README.md>
   [PlGh]: <https://github.com/joemccann/dillinger/tree/master/plugins/github/README.md>
   [PlGd]: <https://github.com/joemccann/dillinger/tree/master/plugins/googledrive/README.md>
   [PlOd]: <https://github.com/joemccann/dillinger/tree/master/plugins/onedrive/README.md>
   [PlMe]: <https://github.com/joemccann/dillinger/tree/master/plugins/medium/README.md>
   [PlGa]: <https://github.com/RahulHP/dillinger/blob/master/plugins/googleanalytics/README.md>




本期精读文章是：[The DCI Architecture](http://www.artima.com/articles/dci_vision.html)

# 1 引言

随着前端ES6 ES7 的一路前行， 我们大前端借鉴和引进了各种其他编程语言中的概念、特性、模式;
我们可以使用函数式Functional编程设计，可以使用面向对象OOP的设计，可以使用面向接口的思想，也可以使用AOP,
可以使用注解，代理、反射，各种设计模式； 在大前端辉煌发展、在数据时代的当下 我们一起阅读了一篇设计相关的老文：
《The DCI Architecture》
一起来再探索和复习一下 相关的设计和思想


# 2 内容摘要

DCI是数据Data 场景Context 交互Interactions 简称， 重点是关注 数据的不同场景的交互行为， 是面向对象系统 状态和行为的一种范式设计；
DCI在许多方面是许多过去范式的统一，多年来这些模式已经成为面向对象编程的辅助工具。

尽管面向切面的编程（AOP）也有其他用途，但DCI满足了许多AOP的应用以及Aspects在解决问题方面的许多目标。根据AOP的基本原理，DCI基于深层次的反射或元编程。
与Aspects不同，角色聚合并组合得很好。Context提供角色集之间的关联的范围关闭，而Aspect仅与应用它们的对象配对。
在许多时候，虽然混合本身缺乏我们在Context语义中发现的动力 ，但DCI反映了混合风格策略。
DCI实现了多范式设计的许多简单目标，能够将过程逻辑与对象逻辑分开。然而，DCI具有比多范式设计提供的更强大的技术更好的耦合和内聚效果

结合ATM 汇款场景案例，讲解了一下 DCI
角色提供了和用户相关 自然的边界，以转账为例，我们实际谈论的是钱的转移，以及源账户和目标账户的角色，算法(用例 角色行为集合)应该是这样：
1.账户拥有人选择从一个账户到另外一个账户的钞票转移。
2.系统显示有效账户
3.用户选择源账户
4.系统显示存在的有效账户
5.账户拥有人选择目标账户。
6.系统需要数额
7.账户拥有人输入数额
8.钞票转移 账户进行中(确认金额 修改账户等操作)

设计者的工作就是把这个用例转化为类似交易的算法，如下：
1.源账户开始交易事务
2.源账户确认余额可用
3.源账户减少其帐目
4.源账户请求目标账户增加其帐目
5.源账户请求目标账户更新其日志log
6.源账户结束交易事务
7.源账户显示给账户拥有人转账成功。


```
template <class ConcreteAccountType>
class TransferMoneySourceAccount: public MoneySource
{
private:
 ConcreteDerived *const self() {
    return static_cast<ConcreteDerived*>(this);
 }
 void transferTo(Currency amount) {
    // This code is reviewable and
    // meaningfully testable with stubs!
    beginTransaction();
    if (self()->availableBalance() < amount) {
      endTransaction();
      throw InsufficientFunds();
    } else {
      self()->decreaseBalance(amount);
      recipient()->increaseBalance (amount);
      self()->updateLog("Transfer Out", DateTime(),
                amount);
      recipient()->updateLog("Transfer In",
             DateTime(), amount);
    }
    gui->displayScreen(SUCCESS_DEPOSIT_SCREEN);
    endTransaction();
 }


```

# 3 精读

本次提出独到观点的同学有：[@ascoders](https://github.com/ascoders)、[@TingGe](https://github.com/TingGe)、[@zy](https://github.com/zhaoyangsoft)，精读由此归纳。

## 尝试从人类思维角度出发 理解

DCI 即 数据(data) 场景(context) 交互(interactive)。

DCI 之所以被提出，是因为传统 mvc 代码，在越来越丰富的交互需求中**变得越来越难读**。有人会觉得，复杂的需求 mvc 也可以 cover 住，诚然如此，但很少有人能只读一遍源码就能理解程序处理了哪些事情，这是因为人类思维与 mvc 的传统程序设计思想存在鸿沟，我们需要脑补内容很多，才会觉得难度。

现在仍有大量程序**使用面向对象的思想表达交互行为**，当我们把所有对象之间的关联记录在脑海中时，可能对象之间交互行为会比较清楚，但任无法轻松理解，因为对象的封装会导致内聚性不断增加，交互逻辑会在不同对象之间跳转，对象之间的嵌套关系在复杂系统中无疑是一个理解负担。

DCI 尝试从人类思维角度出发，举一个例子：为什么在看电影时会轻轻松松的理解故事主线呢？回想一下我们看电影的过程，看到一个画面时，我们会思考三件事：

1. 画面里有什么人或物？
2. 人或物发生了什么行为、交互？
3. 现在在哪？厨房？太空舱？或者原始森林？

很快把这三件事弄清楚，我们就能快速理解当前场景的逻辑，并且**轻松理解该场景继续发生的状况**，即便是盗梦空间这种烧脑的电影，当我们搞清楚这三个问题后，就算街道发生了180度扭曲，也不会存在理解障碍，反而可以吃着爆米花享受，直到切换到下一个场景为止。

当我们把街道扭曲 180 度的能力放在街道对象上时，理解就变的复杂了：这个函数什么时候被调用？为什么不好好承载车辆而自己发生扭曲？这就像电影开始时，把电影里播放的所有关于街道的状态都走马灯过一遍：我们看到街道通过了车辆、又卷曲、又发生了爆炸，实在觉得莫名其妙。

理解代码也是如此，当交互行为复杂时，把交互和场景分别抽象出来，以场景为切入点交互数据。

举个例子，传统的 mvc 可能会这么组织代码：

`UserModel`:

```javascript
class My {
  private name = "ascoders" // 名字
  private skills = ["javascript", "nodejs", "切图"] // 技能
  private hp = 100 // 生命值？？
  private account = new Account() // 账户相关
}
```

`UserController`:

```javascript
class Controller {
  private my = new My()
  private account = new Account()
  private accountController = new AccountController()

  public cook() {
    // 做饭
  }

  public coding() {
    // 写代码
  }

  public fireball() {
    // 搓火球术。。？
  }

  public underAttack() {
    // 受到攻击？？
  }

  public pay() {
    // 支付，用到了 account 与 accountController
  }
}
```

这只是我自己的行为，当我这个对象，与文章对象、付款行为发生联动时，就发生了各种各样的跳转。到目前为止我还不是非常排斥这种做法，毕竟这样是非常主流的，前端数据管理中，不论是 redux，还是 mobx，都类似 MVC。

不论如何，尝试一下 DCI 的思路吧，看看是否会像看电影一样轻松的理解代码：

以上面向对象思想主要表达了 4 个场景，家庭、工作、梦境、购物：

1. home.scene.scala
2. work.scene.scala
3. dream.scene.scala
4. buy.scene.scala

以程序员工作为例，在工作场景下，写代码可以填充我们的钱包，那么我们看到一个程序员的钱包：

`codingWallet.scala`:

```scala
case class CodingWallet(name: String, var balance: Int) {
  def coding(line: Int) { balance += line * 1 }
}
```

写一行代码可以赚 1 块钱，它不需要知道在哪个场景被使用，程序员的钱包只要关注把代码变成钱。

交互是基于场景的，所以交互属于场景，写代码赚钱的交互，放在工作场景中：

`work.scene.scala`：

```scala
object MoneyTransferApp extends App {

  @context
  class MoneyTransfer(wallet: CodingWallet, time: int) {
    // 在这个场景中，工作 1 小时，可以写 100 行代码
    // 开始工作！
    wallet.working

    role wallet {
      def working() {
        wallet.coding(time)
      }
    }
  }

  // 钱包默认有 3000 元
  val wallet = CodingWallet("wallet", 3000)

  // 初始化工作场景，工作了 1 小时
  new MoneyTransfer(wallet, 1)

  // 此时钱包一共拥有 3100 元
  println(wallet.balance)
}
```

小结：，就是把数据与交互分开，额外增加了**场景**，交互属于场景，获取数据进行交互。原文的这张图描述了 DCI 与 MVC 之间的关系：

![image](https://user-images.githubusercontent.com/7970947/27719998-294f4356-5d89-11e7-99af-8811a782cd50.png)


## 发现并梳理现代前端模式和概念的蛛丝马迹

现代前端受益于低门槛和开放，伴随 OO 和各种 MV＊ 盛行，也出现了越来越多的概念、模式和实践。而 DCI 作为 MVC 的补充，试图通过引入函数式编程的一些概念，来平衡 OO 、数据结构和算法模型。值得我们津津乐道的如 Mixins、Multiple dispatch、 依赖注入（DI）、Multi-paradigm design、面向切面编程（AOP）都是不错的。如果对这些感兴趣，深挖下 AngularJS 在这方面的实践会有不少收获。
当然，也有另辟途径的，如 Flux 则采用了 DDD/CQRS 架构。

软件架构设计，是一个很大的话题，也是值得每位工程师长期实践和思考的内容。个人的几点体会：
1. 一个架构，往往强调职责分离，通过分层和依赖原则，来解决程序内、程序间的相互通讯问题；
2. 知道最好的几种可能的架构，可以轻松地创建一个适合的优化方案；
3. 最后，必须要记住，程序必须遵循的架构。

分享些架构相关的文章：

-  [Comparison of Architecture presentation patterns MVP(SC),MVP(PV),PM,MVVM and MVC](https://www.codeproject.com/Articles/66585/Comparison-of-Architecture-presentation-patterns-M)
-  [The DCI Architecture: A New Vision of Object-Oriented Programming](http://www.artima.com/articles/dci_vision.html)
- [干净的架构The Clean Architecture](https://www.bbsmax.com/A/pRdBWY3ezn/)
- [MVC的替代方案](https://gxnotes.com/article/71237.html)
- [展示模式架构比较MVP(SC)，MVP(PV)，PM，MVVM和MVC](http://blog.csdn.net/lihenair/article/details/51791915)
- [Software Architecture Design](https://github.com/zenany/weekly/blob/master/resources/software_architecture.md)
- [【译】什么是 Flux 架构？（兼谈 DDD 和 CQRS）](https://blog.jimmylv.info/2016-07-07-what-the-flux-on-flux-ddd-and-cqrs/)


## 结合DCI 设想开发的过程中使用到一些设计方法和原则

我们在开发的过程中多多少少都会使用到一些设计方法和原则
DCI 重点是关注 数据的不同场景的交互行为， 是面向对象系统 状态和行为的一种范式设计；

它能够将过程逻辑与对象逻辑分开，是一种典型的行为模式设计；
很好的点是 它根据AOP的基本原理，DCI 提出基于AOP 深层次的元编程(可以理解成面向接口编程)， 去促使系统的内聚效果和降低耦合度；

举个例子：
在一个BI系统中， 在业务的发展中， 这个系统使用到了多套的 底层图表库，比如： Echarts, G2，Recharts, FusionChart;  等等；

那么问题来了，
1.  如何去同时支持 这些底层库， 并且达到很容易切换的一个效果？
2.  如何去面向未来的考虑 将来接入更多类型的图表？
3.  如何去考虑扩展业务 对图表的日益增强的业务功能(如: 行列转换、智能格式化 等等)

带着这些问题， 我们再来看下 DCI 给我们的启示， 我们来试试看相应的解法:
1. 图表的模型数据就是 数据Data , 我们可以把[日益增强的业务功能] 认为是各个场景交互Interactions;
2. 接入更多类型的图表咋么搞？
 不同类型的图表其实是图表数据模型的转换，我们也可以把这些转换的行为过程作为一个个的切片(Aspect)，每个切片都是独立的， 松耦合的 ;
![image](https://user-images.githubusercontent.com/1456421/27744526-67fd0e3e-5d85-11e7-9b48-e1934d9b15f3.png)

3. 接入多套底层库怎么搞？ 每个图形库的  build方法，render 方法 ， resize 方法，repaint 方法 都不一样 ，怎么搞 ?  我们可以使用 DCI 提到的元编程- 我们在这里理解为面向接口编程， 我们分装一层 统一的接口；
利用面向接口的父类引用指向子类对象  我们就可以很方便的 接入更多的 implement 接入更多的图形库(当然，一个系统统一一套是最好的)；



# 4 总结

DCI是数据Data 场景Context 交互Interactions的简称，DCI是一种特别关注行为的设计模式(行为模式)，
DCI 关注数据不同场景的交互行为， 是面向对象 状态和行为的一种范式设计；DCI 尝试从人类思维，过程化设计一些行为；
DCI 也会使用一些面向切面和接口编程的设计思想去达到高内聚低耦合的目标。

> 讨论地址是：[精读《架构设计 之 DCI》 · Issue #20 · dt-fe/weekly](https://github.com/dt-fe/weekly/issues/20)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题， 欢迎来一起学习 共同探索。




### 科学公式 TeX(KaTeX)

$$E=mc^2$$

行内的公式$$E=mc^2$$行内的公式，行内的$$E=mc^2$$公式。

$$\(\sqrt{3x-1}+(1+x)^2\)$$

$$\sin(\alpha)^{\theta}=\sum_{i=0}^{n}(x^i + \cos(f))$$

多行公式：

```math
\displaystyle
\left( \sum\_{k=1}^n a\_k b\_k \right)^2
\leq
\left( \sum\_{k=1}^n a\_k^2 \right)
\left( \sum\_{k=1}^n b\_k^2 \right)
```

```katex
\displaystyle
    \frac{1}{
        \Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{
        \frac25 \pi}} = 1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {
        1+\frac{e^{-6\pi}}
        {1+\frac{e^{-8\pi}}
         {1+\cdots} }
        }
    }
```

```latex
f(x) = \int_{-\infty}^\infty
    \hat f(\xi)\,e^{2 \pi i \xi x}
    \,d\xi
```



#### Setting

    {
        tex  : true
    }

#### Custom KaTeX source URL

```javascript
// Default using CloudFlare KaTeX's CDN
// You can custom url
editormd.katexURL = {
    js  : "your url",  // default: //cdnjs.cloudflare.com/ajax/libs/KaTeX/0.3.0/katex.min
    css : "your url"   // default: //cdnjs.cloudflare.com/ajax/libs/KaTeX/0.3.0/katex.min
};
```

#### Examples

##### 行内的公式 Inline

$$E=mc^2$$

Inline 行内的公式 $$E=mc^2$$ 行内的公式，行内的$$E=mc^2$$公式。

$$c = \\pm\\sqrt{a^2 + b^2}$$

$$x > y$$

$$f(x) = x^2$$

$$\alpha = \sqrt{1-e^2}$$

$$\(\sqrt{3x-1}+(1+x)^2\)$$

$$\sin(\alpha)^{\theta}=\sum_{i=0}^{n}(x^i + \cos(f))$$

$$\\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

$$f(x) = \int_{-\infty}^\infty\hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi$$

$$\displaystyle \frac{1}{\Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{\frac25 \pi}} = 1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}} {1+\frac{e^{-8\pi}} {1+\cdots} } } }$$

$$\displaystyle \left( \sum\_{k=1}^n a\_k b\_k \right)^2 \leq \left( \sum\_{k=1}^n a\_k^2 \right) \left( \sum\_{k=1}^n b\_k^2 \right)$$

$$a^2$$

$$a^{2+2}$$

$$a_2$$

$${x_2}^3$$

$$x_2^3$$

$$10^{10^{8}}$$

$$a_{i,j}$$

$$_nP_k$$

$$c = \pm\sqrt{a^2 + b^2}$$

$$\frac{1}{2}=0.5$$

$$\dfrac{k}{k-1} = 0.5$$

$$\dbinom{n}{k} \binom{n}{k}$$

$$\oint_C x^3\, dx + 4y^2\, dy$$

$$\bigcap_1^n p   \bigcup_1^k p$$

$$e^{i \pi} + 1 = 0$$

$$\left ( \frac{1}{2} \right )$$

$$x_{1,2}=\frac{-b\pm\sqrt{\color{Red}b^2-4ac}}{2a}$$

$${\color{Blue}x^2}+{\color{YellowOrange}2x}-{\color{OliveGreen}1}$$

$$\textstyle \sum_{k=1}^N k^2$$

$$\dfrac{ \tfrac{1}{2}[1-(\tfrac{1}{2})^n] }{ 1-\tfrac{1}{2} } = s_n$$

$$\binom{n}{k}$$

$$0+1+2+3+4+5+6+7+8+9+10+11+12+13+14+15+16+17+18+19+20+\cdots$$

$$\sum_{k=1}^N k^2$$

$$\textstyle \sum_{k=1}^N k^2$$

$$\prod_{i=1}^N x_i$$

$$\textstyle \prod_{i=1}^N x_i$$

$$\coprod_{i=1}^N x_i$$

$$\textstyle \coprod_{i=1}^N x_i$$

$$\int_{1}^{3}\frac{e^3/x}{x^2}\, dx$$

$$\int_C x^3\, dx + 4y^2\, dy$$

$${}_1^2\!\Omega_3^4$$

##### 多行公式 Multi line

> \`\`\`math or \`\`\`latex or \`\`\`katex

```math
f(x) = \int_{-\infty}^\infty
    \hat f(\xi)\,e^{2 \pi i \xi x}
    \,d\xi
```

```math
\displaystyle
\left( \sum\_{k=1}^n a\_k b\_k \right)^2
\leq
\left( \sum\_{k=1}^n a\_k^2 \right)
\left( \sum\_{k=1}^n b\_k^2 \right)
```

```math
\dfrac{
    \tfrac{1}{2}[1-(\tfrac{1}{2})^n] }
    { 1-\tfrac{1}{2} } = s_n
```

```katex
\displaystyle
    \frac{1}{
        \Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{
        \frac25 \pi}} = 1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {
        1+\frac{e^{-6\pi}}
        {1+\frac{e^{-8\pi}}
         {1+\cdots} }
        }
    }
```

```latex
f(x) = \int_{-\infty}^\infty
    \hat f(\xi)\,e^{2 \pi i \xi x}
    \,d\xi
```

#### KaTeX vs MathJax

[https://jsperf.com/katex-vs-mathjax](https://jsperf.com/katex-vs-mathjax "KaTeX vs MathJax")



本期精读文章是：[TC39, ECMAScript, and the Future of JavaScript]( https://ponyfoo.com/articles/tc39-ecmascript-proposals-future-of-javascript)

# 1 引言

<img src="assets/15/juanzhou.png" alt="logo" width="500" />

觉得 es6 es7 动不动就加新特性很烦？提案的讨论已经放开了，每个人都可以做 js 的主人，赶快与我一起了解下有哪些特性在日程中！

# 2 内容概要

### TC39是什么？包括哪些人？

一个推动 JavaScript 发展的委员会，由各个主流浏览器厂商的代表构成。

### 为什么会出现这样一个组织？

从标准到落地是一个漫长的过程，相信大家上次阅读 web components 就能体会到标准到浏览器支持是一个漫长的过程。

### TC39 这群人主要的工作是什么？

制定ECMAScript标准，标准生成的流程，并实现。

### 标准的流程是什么样的？

包括五个步骤：

- stage0 `strawman`

任何讨论、想法、改变或者还没加到提案的特性都在这个阶段。只有TC39成员可以提交。

- stage1 `proposal`
（1）产出一个正式的提案。
（2）发现潜在的问题，例如与其他特性的关系，实现难题。
（3）提案包括详细的API描述，使用例子，以及关于相关的语义和算法。

- stage2 `draft`
（1）提供一个初始的草案规范，与最终标准中包含的特性不会有太大差别。草案之后，原则上只接受增量修改。
（2）开始实验如何实现，实现形式包括polyfill, 实现引擎（提供草案执行本地支持），或者编译转换（例如babel）

- stage3 `candidate`
（1）候选阶段，获得具体实现和用户的反馈。此后，只有在实现和使用过程中出现了重大问题才会修改。
（1）规范文档必须是完整的，评审人和ECMAScript的编辑要在规范上签字。
（2）至少要在一个浏览器中实现，提供polyfill或者babel插件。

- stage4 `finished`
（1）已经准备就绪，该特性会出现在下个版本的ECMAScript规范之中。。
（2）需要通过有2个独立的实现并通过验收测试，以获取使用过程中的重要实践经验。

### 一般可以去哪里查看TC39标准的进程呢？

stage0 的提案 https://github.com/tc39/proposals/blob/master/stage-0-proposals.md
stage1 - 4 的提案 https://github.com/tc39/proposals

### 我们怎么在程序中应用这些新特性呢？

babel的插件：`babel-presets-stage-0` `babel-presets-stage-1` `babel-presets-stage-2` `babel-presets-stage-3` `babel-presets-stage-4`

# 3 精读

本次提出独到观点的同学有：
[@huxiaoyun](https://github.com/huxiaoyun) [@monkingxue](https://github.com/monkingxue) [@jasonslyvia](https://github.com/jasonslyvia) [@ascoders](https://github.com/ascoders)，精读由此归纳。

## 3.1 Stage 4 大家庭

### [Array.prototype.includes](https://github.com/tc39/Array.prototype.includes/)

```javascript
assert([1, 2, 3].includes(2) === true);
assert([1, 2, 3].includes(4) === false);

assert([1, 2, NaN].includes(NaN) === true);

assert([1, 2, -0].includes(+0) === true);
assert([1, 2, +0].includes(-0) === true);

assert(["a", "b", "c"].includes("a") === true);
assert(["a", "b", "c"].includes("a", 1) === false);
```

这个 api 很方便，没有悬念的进入了草案中。

曾争议过是否使用 Array.prototype.contains，但由于 [不兼容因素](https://esdiscuss.org/topic/having-a-non-enumerable-array-prototype-contains-may-not-be-web-compatible) 而换成了 includes。

### [Exponentiation operator](https://github.com/rwaldron/exponentiation-operator)

```javascript
// x ** y

let squared = 2 ** 2;
// same as: 2 * 2

let cubed = 2 ** 3;
// same as: 2 * 2 * 2
```

列表中进入了 stage4，但其 git 仓库 readme 还停留在 stage3。。

虽然已经有 `Math.pow` 了，但由于其他语言都支持此方式，js 也就支持了。

### [Object.values/Object.entries](https://github.com/tc39/proposal-object-values-entries)

```javascript
Object.values({
	a: 1,
	b: 2,
	c: Symbol(),
}) // [1, 2, Symbol()]

Object.entries({
	a: 1,
	b: 2,
	c: Symbol(),
}) // [["a", 1], ["b", 2], ["c", Symbol()]]
```

也没有什么争议，Object.keys 都有了，获取 values、entries 也是合理的。

TC39 会议中有争辩过为何不返回迭代器，原因挺有意思，因为 Object.keys 返回的是数组，所以这两个 api 还是与老大哥统一吧。

### [String.prototype.padStart / String.prototype.padEnd](https://github.com/tc39/proposal-string-pad-start-end)

```javascript
"foo".padStart(5, "bar") // bafoo
"foo".padEnd(5, "bar") // fooba
```

解决了字符串补齐需求，很棒！

### [Object.getOwnPropertyDescriptors](https://github.com/tc39/proposal-object-getownpropertydescriptors)

```javascript
Object.getOwnPropertyDescriptors({ a: 1})
// { a: {
// 	  configurable: true,
// 	  enumberable: true,
// 	  value: 1,
//	  writable: true
// } }
```

特别是 babel 与 typescript 处理 class property decorator 方式不同的时候（typescript 处理得更成熟一些），会导致 babel 处理装饰器时，成员变量不设置默认值时，configurable 默认为 false，通过这个函数检查变量的配置很方便。

### [Trailing commas in function parameter lists and calls](https://github.com/tc39/proposal-trailing-function-commas)

```javascript
function clownPuppiesEverywhere(
   param1,
   param2, // Next parameter that's added only has to add a new line, not modify this line
 ) { /* ... */ }
```

js 终于原生支持了，以前不支持的时候多加逗号还会报错，需要预编译工具删除最后一个逗号，现在终于名正言顺了。

### [Async functions](https://github.com/tc39/ecmascript-asyncawait)

这个不用多说了，都说好用。

### [Shared memory and atomics](https://github.com/tc39/ecmascript_sharedmem)

这是 ECMAScript 共享内存与 Atomics 的规范，涉及内容非常多，主要涉及到 asm.js。

asm.js 是一种性能解决方案，比如可以定义一个精确的 64k 堆：

```javascript
var heap = new ArrayBuffer( 0x10000 )
```

### [Lifting template literal restriction](https://github.com/tc39/proposal-template-literal-revision)

```javascript
styled.div`
  background-color: red;
`
```

`styled.div = text => {}` 就可以处理了，目前使用最多在 styled-components 库里，这种场景还是蛮方便的。

## 3.2 Stage 3 大家庭

### [Function.prototype.toString revision](https://github.com/tc39/Function-prototype-toString-revision)

对函数的 toString 规则进行了修改：http://tc39.github.io/Function-prototype-toString-revision/#sec-function.prototype.tostring

当调用内置函数或 `.bind` 后函数，toString 方法会返回 [NativeFunction](http://tc39.github.io/Function-prototype-toString-revision/#prod-NativeFunction)。

### [global](https://github.com/tc39/proposal-global)

为 ECMAScript 规范添加 `global` 变量，同构代码再也不用这么写了：

```javascript
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
};
```

虽然前端环境与 nodejs 区别很大，但既然提案进入了 stage3，说明大家非常关注 js 整体的生态，只要整体方向良性发展，相信不久将会进入 stage4。

### [Rest/Spread Properties](https://github.com/tc39/proposal-object-rest-spread)

```javascript
let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

不得不说，非常常用，而且 [babel](https://babeljs.io/docs/plugins/transform-object-rest-spread/)，[jsTransform](https://github.com/facebookarchive/jstransform)，[typescript](https://github.com/Microsoft/TypeScript) 均支持，感觉很快会进入 stage4.

### [Asynchronous Iteration](https://github.com/tc39/proposal-async-iteration)

```javascript
const { value, done } = syncIterator.next();

asyncIterator.next().then(({ value, done }) => /* ... */);
```

```javascript
for await (const line of readLines(filePath)) {
  console.log(line);
}
```

```javascript
async function* readLines(path) {
  let file = await fileOpen(path);

  try {
    while (!file.EOF) {
      yield await file.readLine();
    }
  } finally {
    await file.close();
  }
}
```

异步迭代器实现了 async await 与 generator 的结合。
然而 async await 是使用 generator 的语法糖，generator 也可以通过 switch 等流程控制函数模拟。更重要的是异步在 generator 中本身就可以实现，我在[《Callback Promise Generator Async-Await 和异常处理的演进》](https://github.com/ascoders/blog/issues/14) 文章中提过。

语法的修改一定不能为了方便（在 ECMAScript 中可能出现），但这种混杂的方式容易让人混淆 await 与 generator 之间的关系，是否进入 stage4 还需仔细斟酌。

### [import()](https://github.com/tc39/proposal-dynamic-import)

```javascript
import(`./section-modules/${link.dataset.entryModule}.js`)
    .then(module => {
      module.loadPageInto(main);
    })
    .catch(err => {
      main.textContent = err.message;
    });
```

这个提案主要增加了函数调用版的 import，而 webpack 等构建工具也在积极实现此规范，并作为动态加载的最佳范例。希望这种“官方 Amd”可以早日加入草案。

### [RegExp Lookbehind Assertions](https://github.com/tc39/proposal-regexp-lookbehind)

javascript 正则表达式一直不支持后行断言，不过现在已经进入 stage3，相信不久会进入 stage4.

前向断言：

```javascript
/\d+(?=%)/.exec("100% of US presidents have been male") // ["100"]
/\d+(?!%)/.exec("that’s all 44 of them") // ["44"]
```

后向断言：

```javascript
/(?<=\$)\d+/.exec("Benjamin Franklin is on the $100 bill")  // ["100"]
/(?<!\$)\d+/.exec("it’s is worth about €90")                // ["90"]
```

后向断言会获取某个字符后面跟的内容，在获取美刀等货币单位上有很大用途。chrome 可以使用 `chrome.exe --js-flags="--harmony-regexp-lookbehind"` 命令开启。

### [RegExp Unicode Property Escapes](https://github.com/tc39/proposal-regexp-unicode-property-escapes)

```javascript
const regexGreekSymbol = /\p{Script=Greek}/u;
regexGreekSymbol.test('π');
// → true
```

以上 `π` 字符是一个希腊字符，通过指定 `\p{Script=Greek}` 就可以匹配这个字符了！

虽然可以通过引用希腊字符（或者其他编码）表做正则处理，当每当更新表时，更新起来会非常麻烦，不如让浏览器原生支持 `\p{UnicodePropertyName=UnicodePropertyValue}` 的正则语法，帮助开发人员解决这个烦恼。

### [RegExp named capture groups](https://github.com/tc39/proposal-regexp-named-groups)

```javascript
let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u;
let result = re.exec('2015-01-02');
// result.groups.year === '2015';
// result.groups.month === '01';
// result.groups.day === '02';

// result[0] === '2015-01-02';
// result[1] === '2015';
// result[2] === '01';
// result[3] === '02';
```

```javascript
let {groups: {one, two}} = /^(?<one>.*):(?<two>.*)$/u.exec('foo:bar');
console.log(`one: ${one}, two: ${two}`);  // prints one: foo, two: bar
```

同时，还支持 **反向引用能力**，可以通过 `\k<name>` 的语法，在正则中表示同一种匹配类型，这个和 ts 范型很像：

```javascript
let duplicate = /^(?<half>.*).\k<half>$/u;
duplicate.test('a*b'); // false
duplicate.test('a*a'); // true
```

总体来看非常给力，毫无意义的下标也是正则反人类的原因之一，这个提案通过的话，正则会变得更加可读。

### [s (dotAll) flag for regular expressions](https://github.com/tc39/proposals)

```javascript
/foo.bar/s.test('foo\nbar');
// → true
```

通过添加了新的标识符 `/s`，表示 `.` 这个标志可以匹配任何值。原因是觉得现在正则的做法比较反人类：

```javascript
/foo[^]bar/.test('foo\nbar');
// → true
/foo[\s\S]bar/.test('foo\nbar');
// → true
```

从保守派角度来看，可能因为掌握了 `[^]` `[\s\S]` 这种奇技淫巧而沾沾自喜，借此提高正则的门槛，让初学者“看不懂”，而高级语言的第一要义是可读性，`RegExp Unicode Property Escapes` 与 `RegExp named capture groups` 进入草案就是表明了对正则语义化改进的决心，相信这个提案也会被采纳。

### [Legacy RegExp features in JavaScript](https://github.com/tc39/proposal-regexp-legacy-features)

该提案主要针对 RegExp 遗留的静态属性进行梳理。平时很少接触，希望了解的人解读一下。

## 3.3 Stage2 大家庭

### [function.sent metaproperty](https://github.com/allenwb/ESideas/blob/master/Generator%20metaproperty.md)

generator 的第一个 `.next` 参数会被抛弃，因为第一次 next 没有对应上任何 `yield`，如下代码就会产生疑惑：

```javascript
function *adder(total=0) {
   let increment=1;
   while (true) {
       switch (request = yield total += increment) {
          case undefined: break;
          case "done": return total;
          default: increment = Number(request);
       }
   }
}

let tally = adder();
tally.next(0.1); // argument will be ignored
tally.next(0.1);
tally.next(0.1);
let last=tally.next("done");
console.log(last.value);  //1.2 instead of 0.3
```

当引入 `function.sent` 后，可以接收来自 next 的传值，**包括初始传值**：

```javascript
function *adder(total=0) {
   let increment=1;
   do {
       switch (request = function.sent){
          case undefined: break;
          case "done": return total;
          default: increment = Number(request);
       }
       yield total += increment;
   } while (true)
}

let tally = adder();
tally.next(0.1); // argument no longer ignored
tally.next(0.1);
tally.next(0.1);
let last=tally.next("done");
console.log(last.value);  //0.3
```

这是个很棒的特性，也不存在语意兼容问题，但 api 还是比较怪，而且自此 yield 接收参数也变得没有意义，况且如今 async await 逐渐成为主流，这种修正没有强烈刚需。而且 yield 的语意本身没有错误，这个提案比较危险。

### [String.prototype.{trimStart,trimEnd}](https://github.com/tc39/proposal-string-left-right-trim)

既然 `padStart` 与 `padEnd` 都进入了 stage4，`trimStart` `trimEnd` 这两个 api 也非常常用，而且从 ES5 将 `String.prototype.trim` 引入了标准来看，这两个非常有望晋升到 stage3。

### [Class Fields](https://github.com/tc39/proposal-class-fields)

```javascript
class Counter extends HTMLElement {
  x = 0;
  #y = 1;
}
```

类成员变量，有了它 js 就完整了。虽然觉得似有变量符号很难看，但成员变量绝对是非常有用的语法，在 react 中已经很常用了：

```javascript
class Todo extends React.Component {
  state = { //.. }
}
```

### [Promise.prototype.finally](https://github.com/tc39/proposal-promise-finally)

就像 `try/catch/finally` 一样，try return 了都能执行 finally，是非常方便的，对 promise 来说也是如此，[bluebird](https://github.com/petkaantonov/bluebird) [Q](https://github.com/kriskowal/q/wiki/API-Reference#promisefinallycallback) 等库已经实现了此功能。

但是库实现不足以使其纳入标准，只有当这些需求足够常用和通用时才会考虑。第三方库可能从竞争力角度考虑，多支持一种功能、少些一行代码就是多一份筹码，但语言规范是不能在乎这些的。

### [Class and Property Decorators](http://tc39.github.io/proposal-decorators/)

类级别的装饰器已经进入 stage2 了，但现代前端开发中已经非常常用，很可能会进一步进入 stage3.

如果这个提案被废弃，那么大部分现代 js 代码将面临大量使用不存在语法的窘境。不过乐观的是，目前还找不到更好的装饰器替代方案，而在 python 中也存在装饰器模式可以参考。

### [Intl.Segmenter](https://github.com/tc39/proposal-intl-segmenter)

```javascript
// Create a segmenter in your locale
let segmenter = new Intl.Segmenter("fr", {granularity: "word"});

// Get an iterator over a string
let iterator = segmenter.segment("Ceci n'est pas une pipe");

// Iterate over it!
for (let {segment, breakType} of iterator) {
  console.log(`segment: ${segment} breakType: ${breakType}`);
  break;
}

// logs the following to the console:
// segment: Ceci breakType: letter
```

`Intl.Segmenter` 可以帮助分析单词断句分析，可能在 nlp 领域比较有用，在文本编辑器自动选中功能中也很有用。

虽然不是刚需，但 js 作为网页交互的语言，确实需要解决分析用户输入的问题。

### [Arbitrary-precision Integers](https://github.com/tc39/proposal-bigint)

新增了基本类型：整数类型，以及 Integer api 与字面语法 1234n。

目前 js 使用 64 位浮点数处理所有计算，直接导致了运算效率低下，这个提案弥补了 js 的计算缺点，希望可以早日进入草案。

提案名称由 Integer 改为 BigInt。

### [import.meta](https://github.com/tc39/proposals)

提出了使用 `import.meta` 获取当前模块的域信息。类比 nodejs 存在 `__dirname` 等信息标志当前脚本信息，通过浏览器加载的模块也应当拥有这种能力。

目前 js 可以通过如下方式获取脚本信息：

```javascript
const theOption = document.currentScript.dataset.option;
```

这样污染了全局变量，脚本信息应当存储在脚本作用域中，因此提案希望将脚本信息存储在脚本的 `import.meta`  变量中，因此可以这么使用：

```javascript
(async () => {
  const response = await fetch(new URL("../hamsters.jpg", import.meta.url));
  const blob = await response.blob();

  const size = import.meta.scriptElement.dataset.size || 300;

  const image = new Image();
  image.src = URL.createObjectURL(blob);
  image.width = image.height = size;

  document.body.appendChild(image);
})();
```

## 3.4 Stage1 大家庭

### [Date.parse fallback semantics](https://github.com/FaustDeGoethe/proposal-date-time-string-format)

通过字符串格式化日期一直是跨浏览器的痛点，本提案希望通过新增 `Date.parse` 标准完成这个功能。

> "The function first attempts to parse the format of the String according to the rules
> (including extended years) called out in Date Time String Format (20.3.1.16). If the
> String does not conform to that format the function may fall back to any
> implementation-specific heuristics or implementation-specific date formats."

正如提案所说，“如果字符串不满足  ISO 8601 格式，可以返回你想返回的任何值” 这样迷惑开发者是没有任何意义的，这样只会让开发者越来越不相信 js 是跨平台的语言。

这么重要的规范居然才 stage1，必须要顶上去。

### [export * as ns from "mod"; statements](https://github.com/tc39/proposal-export-ns-from)

```javascript
export * as someIdentifier from "someModule";
```

很方便的 api，很多时候希望导出某个模块的全部接口，又不希望命名冲突，可以少写一行 import。


### [export v from "mod"; statements](https://github.com/tc39/proposal-export-default-from)

这个提案与 [export * as ns from "mod"; statements](https://github.com/tc39/proposal-export-ns-from)
 冲突了，感觉 [export * as ns from "mod"; statements](https://github.com/tc39/proposal-export-ns-from)
 提案更清晰一些。

### [Observable](https://github.com/tc39/proposal-observable)

可观察类型可以从 dom 事件、轮询等触发事件中创建监听并订阅：

```javascript
function listen(element, eventName) {
    return new Observable(observer => {
        // Create an event handler which sends data to the sink
        let handler = event => observer.next(event);

        // Attach the event handler
        element.addEventListener(eventName, handler, true);

        // Return a cleanup function which will cancel the event stream
        return () => {
            // Detach the event handler from the element
            element.removeEventListener(eventName, handler, true);
        };
    });
}

// Return an observable of special key down commands
function commandKeys(element) {
    let keyCommands = { "38": "up", "40": "down" };

    return listen(element, "keydown")
        .filter(event => event.keyCode in keyCommands)
        .map(event => keyCommands[event.keyCode])
}

let subscription = commandKeys(inputElement).subscribe({
    next(val) { console.log("Received key command: " + val) },
    error(err) { console.log("Received an error: " + err) },
    complete() { console.log("Stream complete") },
});
```

这个名字和 Object.observe 很像，不过没什么关系。该功能已经被 [RxJS](https://github.com/ReactiveX/RxJS)、[XStream](https://github.com/staltz/xstream) 等库实现。

### [String#matchAll](https://github.com/tc39/String.prototype.matchAll)

目前正则表达式想要匹配全部的语法不够语义化，提案希望通过 `matchAll` 返回迭代器来遍历匹配结果，很赞！

现在匹配全部只能使用 `while ((result = patt.exec(str)) != null)` 这种方式遍历，不优雅。

### [WeakRefs](https://github.com/tc39/proposal-weakrefs)

弱引用，提案地址文档：https://github.com/tc39/proposal-weakrefs/blob/master/specs/Weak%20References%20for%20EcmaScript.pdf

有点像 OC 的弱引用，当对象被释放时，当前持有弱引用的对象也会被 GC 回收，但似乎还没有开始讨论，js 越来越底层了？

### [Frozen Realms](https://github.com/FUDCo/frozen-realms)

增强了 [Realms](https://github.com/tc39/proposal-realms) 提案，利用不可变结构，实现结构共享。

### [Math Extensions](https://github.com/rwaldron/proposal-math-extensions)

Math 函数的拓展包含的函数：https://rwaldron.github.io/proposal-math-extensions/

这个函数拓展很给力，特别是设计游戏，计算角度的时候：

```javascript
Math.DEG_PER_RAD // Math.PI / 180
```

`Math.DEG_PER_RAD` 是一种单位，让角度可以用 0～360 为周期的数字表示，比如射击子弹时的角度、或者做可视化时都非常有用，类比 css 中的：`transform: rotate(180deg);`。

### [of and from on collection constructors](https://github.com/tc39/proposal-setmap-offrom)

该提案设计了 Set、Map 类型的 `of` `from` 方法，具体见此：https://tc39.github.io/proposal-setmap-offrom/

问题由于:

```javascript
Reflect.construct(Array, [1,2,3]) // [1,2,3]
Reflect.construct(Set, [1,2,3]) // Uncaught TypeError: undefined is not a function
```

因为 Set 接收的参数是数组，而 construct 会调用 `CreateListFromArrayLike` 将参数打平，变成了 `new Set(1, 2, 3)` 传入，实际上是语法错误的，因此作者提议新增下 Set、Map 的 `of` `from` 方法。

Set、Map 在国内环境用的比较少，也很少有人计较这个问题，不过从技术角度来看，确实需要修复。。

### [Generator arrow functions (=>*)](https://esdiscuss.org/topic/generator-arrow-functions)

还是挺有必要的，毕竟都出箭头函数了，也要支持一下箭头函数的 generator 语法。

### [Promise.try](https://github.com/tc39/proposal-promise-try)

同理，各大库都有实现，好处是所有错误都可以通过 `.catch` 捕获，而不用担心同步、异步错误的抛出。

### [Null Propagation](https://docs.google.com/presentation/d/11O_wIBBbZgE1bMVRJI8kGnmC6dWCBOwutbN9SWOK0fU/view#slide=id.p)

超级有用，看代码就知道了：

```javascript
const firstName = message.body?.user?.firstName || 'default'
```

该功能完全等同：

```javascript
const firstName =
	()message &&
	message.body &&
	message.body.user &&
	message.body.user.firstName) || 'default'
```

希望立刻进入 stage4.

### [Math.signbit: IEEE-754 sign bit](http://jfbastien.github.io/papers/Math.signbit.html)

当值为 负数 或 -0 时返回 `true`。由于 `Math.sign` 不区分 +0 与 -0，因此提案建议增加此函数，而且此函数在 c、c++、go语言都有实现。

### [Error stacks](https://github.com/tc39/proposal-error-stacks)

提案建议将 `Error.prototype.stack` 作为标准，这对错误上报与分析特别有用，强烈支持。

### [do expressions](https://gist.github.com/dherman/1c97dfb25179fa34a41b5fff040f9879)

```javascript
return (
  <nav>
    <Home />
    {
      do {
        if (loggedIn) {
          <LogoutButton />
        } else {
          <LoginButton />
        }
      }
    }
  </nav>
)
```

`jsx` 再也不用写得超长了，`styled-components` 中被诟病的分支判断难以阅读的问题也会烟消云散，因为我们有 `do`!

### [Realms](https://github.com/tc39/proposal-realms)

```javascript
let realm = new Realm();

let outerGlobal = window;
let innerGlobal = realm.global;

let f = realm.evalScript("(function() { return 17 })");

f() === 17 // true

Reflect.getPrototypeOf(f) === outerGlobal.Function.prototype // false
Reflect.getPrototypeOf(f) === innerGlobal.Function.prototype // true
```

`Realms` 提供了 global 环境的隔离，eval 执行代码时不再会污染全局，简直是测试的福利，脑洞很大。

### [Temporal](https://github.com/maggiepint/proposal-temporal)

与 `Date` 类似，但功能更强：

```javascript
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, options);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, 59);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, 59, options);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, 59, 123);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, 59, 123, options);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, 59, 123, 456789);
var ldt = new temporal.LocalDateTime(2017, 12, 31, 23, 59, 59, 123, 456789, options);

// add/subtract time  (Dec 31 2017 23:00 + 2h = Jan 1 2018 01:00)
var addHours = new temporal.LocalDateTime(2017, 12, 31, 23, 00).add(2, 'hours');

// add/subtract months  (Mar 31 - 1M = Feb 28)
var addMonths = new temporal.LocalDateTime(2017,03,31).subtract(1, 'months');

// add/subtract years  (Feb 29 2020 - 1Y = Feb 28 2019)
var subtractYears = new temporal.LocalDateTime(2020, 02, 29).subtract(1, 'years');
```

还自带时区转换 api 等等，如果进入草案，可以放弃 moment 这个重量级库了。

### [Float16 on TypedArrays, DataView, Math.hfround](https://docs.google.com/presentation/d/1Ta_IbravBUOvu7LUhlN49SvLU-8G8bIQnsS08P3Z4vY/edit?usp=sharing)

由于大多数 WebGL 纹理需要半精度以上的浮点数计算，推荐了 4 个 api：

- Float16Array
- DataView.prototype.getFloat16
- DataView.prototype.setFloat16
- Math.hfround(x)

### [Atomics.waitNonblocking](https://github.com/lars-t-hansen/moz-sandbox/blob/master/sab/waitNonblocking.md)

```javascript
var sab = new SharedArrayBuffer(4096);
var ia = new Int32Array(sab);
ia[37] = 0x1337;
test1();

function test1() {
  Atomics.waitNonblocking(ia, 37, 0x1337, 1000).then(function (r) { console.log("Resolved: " + r); test2(); });
}
var code = `
var ia = null;
onmessage = function (ev) {
  if (!ia) {
    console.log("Aux worker is running");
    ia = new Int32Array(ev.data);
  }
  console.log("Aux worker is sleeping for a little bit");
  setTimeout(function () { console.log("Aux worker is waking"); Atomics.wake(ia, 37); }, 1000);
}`;
function test2() {
  var w = new Worker("data:application/javascript," + encodeURIComponent(code));
  w.postMessage(sab);
  Atomics.waitNonblocking(ia, 37, 0x1337).then(function (r) { console.log("Resolved: " + r); test3(w); });
}
function test3(w) {
  w.postMessage(false);
  Atomics.waitNonblocking(ia, 37, 0x1337).then(function (r) { console.log("Resolved 1: " + r); });
  Atomics.waitNonblocking(ia, 37, 0x1337).then(function (r) { console.log("Resolved 2: " + r); });
  Atomics.waitNonblocking(ia, 37, 0x1337).then(function (r) { console.log("Resolved 3: " + r); });

}
```

该 api 可以在多线程操作中，有顺序的操作同一个内存地址，如上代码变量 `ia` 虽然在多线程中执行，但每个线程都会等资源释放后再继续执行。

### [Numeric separators](https://github.com/tc39/proposal-numeric-separator)

```javascript
1_000_000_000           // Ah, so a billion
101_475_938.38          // And this is hundreds of millions

let fee = 123_00;       // $123 (12300 cents, apparently)
let fee = 12_300;       // $12,300 (woah, that fee!)
let amount = 12345_00;  // 12,345 (1234500 cents, apparently)
let amount = 123_4500;  // 123.45 (4-fixed financial)
let amount = 1_234_500; // 1,234,500
```

提案希望 js 支持分隔符使大数字阅读性更好（不影响计算），很多语言都有实现，很人性化。

# 4 总结

每个草案都觉得很靠谱，涉及语义化、无障碍、性能、拓展语法、连接 nodejs 等方面，虽然部分提案[从语言设计角度是错误的](http://www.yinwang.org/blog-cn/2013/04/18/language-design-mistake2)，但 js 运行在网页端，涉及到人机交互、网络加载等问题，遇到的问题自然比任何语言都要复杂，每个提案都是从实践中出发，相信这种道路是正确的。

由于篇幅与时间限制，stage0 的提案等下次再讨论。特别提一点，stage0 的 [Cancellation API](https://github.com/tc39/proposal-cancellation) 很值得大家关注，取消异步操作是人心所向，大势所趋啊。

感谢所有参与讨论的同学，你们的支持会转化为我们的动力，每周更新，风雨无阻。

> 讨论地址是：[精读《TC39, ECMAScript, and the Future of JavaScript》 · Issue #21 · dt-fe/weekly](https://github.com/dt-fe/weekly/issues/21)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。

> 访问 [原始文章地址](https://github.com/dt-fe/weekly/blob/master/15.%E7%B2%BE%E8%AF%BB%20TC39%20%E4%B8%8E%20ECMAScript%20%E6%8F%90%E6%A1%88.md) , 获得更好阅读效果。







# Upmath: Math Online Editor
### _Create web articles and&nbsp;blog posts with&nbsp;equations and&nbsp;diagrams_

Upmath extremely simplifies this task by using Markdown and LaTeX. It converts the Markdown syntax extended with LaTeX equations support into HTML code you can publish anywhere on the web.

![Paper written in LaTeX](/i/latex.jpg)

## Markdown

Definition from [Wikipedia](https://en.wikipedia.org/wiki/Markdown):

> Markdown is a lightweight markup language with plain text formatting syntax designed so that it can be converted to HTML and many other formats using a tool by the same name. Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

The main idea of Markdown is to use a simple plain text markup. It's ~~hard~~ easy to __make__ **bold** _or_ *italic* text. Simple equations can be formatted with subscripts and superscripts: *E*~0~=*mc*^2^. I have added the LaTeX support: $$E_0=mc^2$$.

Among Markdown features are:

* images (see above);
* links: [service main page](/ "link title");
* code: `untouched equation source is *E*~0~=*mc*^2^`;
* unordered lists--when a line starts with `+`, `-`, or `*`;
  1. sub-lists
  1. and ordered lists too;
* direct use <nobr>of HTML</nobr>&ndash;for <span style="color: red">anything else</span>.

Also the editor supports typographic replacements: (c) (r) (tm) (p) +- !!!!!! ???? ,,  -- ---

## LaTeX

The editor converts LaTeX equations in double-dollars `$$`: $$ax^2+bx+c=0$$. All equations are rendered as block equations. If you need inline ones, you can add the prefix `\inline`: $$\inline p={1\over q}$$. But it is a good practice to place big equations on separate lines:

$$x_{1,2} = {-b\pm\sqrt{b^2 - 4ac} \over 2a}.$$

In this case the LaTeX syntax will be highlighted in the source code. You can even add equation numbers (unfortunately there is no automatic numbering and refs support):

$$|\vec{A}|=\sqrt{A_x^2 + A_y^2 + A_z^2}.$$(1)

It is possible to write Cyrillic symbols in `\text` command: $$Q_\text{плавления}>0$$.

One can use matrices:

$$T^{\mu\nu}=\begin{pmatrix}
\varepsilon&0&0&0\\
0&\varepsilon/3&0&0\\
0&0&\varepsilon/3&0\\
0&0&0&\varepsilon/3
\end{pmatrix},$$

integrals:

$$P_\omega={n_\omega\over 2}\hbar\omega\,{1+R\over 1-v^2}\int\limits_{-1}^{1}dx\,(x-v)|x-v|,$$

cool tikz-pictures:

$$\usetikzlibrary{decorations.pathmorphing}
\begin{tikzpicture}[line width=0.2mm,scale=1.0545]\small
\tikzset{>=stealth}
\tikzset{snake it/.style={->,semithick,
decoration={snake,amplitude=.3mm,segment length=2.5mm,post length=0.9mm},decorate}}
\def\h{3}
\def\d{0.2}
\def\ww{1.4}
\def\w{1+\ww}
\def\p{1.5}
\def\r{0.7}
\coordinate[label=below:$A_1$] (A1) at (\ww,\p);
\coordinate[label=above:$B_1$] (B1) at (\ww,\p+\h);
\coordinate[label=below:$A_2$] (A2) at (\w,\p);
\coordinate[label=above:$B_2$] (B2) at (\w,\p+\h);
\coordinate[label=left:$C$] (C1) at (0,0);
\coordinate[label=left:$D$] (D) at (0,\h);
\draw[fill=blue!14](A2)--(B2)-- ++(\d,0)-- ++(0,-\h)--cycle;
\draw[gray,thin](C1)-- +(\w+\d,0);
\draw[dashed,gray,fill=blue!5](A1)-- (B1)-- ++(\d,0)-- ++(0,-\h)-- cycle;
\draw[dashed,line width=0.14mm](A1)--(C1)--(D)--(B1);
\draw[snake it](C1)--(A2) node[pos=0.6,below] {$c\Delta t$};
\draw[->,semithick](\ww,\p+0.44*\h)-- +(\w-\ww,0) node[pos=0.6,above] {$v\Delta t$};
\draw[snake it](D)--(B2);
\draw[thin](\r,0) arc (0:atan2(\p,\w):\r) node[midway,right,yshift=0.06cm] {$\theta$};
\draw[opacity=0](-0.40,-0.14)-- ++(0,5.06);
\end{tikzpicture}$$

plots:

$$\begin{tikzpicture}[scale=1.0544]\small
\begin{axis}[axis line style=gray,
	samples=120,
	width=9.0cm,height=6.4cm,
	xmin=-1.5, xmax=1.5,
	ymin=0, ymax=1.8,
	restrict y to domain=-0.2:2,
	ytick={1},
	xtick={-1,1},
	axis equal,
	axis x line=center,
	axis y line=center,
	xlabel=$x$,ylabel=$y$]
\addplot[red,domain=-2:1,semithick]{exp(x)};
\addplot[black]{x+1};
\addplot[] coordinates {(1,1.5)} node{$y=x+1$};
\addplot[red] coordinates {(-1,0.6)} node{$y=e^x$};
\path (axis cs:0,0) node [anchor=north west,yshift=-0.07cm] {0};
\end{axis}
\end{tikzpicture}$$

and [the rest of LaTeX features](https://en.wikibooks.org/wiki/LaTeX/Mathematics).

## About Upmath

It works in browsers, except equations rendered [on the server](//tex.s2cms.com/). The editor stores your text in the browser to prevent the loss of your work in case of software or hardware failures.

I have designed and developed this lightweight editor and the service for converting LaTeX equations into svg-pictures to make publishing math texts on the web easy. I consider client-side rendering, the rival technique implemented in [MathJax](https://www.mathjax.org/), to be too limited and resource-consuming, especially on mobile devices.

The source code is [published on Github](https://github.com/parpalak/upmath.me) under MIT license.

***

Now you can erase this instruction and start writing your own scientific post. If you want to see the instruction again, open the editor in a private tab, in a different browser or download and clear your post and refresh the page.

Have a nice day :)

[Roman Parpalak](https://written.ru/), web developer and UX expert.


An h1 header
============

Paragraphs are separated by a blank line.

2nd paragraph. *Italic*, **bold**, and `monospace`. Itemized lists
look like:

  * this one
  * that one
  * the other one

Note that --- not considering the asterisk --- the actual text
content starts at 4-columns in.

> Block quotes are
> written like so.
>
> They can span multiple paragraphs,
> if you like.

Use 3 dashes for an em-dash. Use 2 dashes for ranges (ex., "it's all
in chapters 12--14"). Three dots ... will be converted to an ellipsis.
Unicode is supported. ☺



An h2 header
------------

Here's a numbered list:

 1. first item
 2. second item
 3. third item

Note again how the actual text starts at 4 columns in (4 characters
from the left side). Here's a code sample:

    # Let me re-iterate ...
    for i in 1 .. 10 { do-something(i) }

As you probably guessed, indented 4 spaces. By the way, instead of
indenting the block, you can use delimited blocks, if you like:

~~~
define foobar() {
    print "Welcome to flavor country!";
}
~~~

(which makes copying & pasting easier). You can optionally mark the
delimited block for Pandoc to syntax highlight it:

~~~python
import time
# Quick, count to ten!
for i in range(10):
    # (but not *too* quick)
    time.sleep(0.5)
    print(i)
~~~



### An h3 header ###

Now a nested list:

 1. First, get these ingredients:

      * carrots
      * celery
      * lentils

 2. Boil some water.

 3. Dump everything in the pot and follow
    this algorithm:

        find wooden spoon
        uncover pot
        stir
        cover pot
        balance wooden spoon precariously on pot handle
        wait 10 minutes
        goto first step (or shut off burner when done)

    Do not bump wooden spoon or it will fall.

Notice again how text always lines up on 4-space indents (including
that last line which continues item 3 above).

Here's a link to [a website](http://foo.bar), to a [local
doc](local-doc.html), and to a [section heading in the current
doc](#an-h2-header). Here's a footnote [^1].

[^1]: Some footnote text.

Tables can look like this:

Name           Size  Material      Color
------------- -----  ------------  ------------
All Business      9  leather       brown
Roundabout       10  hemp canvas   natural
Cinderella       11  glass         transparent

Table: Shoes sizes, materials, and colors.

(The above is the caption for the table.) Pandoc also supports
multi-line tables:

--------  -----------------------
Keyword   Text
--------  -----------------------
red       Sunsets, apples, and
          other red or reddish
          things.

green     Leaves, grass, frogs
          and other things it's
          not easy being.
--------  -----------------------

A horizontal rule follows.

***

Here's a definition list:

apples
  : Good for making applesauce.

oranges
  : Citrus!

tomatoes
  : There's no "e" in tomatoe.

Again, text is indented 4 spaces. (Put a blank line between each
term and  its definition to spread things out more.)

Here's a "line block" (note how whitespace is honored):

| Line one
|   Line too
| Line tree

and images can be specified like so:

![example image](example-image.jpg "An exemplary image")

Inline math equation: $\omega = d\phi / dt$. Display
math should get its own line like so:

$$I = \int \rho R^{2} dV$$

And note that you can backslash-escape any punctuation characters
which you wish to be displayed literally, ex.: \`foo\`, \*bar\*, etc.






本期精读文章 [CSS Animations vs Web Animations API | CSS-Tricks](https://css-tricks.com/css-animations-vs-web-animations-api/)

译文地址 [CSS Animation 与 Web Animation API 之争](https://zhuanlan.zhihu.com/p/27867539?refer=FrontendMagazine)

# 1. 引言

<img src="assets/16/logo.png" alt="logo" width="500" />

前端是一个很神奇的工种，一个合格的前端至少要熟练的使用 3 个技能，html、css 和 javascript。在传统的前端开发领域它们三个大多时候是各司其职，分别负责布局、样式以及交互。而在当代的前端开发中，由于多种原因 javascript 做的事情愈来愈多，大有一统全栈之势。服务端的 nodejs，让前端同学可以用自己的语言来开发 server。即便是在前端，我们现在好像也很少写 html 了，在 React 中出来了 JSX，在其他的开发体系中也有与之类似的前端模板代替了 html。我们好像也很少写 css 了，sass、less、stylus 等预处理器以及 css in js 出现。此外，很多 css 领域的的工作也可以通过 javascript 以更加优雅和高效的方式实现。今天我们来一起聊聊 CSS 动画与 WEB Animation API 的优劣。

# 2. 内容概要

JavaScript 规范确实借鉴了很多社区内的优秀类库，通过原生实现的方式提供更好的性能。WAAPI 提供了与 jQuery 类似的语法，同时也做了很多补充，使得其更加的强大。同时 W3C 官方也为开发者提供了 [web-animations/web-animations-js](https://github.com/web-animations/web-animations-js/tree/master) polyfill。下面简单回顾下文章内容：

WAAPI 提供了很简洁明了的，我们可以直接在 dom 元素上直接调用 animate 函数：

```javascript
var element = document.querySelector('.animate-me');
var animation = element.animate(keyframes, 1000);
```

第一个参数是一个对象数组，每个对象表示动画中的一帧：

```javascript
var keyframes = [
  { opacity: 0 },
  { opacity: 1 }
];
```

这与 css 中的 keyframe 定义类似：

```css
0% {
  opacity: 0;
}
100% {
  opacity: 1;
}
```

第二个参数是 duration，表示动画的时间。同时也支持在第二个参数中传入配置项来指定缓动方式、循环次数等。

```javascript
var options = {
  iterations: Infinity, // 动画的重复次数，默认是 1
  iterationStart: 0, // 用于指定动画开始的节点，默认是 0
  delay: 0, // 动画延迟开始的毫秒数，默认 0
  endDelay: 0, // 动画结束后延迟的毫秒数，默认 0
  direction: 'alternate', // 动画的方向 默认是按照一个方向的动画，alternate 则表示交替
  duration: 700, // 动画持续时间，默认 0
  fill: 'forwards', // 是否在动画结束时回到元素开始动画前的状态
  easing: 'ease-out', // 缓动方式，默认 "linear"
};
```

有了这些配置项，基本可以满足开发者的动画需求。同时，文中也提到了在 WAAPI 中很多专业术语与 CSS 变量有所不同，不过这些变化也更显简洁。

在 dom 元素上调用 animate 函数之后返回 animation 对象，或者通过 ele.getAnimation 方法获取 dom 上的 animation 对象。借此开发者可以通过 promise 和 event 两种方式对动画进行操作：

## 1. event 方式

```javascript
myAnimation.onfinish = function() {
  element.remove();
}
```

## 2. promise 方式

```javascript
myAnimation.finished.then(() =>
  element.remove())
```

通过这种方式相对 dom 事件获取更加的简洁优雅。

# 3. 精读

参与本次精度的同学主要来自 [前端外刊评论 - 知乎专栏](https://zhuanlan.zhihu.com/FrontendMagazine) 的留言，该部分主要由文章评论总结而出。

## WAAPI 优雅简洁

web animation 的 api 设计优雅而又全面。文中比对了常见的 WAAPI 与 CSS Animation 对照关系，我们可以看到 WAAPI 更加简洁，而且语法上也更加容易为开发者接受。确实，在写一些复杂的动画逻辑时，需要灵活控制性强的接口。我们可以看到，在处理串连多个动画、截取完整动画的一部分时更加方便。如果非要说有什么劣势，个人在开发中感觉 keyframe 的很多只都只能使用字符串，不过这也是将 css 写在 js 中最常见的一种方式了。

## 低耦合

CSS 动画中，如果需要控制动画或者过渡的开始或结束只能通过相应的 dom 事件来监听，并且在回调函数中操作，这也是受 CSS 本身语言特性约束所致。也就是说很多情况下，想要完成一个动画需要结合 CSS 和 JS 来共同完成。使用 WAAPI 则有 promise 和 event 两种方式与监听 dom 事件相对应。从代码可维护性和完整性上看 WAAPI 有自身语言上的优势。

## 兼容性和流畅度

兼容性上 WAAPI 常用方法已经兼容了大部分现代的浏览器。如果想现在就玩玩 WAAPI，可以使用官方提供的 polyfill。而 CSS 动画我们也用了很久，基本作为一种在现代浏览器中提升体验的方式，对于老旧的浏览器只能用一些优雅的降级方案。至于流畅度的问题，文中也提到性能与 CSS 动画一般，而且提供了性能优化的方案。

# 4. 总结

目前看来，CSS 动画可以做到的，使用 WAAPI 同样可以实现。至于浏览器支持问题，WAAPI 尚需要 polyfill 支持，不过 CSS 动画也同样存在兼容性问题。可能现在新的 API 的接受度还不够，但正如文章结尾处所说：『现有的规范和实现看起来更像是一项伟大事业的起点。』

> 讨论地址是：[精读《CSS Animations vs Web Animations API》 · Issue #22 · dt-fe/weekly](https://github.com/dt-fe/weekly/issues/22)
>
> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




# 精读《如何安全地使用 React context》

本期精读文章是：[How to safely use React context](https://medium.com/@mweststrate/how-to-safely-use-react-context-b7e343eff076)

## 1 引言

在 React 源码中，context 始终存在，却在 React 0.14 的官方文档中才有所体现。在目前最新的官方文档中，仍不建议使用 context，也表明 context 是一个实验性的 API，在未来 React 版本中可能被更改。那么哪些场景下需要用到 context，而哪些情况下应该避免使用，context 又有什么坑呢？让我们一起来讨论一下。

## 2 内容概要

React context 可以把数据直接传递给组件树的底层组件，而无需中间组件的参与。Redux 作者 Dan Abramov 为 contenxt 的使用总结了一些注意事项：

* 如果你是一个库的作者，需要将信息传递给深层次组件时，context 在一些情况下可能无法更新成功。
* 如果是界面主题、本地化信息，context 被应用于不易改变的全局变量，可以提供一个高阶组件，以便在 API 更新时只需修改一处。
* 如果库需要你使用 context，请它提供高阶组件给你。

正如 Dan 第一条所述，在 React issue 中，经常能找到 React.PureComponent、shouldComponentUpdate 与包含 Context 的库结合后引发的一些问题。原因在于 shouldComponentUpdate 会切断子树的 rerender，当 state 或 props 没有发生变化时，可能意外中断上层 context 传播。也就是当 shouldComponentUpdate 返回 false 时，context 的变化是无法被底层所感知的。

因此，我们认为 context 应该是不变的，在构造时只接受 context 一次，使用 context，应类似于依赖注入系统来进行。结合精读文章的示例总结一下思路，不变的 context 中包含可变的元素，元素的变化触发自身的监听器实现底层组件的更新，从而绕过 shouldComponentUpdate。

最后作者提出了 Mobx 下的两种解决方案。context 中的可变元素可用 observable 来实现，从而避免上述事件监听器编写，因为 observable 会帮你完成元素改变后的响应。当然 Provider + inject 也可以完成，具体可参考精读文章中的代码。

## 3 精读

本次提出独到观点的同学有：
[@monkingxue](https://www.zhihu.com/people/turbe-xue) [@alcat2008](https://github.com/alcat2008) [@ascoders](https://www.zhihu.com/people/huang-zi-yi-83)，精读由此归纳。

### context 的使用场景

> In some cases, you want to pass data through the component tree without having to pass the props down manually at every level.

context 的本质在于为组件树提供一种跨层级通信的能力，原本在 React 只能通过 props 逐层传递数据，而 context 打破了这一层束缚。

context 虽然不被建议使用，但在一些流行库中却非常常见，例如：[react-redux](https://github.com/reactjs/react-redux)、[react-router](https://github.com/ReactTraining/react-router)。究其原因，我认为是单一顶层与多样底层间不是单纯父子关系的结果。例如：react-redux 中的 Provider，react-router 中的 Router，均在顶层控制 store 信息与路由信息。而对于 Connect 与 Route 而言，它们在 view 中的层级是多样化的，通过 context 获取顶层 Provider 与 Router 中的相关信息再合适不过。

### context 的坑

* context 相当于一个全局变量，难以追溯数据源，很难找到是在哪个地方中对 context 进行了更新。
* 组件中依赖 context，会使组件耦合度提高，既不利于组件复用，也不利于组件测试。
* 当 props 改变或是 setState 被调用，getChildContext 也会被调用，生成新的 context，但 shouldComponentUpdate 返回的 false 会 block 住 context，导致没有更新，这也是精读文章的重点内容。

## 4 总结

正如精读文章开头所说，context 是一个非常强大的，具有很多免责声明的特性，就像伊甸园中的禁果。的确，引入全局变量似乎是应用混乱的开始，而 context 与 props/state 相比也实属异类。在业务代码中，我们应抵制使用 context，而在框架和库中可结合场景适当使用，相信 context 也并非洪水猛兽。

> 讨论地址是：[精读《How to safely use React context》· Issue #23 · dt-fe/weekly](http://github.com/dt-fe/weekly/issues/23)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布




# 1. 摘要

日期选择器作为基础组件重要不可或缺的一员，大家已经快习惯它一成不变的样子，输入框+日期选择弹出层。但到业务中，这种墨守成规的样子真的能百分百契合业务需求吗。这篇文章从多个网站的日期选择场景出发，企图归纳出日期选择器的最佳实践。这篇文章对移动端的日期选择暂无涉猎，都是PC端，列举出通用场景，每个类型日期选择器需要考虑的设计。
文章链接：Designing The Perfect Date And Time Picker
感谢本期评论官 @黄子毅 @流形  @王亮    @赵阳     @不知名的花瓣工程师
# 2. 设计原则

## 2.1 通用设计
1）明确需求，是实现日期选择、日期区间选择、时间选择

2）用户选中日期后是否需要自动触发下一步？尤其是在某些固定业务流程中

3）日期选择器是否是最佳的日期选择方法？如果提供预定义的日期选择按钮是不是更快呢？

4）如何避免展示不可用日期？

5）是否需要根据上下文自动定位？ 适用于生日选择场景。

## 2.2 输入框设计
1）用户是否可以自定义输入日期，还是只能通过点击选择程序给出的日期？有时候直接输入的效率明显高于点击选择，在很多银行流水查询的场景中就提供自定义输入。

2）用户自定义输入如何保证日期格式正确性？

3）是否需要提供预设场景输入？ 比如昨天，三天前，七天前，30天前？像很多数据分析场景，分析师会关注数据周期，比如流量的周环比，月环比，年环比。

4）是否需要包含默认值？如果有默认，应该是什么？像google flight 根据用户历史数据提供默认值，临近节假日默认填充节假日。同时像有些数据场景，数据存在延迟，需要默认提供T-1/T-2 ，避免用户选择当天。

5）当用户激活输入框时，是否保留默认值？

6）是否提供重置按钮？

7）是否提供『前一项』『现在』『后一项』导航？这个设计点我第一次看到，专门附图说明。

![](https://pic3.zhimg.com/v2-cd71b6e05dec1c801794415816b6369a_b.png)

## 2.3 日期弹出层设计
1）理想状态下，任何日期选择都应该在三步之内完成

2）日期选择弹出层的触发方式？ 是点输入框就还是点日期小图标？

3）默认情况下，展示多少周、月、天？

4）周的定义是周一到周日 还是  周日到周六？

5）如何提示当前时间和当前时间？

6）是否需要提供『前一项』『现在』『后一项』导航？如果提供，选择天、月、年的场景下如何展示？

7）提示用户最关心的信息，比如 价格、公共假期，可采用背景色、点标记

8）是否用户点击非弹出层自动关闭弹出层？是否需要提供关闭按钮？

9）是否可以不和输入框联动？

10）用户可以重置选中的日期吗？


## 2.4 日期区间设计
1）理想状态下，任何日期区间选择需要在六步之内完成

2）用户选中后是否立刻做背景色提示？

3）当用户选择时，区间是否需要随着用户动作改变？比如用户hover时，动态改变选中区间。

4）是否提供快捷键切换 日、月、年选择？

5）是分成两个日期选择器还是采用区间形式？

6）如何去除某些特殊时间点？ 比如春节、节假日。


## 2.5 时间选择设计
1）最简单的方法是竖直的日期，水平的时间选择

2）更有用的是先提供日期还是时间选择？ 时间选择可以作为一个过滤项，移除某些不可用的日期，这个也很有用。

3）提供最常使用的时间片段，并提供快捷键选择。

# 3. 文章中亮点设计

## 3.1 google flight
![](https://pic4.zhimg.com/v2-2cb10cf0f88fc046d32482e8fe0cd837_b.png)

这个案例在最小的范围内提供用户找出最优选择。虽然第一眼看到这个方法，我懵了一秒，但仔细一看发现这种展现方法完美的给出了各种组合。

## 3.2 春夏秋冬
![](https://pic2.zhimg.com/v2-d3250f633f8ff1a075279fbfbf43cfb9_b.png)

这个案例另辟蹊径增加了季节的概念，在某些旅游、机票类业务场景季节是非常必要的概念，提供超出月更粗粒度的日期范围选择。

## 3.3 枚举选择时间
![](https://pic4.zhimg.com/v2-e2d05d6a438b19d5acc7b6a2db6d8d1f_b.png)

使用一系列的按钮代替时间选择器，比如像我们的作息时间表，大部分是把时间划分成有规律的时间段供用户选择，固化用户选择。

## 3.4 对话式交互

![](https://pic1.zhimg.com/v2-cd4874c5dc98505c56b05dbd3193fa78_b.gif)

采用与用户交互的方式选择日期，如果今后应用上AI，单纯的日期选择器是不是会消失不见呢？..
## 3.5  特殊标识周末
![](https://pic1.zhimg.com/v2-d8410bede19d7bd4c212ad216ebd0770_b.png)
在机票、旅行场景中，周末是大家最有可能出行的时间点，采用竖线划分的方式着重标注提醒。

# 4. 总结

![](https://pic3.zhimg.com/v2-ec840145feb22eeac76e5a0503828436_b.png)

总得来说，日期选择器是一个业务组件，虽然现有很多组件库把它纳入UI基础组件。但在每个不通的业务场景和需求下的展现形式、交互都会有所有不同。首先一定一定要明确确定需要日期选择器的场景，尤其是与日期强关联的业务，比如机票定价、日程安排，结合到日期选择器中更直观，提高用户对信息的检索效率。满足用户需求场景的同时，尽量减少用户操作链路。

看到最后点个赞呗，给你比小心心 ❤ ~~








Apple
:   Pomaceous fruit of plants of the genus Malus in
    the family Rosaceae.

Orange
:   The fruit of an evergreen tree of the genus Citrus.



Here's a definition list:

apples
  : Good for making applesauce.

oranges
  : Citrus!

tomatoes
  : There's no "e" in tomatoe.

本期精读的文章是：[The-Best-Frontend-JavaScript-Interview-Questions](https://performancejs.com/post/hde6d32/The-Best-Frontend-JavaScript-Interview-Questions-%28written-by-a-Frontend-Engineer%29)

讨论前端面试哪些问题，以及如何面试。

# 1 引言

<img src="assets/19/logo.png" width="500" alt="logo" />

又到了招聘的季节，如何为自己的团队找到真正优秀的人才？问哪些问题更合适？我们简单总结一把。

# 2 内容概要

[The-Best-Frontend-JavaScript-Interview-Questions](https://performancejs.com/post/hde6d32/The-Best-Frontend-JavaScript-Interview-Questions-%28written-by-a-Frontend-Engineer%29) 从 概念 - 算法 coding - 调试 - 设计 这 4 步全面了解候选人的基本功。

# 3 精读

本精读由 [ascoders](https://github.com/ascoders) [camsong](https://github.com/camsong) [jasonslyvia](https://github.com/jasonslyvia) 讨论而出。

网络技术发展非常迅速，前端变化尤为快，对优秀人才的面试方式在不同时期会有少许不同。

### 整体套路

在面试之前，第一步要询问自己，是否对当前岗位的职责、要求有清晰的认识？不知道自己岗位要招什么样的人，也无法组织好面试题。

认真阅读简历，这是对候选人起码的尊重，同时也是对自己的负责。阅读简历是为了计划面试流程，不应该对所有候选人都准备相同的问题。

具体流程我们一般会通过：

1. 开场白
2. 候选人自我介绍
3. 面试
4. 附加信息
5. 结束

开场白是最重要的，毕竟候选人如果拒绝了本次面试，后面的流程都不会存在。其次，通过候选人自我介绍，了解简历中你所疑惑的地方。简历是为了突出重点，快速判断是否基本匹配岗位要求，一旦确认了面试，全面了解候选人经验是对双方的负责。接下来重点讨论面试过程。

### 开放性问题

面试的目的是挖掘对方的优点，而不是拿面试官自己的知识点与对方知识点做交集，看看能否匹配上 80%。但受主观因素影响，又不宜询问太多开放性问题，因此开放问题很讲究技巧。

正如上面所说，我推荐以开放性问题开场，这样便于了解候选人的经历、熟悉哪些技术点，便于后面的技术提问。如果开场就以准备好的题目展开车轮战，容易引起候选人心里紧张，同时我们问的问题不一定是候选人所在行的，技术问题不是每一个都那么重要，很多时候我们只看到了候选人的冰山一角，但此时气氛已经尴尬，很多时候会遗漏优秀人才。

开放性问题最好基于行为面试法询问（Star法则）：

- Situation: 场景 - 当时是怎样的场景
- Task: 任务 - 当时的任务是什么
- Action: 我采取了怎样的行动
- Result: 达到了什么样的结果

行为面试法的好处在于还原当时场景，不但让面试官了解更多细节，也开拓了面试者的思维，让面试过程更加高效、全面。

举一个例子，比如考察候选人是否聪明，star 法则会这样询问：

> 在刚才的项目中，你提到了公司业务发展很快，人手不够，你是如何应对的呢？

相比不推荐的 “假设性问题” 会如此提问：

> 假如让你学习一个新技术，你会如何做？

更不推荐的是 “引导性问题”：

> 你觉得自己聪明吗？

相比于 star 法则，其他方式的提问，不但让候选人觉得突兀，不好回答，而且容易被主观想法带歪，助长了面试中投机的气氛。至于对 star 法则都精心编排的候选人，我还没有遇到过，如果遇到了肯定会劝他转行做演员 —— 开玩笑的，会通过后续技术问题甄别候选人是否有真本领。

### 技术问题

亘古不变的问题就是考察基本功了，然而基本功随着技术的演进会有所调整，Html Css Js 这三个维度永远是不变的，但旧的 api 是否考察，取决于是否有最新 api 代替了它，如果有，在浏览器兼容性达标的基础上，可以只考察替代的 api，当然了解历史会更好。

> 比如 `proxy` 与 `defineProperty` 需要结合考察，因为 `proxy` 不兼容任何 IE 浏览器，候选人需要全面了解这两种用法。

变的地方在于对候选人使用技术框架的提问。在开放性问题中已经做好了铺垫，那无论候选人时以什么框架开发的，或者不使用框架开发，最好按照候选人的使用习惯提问。比如候选人使用 Angular 框架的开发经验较多，就重点考察对 Angular 框架设计、实现原理是否了解，实际使用中是否遇到过问题，以及对问题的解决方法，这也回到了 star 法则。

如果候选人能总结出比如当前流行的 Vue React Angular 这三个框架核心实现思想的异同，就是加分项。

对与老旧的问题，比如 jquery 的问题，也会问与设计思想相关的问题，比如候选人不知道 `$.delegate`，也不知道其已被 `$on` 在 Jq3.0 取代，这不代表候选人能力不行，最多说明候选人比较年轻。此时应该通过引导的方式，让其思考如何优化 `$.bind` 方法的性能，通过逐步引导，判断候选人的思维活跃度有多强。

### 如何防止被套路

把面试官经验抛出来，怕不怕让候选人有所准备呢？ —— 说实在的，几乎所有候选人都是有准备的，也不差这一篇文章。

以上是开玩笑。

面试主要是看候选人基础有多扎实，和思维能力。基础主要指的是，候选人提前了解了多少前端相关知识，比如对闭包的理解，对原生 api 的理解？如果候选人没接触过这两个知识点，会有两种情况：

- **这些知识点看完需要多久？如果是闭包和原生api的定义与用法，候选人这方面的缺陷可以通过5分钟来弥补，那么这种问题到底想考什么？我们真的在乎这5分钟看文档的时间吗？此时应该了解候选人对知识点的感悟，或者学习方式，因为这两点的差距可能几年都无法弥补**
- **如果候选人学习能力非常强，但几乎所有前端知识点都不了解，弥补完大概一共要花 1000*5 分钟，这时候量变引发质变了，是不是说明候选人本身对技术的热情存在问题？**

通过了基础问题还远远不够。甚至当问一个复杂的问题的时候，如果候选人瞬间把答案完美流畅表达出来，说明这个问题基本上白问了。

**技术面更应该考察候选人的思考过程和基于此来表达出的技术能力和项目经验。**如果候选人基础没有落下太多，思维足够灵活，在过往项目中主动学习，并主导解决过项目问题，说明已经比较优秀了，我们招的每一人都应当拥有激情与学习能力。

所以，当问到候选人不了解的知识点时，通过引导并挖掘出候选人拥有多少问题解决能力，才是最大的权重项，如果这个问题候选人也提前准备了，那说明准备对了。

### 非技术相关

最后考察候选人的发展潜力与工作态度，我们一般通过询问简单的算法问题，进一步了解候选人是否对技术真正感兴趣，而不只是对前端工程感兴趣。同时，算法问题也考察候选人解决抽象问题的能力，或者让候选人设计一个组件，通过对组件需求的不断升级，考察候选人是否能及时给出解决方案。

最后时工作态度，首先会考察人品，对不懂的知识点装懂是违背诚信的行为，任何团队都不会要的。同时，**不正视自己技术存在的盲点，将是技术发展的最大阻碍**。不过这里也不怕被候选人套路，如果全部都回答不懂那也不用考虑了。

# 3 总结

由于经验不多，只能编出这些体会，希望求职者多一些真诚，少一些套路，就一定会找到满意的工作。

> 讨论地址是：[精读《最佳前端面试题》及前端面试官技巧 · Issue #27 · dt-fe/weekly](https://github.com/dt-fe/weekly/issues/27)

> 如果你想参与讨论，请[点击这里](https://github.com/dt-fe/weekly)，每周都有新的主题，每周五发布。




---
title: Markdown Syntax
taxonomy:
    category: docs
---

Let's face it: Writing content for the Web is tiresome. WYSIWYG editors help alleviate this task, but they generally result in horrible code, or worse yet, ugly web pages.

**Markdown** is a better way to write **HTML**, without all the complexities and ugliness that usually accompanies it.

Some of the key benefits are:

1. Markdown is simple to learn, with minimal extra characters, so it's also quicker to write content.
2. Less chance of errors when writing in markdown.
3. Produces valid XHTML output.
4. Keeps the content and the visual display separate, so you cannot mess up the look of your site.
5. Write in any text editor or Markdown application you like.
6. Markdown is a joy to use!

John Gruber, the author of Markdown, puts it like this:

> The overriding design goal for Markdown’s formatting syntax is to make it as readable as possible. The idea is that a Markdown-formatted document should be publishable as-is, as plain text, without looking like it’s been marked up with tags or formatting instructions. While Markdown’s syntax has been influenced by several existing text-to-HTML filters, the single biggest source of inspiration for Markdown’s syntax is the format of plain text email.
> -- <cite>John Gruber</cite>


Grav ships with built-in support for [Markdown](http://daringfireball.net/projects/markdown/) and [Markdown Extra](https://michelf.ca/projects/php-markdown/extra/). You must enable **Markdown Extra** in your `system.yaml` configuration file.

Without further delay, let us go over the main elements of Markdown and what the resulting HTML looks like:

!! <i class="fa fa-bookmark"></i> Bookmark this page for easy future reference!

## Headings

Headings from `h1` through `h6` are constructed with a `#` for each level:

```markdown
# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
```

Renders to:

# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading

HTML:

```html
<h1>h1 Heading</h1>
<h2>h2 Heading</h2>
<h3>h3 Heading</h3>
<h4>h4 Heading</h4>
<h5>h5 Heading</h5>
<h6>h6 Heading</h6>
```

<br>
<br>
<br>

## Comments

Comments should be HTML compatible

```html
<!--
This is a comment
-->
```
Comment below should **NOT** be seen:

<!--
This is a comment
-->

<br>
<br>
<br>

## Horizontal Rules

The HTML `<hr>` element is for creating a "thematic break" between paragraph-level elements. In markdown, you can create a `<hr>` with any of the following:

* `___`: three consecutive underscores
* `---`: three consecutive dashes
* `***`: three consecutive asterisks

renders to:

___

---

***


<br>
<br>
<br>


## Body Copy

Body copy written as normal, plain text will be wrapped with `<p></p>` tags in the rendered HTML.

So this body copy:

```markdown
Lorem ipsum dolor sit amet, graecis denique ei vel, at duo primis mandamus. Et legere ocurreret pri, animal tacimates complectitur ad cum. Cu eum inermis inimicus efficiendi. Labore officiis his ex, soluta officiis concludaturque ei qui, vide sensibus vim ad.
```
renders to this HTML:

```html
<p>Lorem ipsum dolor sit amet, graecis denique ei vel, at duo primis mandamus. Et legere ocurreret pri, animal tacimates complectitur ad cum. Cu eum inermis inimicus efficiendi. Labore officiis his ex, soluta officiis concludaturque ei qui, vide sensibus vim ad.</p>
```

A **line break** can be done with 2 spaces followed by 1 return.


<br>
<br>
<br>


## Inline HTML

If you need a certain HTML tag (with a class) you can simply use HTML:

```
Paragraph in Markdown.

<div class="class">
</div>

Paragraph in Markdown.
```


<br>
<br>
<br>


## Emphasis

### Bold
For emphasizing a snippet of text with a heavier font-weight.

The following snippet of text is **rendered as bold text**.

```markdown
**rendered as bold text**
```
renders to:

**rendered as bold text**

and this HTML

```html
<strong>rendered as bold text</strong>
```

### Italics
For emphasizing a snippet of text with italics.

The following snippet of text is _rendered as italicized text_.

```markdown
_rendered as italicized text_
```

renders to:

_rendered as italicized text_

and this HTML:

```html
<em>rendered as italicized text</em>
```


### strikethrough
In GFM (GitHub flavored Markdown) you can do strikethroughs.

```markdown
~~Strike through this text.~~
```
Which renders to:

~~Strike through this text.~~

HTML:

```html
<del>Strike through this text.</del>
```

<br>
<br>
<br>


## Blockquotes
For quoting blocks of content from another source within your document.

Add `>` before any text you want to quote.

```markdown
> **Fusion Drive** combines a hard drive with a flash storage (solid-state drive) and presents it as a single logical volume with the space of both drives combined.
```

Renders to:

> **Fusion Drive** combines a hard drive with a flash storage (solid-state drive) and presents it as a single logical volume with the space of both drives combined.

and this HTML:

```html
<blockquote>
  <p><strong>Fusion Drive</strong> combines a hard drive with a flash storage (solid-state drive) and presents it as a single logical volume with the space of both drives combined.</p>
</blockquote>
```

Blockquotes can also be nested:

```markdown
> Donec massa lacus, ultricies a ullamcorper in, fermentum sed augue.
Nunc augue augue, aliquam non hendrerit ac, commodo vel nisi.
>> Sed adipiscing elit vitae augue consectetur a gravida nunc vehicula. Donec auctor
odio non est accumsan facilisis. Aliquam id turpis in dolor tincidunt mollis ac eu diam.
```

Renders to:

> Donec massa lacus, ultricies a ullamcorper in, fermentum sed augue.
Nunc augue augue, aliquam non hendrerit ac, commodo vel nisi.
>> Sed adipiscing elit vitae augue consectetur a gravida nunc vehicula. Donec auctor
odio non est accumsan facilisis. Aliquam id turpis in dolor tincidunt mollis ac eu diam.


<br>
<br>
<br>

## Notices

! The old mechanism for notices overriding the block quote syntax (`>>>`) has been deprecated.  Notices are now handled via a dedicated plugin called [Markdown Notices](https://github.com/getgrav/grav-plugin-markdown-notices)

<br>
<br>
<br>

## Lists

### Unordered
A list of items in which the order of the items does not explicitly matter.

You may use any of the following symbols to denote bullets for each list item:

```markdown
* valid bullet
- valid bullet
+ valid bullet
```

For example

```markdown
+ Lorem ipsum dolor sit amet
+ Consectetur adipiscing elit
+ Integer molestie lorem at massa
+ Facilisis in pretium nisl aliquet
+ Nulla volutpat aliquam velit
  - Phasellus iaculis neque
  - Purus sodales ultricies
  - Vestibulum laoreet porttitor sem
  - Ac tristique libero volutpat at
+ Faucibus porta lacus fringilla vel
+ Aenean sit amet erat nunc
+ Eget porttitor lorem
```
Renders to:

+ Lorem ipsum dolor sit amet
+ Consectetur adipiscing elit
+ Integer molestie lorem at massa
+ Facilisis in pretium nisl aliquet
+ Nulla volutpat aliquam velit
  - Phasellus iaculis neque
  - Purus sodales ultricies
  - Vestibulum laoreet porttitor sem
  - Ac tristique libero volutpat at
+ Faucibus porta lacus fringilla vel
+ Aenean sit amet erat nunc
+ Eget porttitor lorem

And this HTML

```html
<ul>
  <li>Lorem ipsum dolor sit amet</li>
  <li>Consectetur adipiscing elit</li>
  <li>Integer molestie lorem at massa</li>
  <li>Facilisis in pretium nisl aliquet</li>
  <li>Nulla volutpat aliquam velit
    <ul>
      <li>Phasellus iaculis neque</li>
      <li>Purus sodales ultricies</li>
      <li>Vestibulum laoreet porttitor sem</li>
      <li>Ac tristique libero volutpat at</li>
    </ul>
  </li>
  <li>Faucibus porta lacus fringilla vel</li>
  <li>Aenean sit amet erat nunc</li>
  <li>Eget porttitor lorem</li>
</ul>
```

### Ordered

A list of items in which the order of items does explicitly matter.

```markdown
1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa
4. Facilisis in pretium nisl aliquet
5. Nulla volutpat aliquam velit
6. Faucibus porta lacus fringilla vel
7. Aenean sit amet erat nunc
8. Eget porttitor lorem
```
Renders to:

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa
4. Facilisis in pretium nisl aliquet
5. Nulla volutpat aliquam velit
6. Faucibus porta lacus fringilla vel
7. Aenean sit amet erat nunc
8. Eget porttitor lorem

And this HTML:

```html
<ol>
  <li>Lorem ipsum dolor sit amet</li>
  <li>Consectetur adipiscing elit</li>
  <li>Integer molestie lorem at massa</li>
  <li>Facilisis in pretium nisl aliquet</li>
  <li>Nulla volutpat aliquam velit</li>
  <li>Faucibus porta lacus fringilla vel</li>
  <li>Aenean sit amet erat nunc</li>
  <li>Eget porttitor lorem</li>
</ol>
```

**TIP**: If you just use `1.` for each number, Markdown will automatically number each item. For example:

```markdown
1. Lorem ipsum dolor sit amet
1. Consectetur adipiscing elit
1. Integer molestie lorem at massa
1. Facilisis in pretium nisl aliquet
1. Nulla volutpat aliquam velit
1. Faucibus porta lacus fringilla vel
1. Aenean sit amet erat nunc
1. Eget porttitor lorem
```

Renders to:

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa
4. Facilisis in pretium nisl aliquet
5. Nulla volutpat aliquam velit
6. Faucibus porta lacus fringilla vel
7. Aenean sit amet erat nunc
8. Eget porttitor lorem


<br>
<br>
<br>


## Code

### Inline code
Wrap inline snippets of code with `` ` ``.

```markdown
In this example, `<section></section>` should be wrapped as **code**.
```

Renders to:

In this example, `<section></section>` should be wrapped with **code**.

HTML:

```html
<p>In this example, <code>&lt;section&gt;&lt;/section&gt;</code> should be wrapped with <strong>code</strong>.</p>
```

### Indented code

Or indent several lines of code by at least four spaces, as in:

<pre>
  // Some comments
  line 1 of code
  line 2 of code
  line 3 of code
</pre>

Renders to:

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code

HTML:

```html
<pre>
  <code>
    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code
  </code>
</pre>
```


### Block code "fences"

Use "fences"  ```` ``` ```` to block in multiple lines of code.

<pre>
``` markup
Sample text here...
```
</pre>


```
Sample text here...
```

HTML:

```html
<pre>
  <code>Sample text here...</code>
</pre>
```

### Syntax highlighting

GFM, or "GitHub Flavored Markdown" also supports syntax highlighting. To activate it, simply add the file extension of the language you want to use directly after the first code "fence", ` ```js `, and syntax highlighting will automatically be applied in the rendered HTML. For example, to apply syntax highlighting to JavaScript code:

<pre>
```js
grunt.initConfig({
  assemble: {
    options: {
      assets: 'docs/assets',
      data: 'src/data/*.{json,yml}',
      helpers: 'src/custom-helpers.js',
      partials: ['src/partials/**/*.{hbs,md}']
    },
    pages: {
      options: {
        layout: 'default.hbs'
      },
      files: {
        './': ['src/templates/pages/index.hbs']
      }
    }
  }
};
```
</pre>

Renders to:

```js
grunt.initConfig({
  assemble: {
    options: {
      assets: 'docs/assets',
      data: 'src/data/*.{json,yml}',
      helpers: 'src/custom-helpers.js',
      partials: ['src/partials/**/*.{hbs,md}']
    },
    pages: {
      options: {
        layout: 'default.hbs'
      },
      files: {
        './': ['src/templates/pages/index.hbs']
      }
    }
  }
};
```

!!! For syntax highlighting to work, the [Highlight plugin](https://github.com/getgrav/grav-plugin-highlight) needs to be installed and enabled. It in turn utilizes a jquery plugin, so jquery needs to be loaded in your theme too.

<br>
<br>
<br>



## Tables
Tables are created by adding pipes as dividers between each cell, and by adding a line of dashes (also separated by bars) beneath the header. Note that the pipes do not need to be vertically aligned.


```markdown
| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |
```

Renders to:

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

And this HTML:

```html
<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>data</td>
      <td>path to data files to supply the data that will be passed into templates.</td>
    </tr>
    <tr>
      <td>engine</td>
      <td>engine to be used for processing templates. Handlebars is the default.</td>
    </tr>
    <tr>
      <td>ext</td>
      <td>extension to be used for dest files.</td>
    </tr>
  </tbody>
</table>
```

### Right aligned text

Adding a colon on the right side of the dashes below any heading will right align text for that column.

```markdown
| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |
```

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |


<br>
<br>
<br>


## Links

### Basic link

```markdown
[Assemble](http://assemble.io)
```

Renders to (hover over the link, there is no tooltip):

[Assemble](http://assemble.io)

HTML:

```html
<a href="http://assemble.io">Assemble</a>
```


### Add a title

```markdown
[Upstage](https://github.com/upstage/ "Visit Upstage!")
```

Renders to (hover over the link, there should be a tooltip):

[Upstage](https://github.com/upstage/ "Visit Upstage!")

HTML:

```html
<a href="https://github.com/upstage/" title="Visit Upstage!">Upstage</a>
```

### Named Anchors

Named anchors enable you to jump to the specified anchor point on the same page. For example, each of these chapters:

```markdown
# Table of Contents
  * [Chapter 1](#chapter-1)
  * [Chapter 2](#chapter-2)
  * [Chapter 3](#chapter-3)
```
will jump to these sections:

```markdown
## Chapter 1 <a id="chapter-1"></a>
Content for chapter one.

## Chapter 2 <a id="chapter-2"></a>
Content for chapter one.

## Chapter 3 <a id="chapter-3"></a>
Content for chapter one.
```
**NOTE** that specific placement of the anchor tag seems to be arbitrary. They are placed inline here since it seems to be unobtrusive, and it works.


<br>
<br>
<br>


## Images
Images have a similar syntax to links but include a preceding exclamation point.

```markdown
![Minion](http://octodex.github.com/images/minion.png)
```
![Minion](http://octodex.github.com/images/minion.png)

or
```markdown
![Alt text](http://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")
```
![Alt text](http://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

Like links, Images also have a footnote style syntax

```markdown
![Alt text][id]
```
![Alt text][id]

With a reference later in the document defining the URL location:

[id]: http://octodex.github.com/images/dojocat.jpg  "The Dojocat"


    [id]: http://octodex.github.com/images/dojocat.jpg  "The Dojocat"





---
title: Pages
taxonomy:
    category: docs
process:
    twig: true
---

In Grav-speak, **Pages** are the fundamental building blocks of your site. They are how you write content and provide navigation in the Grav system.

Combining content and navigation ensures that the system is intuitive to use for even the most inexperienced of content authors. However, this system, in conjunction with powerful taxonomy capabilities, is still powerful enough to handle complex content requirements.

Grav natively supports **3 types of Pages** that allow you to create a rich selection of web content. Those types are:

![Grav Page Types](page-types.png)

#### Regular Page

![Standard Page](content-standard.jpg?classes=shadow)

A regular Page is generally a single page such as a **blog post**, **contact form**, **error page** etc. This is the most common type of page that you will create. By default a Page is considered a regular page unless you tell Grav otherwise.

When you download and install the **Core Grav** package, you are greeted by a standard page. We covered creating a simple regular Page in the [Basic Tutorial](/basics/basic-tutorial).

#### Listing Page

![Listing Page](content-listing.jpg?classes=shadow)

This is an extension of a regular Page. This is a page that has a reference to a collection of pages.

The most straightforward approach to setting this up is to create **child-pages** below the Listing Page. An example of this would be a **blog listing page**, where you would display a summary list of blog posts that exist as child-pages.

There is also some configuration settings to **control the order** of the listing as well as a **limit on the number of items**, and whether or not **pagination** should be enabled.

!! A sample **Blog Skeleton** using a **Listing Page** can be found in the [Grav Downloads](https://getgrav.org/downloads/skeletons).

#### Modular Page

![Modular Page](content-modular.jpg?classes=shadow)

A Modular Page is a special type of listing page because it builds a **single page** from its **child-pages**. This allows for the ability to build very complex **one-page layouts** from Modules. This is accomplished by constructing the **Modular Page** from multiple **Module-folders** found in the page's primary folder.

!! A sample **One-Page Skeleton** using a **Modular Page** can be found in the [Grav Downloads](https://getgrav.org/downloads/skeletons).

Each of these page types follows the same basic structure, so before we can get into the nitty-gritty of each type, we must explain how pages in Grav are constructed.

!! A Module, because it is intended to be part of another page, is inherently not a page you can reach directly via a URL. Because of this, all modular pages are by default set as **non-routable**.

## Folders

All content pages are located in the `/user/pages` folder. Each **Page** should be placed in its own folder.

!! Folder names should also be valid **slugs**. Slugs are entirely lowercase, with accented characters replaced by letters from the Latin alphabet and whitespace characters replaced by a dash or an underscore, to avoid being encoded.

Grav understands that any integer value followed by a period will be solely for ordering, and is removed internally in the system. For example, if you have a folder named `01.home`, Grav will treat this folder as `home`, but will ensure that with default ordering, it comes before `02.blog`.

![Grav Folder Example](page-folders.png)

Your site must have an entry-point so that it knows where to go when you point your browser to the root of your site. For example if you were to enter `http://yoursite.com` in your browser, by default Grav expects an alias `home/`, but you can override the home-location by changing the `home.alias` option in the [Grav configuration file](/basics/grav-configuration).

**Module-folders** are identified by an underscore (`_`) before the folder name. This is a special folder type that is intended to be used only with **modular content**.  These are **not routable** and **not visible** in the navigation. An example of a Module-folder would be a folder such as `user/pages/01.home/_header`. Home is configured as a **modular page** and would be constructed from the `_header`, `_features`, and `_body` Modules.

The textual name of each folder defaults to the _slug_ that the system uses as part of the URL. For example if you have a folder such as `/user/pages/02.blog`, the slug for this page would default to `blog`, and the full URL would be `http://yoursite.com/blog`. A blog item page, located in `/user/pages/02.blog/blog-item-5` would be accessible via `http://yoursite.com/blog/blog-item-5`.

If no number is provided as a prefix of the folder name, the page is considered to be **invisible**, and will not show up in the navigation. An example of this would be the `error` page in the above folder-structure.

!! This can actually be overridden in the page itself by setting the [visible parameter](/content/headers#visible) in the headers.

## Ordering

When dealing with collections, there are several options available to control how folders are ordered. The most important option is set in the `content.order.by` of the page configuration settings. The options are:

| Ordering     | Details                                                                                                                                              |
| :----------  | :----------                                                                                                                                          |
| **default**  | The order based on the file system, i.e. `01.home` before `02.advark`                                                                                |
| **title**    | The order is based on the title as defined in each page                                                                                              |
| **basename** | The order is based on the alphabetic folder without numeric order                                                                                    |
| **date**     | The order based on the date as defined in each page                                                                                                  |
| **modified** | The order based on the modified timestamp of the page                                                                                                |
| **folder**   | The order based on the folder name with any numerical prefix, i.e. `01.`, removed                                                                    |
| **header.x** | The order based on any page header field. i.e. `header.taxonomy.year`. Also a default can be added via a pipe. i.e. `header.taxonomy.year|2015` |
| **manual**   | The order based on the `order_manual` variable                                                                                                       |
| **random**   | The order is randomized                                                                                                                              |

You can specifically define a manual order by providing a list of options to the `content.order.custom` configuration setting. This will work in conjunction with the `content.order.by` because it first tries to order the pages manually, but any pages not specified in the manual order, will fall through and be ordered by the ordering provided.

!! You can override the **default behavior** for folder ordering and the direction in which the ordering occurs by setting the `pages.order.dir` and the `pages.order.by` options in the [Grav system configuration file](/basics/grav-configuration).

## Page File

Within the page-folder, we create the actual page-file. The filename should end with `.md` to indicate that it is a Markdown-formatted file. Technically, it is Markdown with YAML FrontMatter, which sounds impressive but really is not a big deal at all. We will cover the details of the file-structure soon.

The important thing to understand is the name of the file directly references the name of the theme's template file that will be used to render. The standard name for the main template file is **default**, so the file would be named `default.md`.

You can, of course, name your file whatever you like, for example: `document.md`, which would make Grav look for a template file in the theme that matches, such as the **document.html.twig** Twig-template.

!! This behavior can be overridden in the page by setting the [template parameter](/content/headers#template) in the headers.

An example page file could look like this:

```
---
title: Page Title
taxonomy:
    category: blog
---
# Page Title

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque porttitor eu
felis sed ornare. Sed a mauris venenatis, pulvinar velit vel, dictum enim. Phasellus
ac rutrum velit. **Nunc lorem** purus, hendrerit sit amet augue aliquet, iaculis
ultricies nisl. Suspendisse tincidunt euismod risus, _quis feugiat_ arcu tincidunt
eget. Nulla eros mi, commodo vel ipsum vel, aliquet congue odio. Class aptent taciti
sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Pellentesque
velit orci, laoreet at adipiscing eu, interdum quis nibh. Nunc a accumsan purus.
```

The settings between the pair of `---` markers are known as the YAML FrontMatter, and it is comprised of basic YAML settings for the page.

In this example, we are explicitly setting the title, as well the taxonomy to **blog** so we can filter it later.  The content after the second `---` is the actual content that will be compiled and rendered as HTML on your site.  This is written in [Markdown](/content/markdown), which will be covered in detail in a future chapter. Just know that the `#`, `**`, and `_` markers translate to **heading 1**, **bold**, and **italics**, respectively.

!! Ensure you save your `.md` files as `UTF-8`-encoded files. This will ensure they work with language-specific special characters.

### Summary Size and Separator

There is a setting in the `site.yaml` file that lets you define a default size (in characters) of the summary that can be used via `page.summary()` to display a summary or synopsis of the page. This is particularly useful for blogs where you want to have a listing that contains just summary information, and not the full page content.

By default, this value is `300` characters. You can override this in your `user/config/site.yaml` file, but an even more useful approach is to use the manual **summary separator** also known as the **summary delimiter**: `===`.

You need to ensure you put this in your content with blank lines **above** and **below**. For example:

```
Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat.

===

Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
```

This will use the text above the separator when referenced by `page.summary()` and the full page content when referenced by `page.content()`.

!! When using `page.summary()`, the summary size setting will be used if the separator is not found in the page content.

### Finding other Pages

Grav has a useful feature that allows you to find another page and perform actions on that page. This can be accomplished with the `find()`-method that simply takes the **route** and returns a new Page-object.

This allows you to perform a wide variety of functionality from any page on your Grav site. For example, you may want to provide a list of all current projects on a particular project detail page:

{% verbatim %}
```
# All Projects
<ul>
{% for p in page.find('/projects').children if p != page %}
<li><a href="{{p.url}}">{{ p.title }}</a></li>
{% endfor %}
</ul>
```
{% endverbatim %}

In the next section, we will continue to dig into the specifics of a Page in detail.

### contentMeta

Referencing pages and content is straightforward, but what about the content that doesn't get rendered on the front-end along with the rest of the page?

When Grav reads page content, it stores this content in cache. That way, the next time the page is rendered it doesn't have to read all the content from the `.md` file. Generally, this content is all rendered to the front-end. However, there are instances where having some additional data stored alongside the page in the cache is useful.

This is where `contentMeta()` comes in. We use ContentMeta in our [Shortcode](https://github.com/getgrav/grav-plugin-shortcode-core)-plugin to [retrieve sections from other pages](https://github.com/getgrav/grav-plugin-shortcode-core#sections-from-other-pages) using shortcodes. For example:

{% verbatim %}
```
<div id="author">{{ page.find('/my/custom/page').contentMeta.shortcodeMeta.shortcode.section.author }}</div>
```
{% endverbatim %}

We used this in Shortcode Core to store CSS and JS assets that the shortcode on the page requires, however this feature can be used to store just about any data structure you need.




---
title: Markdown syntax for files, widgets, and wikis in Azure DevOps
titleSuffix: Azure DevOps
description: Learn how to share information, add tables & mathematical notation using markdown within pull requests, README files, dashboards, and wikis
ms.prod: devops
ms.technology: devops-collab
ms.assetid: 43D2156E-2E20-42B8-B816-43E95CB479C5
ms.manager: douge
ms.author: chcomley
author: chcomley
ms.reviewer: sancha
ms.topic: reference
monikerRange: '>= tfs-2015'
ms.date: 12/11/2018
---

# Syntax guidance for markdown usage

[!INCLUDE [temp](../../_shared/version-ts-tfs-2015-2016.md)]

In this article you'll find some basic Markdown syntax guidance as well as specific guidance for using Markdown in Azure DevOps features. You can use both common [Markdown conventions](http://daringfireball.net/projects/markdown/syntax) and [GitHub-flavored extensions](https://help.github.com/articles/github-flavored-markdown/).

Having the right guidance at the right time is critical to success. To support your team or contributors to your project, use [markdown](https://en.wikipedia.org/wiki/Markdown) to add rich formatting, tables, and images to your project pages, README files, dashboards, and pull request comments.

You can provide guidance in the following areas using markdown:

::: moniker range=">= azdevserver-2019"

- [Project wiki (provisioned wiki)](add-edit-wiki.md)
- [Publish code as wiki](publish-repo-to-wiki.md)
- [Markdown widget added to a dashboard](../../report/dashboards/add-markdown-to-dashboard.md)
- [Project vision page or Welcome pages](project-vision-status.md)
- [Repository README files](../../repos/git/create-a-readme.md)
- [Pull request comments](../../repos/git/pull-requests.md)
- [Definition of Done (Kanban board)](../../boards/boards/definition-of-done.md)

::: moniker-end

::: moniker range="tfs-2018"

- [Project wiki](add-edit-wiki.md)
- [Markdown widget added to a dashboard](../../report/dashboards/add-markdown-to-dashboard.md)
- [Project vision page or Welcome pages](project-vision-status.md)
- [Repository README files](../../repos/git/create-a-readme.md)
- [Pull request comments](../../repos/git/pull-requests.md)
- [Definition of Done (Kanban board)](../../boards/boards/definition-of-done.md)

> [!NOTE]
> Rich markdown rendering in code repositories is supported for TFS 2018.2 and later versions. You can create rich README.md files in the code repositories. The markdown rendering of the MD files in code repositories supports HTML tags, block quotes, emojis, image resizing, and mathematical formulas. There is parity in markdown rendering in Wiki and MD files in code.

::: moniker-end

::: moniker range="tfs-2017"

- [Markdown widget added to a dashboard](../../report/dashboards/add-markdown-to-dashboard.md)
- [Project vision page or Welcome pages](project-vision-status.md)
- [Repository README files](../../repos/git/create-a-readme.md)
- [Pull request comments](../../repos/git/pull-requests.md)
- [Definition of Done (Kanban board)](../../boards/boards/definition-of-done.md)

> [!NOTE]
> With TFS 2017.1, welcome pages, the markdown widget on team dashboards, and the Definition of Done on Kanban boards will no longer support file links in their markdown. As a workaround, you can include your file link as text in the Markdown.

::: moniker-end

::: moniker range="tfs-2015"

- [Markdown widget added to a dashboard](../../report/dashboards/add-markdown-to-dashboard.md)
- [Project vision page or Welcome pages](project-vision-status.md)
- [Repository README files](../../repos/git/create-a-readme.md)
- [Definition of Done (Kanban board)](../../boards/boards/definition-of-done.md)

::: moniker-end

## Basic format elements

### Headers

Structure your comments using headers. Headers segment longer comments, making them easier to read.

Start a line with a hash character `#` to set a heading. Organize your remarks with subheadings by starting a line with additional hash characters, for example `####`. Up to six levels of headings are supported.

**Example:**
```
# This is a H1 header
## This is a H2 header
### This is a H3 header
#### This is a H4 header
##### This is a H5 header
```

**Result:**

<img src="_img/markdown-guidance/mrkdown-headers.png" alt="Web portal, Headers 1 through 5" style="border: 1px solid #C3C3C3;" />

### Paragraphs and line breaks

Make your text easier to read by breaking it up with paragraphs or line breaks.

::: moniker range=">= tfs-2018"
In pull request comments, press Enter to insert a line break and begin text on a new line.

In a Markdown file or widget, enter two spaces prior to the line break to begin a new paragraph, or enter two line breaks consecutively to begin a new paragraph.

::: moniker-end

::: moniker range="tfs-2017"
In pull request comments, press Enter to insert a line break and begin text on a new line. In a Markdown file or widget, enter two spaces prior to the line break to begin a new paragraph, or enter two line breaks consecutively to begin a new paragraph.
::: moniker-end

::: moniker range="tfs-2015"
In a Markdown file or widget, enter two spaces prior to the line break to begin a new paragraph, or enter two line breaks consecutively to begin a new paragraph.
::: moniker-end

**Example - pull request comment:**

<pre>
Add lines between your text with the Enter key.
This spaces your text better and makes it easier to read.
</pre>

**Result:**
Add lines between your text with the Enter key.
This spaces your text better and makes it easier to read.

**Example - markdown file or widget:**

<pre>
Add two spaces prior to the end of the line.(space, space)
This adds space in between paragraphs.
</pre>

**Result:**
Add two spaces prior to the end of the line.

This adds space in between paragraphs.

### Block quotes

Quote previous comments or text to set context for your comment or text.

Quote single lines of text be putting a `>` before the text. Use multiple `>` characters to nest quoted text.
Quote blocks of lines of text by using the same level of `>` across multiple lines.

**Example:**

<pre>
> Single line quote
>> Nested
>> multiple line
>> quote
</pre>

**Result:**

![quoting in markdown](_img/markdown-guidance/markdown_quote2.jpg)

### Horizontal rules

Add a horizontal rule by adding a new line that's just a series of dashes `---`. There must be a blank line above the line containing the `---`.

**Example:**

<div id="do_not_render">
<pre>
above
&nbsp;
&#45;&#45;&#45;&#45;
below
</pre>
</div>

**Result:**

above

-----

below

### Emphasis (bold, italics, strikethrough)

You can emphasize text by applying bold, italics, or strikethrough to characters:

- To apply italics: surround the text with an asterisk `*` or underscore `_`
- To apply bold: surround the text with double asterisks `**`.
- To apply strikethrough: surround the text with double tilde characters `~~`.

Combine these elements to apply multiple emphasis to text.

::: moniker range=">= azdevserver-2019"
> [!NOTE]
> There is no markdown syntax that supports underlining text. Within a wiki page, you can use the HTML `<u>` tag to generate underlined text. For example, `<u>underlined text</u>` will yield <u>underlined text`</u>.
::: moniker-end

::: moniker range="tfs-2018"
> [!NOTE]
> There is no markdown syntax that supports underlining text. Within a wiki page in TFS 2018.2 and later versions, you can use the HTML `<u>` tag to generate underlined text. For example, `<u>underlined text</u>` will yield <u>underlined text`</u>.
::: moniker-end

::: moniker range=">= tfs-2015 <= tfs-2017"
> [!NOTE]
> There is no markdown syntax that supports underlining text.
::: moniker-end

**Example:**

<pre>
Use _emphasis_ in comments to express **strong** opinions and point out ~~corrections~~
**_Bold, italizied text_**
**~~Bold, strike-through text~~**
</pre>

<br/>
**Result:**
Use _emphasis_ in comments to express **strong** opinions and point out <s>corrections</s>
**_Bold, italizied text_**
**~~Bold, strike-through text~~**

### Code highlighting

Highlight suggested code segments using code highlight blocks.
To indicate a span of code, wrap it with three backtick quotes (<code>&#96;&#96;&#96;</code>) on a new line at both the start and end of the block. To indicate code inline, wrap it with one backtick quote (<code>&#96;</code>).

**Example:**

<pre>&#96;&#96;&#96;
$ sudo npm install vsoagent-installer -g
&#96;&#96;&#96;
</pre>

<br/>
**Result:**
```
$ sudo npm install vsoagent-installer -g
```
<br/>
**Example:**

<pre>
To install the Microsoft Cross Platform Build & Release Agent, run the following: &#96;$ sudo npm install vsoagent-installer -g&#96;.
</pre>

<br/>
**Result:**
To install the Microsoft Cross Platform Build & Release Agent run the following: `$ sudo npm install vsoagent-installer`.

<br/>
Within a markdown file, text with four spaces at the beginning of the line automatically converts to a code block.

Set a language identifier for the code block to enable syntax highlighting for any of the [supported languages](http://highlightjs.readthedocs.io/en/latest/css-classes-reference.html#language-names-and-aliases).

<pre>
``` language
code
```
</pre>

<br/>
**Additional examples:**

<pre>
``` js
const count = records.length;
```
</pre>

``` js
const count = records.length;
```

<br/>
<pre>
``` csharp
Console.WriteLine("Hello, World!");
```
</pre>

``` csharp
Console.WriteLine("Hello, World!");
```

## YAML tags

Any file that contains a YAML block in a Wiki is processed by a table with one head and one row. The YAML block must be the first thing in the file and must take the form of valid YAML set between triple-dashed lines. It supports all basic datatypes, lists, and objects as values. The syntax is supported in wiki, code file preview.

Basic example:

```
tag: post
title: Hello world
```

![YAML tag, basic example](_img/wiki/yaml_basic_example.png)

Tags with list:
```
tags:
- post
- code
- web
title: Hello world
```

![YAML tags with list example](_img/wiki/yaml_tags_with_list.png)

## Tables

Organize structured data with tables. Tables are especially useful for describing function parameters, object methods, and other data that has
a clear name to description mapping. You can format tables in pull requests, wiki, and markdown files such as README files and markdown widgets.

- Place each table row on its own line
- Separate table cells using the pipe character `|`
- The first two lines of a table set the column headers and the alignment of elements in the table
- Use colons (`:`) when dividing the header and body of tables to specify column alignment (left, center, right)
- To start a new line, use the HTML break tag (`<br/>`) (Works within a Wiki but not elsewhere)
- Make sure to end each row with a CR or LF.
- A blank space is required before and after workitem or PR mentions inside a table cell.

**Example:**

```
| Heading 1 | Heading 2 | Heading 3 |
|-----------|:-----------:|-----------:|
| Cell A1 | Cell A2 | Cell A3 |
| Cell B1 | Cell B2 | Cell B3<br/>second line of text |
```

<br/>
**Result:**

| Heading 1 | Heading 2 | Heading 3 |
|-----------|:---------:|-----------:|
| Cell A1 | Cell A2 | Cell A3 |
| Cell B1 | Cell B2 | Cell B3<br/>second line of text |

## Lists

Organize related items with lists. You can add ordered lists with numbers, or unordered lists with just bullets.

Ordered lists start with a number followed by a period for each list item. Unordered lists start with a `-`. Begin each list item on a new line. In a Markdown file or widget, enter two spaces prior to the line break to begin a new paragraph, or enter two line breaks consecutively to begin a new paragraph.

### Ordered or numbered lists

**Example:**
```
1. First item.
2. Second item.
3. Third item.
```

**Result:**
1. First item.
2. Second item.
3. Third item.

### Bullet lists

**Example:**

<pre>
- Item 1
- Item 2
- Item 3
</pre>

**Result:**

- Item 1
- Item 2
- Item 3

### Nested lists

**Example:**
<pre>
1. First item.
   - Item 1
   - Item 2
   - Item 3
1. Second item.
   - Nested item 1
   - Nested item 2
   - Nested item 3
</pre>

**Result:**

1. First item.
	- Item 1
	- Item 2
	- Item 3
2. Second item.
	- Nested item 1
	- Nested item 2
	- Nested item 3

## Links

In pull request comments and wikis, HTTP and HTTPS URLs are automatically formatted as links. Also, within pull requests, you can link to work items by typing the # key and a work item ID, and then choosing the work item from the list.

You can escape auto suggestion of work items by prefixing # with a backslash (`\`). E.g. This can be useful if you want to use # for color hex codes.

In markdown files and widgets, you can set text hyperlinks for your URL using the standard markdown link syntax:

```
[Link Text](Link URL)
```
When linking to another Markdown page in the same Git or TFVC repository, the link target can be a relative path or an absolute path in the repository.

**Supported links for Welcome pages:**

<ul>
<li>Relative path: ```[text to display](./target.md)```  </li>
<li>Absolute path in Git: ```[text to display](/folder/target.md)``` </li>
<li>Absolute path in TFVC: ```[text to display]($/project/folder/target.md)```</li>
<li>URL: ```[text to display](http://address.com)```  </li>
</ul>
<p>**Supported links for [Markdown widget](../../report/dashboards/widget-catalog.md#markdown-widget):**</p>
<ul>
<li>URL: ```[text to display](http://address.com)```  </li>
</ul>
**Supported links for Wiki:**
<ul>
<li>Absolute path of Wiki pages: ```[text to display](/parent-page/child-page)``` </li>
<li>URL: ```[text to display](http://address.com)```  </li>
</ul>

> [!NOTE]
> Links to documents on file shares using `file://` are not supported on TFS 2017.1 and later versions. This restriction has been implemented for security purposes.
>
>For information on how to specify relative links from a Welcome page or Markdown widget, see [Source control relative links](#relative-links).

**Example:**
<pre>
&#91;C# language reference](https://msdn.microsoft.com/library/618ayhy6.aspx)
</pre>

**Result:**

[C# language reference](https://msdn.microsoft.com/library/618ayhy6.aspx)

::: moniker range=">= tfs-2018"

<a id="link-work-items">  </a>

### Link to work items from a Wiki page

Simply enter the pound sign (`#`) and enter a work item ID.

::: moniker-end

::: moniker range="tfs-2018"
> [!NOTE]
> This feature is available with TFS 2018.2 and later versions.
::: moniker-end

<a id="relative-links">  </a>

### Source control relative links

Links to source control files are interpreted differently depending on whether you specify them in a Welcome page or a Markdown widget. The system interprets relative links as follows:

- **Welcome page:** relative to the root of the source control repository in which the welcome page exists
- **Markdown widget:**  relative to the team project collection URL base.

For example:

| Welcome page  | Markdown widget equivalent  |
|--------------------|-----------------------------------|
| /BuildTemplates/AzureContinuousDeploy.11.xaml |/DefaultCollection/Fabrikam Fiber/_versionControl#path=$/Tfvc Welcome/BuildTemplates/AzureContinuousDeploy.11.xaml|
| ./page-2.md |/DefaultCollection/Fabrikam Fiber/_versionControl#path=$/Tfvc Welcome/page-2.md |

### Anchor links

Within Markdown files, anchor IDs are assigned to all headings when rendered as HTML. The ID is the heading text, with the spaces replaced by dashes (-) and all lower case. In general, the following conventions:

- Punctuation marks and leading white spaces within a file name are ignored
- Upper case letters are  converted to lower
- Spaces between letters are converted to dashes (-).

**Example:**

<pre>
###Link to a heading in the page
</pre>

<br/>
**Result:**

The syntax for an anchor link to a section...

<pre>
[Link to a heading in the page](#link-to-a-heading-in-the-page)
</pre>
<br/>
The ID is all lower case, and the link is case sensitive, so be sure to use lower case, even though the heading itself uses upper case.

You can also reference headings within another Markdown file:

<pre>
[text to display](./target.md#heading-id)
</pre>

<br/>
In wiki, you can also reference heading in another page:

<pre>
[text to display](/page-name#section-name)
</pre>

<a name="images"> </a>

## Images

Add images and animated GIFs to your pull request comments, markdown files, or wiki pages to highlight issues or just to liven the discussion.

Use the following syntax to add an image: <div id="do_not_render"><pre>&#33;&#91;Text](URL)</pre></div> The text in the brackets describes the image being linked and the URL points to the image location.

**Example:**

<pre>
![Illustration to use for new users](https://docs.microsoft.com/media/illustrations/bcs-user-management-add-customer-1.svg)
</pre>

<br/>
**Result:**

![Illustration of linked image](https://docs.microsoft.com/media/illustrations/bcs-user-management-add-customer-1.svg)

The path to the image file can be a relative path or the absolute path in Git or TVFC, just like the path to another Markdown file in a link.
<ul>
<li>Relative path:<br/> ```![Image alt text](./image.png)``` </li>
<li>Absolute path in Git:<br/> ```![Image alt text](/_img/markdown-guidance/image.png)``` </li>
<li>Absolute path in TFVC:<br/> ```![Image alt text]($/project/folder/_img/markdown-guidance/image.png)```  </li>
<li>Resize image:<br/> ```![Image alt text]($/project/folder/_img/markdown-guidance/image.png =WIDTHxHEIGHT)```  </li>
</ul>

> [!NOTE]
> The syntax to support image resizing is only supported in pull requests and the Wiki.

::: moniker range=">= tfs-2017"

## Checklist or task list

Lightweight task lists are a great way to track progress on a list of todos as a pull request creator or reviewer in the PR description or in a wiki page. Click the Markdown toolbar to get started or apply the format to selected text.

You can Use `[ ]` or `[x]` to support checklists. You need to precede the checklist with either `-<space>` or `1.<space>` (any numeral).

**Example - Apply the task list markdown to a higlighted list**

> [!div class="mx-imgBorder"]
> ![Apply markdown task list format to a highlighted list in a PR](_img/markdown-guidance/checklist-pr-apply.png)

Once you've added a task list, you can simply check the boxes to mark items as completed. These are expressed and stored within the comment as [ ] and [x] in Markdown.

> [!div class="mx-imgBorder"]
> ![Apply markdown task list format to a highlighted list in a PR](_img/markdown-guidance/checklist-pr-applied-check.png)

**Example - Format a list as a task list**

<pre>
- [ ] A
- [ ] B
- [ ] C
- [x] A
- [x] B
- [x] C

</pre>

<br/>
**Result:**

<img src="_img/markdown-guidance/markdown-checklists.png" alt="Checklists" style="border: 1px solid #C3C3C3;" />

> [!NOTE]
> A checklist within a table cell isn't supported.

::: moniker-end

::: moniker range=">= tfs-2017"

## Emoji

::: moniker-end

::: moniker range=">= tfs-2018"
In pull request comments and wiki pages, you can use emojis to add character and react to comments in the request. Enter what you're feeling surrounded by `:` characters to get a matching emoji in your text. The [full set of emojis](http://www.webpagefx.com/tools/emoji-cheat-sheet/) are supported.

::: moniker-end

::: moniker range="tfs-2017"
In pull request comments, you can use emojis to add characters and react to comments in the request. Enter what you're feeling surrounded by `:` characters to get a matching emoji in your text. The [full set of emojis](http://www.webpagefx.com/tools/emoji-cheat-sheet/) are supported.

::: moniker-end

::: moniker range=">= tfs-2017"

**Example:**

<pre>
:smile:
:angry:
</pre>
<br/>

**Result:**

![Emojis in markdown](../../repos/git/_img/pull-requests/emoji-markdown.png)

To escape emojis, enclose them using the \` character.

**Example:**

<pre>`:smile:` `:)` `:angry:`</pre>

**Result:**

 `:smile:` `:)` `:angry:`

::: moniker-end

## Ignore or escape markdown syntax to enter specific or literal characters

<table width="650px">
<tbody valign="top">
<tr>
<th width="300px">Syntax</th>
<th width="350px">Example/notes</th>
</tr>


<tr>
<td>
<p>To insert one of the following characters, prefix with a backslash:</p>

<p style="margin-bottom:2px;">```\   backslash ``` </p>
<p style="margin-bottom:2px;"><code>\`</code>   `backtick`</p>
<p style="margin-bottom:2px;">```_   underscore  ```</p>
<p style="margin-bottom:2px;">```{}  curly braces  ``` </p>
<p style="margin-bottom:2px;">```[]  square brackets ```</p>
<p style="margin-bottom:2px;">```()  parentheses  ```</p>
<p style="margin-bottom:2px;">```#   hash mark  ``` </p>
<p style="margin-bottom:2px;">```+   plus sign  ```</p>
<p style="margin-bottom:2px;">```-   minus sign (hyphen) ```</p>
<p style="margin-bottom:2px;">```.   dot  ``` </p>
<p style="margin-bottom:2px;">```!   exclamation mark  ```</p>

</td>
<td>Some examples on inserting special characters
<p>Enter ```\\``` to get \\ </p>
<p>Enter ```\_``` to get _ </p>
<p>Enter ```\#``` to get \# </p>
<p>Enter ```\(``` to get \( </p>
<p>Enter ```\.``` to get \. </p>
<p>Enter ```\!``` to get \! </p>
</td>
</tr>

</tbody>
</table>


::: moniker range=">= tfs-2017"

<a name="attach"></a>

## Attachments

::: moniker-end

::: moniker range=">= tfs-2018"
In pull request comments and wiki pages, you can attach files to illustrate your point or to give more detailed reasoning behind your suggestions. To attach a file, drag and drop it into the comment field or wiki page edit experience. You can also select the paper-clip icon in the upper-right of the comment box or the format pane in wiki page.
::: moniker-end

::: moniker range="tfs-2017"
In pull request comments, you can attach files to illustrate your point or to give more detailed reasoning behind your suggestions. To attach a file, drag and drop it into the comment field. You can also select the paper-clip icon in the upper-right of the comment box.
::: moniker-end

::: moniker range="tfs-2017"
> [!NOTE]
> Attachments in pull requests is available with TFS 2017.1 and later versions.
::: moniker-end

::: moniker range=">= tfs-2017"

<img src="_img/markdown-guidance/attach_files.png" alt="Web portal, Pull Request, Attach files via drag and drop i" style="border: 1px solid #C3C3C3;" />

If you have an image in your clipboard, you can paste it from the clipboard into the comment box or wiki page and it will render directly into your comment or wiki page.

Attaching non-image files creates a link to the file in your comment. Update the description text between the brackets to change the text displayed in the link.
Attached image files render directly into your comment or wiki pages. Once you save or update a comment or wiki page with an attachment, you can see the attached image(s) and can select links to download attached files.

Attachments support the following file formats.

> [!div class="mx-tdCol2BreakAll"]
> |          Type          | File formats |
> |------|---------|
> | Code | CS (.cs), Extensible Markup Language (.xml), JavaScript Object Notation (.json), Hypertext Markup Language(.html, .htm), Layer (.lyr), Windows PowerShell script (.ps1), Roshal Archive (.rar), Remote Desktop Connection (.rdp), Structured Query Language (.sql) - **Note: Code attachments are not permitted in PR comments**  |
> | Compressed files | ZIP (.zip) and GZIP (.gz) |
> | Documents | Markdown (.md), Microsoft Office Message (.msg), Microsoft Project (.mpp), Word (.doc and .docx), Excel (.xls, .xlsx and .csv), and Powerpoint (.ppt and .pptx), text files (.txt), and PDFs (.pdf) |
> | Images | PNG (.png), GIF (.gif), JPEG (both .jpeg and .jpg), Icons (.ico) |
> | Visio | VSD (.vsd and .vsdx)  |
> | Video | MOV (.mov), MP4 (.mp4) |

> [!NOTE]
> Not all file formats are supported within pull requests, such as Microsoft Office Message (.msg) files.

::: moniker-end

::: moniker range=">= tfs-2018"
<a name="html"></a>

## HTML tag support in wiki pages

In wiki pages, you can also create rich content using HTML tags.
::: moniker-end
::: moniker range="tfs-2018"
> [!NOTE]
> Pasting rich content as HTML is supported in TFS 2018.2 and later versions.
::: moniker-end

::: moniker range=">= tfs-2018"
**Example - Embedded video**

```HTML
<video src="path of the video file" width=400 controls>
</video>
```

**For example:**
```HTML
<video src="https://sec.ch9.ms/ch9/7247/7c8ddc1a-348b-4ba9-ab61-51fded6e7247/vstswiki_high.mp4" width=400 controls>
</video>
```

</br>
**Result:**
</br>
<video src="_img/markdown-guidance/vstswiki_mid.mp4" width="600" controls>
</video>

**Example - Rich text format**

```HTML
<p>This text needs to <del>strikethrough</del> <ins>since it is redundant</ins>!</p>
<p><tt>This text is teletype text.</tt></p>
<font color="blue">Colored text</font>
<center>This text will be center-aligned.</center>
<p>This text contains <sup>superscript</sup> text.</p>
<p>This text contains <sub>subscript</sub> text.</p>
<p>The project status is <span style="color:green;font-weight:bold">GREEN</span> even though the bug count / developer may be in <span style="color:red;font-weight:bold">red.</span> - Capability of span
<p><small>Disclaimer: Wiki also supports showing small text</small></p>
<p><big>Bigger text</big></p>
```

**Result:**
<p>This text needs to <del>strikethrough</del> <ins>since it is redundant</ins>!</p>
<p><tt>This text is teletype text.</tt></p>
<font color="blue">Colored text</font>
<center>This text will be center-aligned.</center>
<p>This text contains <sup>superscript</sup> text.</p>
<p>This text contains <sub>subscript</sub> text.</p>
<p>The project status is <span style="color:green;font-weight:bold">GREEN</span> even though the bug count / developer may be in <span style="color:red;font-weight:bold">red.</span> - Capability of span
<p><small>Disclaimer: Wiki also supports showing small text</small></p>
<p><big>Bigger text</big></p>

::: moniker-end

::: moniker range=">=tfs-2018"

<a id="mathematical-notation">  </a>

## Mathematical notation and characters

Both inline and block [KaTeX](https://khan.github.io/KaTeX/function-support.html) notation is supported in wiki pages and pull requests. This includes inserting symbols, Greek letters, mathematical operators, powers and indices, fractions and binomials, and other KaTeX supported elements.

To include mathematical notation, surround the mathematical notation with a `$` sign, for inline, and `$$` for block,  as shown in the following examples:

::: moniker-end

::: moniker range="tfs-2018"
> [!NOTE]
> This feature is supported within Wiki pages and pull requests for TFS 2018.2 or later versions.
::: moniker-end

::: moniker range=">=tfs-2018"

### Example: Greek characters

```KaTeX
$
\alpha, \beta, \gamma, \delta, \epsilon, \zeta, \eta, \theta, \kappa, \lambda, \mu, \nu, \omicron, \pi, \rho, \sigma, \tau, \upsilon, \phi, ...
$


$\Gamma,  \Delta,  \Theta, \Lambda, \Xi, \Pi, \Sigma, \Upsilon, \Phi, \Psi, \Omega$
```

**Result:**
> [!div class="mx-imgBorder"]
![Greek letters](_img/markdown-guidance/mathematical-notation-greek-characters.png)

### Example: Algebraic notation

```KaTeX
Area of a circle is $\pi r^2$

And, the area of a triangle is:

$$
A_{triangle}=\frac{1}{2}({b}\cdot{h})
$$

```

**Result:**
> [!div class="mx-imgBorder"]
![Algebraic notation](_img/markdown-guidance/mathematical-notation-algebra.png)

### Example: Sums and Integrals

```KaTeX
$$
\sum_{i=1}^{10} t_i
$$


$$
\int_0^\infty \mathrm{e}^{-x}\,\mathrm{d}x
$$
```

**Result:**
> [!div class="mx-imgBorder"]
![Greek letters](_img/markdown-guidance/mathematical-notation-sums-integrals.png)

::: moniker-end

::: moniker range=">= azdevserver-2019"
<a id="toc-wiki" > </a>

## Table of contents (TOC) for Wiki pages

You can now just add a tag [[\_TOC\_]] to enable table of contents in your page. The TOC is generated when the tag is added to the page and there is at least one heading in the page.

> [!div class="mx-imgBorder"]
> ![Table of contents](_img/toc_sample.png)

The [[\_TOC\_]] can be placed anywhere in the page to render the Table of Contents.
Only Markdown headings are considered for TOC (HTML heading tags are not).

All HTML and markdown tags are stripped from the headings while adding it inside the TOC block.
For example: Adding bold and italics to a heading text will render the TOC as follows.

> [!div class="mx-imgBorder"]
> ![Tags for Toc](_img/toc_tags.png)

This is to maintain consistency in the formatting in TOC.
Note: The tag [[\_TOC\_]] is case sensitive i.e. [[\_toc\_]] may not render the TOC.

::: moniker-end


::: moniker range=">= azdevserver-2019"

## Embed Videos in a Wiki page

To embed videos from YouTube and Microsoft Streams in a wiki page, use the following syntax:

```
::: video
<iframe width="100%" height="315" src="https://www.youtube.com/embed/OtqFyBA6Dbk" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
:::
```
The iframe is the embed iframe block of the YouTube or Microsoft Streams video.

**Result:**

<iframe width="100%" height="315" src="https://www.baidu.com" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

(The ending ":::" is required to prevent break in page)

::: moniker-end

## Related articles

- [Project vision page or Welcome pages](project-vision-status.md)
- [README files](../../repos/git/create-a-readme.md)
- [Pull requests](../../repos/git/pull-requests.md)
- [Markdown widget](../../report/dashboards/add-markdown-to-dashboard.md)
- [Dashboards](../../report/dashboards/dashboards.md)
- [Widget catalog](../../report/dashboards/widget-catalog.md)
- [Wiki](add-edit-wiki.md)

