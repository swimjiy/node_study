# 7장 MySQL 🚀

### 7.1 데이터베이스란?

데이터베이스: 관련성을 가지며 중복이 없는 데이터들의 집합.

#### DBMS(DataBase Management System)

데이터베이스를 관리하는 시스템.

보통 서버 종료 여부와 상관 없이 사용 가능한 서버의 하드 디스크나 SSD 등의 저장 매체에 저장.

#### 데이터 베이스의 장점

여러 사람이 동시에 사용할 수 있다.

#### RDBMS(Relational DBMS)

관계형 DBMS. SQL 언어를 이용하여 데이터를 관리한다.

ex) Oracle, MySQL, MSSQL



### 7.2 MySQL 설치하기

Homebrew를 이용해 설치

```bash
$ brew install mysql
$ brew services start mysql
$ mysql_secure_installation
```

mysql에 접속

```bash
$ mysql -h localhost -u root -p
```



### 7.3 워크벤치 설치하기

워크벤치를 사용하면 데이터베이스 내부에 저장된 데이터를 시각적으로 관리할 수 있다.

```bash
$ brew cask install mysqlworkbench
```



### 7.4 데이터베이스 및 테이블 생성하기

#### 7.4.1 데이터베이스 생성하기

mysql에서는 schema = 데이터베이스

```mysql
CREATE SCHEMA `nodejs` DEFAULT CHARACTER SET utf8;
use nodejs;
```



#### 7.4.2 테이블 생성하기

테이블: 데이터가 들어갈 수 있는 틀

```mysql
CREATE TABLE nodejs.users (
  -> id INT NOT NULL AUTO_INCREMENT,
  -> name VARCHAR(20) NOT NULL,
  -> age INT UNSIGNED NOT NULL,
  -> married TINYINT NOT NULL,
  -> comment TEXT NULL,
  -> created_at DATETIME NOT NULL DEFAULT now(),
  -> PRIMARY KEY(id),
  -> UNIQUE INDEX name_UNIQUE (name ASC))
  -> COMMENT = '사용자 정보'
  -> DEFAULT CHARACTER SET = utf8
  -> ENGINE = InnoDB;

```



#### 컬럼의 자료형

| 자료형          | 설명                                                         |
| --------------- | ------------------------------------------------------------ |
| INT             | 정수                                                         |
| VARCHAR(자릿수) | CHAR(자릿수)와 달리 정해진 자릿수보다 짧은 문자열도 넣을 수 있다.<br>CHAR는 공백을 스페이스로 처리. |
| TEXT            | 긴 글을 저장할 때 사용. 주로 수백 자 이상의 문자열을 처리.   |
| TINYINT         | -128부터 127까지의 정수. 1 또는 0만 저장한다면 불 값과 같은 역할 |
| DATETIME        | 날짜(DATE)와 시간(TIME)에 대한 정보                          |



#### 자료형 옵션

| 옵션명           | 설명                                                         |
| ---------------- | ------------------------------------------------------------ |
| NULL, NOT NULL   | 빈칸을 허용할지 여부를 묻는 옵션                             |
| AUTO_INCREMENT   | 숫자를 저절로 올린다. 맨 처음은 1.                           |
| UNSIGNED         | 음수가 나올 수 없는 컬럼에 적용                              |
| ZEROFILL         | 숫자의 자릿수가 고정되어 있을 때 적용.<br>e.g., INT(4) -> 1 -> 0001 |
| DEFAULT (기본값) | 해당 컬럼에 값이 없다면 기본값을 대신 추가.<br>now() == CURRENT_TIMESTAMP |
| PRIMARY KEY      | 로우들을 구별할 고유한 식별자를 설정                         |
| UNIQUE INDEX     | 해당 값이 고유해야 하는지에 대한 옵션                        |



#### 테이블 설정

| 설정명                | 설명                              |
| --------------------- | --------------------------------- |
| COMMENT               | 테이블에 대한 보충 설명.          |
| DEFAULT CHARACTER SET | utf8로 설정하면 한글 입력 가능.   |
| ENGINE                | MyISAM과 InnoDB가 제일 많이 사용. |



#### 만들어진 테이블 확인

```mysql
DESC users;
```



#### 테이블 제거

```mysql
DROP TABLE users;
```



#### 사용자의 댓글을 저장하는 테이블 만들기 

```mysql
CREATE TABLE nodejs.comments (
	-> id INT NOT NULL AUTO_INCREMENT,
  -> commenter INT NOT NULL,
  -> comment VARCHAR(100) NOT NULL,
  -> created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -> PRIMARY KEY(id),
  -> INDEX commenter_idx (commenter ASC),
  -> CONSTRAINT commenter
  -> FOREIGN KEY (commenter)
  -> REFERENCES nodejs.users (id)
  -> ON DELETE CASCADE
  -> ON UPDATE CASCADE)
  -> COMMENT = '댓글'
  -> DEFAULT CHARACTER SET = utf8
  -> ENGINE = InnoDB;
```



#### 테이블 리스트 확인

```mysql
SHOW TABLES;
```





### 7.5 CRUD 작업하기

Create, Read, Update, Delete 의 첫 글자를 모은 두문자어이며 데이터베이스에서 많이 수행하는 네 가지 작업을 일컫는다.



#### 7.5.1 Create(생성)

데이터를 생성해서 데이터베이스에 추가

`INSERT INTO [테이블명] ([컬럼1], [컬럼2], ...) VALUES ([값1], [값2], ...)` 형태로 추가.

```mysql
INSERT INTO nodejs.users (name, age, married, comment) VALUES ('zero', 24, 0, '자기소개1');
INSERT INTO nodejs.users (name, age, married, comment) VALUES ('nero', 32, 1, '자기소개2');
```

```mysql
INSERT INTO nodejs.comments (commenter, comment) VALUES (1, '안녕하세요. zero의 댓글입니다.');
```



#### 7.5.2. Read(조회)

데이터베이스에 있는 데이터를 조회

```mysql
SELECT * FROM nodejs.users;
SELECT name, married FROM nodejs.users;
SELECT name, age FROM nodejs.users WHERE married = 1 AND age > 30;
SELECT name, age FROM nodejs.users WHERE married = 0 OR age > 30;
SELECT id, name FROM nodejs.users ORDER BY age DESC;

/* 조회할 로우 개수 설정. 페이지네이션 기능 구현에 유용 */
SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1;
/* OFFSET으로 건너뛸 숫자 지정 */
SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1 OFFSET 1;
```



#### 7.5.3 Update(수정)

데이터베이스에 있는 데이터를 수정

```mysql
UPDATE nodejs.users SET comment = '바꿀 내용' WHERE id = 2;
```



#### 7.5.4 Delete(삭제)

데이터베이스에 있는 데이터를 삭제

```mysql
DELETE FROM nodejs.users WHERE id = 2;
```





### 7.6 시퀄라이즈 사용하기

시퀄라이즈: 노드에서 MySQL 작업을 쉽게 할 수 있도록 도와주는 라이브러리. ORM으로 분류된다.

ORM: 자바스크립트 객체와 데이터베이스의 릴레이션을 매핑해주는 도구.

```json
// ./package.json

{
  "name": "learn-sequelize",
  "version": "0.0.1",
  "description": "시퀄라이즈를 배우자",
  "main": "app.js",
  "scripts": {
    "start": "nodemon app",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "jiy",
  "license": "MIT",
  "dependencies": {
    "express": "^4.17.1",
    "morgan": "^1.10.0",
    "mysql2": "^2.2.5",
    "nunjucks": "^3.2.2",
    "sequelize": "^6.3.5",
    "sequelize-cli": "^6.2.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.6"
  }
}
```





```bash
npm i express morgan nunjucks sequelize sequelize-cli mysql
npx sequelize init
```



```javascript
// ./models/index.js

const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);
db.sequelize = sequelize;

module.exports = db;
```



#### 7.6.1 MySQL 연결하기

```javascript
// ./app.js

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const nunjucks = require('nunjucks');

const { sequelize } = require('./models');

const app = express();
app.set('port', process.env.PORT || 3001);
app.set('view engine', 'html');
nunjucks.configure('views', {
	express: app,
	watch: true,
});
sequelize.sync({ force: false }) // force: true 설정 시 서버를 실행할 때마다 테이블 재생성
	.then(() => {
		console.log('데이터베이스 연결 성공')
	})
	.catch((err) => {
		console.error(err);
	});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
})

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
	res.status(err.status || 500);
	res.render('error');
})

app.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기 중');
})
```



#### 7.6.2 모델 정의하기

MySQL 테이블은 시퀄라이즈의 모델과 대응된다. 시퀄라이즈는 모델과 MySQL의 테이블을 연결해주는 역할.

*시퀄라이즈 모델 이름은 단수형으로, 테이블 이름은 복수형으로 사용*

```javascript
// ./models/user.js

const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
	static init(sequelize) { // init 메서드: 테이블에 대한 설정
		return super.init({ // 첫 번째 인수: 테이블 컬럼 설정, 두 번째 인수: 테이블 자체 설정
			// id는 알아서 설정
			name: {
				type: Sequelize.STRING(20),
				allowNull: false,
				unique: true,
			},
			age: {
				type: Sequelize.INTEGER.UNSIGNED,
				allowNull: false,
			},
			married: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
			},
			comment: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
		}, {
			sequelize,
			timestamps: false, // true면 createdAt과 updatedAt 컬럼을 자동 추가.
			underscored: false, // true면 캐멀케이스 대신 스네이크 케이스로 변경.
			modelName: 'User', // 모델명
			tableName: 'users', // 데이터베이스의 테이블 이름
			paranoid: false, // true면 deletedAt 컬럼 추가. 로우를 복원해야할 때 사용.
			charset: 'utf8',
			collate: 'utf8_general_ci',
      // charset, collate 둘 다 설정해야 한글 입력 가능.
      // 이모티콘 사용은 utf8mb4, utf8mb4_general_ci
		});
	}
	static associate(db) {} // associate 메서드: 다른 모델과의 관계
}

```



#### MySQL과 시퀄라이즈의 비교

| MySQL         | 시퀄라이즈                  |
| ------------- | --------------------------- |
| VARCHAR(100)  | STRING(100)                 |
| INT           | INTEGER                     |
| TINYINT       | BOOLEAN                     |
| DATETIME      | DATE                        |
| INT UNSIGNED  | INTEGER.UNSIGNED            |
| NOT NULL      | allowNull: false            |
| UNIQUE        | unique: true                |
| DEFAULT now() | defaultValue: Sequelize.NOW |



```javascript
// ./models/comment.js

const Sequelize = require('sequelize');

module.exports = class Comment extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			comment: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: true,
				defaultValue: Sequelize.NOW,
			},
		}, {
			sequelize,
			timestamps: false,
			modelName: 'Comment',
			tableName: 'comments',
			paranoid: false,
			charset: 'utf8mb4',
			collate: 'utf8mb4_general_ci',
		});
	}
	static associate(db) {}
}

```



#### 7.6.3 관계 정의하기

MySQL에서는 JOIN 기능으로 여러 테이블 간의 관계를 파악해 결과를 도출한다.

시퀄라이즈는 테이블 간의 관계 정보를 입력하면 알아서 JOIN 기능을 구현해준다.



##### 7.6.3.1 1:N

`hasMany` 메서드와 `belongsTo` 메서드로 1:N 관계를 표현.

다른 모델의 정보가 들어가있는 테이블에 `belongsTo` 를 사용한다.

> User => `hasMany` => Comment
>
> Comment => `belongsTo` => User



```javascript
// ./models/user.js
static associate(db) {
  db.User.hasMany(db.Comment, { foreignKey: 'commenter', sourceKey: 'id' });
}

// ./models/comment.js
static associate(db) {
  db.Comment.belongsTo(db.User, { foreignKey: 'commenter', targetKey: 'id', as: 'Answers' }); // as로 모델 이름을 바꿀 수 있다. 7.6.4.1에서 사용함.
}

// foreignKey를 따로 정해주지 않으면 모델명 + 기본 키 가 합쳐진 컬럼이 모델에 생성. i.e., UserId
```



##### 7.6.3.2 1:1

`hasOne` 메서드와  `belongsTo` 메서드로 1:1 관계를 표현

```javascript
db.User.hasOne(db.Info, { foreignKey: 'userId', sourceKey: 'id' });
db.Info.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id' });
```



##### 7.6.3.3 N:M

`belongsToMany` 메서드로 N:M 관계를 표현

N:M 특성상 새로운 모델이 생성되는데 `through` 속성에 그 이름을 적는다.

```javascript
db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });
```

 

#### 7.6.4 쿼리 알아보기

##### Create

```javascript
INSERT INTO nodejs.users (name, age, married, comment) VALUES ('zero', 24, 0, '자기소개1');

const { User } required('../models');
User.create({
  name: 'zero',
  age: 24,
  married: false, // 시퀄라이즈의 문법에 맞게 0이 아닌 false로 추가
  comment: '자기소개1',
});
```



##### Read

```javascript
/* SELECT * FROM nodejs.users; */
User.findAll({});

/* SELECT * FROM nodejs.users LIMIT 1; */
User.findOne({});

/* SELECT name, age FROM nodejs.users WHERE married = 1 AND age > 30; */
const { Op } = require('sequelize');
const { User } = require('../models');
User.findAll({
  attributes: ['name', 'age'],
  where: {
    married: true,
    age: { [Op.gt]:30 },
  },
});

/* 자주 쓰이는 연산자 */
// Op.gt(초과), Op.gte(이상), Op.lt(미만), Op.lte(이하), Op.ne(같이 않음), Op.or(또는), Op.in(배열 요소 중 하나), Op.notIn(배열 요소와 모두 다름)

/* SELECT name, age FROM nodejs.users WHERE married = 0 OR age > 30; */
const { Op } = require('sequelize');
const { User } = require('../models');
User.findAll({
  attributes: ['name', 'age'],
  where: {
    [Op.or]: [{ married: false }, { age: { [Op.gt]:30 }}], // Op.or 속성에 배열로 나열.
  },
});

/* SELECT id, name FROM nodejs.users ORDER BY age DESC LIMIT 1 OFFSET 1; */
User.findAll({
  attributes: ['id', 'name'],
  order: [['age', 'DESC']], // 정렬은 꼭 컬럼 하나로만 하는 게 아니기 때문에 이중배열.
  limit: 1,
  offset: 1,
})

```



##### Update

```javascript
/* UPDATE nodejs.users SET comment = '바꿀 내용' WHERE id = 2; */
User.update({
  comment: '바꿀 내용',
}, {
  where: { id: 2 },
})
```



##### Delete

```javascript
/* DELETE FROM nodejs.users WHERE id = 2; */
User.destroy({
  where: { id: 2 },
})
```



##### 7.6.4.1 관계 쿼리

`include` 속성으로 MySQL의 JOIN 기능처럼 사용할 수 있다.

```javascript
// 특정 사용자와 댓글까지 가져오는 로직
const user = await User.findOne({
  include: [{
    model: Comment,
    where: {
      id: 1,
    },
    attributes: ['id'],
  }]
});
console.log(user.Comments); // 사용자 댓글
```

```javascript
// 관계가 설정되어있다면 getComments, setComments, addComment, addComments, removeComments 등 메서드 지원.
const user = await User.findOne({});
const comments = await user.getComments();
console.log(comments); // 사용자 댓글
```



##### 7.6.4.2 SQL 쿼리하기

직접 SQL문을 통해 쿼리할 수 있다.

```javascript
const [result, metadata] = await sequelize.query('SELECT * from comments');
console.log(result);
```



####  7.6.5 쿼리 수행하기

https://github.com/ZeroCho/nodejs-book/tree/master/ch7/7.6/learn-sequelize