## 图形工具软件
目前只支持思维导图类型，以后会支持其他类型

#### 运行开发服务器
- package.json
	- 指定electron启动命令（其中设置开发服务器的地址作为环境变量）：set DEV_SERVER_URL=http://localhost:3000 && electron .
	- 指定electron运行的主文件（其中判断指定的环境变量作为开发环境/部署环境的区别）：main.js
- npm start：启动react开发服务器
- npm run electron：启动electron

#### 部署
- npm run build：打包react项目到build目录
- main.js中要指定启动的静态页：mainWindow.loadFile(__dirname+'\\build\\index.html');
- 复制package.json、main.js、build目录到electron预编译目录的resources/app下



