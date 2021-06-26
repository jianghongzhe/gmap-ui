- 常用内容
	- aaa|ref:haha
	
	
***

# ref:haha

```echart
{
	w:'50%',
	h:'300px',
    title: {
        text: '某站点用户访问来源',
        subtext: '纯属虚构',
        left: 'center'
    },
    tooltip: {
        trigger: 'item'
    },
    legend: {
        orient: 'vertical',
        left: 'left',
    },
    series: [
        {
            name: '访问来源',
            type: 'pie',
            radius: '50%',
            data: [
                {value: 1048, name: '搜索引擎'},
                {value: 735, name: '直接访问'},
                {value: 580, name: '邮件营销'},
                {value: 484, name: '联盟广告'},
                {value: 300, name: '视频广告'}
            ],
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }
    ]
}
```

```mermaid
gantt
    dateFormat  YYYY-MM-DD
    title       Adding GANTT diagram functionality to mermaid
    excludes    weekends
    %% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section A section
    Completed task            :done,    des1, 2014-01-06,2014-01-08
    Active task               :active,  des2, 2014-01-09, 3d
    Future task               :         des3, after des2, 5d
    Future task2              :         des4, after des3, 5d

    section Critical tasks
    Completed task in the critical line :crit, done, 2014-01-06,24h
    Implement parser and jison          :crit, done, after des1, 2d
    Create tests for parser             :crit, active, 3d
    Future task in critical line        :crit, 5d
    Create tests for renderer           :2d
    Add to mermaid                      :1d

    section Documentation
    Describe gantt syntax               :active, a1, after des1, 3d
    Add gantt diagram to demo page      :after a1  , 20h
    Add another diagram to demo page    :doc1, after a1  , 48h

    section Last section
    Describe gantt syntax               :after doc1, 3d
    Add gantt diagram to demo page      :20h
    Add another diagram to demo page    :48h
```


```echart
bar-line
w 50%
title 柱线图。。。
,2018,2019,2020




- bar,小李,1,2,30
- bar,小张,4,5,6
bar,小郑,1,40,2
```


```echart
line
w 50%
title 对比图哈哈
,2018,2019,2020
小李,1,2,3
小张,4,5,6
小郑,1,4,2
```

```echart
stack
w 50%
title 对比图哈哈
,2018,2019,2020
小李,1,2,3
小张,4,5,6
小郑,1,4,2
```

```echart
pie
title 哈哈
w 50%
h 500px
"a": 155
"d": 222
"f"   :    3432
```



```mermaid
pie
title 你好
"a": 30
"b": 20
"c": 50
"d": 40
"e": 10
```


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

## aaaaa