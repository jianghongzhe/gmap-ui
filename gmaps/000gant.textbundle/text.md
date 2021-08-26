- 常用内容
	- aaa|ref:haha|[](file:///D:\games\TombRaider\开始游戏.exe)|ref:haha
	- 222|[](cp:///dfas)
	- file|[](file:///d:\a.txt)|[](file:///d:\aaaaa.txt)
	- dir|[](dir:///d:\a.txt)|[](dir:///d:\aaaaa.txt)
	- ssssssss|[](file:///D:\中 文\a.txt)|[](openas:///D:\中 文\a.txt)
	- ping|[](cmd://ping 192.168.{{ip1}}.{{ip2:1}})
	- 百度|[](https://www.baidu.com/s?wd={{关键词}})
	- goto|[跳转到导图 - jvm/test/ccdfasd](gmap://jvm/test/ccdfasd)
	
	
***

# ref:haha
```echart
bar
title 柱状图
w 50%
h 200px
x 横轴名称
y 纵轴名称
,2018,2019,2020
食品,500,400,300
娱乐,600,400,600
医疗,500,200,300
```

### 一、引导用户登录并获取授权码：authorization_code
#### 方式1：通过回调地址获取
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=REDIRECT_URL&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY、REDIRECT_URL，并且REDIRECT_URL需要在应用管理中注册

#### 方式2：直接从百度提供的页面上获取，需要手动复制授权码
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=oob&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY，redirect_uri参数固定传入oob即可，此方式只能手动复制授权码，无法与应用集成（自动获取授权码）



### 二、使用授权码换取访问令牌：access_token
```http
GET https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=CODE&client_id=APP_KEY&client_secret=APP_SECRET&redirect_uri=REDIRECT_URL HTTP/1.1
```
> 需要填写CODE、APP_KEY、APP_SECRET、REDIRECT_URL，其中REDIRECT_URL需要与上面传入的一致


### 三、目录列表
```http
GET https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN HTTP/1.1
```
> 需要填写PATH、ACCESS_TOKEN


### 四、获取文件详细信息，包含下载地址
```http
GET https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=FSIDS HTTP/1.1
```
> 需要填写ACCESS_TOKEN、FSIDS，其中FSIDS格式为数组：[111,222,333]  
> 返回数据中dlink为下载地址

### 五、下载文件
```http
GET DLINK&access_token=ACCESS_TOKEN HTTP/1.1
User-Agent: pan.baidu.com
```
> 需要填写DLINK、ACCESS_TOKEN  
> 并且请求头中要有 `User-Agent: pan.baidu.com`



### 一、在应用管理中复制出API KEY与SECRET KEY
[应用管理地址](http://developer.baidu.com/console#app/project)
```
API Key：GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb
Secret Key：SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw
```

### 二、在应用管理中设置回调地址
```
http://192.168.1.156/collectAuthCode,
http://gigijiang.asuscomm.com:50080/collectAuthCode
```

### 三、获取授权码
访问地址
```
http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode&scope=basic,netdisk&display=page&qrcode=1&force_login=1
```

返回结果
```
http://gigijiang.asuscomm.com:50080/collectAuthCode?code=xxx
```

> 3326b8ec7ac842f00e2ceb5142babf8b


### 四、获取ACCESS_TOKEN、REFRESH_TOKEN
```
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=AUTH_CODE&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=3326b8ec7ac842f00e2ceb5142babf8b&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
```

> refresh_token: 122.198eec8dce901709fe5200da7fe12143.YCLLJz1ZuHPTji7C3jBPy6yaQClVlg1m6yCRhqw.BVYKjw  
access_token: 121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q


### 五、文件列表、查看文件详情、文件下载
```
https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN
https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=[ID1,ID2,ID2...]
DLINK&access_token=ACCESS_TOKEN


https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=%2F%E6%88%91%E7%9A%84%E5%BA%94%E7%94%A8%2Ftest%2F&access_token=121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q
```
> 下载时加请求头：`User-Agent: pan.baidu.com`

### 一、引导用户登录并获取授权码：authorization_code
#### 方式1：通过回调地址获取
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=REDIRECT_URL&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY、REDIRECT_URL，并且REDIRECT_URL需要在应用管理中注册

#### 方式2：直接从百度提供的页面上获取，需要手动复制授权码
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=oob&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY，redirect_uri参数固定传入oob即可，此方式只能手动复制授权码，无法与应用集成（自动获取授权码）



### 二、使用授权码换取访问令牌：access_token
```http
GET https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=CODE&client_id=APP_KEY&client_secret=APP_SECRET&redirect_uri=REDIRECT_URL HTTP/1.1
```
> 需要填写CODE、APP_KEY、APP_SECRET、REDIRECT_URL，其中REDIRECT_URL需要与上面传入的一致


### 三、目录列表
```http
GET https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN HTTP/1.1
```
> 需要填写PATH、ACCESS_TOKEN


### 四、获取文件详细信息，包含下载地址
```http
GET https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=FSIDS HTTP/1.1
```
> 需要填写ACCESS_TOKEN、FSIDS，其中FSIDS格式为数组：[111,222,333]  
> 返回数据中dlink为下载地址

### 五、下载文件
```http
GET DLINK&access_token=ACCESS_TOKEN HTTP/1.1
User-Agent: pan.baidu.com
```
> 需要填写DLINK、ACCESS_TOKEN  
> 并且请求头中要有 `User-Agent: pan.baidu.com`



### 一、在应用管理中复制出API KEY与SECRET KEY
[应用管理地址](http://developer.baidu.com/console#app/project)
```
API Key：GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb
Secret Key：SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw
```

### 二、在应用管理中设置回调地址
```
http://192.168.1.156/collectAuthCode,
http://gigijiang.asuscomm.com:50080/collectAuthCode
```

### 三、获取授权码
访问地址
```
http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode&scope=basic,netdisk&display=page&qrcode=1&force_login=1
```

返回结果
```
http://gigijiang.asuscomm.com:50080/collectAuthCode?code=xxx
```

> 3326b8ec7ac842f00e2ceb5142babf8b


### 四、获取ACCESS_TOKEN、REFRESH_TOKEN
```
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=AUTH_CODE&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=3326b8ec7ac842f00e2ceb5142babf8b&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
```

> refresh_token: 122.198eec8dce901709fe5200da7fe12143.YCLLJz1ZuHPTji7C3jBPy6yaQClVlg1m6yCRhqw.BVYKjw  
access_token: 121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q


### 五、文件列表、查看文件详情、文件下载
```
https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN
https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=[ID1,ID2,ID2...]
DLINK&access_token=ACCESS_TOKEN


https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=%2F%E6%88%91%E7%9A%84%E5%BA%94%E7%94%A8%2Ftest%2F&access_token=121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q
```
> 下载时加请求头：`User-Agent: pan.baidu.com`

### 一、引导用户登录并获取授权码：authorization_code
#### 方式1：通过回调地址获取
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=REDIRECT_URL&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY、REDIRECT_URL，并且REDIRECT_URL需要在应用管理中注册

#### 方式2：直接从百度提供的页面上获取，需要手动复制授权码
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=oob&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY，redirect_uri参数固定传入oob即可，此方式只能手动复制授权码，无法与应用集成（自动获取授权码）



### 二、使用授权码换取访问令牌：access_token
```http
GET https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=CODE&client_id=APP_KEY&client_secret=APP_SECRET&redirect_uri=REDIRECT_URL HTTP/1.1
```
> 需要填写CODE、APP_KEY、APP_SECRET、REDIRECT_URL，其中REDIRECT_URL需要与上面传入的一致


### 三、目录列表
```http
GET https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN HTTP/1.1
```
> 需要填写PATH、ACCESS_TOKEN


### 四、获取文件详细信息，包含下载地址
```http
GET https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=FSIDS HTTP/1.1
```
> 需要填写ACCESS_TOKEN、FSIDS，其中FSIDS格式为数组：[111,222,333]  
> 返回数据中dlink为下载地址

### 五、下载文件
```http
GET DLINK&access_token=ACCESS_TOKEN HTTP/1.1
User-Agent: pan.baidu.com
```
> 需要填写DLINK、ACCESS_TOKEN  
> 并且请求头中要有 `User-Agent: pan.baidu.com`



### 一、在应用管理中复制出API KEY与SECRET KEY
[应用管理地址](http://developer.baidu.com/console#app/project)
```
API Key：GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb
Secret Key：SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw
```

### 二、在应用管理中设置回调地址
```
http://192.168.1.156/collectAuthCode,
http://gigijiang.asuscomm.com:50080/collectAuthCode
```

### 三、获取授权码
访问地址
```
http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode&scope=basic,netdisk&display=page&qrcode=1&force_login=1
```

返回结果
```
http://gigijiang.asuscomm.com:50080/collectAuthCode?code=xxx
```

> 3326b8ec7ac842f00e2ceb5142babf8b


### 四、获取ACCESS_TOKEN、REFRESH_TOKEN
```
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=AUTH_CODE&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=3326b8ec7ac842f00e2ceb5142babf8b&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
```

> refresh_token: 122.198eec8dce901709fe5200da7fe12143.YCLLJz1ZuHPTji7C3jBPy6yaQClVlg1m6yCRhqw.BVYKjw  
access_token: 121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q


### 五、文件列表、查看文件详情、文件下载
```
https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN
https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=[ID1,ID2,ID2...]
DLINK&access_token=ACCESS_TOKEN


https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=%2F%E6%88%91%E7%9A%84%E5%BA%94%E7%94%A8%2Ftest%2F&access_token=121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q
```
> 下载时加请求头：`User-Agent: pan.baidu.com`

### 一、引导用户登录并获取授权码：authorization_code
#### 方式1：通过回调地址获取
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=REDIRECT_URL&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY、REDIRECT_URL，并且REDIRECT_URL需要在应用管理中注册

#### 方式2：直接从百度提供的页面上获取，需要手动复制授权码
```http
GET http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=APP_KEY&redirect_uri=oob&scope=basic,netdisk&display=page&qrcode=1&force_login=1 HTTP/1.1
```
> 需要填写APP_KEY，redirect_uri参数固定传入oob即可，此方式只能手动复制授权码，无法与应用集成（自动获取授权码）



### 二、使用授权码换取访问令牌：access_token
```http
GET https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=CODE&client_id=APP_KEY&client_secret=APP_SECRET&redirect_uri=REDIRECT_URL HTTP/1.1
```
> 需要填写CODE、APP_KEY、APP_SECRET、REDIRECT_URL，其中REDIRECT_URL需要与上面传入的一致


### 三、目录列表
```http
GET https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN HTTP/1.1
```
> 需要填写PATH、ACCESS_TOKEN


### 四、获取文件详细信息，包含下载地址
```http
GET https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=FSIDS HTTP/1.1
```
> 需要填写ACCESS_TOKEN、FSIDS，其中FSIDS格式为数组：[111,222,333]  
> 返回数据中dlink为下载地址

### 五、下载文件
```http
GET DLINK&access_token=ACCESS_TOKEN HTTP/1.1
User-Agent: pan.baidu.com
```
> 需要填写DLINK、ACCESS_TOKEN  
> 并且请求头中要有 `User-Agent: pan.baidu.com`


### 一、在应用管理中复制出API KEY与SECRET KEY
[应用管理地址](http://developer.baidu.com/console#app/project)
```
API Key：GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb
Secret Key：SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw
```

### 二、在应用管理中设置回调地址
```
http://192.168.1.156/collectAuthCode,
http://gigijiang.asuscomm.com:50080/collectAuthCode
```

### 三、获取授权码
访问地址
```
http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode&scope=basic,netdisk&display=page&qrcode=1&force_login=1
```

返回结果
```
http://gigijiang.asuscomm.com:50080/collectAuthCode?code=xxx
```

> 3326b8ec7ac842f00e2ceb5142babf8b


### 四、获取ACCESS_TOKEN、REFRESH_TOKEN
```
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=AUTH_CODE&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
https://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=3326b8ec7ac842f00e2ceb5142babf8b&client_id=GyDhe45AlhttlxsnPZ4kLWtz2GMdkvjb&client_secret=SFPO0Ap7Y4aR6LdQ6RzIXzHqwnTO2pRw&redirect_uri=http%3A%2F%2Fgigijiang.asuscomm.com%3A50080%2FcollectAuthCode
```

> refresh_token: 122.198eec8dce901709fe5200da7fe12143.YCLLJz1ZuHPTji7C3jBPy6yaQClVlg1m6yCRhqw.BVYKjw  
access_token: 121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q


### 五、文件列表、查看文件详情、文件下载
```
https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=PATH&access_token=ACCESS_TOKEN
https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&dlink=1&access_token=ACCESS_TOKEN&fsids=[ID1,ID2,ID2...]
DLINK&access_token=ACCESS_TOKEN


https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=%2F%E6%88%91%E7%9A%84%E5%BA%94%E7%94%A8%2Ftest%2F&access_token=121.b72c8f94cb47a97111d42efb497bd610.YlF64PEafgDCGKq3aRj38LscL7IHOzrO9N2qqET.ATIi3Q
```
> 下载时加请求头：`User-Agent: pan.baidu.com`