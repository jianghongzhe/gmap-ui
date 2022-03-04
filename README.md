## 思维导图工具软件
通过markdown文本自动生成思维导图，不使用鼠标拖拽的方式，更适合程序员手不离开键盘的使用方式。

#### 运行开发服务器
- package.json
	- 指定electron启动命令（其中设置开发服务器的地址作为环境变量）：set DEV_SERVER_URL=http://localhost:3000 && electron .
	- 指定electron运行的主文件（其中判断指定的环境变量作为开发环境/部署环境的区别）：main.js
- npm start：启动react开发服务器
- npm run electron：启动electron

#### 部署
- npm run build：打包react项目到build目录
- 复制如下指定内容目录到electron预编译目录的resources/app下

|目录或文件名|说明|
|-|-|
|main|主进程相关文件，其中包含启动入口|
|build|系统主功能窗口的渲染进程|
|findinpage|查找窗口渲染进程|
|externals|外部程序和导出模版|
|gmaps|导图主目录，应为空|
|cache|缓存目录，应为空|
|work|工作目录，应为空|
|package.json|主配置文件|



