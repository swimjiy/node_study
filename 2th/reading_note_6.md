# 6장 익스프레스 웹 서버 만들기 🚀

> **익스프레스란?**
>
> node로 서버를 제작하는 과정에서의 불편함을 해소하기 위해 만들어진 웹 서버 프레임워크.
>
> 비슷한 프레임워크로는 koa, hapi 등이 있다.



### 6.1 익스프레스 프로젝트 시작하기

1. `package.json` 생성 후 정보 작성
2. `npm i express`, `npm i -D nodemon` 으로. 필요한 패키지 설치
3. `app.js` 에 다음과 같이 작성 후 `npm start` 로 실행.



#### package.json

```json
{
  "name": "learn-express",
  "version": "1.0.0",
  "description": "익스프레스를 배우자",
  "main": "app.js",
  "dependencies": {
    "express": "^4.17.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.6"
  },
  "scripts": {
    "start": "nodemon app", // app.js를 nodemon으로 실행. 변경이 생기면 자동으로 서버를 재시작한다.
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "swimjiy",
  "license": "MIT"
}

```



#### app.js

```javascript
const express = require('express');

const app = express();
app.set('port', process.env.PORT || 3000);
// app.set(키, 값)으로 데이터를 저장하고, app.get(키) 로 접근.

app.get('/', (req, res) => {
	res.send('Hello Express'); // == node의 res.write, res.end
  
  // sendFile에서 파일 경로를 지정하여 HTML 형태로 응답할 수 있다.
	res.sendFile(path.join(__dirname, './index.html'));
})
// app.get(주소, 라우터)로 주소에 대한 GET 요청이 올 때의 동작을 지정.

app.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기 중');
});

```



### 6.2 자주 사용하는 미들웨어

익스프레스의 핵심. 요청과 응답의 중간에 위치하여 미들웨어라고 부른다. (라우터, 에러 핸들러 등...)

`app.use(미들웨어)` 형태로 사용.

위에서부터 아래로 순서대로 실행되며, next라는 매개변수로 다음 미들웨어로 넘어갈 수 있다.

주소를 첫 번째 인수로 넣어주지 않으면 모든 요청에서 실행되고, 넣는다면 해당하는 요청에서만 실행된다.



##### 기본 미들웨어 사용 방법

```javascript
const express = require('express');
const path = require('path');

const app = express();
app.set('port', process.env.PORT || 3000);

app.use((req, res, next) => {
	console.log('모든 요청에 다 실행됩니다.');
	next(); // next를 호출해야 다음 미들웨어로 넘어갈 수 있다.
})

app.get('/', (req, res, next) => {
	console.log('GET / 요청에만 실행됩니다.');
	next();
}, (req, res) => {
	throw new Error('에러는 에러 처리 미들웨어로 갑니다.');
}) // app.get 라우터에 미들웨어가 두 개 연결됨. 

// 에러 처리 미들웨어. 네 개의 변수를 갖고 있음.
// 특별한 경우가 아니면 가장 아래에 위치하도록 한다.
app.use((err, req, res, next) => {
	console.log(err);
	res.status(500).send(err.message);
})

app.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기 중');
});

```



##### 미들웨어가 실행되는 경우 

| 코드                         | 설명                                       |
| ---------------------------- | ------------------------------------------ |
| `app.use(미들웨어)`          | 모든 요청에서 미들웨어 실행                |
| `app.use('/abc', 미들웨어)`  | abc로 시작하는 요청에서 미들웨어 실행      |
| `app.post('/abc', 미들웨어)` | abc로 시작하는 POST 요청에서 미들웨어 실행 |



#### 실무에 사용하는 미들웨어 알아보기

```bash
$ npm i morgan cookie-parser express-session dotenv
```



#### dotenv

보안 상의 편의를 위해 `process.env` 를 별도의 파일로 관리할 수 있게 하는 패키지. (미들웨어는 아님!)

`.env`  파일을 읽어서 `process.env` 로 키=값을 추가한다.



#### 6.2.1 morgan

요청과 응답에 대한 정보를 콘솔에 기록한다.

##### 사용 방법

```javascript
app.use(morgan('dev'));
// dev 대신 combined(배포 환경에 추천), common, short, tiny 등을 넣을 수 있다.
```

##### console

```bash
# [HTTP 메서드][주소][HTTP 상태 코드][응답 속도] - [응답 바이트]
GET / 304 1.253 ms - 150
```



#### 6.2.2 static

<u>*express에서 기본 제공.*</u>

정적인 파일들(css, js, images)을 제공하는 라우터 역할. 

`fs.readFile` 로 파일을 직접 읽어서 전송할 필요가 없어진다.

요청 경로에 해당하는 파일이 없으면 내부적으로 `next` 를 호출하며, 파일을 발견하면 다음 미들웨어는 실행되지 않는다.

##### 사용 방법

```javascript
app.use('요청 경로', express.static('실제 경로'));

// 실제 서버의 폴더 경로는 public이 있지만, 요청 주소에는 public이 없으므로 보안 유지.
app.use('/', express.static(path.join(__dirname, 'public')));
```

> 💡 그럼 파일을 발견해서 다음 미들웨어가 실행되지 않으면 그걸로 코드 끝...? => 네. 뒤에 거는 막힙니다. 6-2-6



#### 6.2.3 body-parser

<u>*express에서 기본 제공. (v 4.16.0 ~)*</u>

요청의 본문에 있는 데이터를 해석해서 `req.body` 객체로 만들어주는 미들웨어.

보통 폼 데이터나 AJAX 요청의 데이터를 처리

멀티파트(이미지, 동영상, 파일) 데이터는 처리하지 못한다. (multer 모듈 사용)

##### 사용 방법

```js
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Raw, Text 형식의 데이터를 해석할 경우 설치 후 아래와 같이 추가
const bodyParser = require('body-parser');
app.use(bodyParser.raw());
app.use(bodyParser.text());
```

##### 요청 데이터 종류

- `JSON`: JSON 형식의 데이터 전달 방식
- `URL-encoded`: 주소 형식의 데이터 전달 방식.
  -  `extended` 옵션: `false` 면 노드의 querystring 모듈을 사용하여 쿼리스트링을 해석하며 `true` 면 qs 모듈로 해석.
  - `name=swimjiy&book=nodejs` => req.body `{ name: 'swimjiy', book: 'nodejs' }`



#### 6.2.4 cookie-parser

요청에 동봉된 쿠키를 해석해 req.cookies 객체로 만드는 미들웨어.

`name=swimjiy` => req.cookie `{ name: 'swimjiy' }`

##### 사용 방법

```javascript
app.use(cookieParser(비밀키));
// 서명된 쿠키가 있는 경우, 인수로 제공한 비밀키를 통해 해당 쿠키가 내 서버가 만든 쿠키임을 검증할 수 있다.
// 서명이 붙은 쿠키는 .sign이 뒤에 붙으며 req.signedCookies 객체에 저장
```

##### 쿠키 생성/제거

```javascript
res.cookie('name', 'swimjiy', {
  expires: new Date(Date.now() + 900000),
  httpOnly: true,
  secure: true,
  signd: true, // 쿠키 뒤에 서명이 붙는다. 서명을 위한 비밀 키는 process.env.COOKIE_SECRET
});

// 쿠키를 지우러면 키와 값 외에 옵션도 정확히 일치해야 한다. (expires, maxAge 제외)
res.clearCookie('name', 'swimjiy', {
  httpOnly: true,
  secure: true,
})
```



#### 6.2.5 express-session

세션 관리용 미들웨어

로그인 등의 이유로 세션을 구현하거나 특정 사용자를 위한 데이터를 임시적으로 저장해둘 때 사용.

사용자별로 req.session 객체 안에 유지.

##### 사용 방법

```javascript
app.use(session({
	resave: false, // 요청이 올 때 세션에 수정 사항이 생기지 않더라도 세션을 다시 저장할 지 여부.
	saveUninitialized: false, // 세션에 저장할 내역이 없어도 처음부터 세션을 생성할지 여부.
 
  // 세션 관리 시 클라이언트에 쿠키를 보낸다. = 4.3절의 세션 쿠키!
	secret: process.env.COOKIE_SECRET, // 쿠키에 서명 추가
	cookie: { // 세션 쿠키 설정
		httpOnly: true, // 클라이언트에서 쿠키 확인 불가
		secure: false, // https 가 아닌 환경에도 사용 가능
	},
	name: 'session-cookie', // 세션 쿠키 이름
  
  // + store 옵션으로 레디스 등의 DB에 세션 저장. 현재는 메모리에 저장.
}))
```



##### 세션 변경 및 삭제 

```javascript
req.session.name = 'swimjiy'; // 세션 등록
req.sessionID; // 세션 아이디 확인
req.session.destroy(); // 세션 모두 제거
```



#### 6.2.6 미들웨어 특성 활용하기

##### 미들웨어 tl;dr

1. 미들웨어란 `req, res, next` 를 매개변수로 가지는 함수 (에러 처리 미들웨어만 예외)로서 `app.use` 나 `app.get`, `app.post` 등으로 장착.
2. 특정 주소의 요청에만 실행되게 하려면 첫 번째 인수로 주소를 넣는다. `app.use('/', (req, res, next) => {})`
3. 동시에 여러 개의 미들웨어 장착 가능. `app.use(morgan('dev'), express.json(), ...)`
4. 다음 미들웨어로 넘어가려면 next 함수를 호출해야 한다. 아니면 `res.send` 나 `res.sendFile` 등의 메서드로 응답을 보내야 한다.

 ```javascript
app.use((req, res, next) => {
	console.log('모든 요청에 다 실행됩니다.');
	next();
});
 ```



> 💡 갑자기 궁금한건데, 미들웨어가 req, res, next 를 매개변수로 갖고, morgan같은 건 저 매개변수랑 next()가 감춰져있다는 거잖아. 그럼 실제로는 어떻게 생긴거지???



##### next()

인수를 넣으면 특수한 동작을 한다.

```javascript
next('route'); // 다음 라우터의 미들웨어로 바로 이동하고, 그 외의 인수를 넣으면 에러 처리 미들웨어로 이동.

next(err); // 인수가 에러 처리 미들웨어의 err 매개변수.
(err, req, res, next) => {}
```



##### 미들웨어 간에 데이터 전달하기

요청이 끝날 때까지만 데이터를 유지한다.

```javascript
app.use((req, res, next) => {
  req.data = '데이터 넣기';
  next();
}, (req, res, next) => {
  console.log(req.data); // 데이터 받기.
  next();
})
```



> **NOTE: app.set과의 차이**
>
> app.set은 익스프레스에서 전역적으로 사용되므로 사용자 개개인의 값을 넣기에는 부적절하다.
>
> 앱 전체의 설정을 공유할 때 사용.
>
> req 객체는 요청을 보낸 사용자 개개인에게 귀속되므로 req 객체를 통해 개인의 데이터를 전달하는 것이 좋다.



##### 미들웨어 안에 미들웨어 넣기

기존 미들웨어의 기능을 확장할 수 있다. (분기 처리 등)

```javascript
// 기존 방식
app.use(morgan('dev'));

// 새 방식
app.use((req, res, next) => {
  morgan('dev')(req, res, next);
});
```



##### 조건문에 따라 다른 미들웨어를 적용하는 코드

```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    morgan('combined')(req, res, next);
  } else {
    morgan('dev')(req, res, next);
  }
});
```

> 💡 이게...굳이 (req, res, next) 를 쓰지 않으면 안돌아가는건가?? 왜 저렇게 쓰는지 모르겠다.





#### 6.2.7 multer

이미지, 동영상 등을 비롯한 여러 가지 파일들을 멀티파트 형식으로 업로드할 때 사용하는 미들웨어.

> 멀티파트: enctype=multipart/form-data 속성인 폼을 통해 업로드하는 데이터의 형식

```javascript
const multer = require('multer');

const upload = multer({
  // 어디에(destination) 어떤 이름으로(filename) 저장할 지 설정
	storage: multer.diskStorage({
		destination(req, file, done) {
			done(null, 'uploads/'); // 첫 번째 인수에는 에러가 있다면 에러를 넣는다.
		},
		filename(req, file, done) {
			const ext = path.extname(file.originalname);
			done(null, path.basename(file.originalname, ext) + Date.now() + ext);
		}
	}),
	limits: { fileSize: 5 * 1024 * 1024 }, // 업로드에 대한 제한 상황 설정. 현재 5MB
});
```



위 설정을 실제로 활용하기 위해 서버에 반드시 `uploads` 폴더가 존재해야 한다.

```javascript
const fs = require('fs');

try {
	fs.readFileSync('uploads');
} catch (error) {
	console.error('upload 폴더가 없어 uploads 폴더를 생성합니다.');
	fs.mkdirSync('uploads');
}
```



##### 하나의 파일만 업로드 하는 경우

```html
<!-- html -->
<form action="/upload" method="post" enctype="multipart/form-data">
	<input type="file" name="image" />
	<input type="text" name="title" />
	<button type="submit">업로드</button>
</form>
```

```javascript
/* js */
app.post('/upload', upload.single('image'), (req, res) => {
	console.log(req.file, req.body);
	res.send('ok');
});
// 업로드 성공 시 req.file 안에 객체 생성. req.body에는 파일이 아닌 데이터인 title이 들어 있다.
```



##### 여러 파일을 업로드 하는 경우

```html
<!-- html -->
<form action="/upload" method="post" enctype="multipart/form-data">
	<input type="file" name="many" multiple />
	<input type="text" name="title" />
	<button type="submit">업로드</button>
</form>
```

```javascript
/* js */
app.post('/upload', upload.array('many'), (req, res) => {
	console.log(req.files, req.body);
	res.send('ok');
});
// 업로드 성공 시 req.files 안에 객체 배열 생성.
```



##### 기타


```javascript
/* input태그가 여러개일 떄 : field */
app.post('/upload', upload.fields([{ name: 'image1' }, { name: 'image2' }]), (req, res) => {
	console.log(req.files, req.body);
	res.send('ok');
});

/* 파일을 업로드하지 않고도 멀티파트 형식으로 업로드할 때 : none */
app.post('/upload', upload.none(), (req, res) => {
	console.log(req.body); // body만 존재
	res.send('ok');
});
```





### 6.3 Router 객체로 라우팅 분리하기

#### 기본 사용 방법

```javascript
/* routes/index.js */
const express = require('express');
const router = express.Router();

// GET / 라우터
router.get('/', (req, res) => {
	res.send('Hello, Express');
})

module.exports = router;


/* routes/user.js : 앞뒤 동일 */
...
// GET /user 라우터
router.get('/', (req, res) => {
	res.send('Hello, User');
})
...
```

```javascript
/* app.js */
const indexRouter = require('./routes');
const userRouter = require('./routes/user');

app.use('/', indexRouter);
app.use('/user', userRouter);
```



#### next('route')

다음 라우터로 넘어가는 기능. 라우터에 연결된 나머지 미들웨어들을 건너뛰고 싶을 때.

```javascript
router.get('/', (req, res, next) => {
	console.log('GET / 요청에만 실행됩니다.');
	next('route');
}, (req, res, next) => {
  console.log('실행되지 않습니다.')
	next();
});

router.get('/', (req, res) => {
	console.log('GET / 요청에만 실행됩니다.');
	res.send('Hello, Express!');
});
```

>  💡그럼 나머지 실행 안되는 애들은 안쓰는건가?



#### 라우터 특수 패턴: 라우트 매개변수

사용자 지정 패턴을 넣을 수 있고, `req.params` 에서 확인할 수 있다.

와일트카드 역할을 하므로 일반 라우터보다 뒤에 위치해야 한다.

```javascript
router.get('/user/:id', (req, res) => {
	console.log(req.params, req.query);
});
// req.params.id 로 확인 가능.
```





### 6.4 req, res 객체 살펴보기

http 모듈의 req, res 객체를 확장한 것. 기존 메서드도 사용할 수 있고 추가적인 메서드도 있다.

#### req 객체

| 메서드               | 설명                                                      |
| -------------------- | --------------------------------------------------------- |
| `req.app`            | app객체에 접근할 수 있다.<br />ex) req.app.get('port')    |
| `req.body`           | body-parser 미들웨어가 만드는 요청의 본문을 해석한 객체   |
| `req.cookies`        | cookie-parser 미들웨어가 만드는 요청의 쿠키를 해석한 객체 |
| `req.ip`             | 요청의 ip 주소                                            |
| `req.params`         | 라우트 매개변수에 대한 정보                               |
| `req.query`          | 쿼리스트링에 대한 정보                                    |
| `req.signedCookied`  | 서명된 쿠키의 정보                                        |
| `req.get(헤더 이름)` | 헤더의 값을 가져오고 싶을 때 사용하는 메서드              |



#### res 객체

| 메서드                          | 설명                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `res.app`                       | app 객체에 접근                                              |
| `res.cookie(키, 값, 옵션)`      | 쿠키를 설정                                                  |
| `res.clearCookie(키, 값, 옵션)` | 쿠키를 제거                                                  |
| `res.end()`                     | 데이터 없이 응답                                             |
| `res.json(JSON)`                | JSON 형식의 응답                                             |
| `res.redirect(주소)`            | 리다이렉트할 주소와 응답을 보낸다                            |
| `res.render(뷰, 데이터)`        | 템플릿 엔진을 렌더링해서 응답할 때 사용                      |
| `res.send(데이터)`              | 데이터와 함께 응답을 보낸다.<br />데이터의 종류 : 문자열, HTML, 버퍼, 객체, 배열 등 |
| `res.sendFile(경로)`            | 경로에 위치한 파일을 응답                                    |
| `res.set(헤더, 값)`             | 응답의 헤더를 설정                                           |
| `res.status(코드)`              | 응답 시의 HTTP. 상태 코드                                    |



#### 메서드 체이닝

```javascript
res
	.status(201)
	.cookie('test', 'test')
	.redirect('/admin');
```



### 6.5 템플릿 엔진 사용하기

정적인 HTML을 대체하기 위해 탄생.

자바스크립트를 이용해서 HTML을 렌더링할 수 있다.

#### 6.5.1 퍼그(제이드)

문법이 간단하여 코드의 양을 줄일 수 있다. 다만 HTML과 문법이 많이 다름.

#### 6.5.2 넌적스

파이어폭스, 모질라에서 개발.

HTML 문법을 그대로 사용하여 퍼그의 문법 변화에 적응하기 힘든 경우에 적합.