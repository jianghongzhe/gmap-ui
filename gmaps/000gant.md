- 常用内容
	- aaa|ref:haha
	
	
***

# ref:haha
aaabb
```flow
st=>start: begin
e=>end: tail
st->e
```

```sequence
a->b: haha
b->a: hoho
a->b: 333
```

```mermaid
graph TD
	HttpRequestDecoder -- HttpRequest/HttpContent --> HttpChunkUploadHandler
	HttpChunkUploadHandler -- HttpRequest/HttpContent --> HttpObjectAggregator
	HttpChunkUploadHandler -- RequestExecuteInfo --> BizHandler
	BizHandler -- ResponseInfoWrapper --> ResultHandler
	HttpObjectAggregator -- FullHttpRequest --> WebSocketServerProtocolHandler
	WebSocketServerProtocolHandler -- FullHttpRequest --> HttpFullRequestHandler
	HttpFullRequestHandler -- RequestExecuteInfo --> BizHandler
	WebSocketServerProtocolHandler -- TextWebSocketFrame/BinaryWebSocketFrame --> WebSocketFrameHandler
	ResultHandler -- http响应 --> 客户端
	WebSocketFrameHandler -- websocket响应 --> 客户端
```

```sequence
客户端->服务端: aaa
服务端->客户端: bbb
服务端->客户端: bbb
客户端->服务端: aaa
```


```mermaid
graph LR
	a --> b
	b ==> c
```