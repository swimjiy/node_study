# 8장 MongoDB 🚀

[TOC]



### 8.1 NoSQL vs SQL

| SQL(MySQL)               | NoSQL(MongoDB)               |
| ------------------------ | ---------------------------- |
| 규칙에 맞는 데이터 입력  | 자유로운 데이터 입력         |
| 테이블 간 JOIN 지원      | 컬렉션 간 JOIN 미지원        |
| 안정성, 일관성           | 확장성, 가용성               |
| 용어(테이블, 로우, 컬럼) | 용어(컬렉션, 다큐먼트, 필드) |



### 8.2 몽고디비 설치하기

```bash
$ brew tap mongodb/brew
$ brew install mongodb-community

/* 몽고디비 실행 */
$ brew services start mongodb-community
```



#### 관리자 계정으로 접속하기

```bash
> use admin
> db.createUser({ user: '이름', pwd: '비밀번호', roles: ['root'] })
```

```bash
$ mongod --auth // 로그인 필요
$ mongo admin -u [이름] -p [비밀번호]
```





### 8.3 컴퍼스 설치하기

컴퍼스: 몽고디비 관리 도구. GUI로 데이터를 시각적으로 관리할 수 있다.

```bash
$ brew cask install mongodb-compass-community
```



### 8.4 데이터베이스 및 컬렉션 생성하기

```bash
/* 데이터베이스 생성: use [데이터베이스명] */
use nodejs

/* 데이터베이스 목록 확인 */
show dbs

/* 현재 사용 중인 데이터베이스 확인 */
db

/* 컬렉션 생성하기 (다큐먼트 넣는 순간 컬렉션 자동 생성) */
db.createCollection('users')
```





### 8.5 CRUD 작업하기

***자료형**

몽고디비는 기본적으로 JS문법을 따르므로 자료형 또한 JS를 따른다. (`Date()` 등)

추가적으로 쓰는 자료형은 `ObjectId`, `Binary Data`, `Timestamp` 등이 있음.



#### 8.5.1 Create(생성)

`db.컬렉션명.save(다큐먼트)` 로 생성.

```javascript
db.users.save({ name: 'zero', age: 24, married: false, comment: '안녕하세요.', createdAt: new Date() });
db.comments.save({ commenter: ObjectId("5fec1beac0dfb10221f22f4a"), comment: '안녕하세요. 댓글입니다.', createdAt: new Date() });
```



#### 8.5.2 Read(조회)

`db.컬렉션명.find({})` 로 전체 조회.

```javascript
db.users.find({}, { _id: 0, name: 1, married: 1 });
// _id: 0 또는 false로 id 필드는 가져오지 않도록 한다.

db.users.find({ age: { $gt: 30 } }, { _id: 0, name: 1, married: 1 });
// $gt, $gte, $lt, $lte, $ne, $or, $in 연산자로 조건부 조회. 시퀄라이즈와 비슷하다.

db.users.find({ $or: [{ age: { $gt: 30 }}, { married: false }] }, { _id: 0, name: 1, married: 1 });

db.users.find({}, { _id: 0, name: 1, married: 1 }).sort({ age: -1 }).limit(1).skip(1);
// .sort()로 정렬, .limit()로 조회 개수, .skip()으로 건너뛸 개수 설정.
```



#### 8.5.3 Update(수정)

`db.users.update([수정할 다큐먼트 정보], [수정할 내용])` 으로 수정

`$set{}` 연산자를 지정해야. 특정 필드만 수정할 수 있다. 아니면 통째로 수정됨.

```javascript
db.users.update({ name: 'zero' }, { $set: { comment: '안녕하세요 이 필드를 바꿔보겠습니다' } })
```



#### 8.5.4 Delete(삭제)

`db.users.remove([삭제할 다큐먼트 정보])` 로 삭제. 성공 시 삭제된 개수 반환.

```javascript
db.users.remove({ name: 'nero' });
```





### 8.6 몽구스 사용하기

노드와 MongoDB를 연결해주고 쿼리를 만들어주는 **ODM**(Object Document Mapping).

##### 장점

- 스키마: 몽고디비에 데이터를 넣기 전 스키마로 데이터를 한 번 필터링함으로써 실수를 방지할 수 있다.
- `populate` 메서드: MySQL의 JOIN 기능과 유사. 관계가 있는 데이터를 쉽게 가져올 수 있다.
- ES2015 프로미스 문법과 가독성 높은 쿼리 빌더 지원.



#### 8.6.1 몽고디비 연결하기

```json
// package.json
{
  "name": "learn-mongoose",
  "version": "0.0.1",
  "description": "몽구스를 배우자",
  "main": "app.js",
  "scripts": {
    "start": "nodemon app",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "jiy",
  "license": "MIT",
  "dependencies": {
    "express": "^4.17.1",
    "mongoose": "^5.11.9",
    "morgan": "^1.10.0",
    "nunjucks": "^3.2.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.6"
  }
}
```



```javascript
// schemas/index.js

const mongoose = require('mongoose');

// 개발 환경일 때만 콘솔을 통해 몽구스가 생성하는 쿼리 내용을 확인
const connect = () => {
	if (process.env.NODE_ENV !== 'production') {
		mongoose.set('debug', true);
	}
}

// 몽구스와 몽고디비를 연결
mongoose.connect('mongodb://jiy:0602@localhost:27017/admin', {
	dbName: 'nodejs',
	useNewUrlParser: true, // useNewUrlParser, useCreateIndex 는 콘솔에 경고 메시지 띄우는 용도
	useCreateIndex: true,
}, (error) => {
	if (error) {
		console.log('몽고디비 연결 에러', error);
	} else {
		console.log('몽고디비 연결 성공');
	}
})

// 몽구스 커넥션에 이벤트 리스너 추가. 에러 발생 시 에러 내용 기록하고 연결 종료 시 재연결 시도
mongoose.connection.on('error', (error) => {
	console.error('몽고디비 연결 에러', error);
})

mongoose.connection.on('disconnected', () => {
	console.error('몽고디비 연결이 끊어졌습니다. 연결을 재시도합니다.');
	connect();
})

module.exports = connect;
```



```javascript
// ./app.js

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const nunjucks = require('nunjucks');

const connect = require('./schemas');

const app = express();
app.set('port', process.env.PORT || 3002);
app.set('view engine', 'html');
nunjucks.configure('views', {
	express: app,
	watch: true,
});
connect();

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
	res.status(err.status || 500);
	res.render('error');
});

app.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기 중');
});
```



#### 8.6.2 스키마 정의하기 

```javascript
// ./schemas/user.js
const mongoose = require('mongoose');

const { Schema } = mongoose;
// _id를 기본 키로 생성하므로 선언X
const userSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	age: {
		type: Number,
		required: true,
	},
	comment: String,
	createdAt: {
		type: Date,
		default: Date.now,
	}
});

// model메서드로 스키마와 몽고디비 컬렉션 연결
module.exports = mongoose.model('User', userSchema);
```

```javascript
// ./schemas/comment.js
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const commentSchema = new Schema({
	commenter: {
		type: ObjectId,
		required: true,
		ref: 'User',
	},
	comment: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// model메서드로 스키마와 몽고디비 컬렉션 연결
module.exports = mongoose.model('Comment', commentSchema);
```



#### 8.6.3 쿼리 수행하기 

https://github.com/ZeroCho/nodejs-book/tree/master/ch8/8.6/learn-mongoose