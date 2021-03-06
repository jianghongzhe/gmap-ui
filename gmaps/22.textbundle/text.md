- 高数学习
	- 主要内容
		- 一元、多元函数的微分学和积分学
		- 矢量代数
		- 空间解析几何
		- 无穷极数
		- 微分方程
	- 函数|zip:
		- 概念
			- 区间、邻域
				- 常用数集
					- N - 自然数集
					- Z - 整数集
					- Q - 有理数集
					- R - 实数集
				- 区间
					- 开区间|ref:开区间
					- 闭区间|ref:闭区间
					- 半开区间|ref:半开区间
					- 有限区间|m:左右端点都是确定的实数
					- 区间长度|m:右端点-左端点
					- 正无穷大(+∞)与负无穷大(-∞)
					- 无穷区间/无限区间|ref:无穷区间
					- 区间在数轴上的表示|ref:区间在数轴上的表示
				- 邻域
					- 邻域的概念|ref:邻域
					- 去心邻域|ref:去心邻域
			- 函数定义
				- 任取一值符号|ref:任取一值符号
				- 函数、定义域、自变量、因变量、值域的概念|ref:函数、定义域、自变量、因变量、值域的概念
				- 函数的几何意义|ref:函数的几何意义
			- 函数的性质|ref:函数性质
				- 有界性
				- 单调性
				- 奇偶性
				- 周期性
			- 复合函数、反函数|ref:复合函数、反函数
		- 初等函数
			- 基本初等函数（6类）
				- 幂函数
				- 指数函数
				- 对数函数
				- 三角函数
				- 反三角函数
				- 常量函数
			- 初等函数
				- 多个基本初等函数
				- **有限次**四则运算
				- **有限次**复合步骤
				- 能够用一个数据式子表达
		- 双曲函数|ref:双曲函数
			- 双曲正弦
			- 双曲余弦
			- 双曲正切
			- 反双曲正弦
			- 反双曲余弦
			- 反双曲正切
	- 极限|zip:
		- 数列的极限
			- 数列的定义（无穷序列）
				- Un=f(n) 整标函数
				- 数列的项
				- 表示方法 {Un}
				- 一般项（通项公式）
			- 数列的极限|ref:数列的极限
			- 数列的有界性|ref:数列的有界性
			- 收敛数列的两性质
				- 定理1：极限的唯一性|m:若数列极限存在，则极限唯一
				- 定理2：极限的有界性|m:若数据极限存在，则数列有界
		- 函数的极限
			- x为连续自变量时y=f(x)的极限
				- x->x0 f(x)的变化趋势（在x0点可**有**定义也可**无**定义）
					- 函数极限定义|ref:函数极限定义
						- 几何意义
					- 左极限和右极限|ref:左极限和右极限
				- \|x\|->∞ f(x)的变化趋势
					- 极限定义|ref:函数极限定义2
					- 左极限和右极限|ref:左极限和右极限2
		- 极限的性质和运算
			- 无穷小与无穷大|ref:无穷小与无穷大
			- 极限值与函数值的关系
				- 极限值的唯一性
				- 极限值与函数值的同号性|ref:极限值与函数值的同号性
				- 有界性
			- 函数极限与无穷小的关系
				- 定理|ref:函数极限与无穷小的关系定理
			- 无穷小的性质
				- 有限个无穷小的代数和仍是无穷小
				- 有界函数与无穷小的乘积仍是无穷小
					- 常数与无穷小的乘积仍是无穷小
					- 两个（或有限个）无穷小的乘积仍是无穷小
				- 无穷小与极限非0的函数的商仍是无穷小|ref:无穷小与极限非0的函数的商仍是无穷小
			- 极限的四则运算公式|ref:极限的四则运算公式
				- 商的形式
					- 分母极限不为0：直接代
					- 分子分母极限都为0：因式分解、约分
					- 分母极限为0，分子极限不为0：求倒数，得0，再由无穷小无穷大的关系，得无穷大
					- x->∞时，同除最高次项
			- 极限的存在准则与两个重要极限
				- 准则1：夹挤准则|ref:夹挤准则
					- 两个重要极限之一|ref:两个重要极限之一
				- 准则2：单调有界准则|ref:单调有界准则
					- 两个重要极限之二|ref:两个重要极限之二
			- 无穷小的比较
				- 无穷小的比较|ref:无穷小的比较
					- 高阶无穷小
					- 低阶无穷小
					- 同阶无穷小
					- 等价无穷小
				- 等价无穷小代换定理|ref:等价无穷小代换定理
		- 连续函数
			- 函数的连续性定义|ref:函数的连续性定义
				- 变量的增量（改变量）
				- 函数的增量
				- 函数连续的定义
					- 左连续
					- 右连续
				- 函数在区间上连续的定义
					- 开区间
					- 闭区间
			- 函数的间断点
				- 定义：某点不连接则间断
				- 分类
					- 第一类间断点
						- 左右极限存在
							- 不相等
							- 相等但不等于该点函数值（或在该点无定义）
								- 可去间断点
					- 第二类间断点
						- 左右极限至少一个不存在
			- 初等函数的连续性
				- 连续函数和、积、商的连续性
					- **有限个**在某点连续的函数的**代数和**仍是在该点连续的函数
					- **有限个**在某点连续的函数的**乘积**仍是在该点连续的函数
					- **两个**在某点连续的函数的**商**仍是在该点连续的函数（只要分母在该点函数值不为0）
				- 反函数与复合函数的连续性
					- 函数单调増（减）且连续则反函数单调増（减）且连续
						- 三角函数连续->反三角函数连续
					- 复合函数的极限|ref:复合函数的极限
					- 复合函数的连续性|ref:复合函数的连续性
				- 初等函数的连续性
					- 基本初等函数的连续性|ref:基本初等函数的连续性
						- 三角反三角
						- 指数函数
						- 对数函数
						- 幂函数
					- 结论：初等函数在定义区间内处处连续
			- 连续函数在闭区间上的性质
				- 函数在区间I上的最大最小值定义|ref:函数在区间I上的最大最小值定义
				- 性质
					- 最大最小值定理|m:闭区间上的连续函数在该区间上一定有最大最小值
						- 闭区间
						- 连续函数
					- 有界性定理|m:闭区间上的连续函数在该区间上一定有界
					- 零值点定理|m:f(x)在[a,b]连续且f(a)与f(b)异号，则至少存在一个零值点
					- 介值定理|m:f(x)在[a,b]连续且f(a)=A、f(b)=B、A不等于B，则对于C介于A、B之间，至少存在一个点m使f(m)=C
						- 推论|m:对于C介于最大最小值之间，，至少存在一个点m使f(m)=C
	- 导数与微分
		- 导数
			- 二个例子
				- 瞬时速度问题
				- 曲线的切线问题
			- 定义|ref:导数定义
				- 左导数
				- 右导数
				- 开区间可导
				- 闭区间可导
			- 导数的几何意义|ref:导数的几何意义
				- 斜率
				- 切线方程
				- 法线方程
			- 函数的可导性与连续性的关系
				- 定理：某点可导**一定**连续，连续**不一定**可导
			- 基本初等函数的导数公式|ref:基本初等函数的导数公式
		- 函数的微分法
			- 函数和差积商的求导法则|ref:函数和差积商的求导法则
			- 反函数的导数|ref:反函数的导数
				- 反三角函数的导数
				- 指数函数的导数
			- 复合函数的导数
				- 复合函数求导法则|ref:复合函数求导法则
			- 高阶导数|ref:高阶导数
			
					
						
						
***
# ref:开区间
```latex
(a,b)=\{x|a<x<b\} \\
a \notin (a,b) \\
b \notin (a,b) \\
```

- a称为(a,b)的左端点
- b称为(a,b)的右端点


# ref:闭区间
```latex
[a,b]=\{x|a \le x \le b\} \\
a \in (a,b) \\
b \in (a,b) \\
```

# ref:半开区间
### 第一种情况
```latex
[a,b)=\{x|a \le x<b\} \\
a \in (a,b) \\
b \notin (a,b) \\
```

### 第二种情况
```latex
(a,b]=\{x|a<x \le b\} \\
a \notin (a,b) \\
b \in (a,b) \\
```

# ref:区间在数轴上的表示
### 有限区间
![region.jpg](assets/region.jpg)
### 无穷区间
![region_infinity.jpg](assets/region_infinity.jpg)


# ref:无穷区间
```latex
[a,+\infty)=\{x|x \ge a\} \\
(a,+\infty)=\{x|x > a\} \\
(-\infty,b]=\{x|x \le b\} \\
(-\infty,b)=\{x|x<b\}
```

> 无穷一侧必须使用圆括号



# ref:邻域
```latex
N(a,\delta) = \{x|a-\delta<x<a+\delta\} (\delta>0) \\
```
- a为邻域的中心
- δ为邻域的半径

# ref:去心邻域
```latex
N(\hat{a},\delta) = \{x|0<|x-a|<\delta\} = N\{a,\delta\} \backslash \{a\}
```


# ref:任取一值符号
```latex
\forall x \in (0,+\infty)
```


# ref:函数、定义域、自变量、因变量、值域的概念
```latex
x {\xrightarrow{f}} y \iff f(x)=y \\
定义域：D_f = X \\
自变量：x \\
因变量：y \\
值域：V_f = \{y|y=f(x), x \in X\} 
```

- 函数定义的两个要素：对应法则、定义域
- 函数的值域由定义域和对应法则确定
- 确定定义域的方法
	- 如果函数有实际意义，根据实际问题是否有意义来确定
	- 如果函数不表示实际问题，自变量所能取得的使函数y=f(x)成立的一切实数所构成的数集
	
# ref:函数的几何意义
```latex
P=\{(x,y)|y=f(x), x \in D_f\}
```
点集P称为函数的图形

# ref:函数性质
# 有界性
## 有界
```latex
若\exist M>0，s.t. \quad |f(x)| \le M，x \in I，则称y=f(x)在区间I上有界；\\
否则为无界，即：对任何正数M>0，总\exist x_1 \in I，s.t. \quad |f(x_1)|>M，则称f(x)在I上无界
```

## 上界、下界
```latex
若\exist M，s.t. \quad f(x) \le M，x \in I，则称y=f(x)在区间I上有上界，任何一个数N>M，N也是f(x)的一个上界\\
若\exist P，s.t. \quad f(x) \ge P，x \in I，则称y=f(x)在区间I上有下界，任何一个数Q<P，Q也是f(x)的一个下界
```

## 有界与有上界下界的关系
```latex
有界 \iff 既有上界也有下界
```

# 单调性
```latex
\begin{aligned}
若f(x)在区间I上，对任何x_1,x_2 \in I，且x_1<x_2，&恒有f(x_1)<f(x_2)，则称f(x)在I上严格单调増；\\
&恒有f(x_1) \le f(x_2)，则称f(x)在I上广义单调増（单调増/非减）；\\
&恒有f(x_1)>f(x_2)，则称f(x)在I上严格单调减；\\
&恒有f(x_1) \ge f(x_2)，则称f(x)在I上广义单调减（单调减/非増）\\
\end{aligned}
```

# 奇偶性
```latex
\begin{aligned}
若f(x)在关于原点对称的区间I上，&满足f(-x)=f(x)，则称f(x)为偶函数,偶函数图形关于y轴对称（如：cosx、x^2）；\\
&满足f(-x)=-f(x)，则称f(x)为奇函数，奇函数图形关于原点对称（如：sinx、x^3）\\
\end{aligned}
```

# 周期性
```latex
f(x+T)=f(x)
```


# ref:复合函数、反函数
## 复合函数定义
```latex
设y=f(u) \enspace D_f=Y，u=g(x) \enspace D_g=X \enspace V_g=Y_g \enspace Y_g \not= \Phi 且 Y_g \subseteq Y，\\
这时 \forall x \in X，通过u都有唯一 的y值与之对应，\\
从而在X上产生一个新函数 f \circ g，称其为X上的复合函数，\\
记为：x \xrightarrow{f \circ g} y 或y=f[g(x)]。\\
f[g(x)]与g(x)定义域不一定相同，f[g(x)]的定义域为D_g中使V_g \in Y 的那部分
```

## 反函数
```latex
y=f(x)称为直接函数，x=f^{-1}(y)称为反函数
```
- 直接函数单值，反函数不一定单值
- 直接函数严格单调，反函数是单值且单调
- 直接函数与反函数关于y=x对称

# ref:双曲函数
双曲正弦
```latex
shx= \frac {e^x-e^{-x}}{2}
```

双曲余弦
```latex
chx= \frac {e^x+e^{-x}}{2}
```

双曲正切
```latex
thx= \frac {shx}{chx} = \frac {e^x-e^{-x}}{e^x+e^{-x}}
```

性质：
```latex
ch^2 x -sh^2 x=1 \\
sh2x=2shxchx\\
ch2x=ch^2 x +sh^2 x
```

> 双曲函数没有周期性

反双曲正弦函数
```latex
arshx= \ln (x+ \sqrt{x^2+1})
```

反双曲余弦函数
```latex
archx= \ln (x+ \sqrt{x^2-1})
```

反双曲正切函数
```latex
arthx= \frac{1}{2} \ln{\frac{1+x}{1-x}}
```



# ref:数列的极限
```latex
\{u_n\}、A、任意\varepsilon>0、\exist N>0，当\quad n>N时 |u_n-A|<\varepsilon \\
则称{u_n} 收敛于A，即：\lim_{n \to \infty} u_n = A  ，或 u_n \to A (n \to \infty) \\

说明：\\
1、定义中的 \varepsilon 为任意给定\\
2、定义中N与\varepsilon有关，记为N(\varepsilon)，N不唯一\\
3、定义没有描述求A的方法，但能用于证明极限\\
4、几何意义：任意给定N(A,\varepsilon)，必存在N，使u_{N+1}、u_{N+2}、...都落在其中\\
5、为了计算方便，N可以放大\\
```

# ref:数列的有界性
```latex
\{u_n\} \quad \exist M>0 \quad s.t. \quad |u_n|<M

```


# ref:函数极限定义
```latex
f(x)在N(\hat{x_0},m)有定义 \quad A \quad 任意 \epsilon>0，总\exist \delta>0 使适合 0<|x-x_0|<\delta 的x对应的f(x)满足|f(x)-A|<\epsilon\\
记为 \lim_{x \to x_0} f(x) = A 或 f(x) \to A (x \to x_0)
```

# ref:左极限和右极限
```latex
左极限\\
f(x)在N(\hat{x_0},m)有定义 \quad A \quad 任意 \epsilon>0，总\exist \delta>0 使适合 x_0-\delta<x<x_0 的x对应的f(x)满足|f(x)-A|<\epsilon\\
记为 \lim_{x \to x_0^-} f(x) = A 或 \lim_{x \to x_0-0} f(x) = A 或 f(x_0-0)=A\\
右极限\\
f(x)在N(\hat{x_0},m)有定义 \quad A \quad 任意 \epsilon>0，总\exist \delta>0 使适合 x_0<x<x_0+\delta 的x对应的f(x)满足|f(x)-A|<\epsilon\\
记为 \lim_{x \to x_0^+} f(x) = A 或 \lim_{x \to x_0+0} f(x) = A 或 f(x_0+0)=A\\
结论：\lim_{x \to x_0}f(x)= A \iff \lim_{x \to x_0-}f(x)= \lim_{x \to x_0+}f(x)= A
```

# ref:函数极限定义2
```latex
f(x)在|x|充分大时有定义、A、任意\varepsilon>0、\exist N>0，当|x|>N时 |f(x)-A|<\varepsilon \\
\lim_{x \to \infty} f(x) = A  或 f(x) \to A (x \to \infty)
```

# ref:左极限和右极限2
```latex
左极限\\
f(x)在|x|充分大时有定义、x>0、A、任意\varepsilon>0、\exist N>0，当x>N时 |f(x)-A|<\varepsilon \\
\lim_{x \to +\infty} f(x) = A  或 f(x) \to A (x \to +\infty)\\
右极限\\
f(x)在|x|充分大时有定义、x<0、A、任意\varepsilon>0、\exist N>0，当x<-N时 |f(x)-A|<\varepsilon \\
\lim_{x \to -\infty} f(x) = A  或 f(x) \to A (x \to -\infty)\\
结论：\lim_{x \to \infty}f(x)= A \iff \lim_{x \to -\infty}f(x)= \lim_{x \to +\infty}f(x)= A
```

# ref:无穷小与无穷大
## 无穷小(量)：
```latex
\lim_{x \to x_0}f(x)=0 或 \lim_{x \to \infty}f(x)=0，则称x \to x_0或x \to \infty时f(x)为无穷小\\
注意：\\
无穷小与很小的数不是同一概念，无穷小是以0为极限的一个变量，而很小的数的极限不是0，因此不是无穷小\\
只有常数0可以作为无穷小\\
```

## 无穷大(量)：
```latex
当x \to x_0 或 x \to \infty时，|f(x)|无限增大，则称x \to x_0或x \to \infty时f(x)为无穷大\\
1\\
任意M>0 \quad \exist \delta>0，使适合0<|x-x_0|<\delta的一切x对应的|f(x)|>M
\\记为：\lim_{x \to x_0}f(x)=\infty（并非指极限存在，只是借助极限符号表示无穷大量）\\
2\\
任意M>0 \quad \exist N>0，使适合|x|>N的一切x对应的|f(x)|>M\\
记为：\lim_{x \to \infty}f(x)=\infty\\
```

同理，还有正无穷大和负无穷大

### 注意
- 不能把无穷大与很大的常数混为一谈，即使很大的常数都不是无穷大
- 无穷大与无限函数的关系
	- 无穷大一定是无界函数
	- 无界函数不一定是无穷大
	
## 无穷大与无穷小的关系
```latex
定理:\\
如果\lim_{x \to x_0} f(x)= \infty（或\lim_{x \to \infty} f(x)= \infty），则\lim_{x \to x_0} \frac{1}{f(x)}= 0（或\lim_{x \to \infty} \frac{1}{f(x)}= 0）\\
如果\lim_{x \to x_0} f(x)= 0（或\lim_{x \to \infty} f(x)= 0）且f(x) \neq 0，则\lim_{x \to x_0} \frac{1}{f(x)}= \infty（或\lim_{x \to \infty} \frac{1}{f(x)}= \infty）\\
```
即无穷小的倒数是无穷大，无穷大的倒数是无穷小


## 海湼定理
```latex
连续自变量函数f(x) \quad \lim_{x \to x_0}f(x) （或\lim_{x \to \infty}f(x)）存在 \iff 任选数列 \{x_n|x_n \to x_0\}（或\{x_n|x_n \to \infty\}）对应的数列\{f(x_n)\}有同一极限
```



# ref:极限值与函数值的同号性
```latex
设\lim_{x \to x_0}f(x)=A 且A>0（或A<0），则必存在N(\hat{x_0}) \quad s.t. \quad \forall x \in N(\hat{x_0})都有f(x)>0（f(x)<0）
```

```latex
设\lim_{x \to x_0}f(x)=A 且在N(\hat{x_0})内f(x) \ge 0，则A \ge 0\\
其中等号不能去掉，比如： \lim_{x \to \infty} \frac{1}{x}=0
```


# ref:函数极限与无穷小的关系定理
```latex
\lim_{x \to x_0}f(x)=A \iff f(x)=A+\alpha(x)且\lim_{x \to x_0}\alpha(x)=0\\
\lim_{x \to \infty}f(x)=A \iff f(x)=A+\alpha(x)且\lim_{x \to \infty}\alpha(x)=0\\
```


# ref:无穷小与极限非0的函数的商仍是无穷小
```latex
\lim_{x \to x_0}f(x)=A \neq 0 且 \lim_{x \to x_0}\alpha(x)=0，则\lim_{x \to x_0} \frac{\alpha(x)}{f(x)}=0 \\
\lim_{x \to \infty}f(x)=A \neq 0 且 \lim_{x \to \infty}\alpha(x)=0，则\lim_{x \to \infty} \frac{\alpha(x)}{f(x)}=0 \\
```

# ref:极限的四则运算公式
```latex
设 \lim f(x)=A，\lim g(x)=B，则有：\\
1、\lim[f(x) \pm g(x)]= \lim f(x) \pm \lim g(x) =A \pm B \\
2、\lim[f(x)g(x)]= \lim f(x) \cdot \lim g(x) =A \cdot B \\
\implies \lim[C \cdot f(x)]= C \cdot \lim f(x) =C \cdot A \quad（C为常数）\\
\implies \lim{[f(x)]^n}= \lim[ f(x) \cdot f(x) \cdot f(x) ... f(x)] =[\lim f(x)]^n =A^n \quad （n为正整数） \\
3、\lim \frac{f(x)}{g(x)}= \frac{\lim f(x)}{\lim g(x)}= \frac{A}{B} \quad （B \neq 0）\\
4、设f(x) \ge g(x)且\lim f(x)=A，\lim g(x)=B，则A \ge B
```

> 注：必须两个函数极限**都存在**，才能使用这几个公式


# ref:夹挤准则
```latex
若在N(x_0,\delta)内有F(x) \le f(x) \le G(x)，且\lim_{x \to x_0}F(x)=\lim_{x \to x_0}G(x)=A，则\lim_{x \to x_0}f(x)=A\\
若在|x|>N>0内有F(x) \le f(x) \le G(x)，且\lim_{x \to \infty}F(x)=\lim_{x \to \infty}G(x)=A，则\lim_{x \to \infty}f(x)=A\\
```


```latex
\lim_{\alpha \to 0}\sin(\alpha)=0\\
\lim_{\alpha \to 0}\cos(\alpha)=1
```

# ref:两个重要极限之一
```latex
\lim_{\alpha \to 0} \frac{\sin \alpha}{\alpha}=0
```

# ref:单调有界准则
```latex
若单调数列\{u_n\}有界，则\lim_{n \to \infty}u_n存在
```

# ref:两个重要极限之二
```latex
\lim_{x \to \infty}(1+ \frac{1}{x})^x=e \implies \lim_{x \to 0}(1+ x)^{\frac{1}{x}}=e
```

# ref:无穷小的比较
```latex
\lim{\frac{\beta}{\alpha}}=0，则\beta是比\alpha高阶的无穷小，\beta=o(\alpha)\\
\\[5px]
\lim{\frac{\beta}{\alpha}}=\infty，则\beta是比\alpha低阶的无穷小\\
\\[5px]
\lim{\frac{\beta}{\alpha}}=C \neq 0，则\beta与\alpha是同阶无穷小 \implies \lim{\frac{\beta}{\alpha}}=C=1，则\beta与\alpha是等价无穷小，\beta \backsim \alpha\\
```



# ref:等价无穷小代换定理
```latex
设\alpha \backsim \alpha'，\beta \backsim \beta'，且\lim \frac{\beta'}{\alpha'}存在，则\lim \frac{\beta}{\alpha}存在，且\lim \frac{\beta}{\alpha}=\lim \frac{\beta'}{\alpha'}
```

> 无穷小之间是乘或除的关系**可以**替换，是加或减的关系**不能**替换

```latex
常用代换：当u \to 0\\
1-\cos u \backsim {\frac{1}{2}}u^2\\
\sin u \backsim u\\
\tan u \backsim u\\
\arcsin u \backsim u\\
\arctan u \backsim u\\
\ln(1+u) \backsim u\\
e^u -1 \backsim u\\
\sqrt{1+u}-1 \backsim \frac{1}{2}u
```


# ref:函数的连续性定义
```latex
变量的增量：\Delta u=u_2-u_1\\
函数的增量：\Delta y=f(x_0+\Delta x)-f(x_0)\\
~\\
函数连续的定义：\\
函数y=f(x)在N(x_0)有定义，x \in N(x_0)，如果当\Delta x=x-x_0 \to 0，\Delta y=f(x_0+\Delta x)-f(x_0) \to 0，则称函数在x_0点连续\\
记为：\lim_{\Delta x \to 0}\Delta y=0 \iff \lim_{x \to x_0}f(x)=f(x_0) \\
同样可用“\epsilon-\delta”语言定义函数连续，只不过其中|x-x_0|<\epsilon不要写成0<|x-x_0|<\epsilon\\
~\\
左连续：\lim_{x->x_0^-}f(x)=f(x_0)\\
右连续：\lim_{x->x_0^+}f(x)=f(x_0)\\
~\\
函数在开区间内连续的定义：\\
如果y=f(x)在(a,b)内每一点处都连续，则称y=f(x)在(a,b)上连续（处处连续），记为f(x) \in C(a,b)，(a,b)称为y=f(x)的连续区间\\
~\\
函数在闭区间内连续的定义：\\
如果y=f(x)在(a,b)内连续，且在a点右连续，在b点左连续，则称f(x)在[a,b]上连续，，记为f(x) \in C[a,b]
```


# ref:复合函数的极限
```latex
x \to x_0时，u=g(x)极限存在且\lim_{x \to x_0}g(x)=a，而y=f(u)在u=a处连续，则x \to x_0时\lim_{x \to x_0}f[g(x)]=f(a)=f[\lim_{x \to x_0}g(x)]

```


# ref:复合函数的连续性
```latex
u=g(x)在x_0点连续且g(x_0)=u_0，y=f(u)在u_0点连续，则y=f[g(x)]在x_0点连续

```



# ref:基本初等函数的连续性
```latex
三角反三角在定义域内连续\\
指数函数 y=a^x (a>0,a \neq 1)在(-\infty,+\infty)连续\\
对数函数 y=\log_{a}x (a>0,a<>1)在(0,+\infty)连续\\
幂函数 y=x^\alpha 在(0,+\infty)连续
```


# ref:函数在区间I上的最大最小值定义
```latex
f(x)在区间I上有定义，如果x_0 \in I，s.t. \quad \forall x \in I \quad f(x_0) \le f(x)，则称f(x_0)是f(x)在I上最小值，记为：\min_{x \in I}f(x)=f(x_0)\\
f(x)在区间I上有定义，如果x_0 \in I，s.t. \quad \forall x \in I \quad f(x_0) \ge f(x)，则称f(x_0)是f(x)在I上最大值，记为：\max_{x \in I}f(x)=f(x_0)\\
```


# ref:导数定义
```latex
\lim_{\Delta x \to 0} \frac{\Delta y}{\Delta x}=\lim_{\Delta x \to 0} \frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}存在，则称y=f(x)在x_0点可导，极限值为y=f(x)在x_0点的导数\\
\\[3pt]
记为：y'|_{x=x_0} \quad f'(x_0) \quad \frac{dy}{dx}|_{x=x_0} \quad \frac{df(x)}{d(x)}|_{x=x_0}\\
~\\
导数的另一种表示方式：\lim_{x \to x_0} \frac{f(x)-f(x_0)}{x-x_0}\\
~\\
若y=f(x)在x_0可导，记为：f(x) \in D\{x_0\}\\
若y=f(x)在(a,b)内可导，记为：f(x) \in D(a,b)\\
若y=f(x)在区间I上可导，记为：f(x) \in D(I)\\
若y=f(x)在(a,b)内可导，\forall x \in (a,b)，就有f'(x)与x对应，由函数定义，可知f'(x)为定义在(a,b)上的函数，f'(x)称为导数（导函数）
```

```latex
左导数：f_{-}'(x_0)=\lim_{\Delta x \to 0^-} \frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\\
\\[5pt]
右导数：f_{+}'(x_0)=\lim_{\Delta x \to 0^+} \frac{f(x_0+\Delta x)-f(x_0)}{\Delta x}\\
\\[5pt]
显然有：f(x)在x_0点可导 \iff f_{-}'(x_0) \quad f_{+}'(x_0)存在且相等\\
\\[5pt]
若y=f(x)在(a,b)内可导，且f_{+}'(a)  \quad  f_{-}'(b)存在，则称f(x)在[a,b]可导，记为：f(x) \in D[a,b]

```



# ref:导数的几何意义
```latex
f'(x_0)为斜率 \quad f'(x_0)=tan \alpha \quad （\alpha为倾角）\\
切线方程（点斜式方程）：y-f(x_0)=f'(x_0)(x-x_0)\\
\\[3pt]
法线方程：y-f(x_0)=-\frac{1}{f'(x_0)}(x-x_0)\\
(注：切线与法线垂直，则k_{切}=f'(x_0)、k_{法}=-\frac{1}{f'(x_0)})\\
特殊情况：若y=f(x)，f'(x_0)=\infty，表示切线垂直于x轴，切线方程为x=x_0

```



# ref:基本初等函数的导数公式
```latex
(C)'=0 \quad （C为常数）\\
(x^\alpha)'=\alpha x^{\alpha-1}\\
(\sin{x})'=\cos{x} \quad (\cos{x})'=-\sin{x}\\
(\log_{a}x)'=\frac{1}{x \ln{a}} \implies (\ln{x})'=\frac{1}{x}
```


# ref:函数和差积商的求导法则
```latex
(U \pm V)'=U' \pm V'\\
(UV)'=U'V+UV' \implies (CU)'=CU' \quad (C为常数)\\
(\frac{U}{V})'= \frac{U'V-UV'}{V^2} \implies (\frac{1}{V})'= -\frac{V'}{V^2}\\
```


```latex
(\tan{x})'= \frac{1}{\cos^2{x}}=\sec^2{x}\\
\\[5pt]
(\cot{x})'= -\frac{1}{\sin^2{x}}= -\csc^2{x}\\
\\[5pt]
(\sec{x})'= \sec{x}\tan{x}\\
\\[5pt]
(\csc{x})'= -\csc{x}\cot{x}\\
```


# ref:反函数的导数
## 求导法则
```latex
\varphi(y)单调且可导，且\varphi'(y) \ne 0，则反函数f(x)也可导，且f'(x)=\frac{1}{\varphi'(y)}
```

## 反三角函数的导数
```latex
(\arcsin{x})'=\frac{1}{(\sin{y})'}=\frac{1}{cosy}=\frac{1}{\sqrt{1-\sin^2{y}}}=\frac{1}{\sqrt{1-x^2}}\\
(\arccos{x})'=-\frac{1}{\sqrt{1-x^2}}\\
\\[3pt]
(\arctan{x})'=\frac{1}{1+x^2}\\
\\[3pt]
(\arcctg{x})'=-\frac{1}{1+x^2}\\
```

## 指数函数的导数
```latex
(a^x)'=a^x \ln{a} \implies (e^x)'=e^x
```



# ref:复合函数求导法则
```latex
u=\varphi(x)在x点可导，y=f(u)在对应点u可导，则复合函数y=f[\varphi(x)]在x点可导，且：\\
\\[3pt]
\frac{dy}{dx}=\frac{df(u)}{du} \cdot \frac{du}{dx}=f'(u) \cdot \varphi'(x)
```


# ref:高阶导数
```latex
y''=[f'(x)]'=f''(x)=\frac{d^2 y}{dx^2}= \frac{d \frac{dy}{dx}}{dx} =\frac{d^2 f(x)}{d^2 x}\\
[f'''(x)]'=f^{(4)}\\
[f^{(n-1)}(x)]'=f^n(x)=\frac{d^n y}{d x^n}=\frac{d^n f(x)}{d x^n}\\
若f(x)在区间I或(a,b)内有n阶导数，记为：f(x) \in D^n(I) 或 f(x) \in D^n(a,b)\\
```