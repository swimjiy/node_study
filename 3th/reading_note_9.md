# 9장 익스프레스로 SNS 서비스 만들기 🚀

[TOC]

### 9.1 프로젝트 구조 갖추기

초기 세팅하기

```json
// ./package.json

{
  "name": "nodebird",
  "version": "0.0.1",
  "description": "익스프레스로 만드는 SNS 서비스",
  "main": "app.js",
  "scripts": {
    "start": "nodemon app",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "jiy",
  "license": "MIT",
  "dependencies": {
    "cookie-parser": "^1.4.5",
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "express-session": "^1.17.1",
    "morgan": "^1.10.0",
    "multer": "^1.4.2",
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



```javascript
// ./app.js

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');

dotenv.config();
const pageRouter = require('./routes/page');

const app = express();
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
	express: app,
	watch: true,
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
	},
}));

app.use('/', pageRouter);

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





### 9.2 데이터베이스 세팅하기

MySQL과 시퀄라이즈로 데이터베이스 설정하기



#### 1) 시퀄라이즈 설정하기

```javascript
// ./models/index.js

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const User = require('./user');
const Hashtag = require('./hashtag');
const Post = require('./post');

const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.User = User;
db.Hashtag = Hashtag;
db.Post = Post;

User.init(sequelize);
Post.init(sequelize);
Hashtag.init(sequelize);

// 각각의 모델들을 시퀄라이즈 객체에 연결.
User.associate(db);
Post.associate(db);
Hashtag.associate(db);

module.exports = db;
```

```javascript
// ./models/user.js

const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
	static init(sequelize) {
		return super.init({
			email: {
				type: Sequelize.STRING(40),
				allowNull: true,
				unique: true,
			},
			nick: {
				type: Sequelize.STRING(15),
				allowNull: false,
			},
			password: {
				type: Sequelize.STRING(100),
				allowNull: true,
			},
			provider: { // local: 로컬 로그인, kakao: 카카오 로그인
				type: Sequelize.STRING(10),
				allowNull: false,
				defaultValue: 'local',
			},
			snsId: { // sns 로그인 시 저장
				type: Sequelize.STRING(30),
				allowNull: true,
			},
		}, {
			sequelize,
			timestamps: true, // Set a createdAt and a updatedAt
			underscored: false,
			modelName: 'User',
			tableName: 'users',
			paranoid: true, // Set a deletedAt
			charset: 'uft8',
			collate: 'utf8_general_ci',
		});
	}

	// 각 모델 간의 관계를 associate 함수 안에 정의
	static associate(db) {
		db.User.hasMany(db.Post);
		// 같은 모델끼리 N:M 관계를 갖는다.
		// 사용자 한 명이 팔로워를 여러 명 가질 수도 있고, 한 사람이 여러 명을 팔로우할 수 있음.
		db.User.belongsToMany(db.User, {
			foreignKey: 'followingId', // foreignKey로 UserId 구별
			as: 'Followers', // foreignKey와 반대되는 모델을 가리킨다.
			through: 'Follow', // 생성할 모델명.
		});
		db.User.belongsToMany(db.User, {
			foreignKey: 'followerId',
			as: 'Followings',
			through: 'Follow',
		});
		// 관계 메서드: user.getFollowers, user.getFollowings
	}
}
```



#### 2) 데이터베이스 만들기

 config 설정 후 DB 생성하기 (DB명: nodebird)

```json
// ./config/config.json

{
  "development": {
    "username": "root",
    "password": null,
    "database": "nodebird",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

```bash
$ npx sequelize db:create
```



모델과 서버 연결하기: 콘솔에 아래 로그 찍히면 성공

```javascript
// ./app.js

...
const { sequelize } = require('./models');
sequelize.sync({ force: false })
	.then(() => {
		console.log('데이터베이스 연결 성공');
	})
	.catch((err) => {
		console.error(err);
	});
...
```





### 9.3. Passport 모듈로 로그인 구현하기

직접 로그인을 구현하는 것은 세션과 쿠키 처리 등 복잡한 작업이 많으므로 검증된 모듈을 사용하는 것이 좋다.

passport: 이름처럼 우리의 서비스를 사용할 수 있게 해주는 여권 같은 역할.

#### 1) passport 설치 후 app.js와 연결

```bash
$ npm i passport passport-local passport-kakao bcrypt
```

```javascript
// ./app.js

...
const passport = require('passport');
const passportConfig = require('./passport');

passportConfig();

app.use(passport.initialize()); // req객체에 passport 설정을 추가
app.use(passport.session()); // req.session객체에 passport 정보를 저장
// req.session객체는 express-session에서 생성하므로 express-session 미들웨어 뒤에 연결.
...
```

```javascript
// ./passport/index.js

const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
	// serializeUser: 로그인 시 실행. req.session(세션) 객체에 어떤 데이터를 저장할 지 정하는 메서드.
	// done(에러 발 생 시 사용 인수, 저장하고 싶은 데이터 인수);
	passport.serializeUser((user, done) => {
		done(null, user.id); // user 전부를 저장하면 세션의 용량이 커지고 데이터 일관성에 문제.
	});

	// deserializeUser: 매 요청 시 실행. serializeUser done의 첫 번째 인수가 deserializeUser의 첫 번째 매개변수가 됨.
	passport.deserializeUser((id, done) => {
		User.findOne({ where: { id } })
			.then(user => done(null, user))
			.catch(err => done(err));
	});

	local();
	kakao();
};
```



#### 로그인 과정

1. 라우터를 통해 로그인 요청이 들어옴
2. 라우터에서 passport.authenticate 메서드 호출
3. 로그인 전략 수행
4. 로그인 성공 시 사용자 정보 객체와 함께 req.login 호출
5. req.login 메서드가 passport.serializeUser 호출
6. req.session에 사용자 아이디만 저장
7. 로그인 완료



#### 로그인 이후 과정

1. 요청이 들어옴
2. 라우터에 요청이 도달하기 전에 passport.session 미들웨어가 passport.deserializeUser 메서드 호출
3. req.session에 저장된 아이디로 데이터베이스 사용자 조회
4. 조회된 사용자 정보를 req.user에 저장
5. 라우터에서 req.user 객체 사용 가능



#### 9.3.1 로컬 로그인 구현하기

자체적으로 회원가입 후 로그인하는 것. 아이디/비밀번호 또는 이메일/비밀번호 이용

passport-local 모듈 사용.



##### 1) 로그인 라우터 추가 후 접근 권한 미들웨어 추가

```javascript
// ./routes/middlewares.js

exports.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.status(403).send('로그인 필요');
	}
};

exports.isNotLoggedIn = (req, res, next) => {
	if (!req.isAuthenticated()) {
		next();
	} else {
		const message = encodeURIComponent('로그인한 상태입니다.');
		res.redirect(`/?error=${message}`);
	}
};
```

```javascript
// ./routes/page.js

...
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
...
router.use((req, res, next) => {
	res.locals.user = req.user;
	res.locals.followerCount = 0;
	res.locals.followingCount = 0;
	res.locals.followerIdList = [];
	next();
});

router.get('/profile', isLoggedIn, (req, res) => {
	// req.isAuthenticated()가 true라면 정상 작동, false면 메인 페이지로 리다이렉트
	res.render('profile', { title: '내 정보 - NodeBird' });
});

router.get('/join', isNotLoggedIn, (req, res) => {
	// req.isAuthenticated()가 false일 때 정상 작동.
	res.render('join', { title: '회원가입 - NodeBird' });
});

...
```



##### 2) 회원가입, 로그인, 로그아웃 라우터 작성

```javascript
// ./routes/auth.js

const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 회원가입 라우터. 
router.post('/join', isNotLoggedIn, async (req, res, next) => {
	const { email, nick, password } = req.body;
	try {
		// 기존에 같은 이메일로 가입한 사용자가 있다면 회원가입 페이지로 이동
		const exUser = await User.findOne({ where: { email } });
		if (exUser) {
			return res.redirect('/join?error=exist');
		}
		// 없다면 비밀번호를 암호화하고 사용자 정보 생성
		const hash = await bcrypt.hash(password, 12); // 두 번째 인수는 pbkdf2의 반복 횟수. 12~31 추천. 
		await User.create({
			email,
			nick,
			password: hash,
		});
		return res.redirect('/');
	} catch (error) {
		console.error(error);
		return next(error);
	}
});

// 로그인 라우터. 
router.post('/login', isLoggedIn, (req, res, next) => {
	// 로그인 요청이 들어오면 아래 미들웨어가 로컬 로그인 전략 수행.
	passport.authenticate('local', (authError, user, info) => {
		if (authError) {
			console.error(authError);
			return next(authError);
		}
		if (!user) {
			return res.redirect(`/?loginError=${info.message}`)
		}
		return req.login(user, (loginError) => {
			if (loginError) {
				console.error(loginError);
				return next(loginError);
			}
			return res.redirect('/');
		});
	})(req, res, next); // 미들웨어 내의 미들웨어는 (req, res, next) 를 붙인다.
});

// 로그아웃 라우터
router.get('/logout', isLoggedIn, (req, res) => {
	req.logout(); // req.user 객체 제거
	req.session.destroy(); // req.session 객체 내용 제거
	res.redirect('/');
});

module.exports = router;
```



##### 3) passport 전략 추가

```javascript
// ./passport/localStrategy.js

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
	// LocalStrategy의 첫 번째 인수: 전략에 관한 설정.
	// usernameField와 passwordField에 일치하는 로그인 라우터의 req.body 속성 추가.
	passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
	}, async (email, password, done) => {
	// 실제 전략을 수행하는 함수.
	// done의 인수는 routes/auth.js의 passport.authenticate('local', (authError, user, info) => { 와 대치
		try {
			const exUser = await User.findOne({ where: { email } });
			// 1. User db에 일치하는 이메일을 찾고, 있다면 compare()로 비밀번호 비교
			if (exUser) {
				const result = await bcrypt.compare(password, exUser.password);
				if (result) {
					// 2. 비밀번호가 일치하면 두 번째 인수로 사용자 정보를 넣어 보냄.
					done(null, exUser);
				} else {
					// 3. 비밀번호가 일치하지 않으면 세 번째 인수로 에러메시지를 보냄.
					done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
				}
			} else {
				done(null, false, { message: '가입되지 않은 회원입니다.' });
			}
		} catch (error) {
			console.error(error);
			done(error);
		} 
	}));
};
```





#### 9.3.2 카카오 로그인 구현하기

로그인 인증 과정을 카카오에 맡기는 것.

SNS 로그인은 회원가입 절차가 따로 없으므로 처음 로그인할 때는 회원가입을, 두 번째 로그인부터는 로그인 처리를 해야 함.



##### 1) kakao passport 전략 추가

```javascript
// ./passport/kakaoStrategy.js

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => {
	// 카카오 로그인에 대한 설정.
	passport.use(new KakaoStrategy({
		clientID: process.env.KAKAO_ID, // 카카오에서 발급하는 아이디. 노출되지 않아야 하므로 env로 설정.
		callbackURL: '/auth/kakao/callback', // 카카오로부터 인증 결과를 받을 라우터 주소.
	}, async (accessToken, refreshToken, profile, done) => {
		console.log('kakao profile', profile);
		try {
			const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao' } });
			// 1. 기존에 카카오로 회원가입한 사용자가 있는지 조회하고, 있다면 done 호출 후 종료.
			if (exUser) {
				done(null, exUser);
			} else {
			// 2. 없다면 회원가입 진행. 카카오에서 전달하는 profile 객체에서 원하는 정보를 꺼내 가입한다.
				const newUser = await User.create({
					email: profile._json && profile._json.kakao_account_email,
					nick: profile.displayName,
					snsId: profile.id,
					provider: 'kakao',
				});
				done(null, newUser);
			}
		} catch (error) {
			console.error(error);
			done(error);
		}
	}));
};
```



##### 2) kakao 로그인 라우터 추가

```javascript
// ./routes/auth.js

...
// /auth/kakao에서 로그인 전략을 수행하는데 처음에는 1. 카카오 로그인 창으로 리다이렉트하고
router.get('/kakao', passport.authenticate('kakao'));

// 2. 로그인 후 성공 여부 결과를 /auth/kakao/callback으로  받는다.
router.get('/kakao/callback', passport.authenticate('kakao', { failureRedirect: '/', }), (req, res) => {
		res.redirect('/');
});
...
```



##### 3) kakao clientID 발급받기

https://developers.kakao.com/

할 일

- ''애플리케이션 추가하기' 하고 REST API 키 .env 에 `KAKAO_ID=` 로 넣기
- 앱 설정 > 플랫폼 > Web 플랫폼 등록 에서 도메인 `http://localhost:8001` 추가하기
- 제품 설정 > 카카오 로그인 에서 활성화 설정 ON
- redirect URL `http://localhost:8001/auth/kakao/callback`  저장
- 카카오 로그인 > 동의항목 에서 카카오 계정으로 정보 수집 후 제공 체크 후 저장



### 9.4 multer 패키지로 이미지 업로드 구현하기

multer로 멀티파트 형식의 이미지 업로드

```bash
$ npm i multer
```

이미지 저장 방법

- `input` 태그로 이미지를 선택할 때 바로 업로드를 진행하고, 업로드된 사진 주소를 다시 클라이언트에 알린다.
- 게시글을 저장할 때는 데이터베이스에 직접 이미지 데이터를 넣는 대신 이미지 경로만 저장.
- 이미지는 서버 디스크에 저장.

```javascript
// ./routes/post.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
	fs.readdirSync('uploads');
} catch (error) {
	console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
	fs.mkdirSync('uploads');
}

const uploads = multer({
	storage: multer.diskStorage({
		destination(req, file, cb) {
			cb(null, 'uploads/');
		}, filename(req, file, cb) {
			const ext = path.extname(file.originalname);
			cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
		},
	}),
	limits: { fileSize: 5 * 1024 * 1024 },
});

// 이미지 하나를 업로드받은 뒤 이미지의 저장 경로를 클라이언트로 응답
router.post('/img', isLoggedIn, uploads.single('img'), (req, res) => {
	console.log(req.file);
	res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
// 게시글 업로드를 처리하는 라우터.
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
	try {
		const post = await Post.create({
			content: req.body.content,
			img: req.body.url, // /post/img 에서 저장한 이미지 주소가 저장.
			UserId: req.user.id,
		});
		const hashtags = req.body.content.match(/#[^\s#]*/g); // 해시태그를 정규식으로 추출 후 DB에 저장
		if (hashtags) {
			const result = await Promise.all(
				hashtags.map(tag => {
					return Hashtag.findOrCreate({ // findOrCreate 메서드로 DB에 있으면 가져오고, 없으면 생성하고 가져온다.
						where: { title: tag.slice(1).toLowerCase() },
					})
				}),
			);
			await post.addHashtags(result.map(r => r[0])); // r이 [모델, 생성 여부] 를 반환.
		}
		res.redirect('/');
	} catch (error) {
		console.error(error);
		next(error);
	}
});

module.exports = router;
```



> NOTE: 실제 서버 운영 시
>
> multer 패키지는 이미지를 서버 디스크에 저장하는데 간단하지만 서버에 문제가 생겼을 때 제공되지 않거나 손실 우려 O.
>
> AWS S3이나 클라우드 스토리지같은 정적 파일 제공 서비스로 이미지 따로 저장/제공 추천.
>
> i.e., multer-s3, multer-google-storage



##### 메인 페이지 로딩 시 메인 페이지와 게시글을 함께 로딩

```javascript
// ./routes/page.js

...
const { Post, User } = require('../models');

router.get('/', async (req, res, next) => {
	try {
    // DB에서 게시글을 조회하고 결과를 twits에 넣어 렌더링.
		const posts = await Post.findAll({
			include: {
				model: User,
				attributes: ['id', 'nick'], // 조회 조건1: 아이디와 닉네임을 JOIN하여 제공
			},
			order: [['createdAt', 'DESC']], // 조회 조건2: 최신순 정렬
		});
		res.render('main', {
			title: 'NodeBird',
			twits: posts,
		});
	} catch (err) {
		console.error(err);
		next(err);
	}
});
...
```





### 9.5 프로젝트 마무리하기

#### 팔로잉 기능 

##### 1) 팔로우 기능 추가

```javascript
// ./routes/user.js

const express = require('express');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// :id = req.params.id
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
	try {
		// 팔로우할 사용자를 조회하고, 시퀄라이즈의 addFollowing 메서드로 관계 지정
		const user = await User.findOne({ where: { id: req.user.id } });
		if (user) {
			await user.addFollowing(parseInt(req.params.id, 10));
			res.send('success');
		} else {
			res.status(404).send('no user');
		}
	} catch (error) {
		console.error(error);
		next(error);
	}
});

module.exports = router;
```



##### 2) req.user에 팔로워와 팔로잉 목록 저장

```javascript
// ./passport/index.js
...
passport.deserializeUser((id, done) => {
  User.findOne({
    where: { id },
    include: [{
      model: User,
      attributes: ['id', 'nick'], // 실수로 비밀번호를 조회하는 것을 막기 위해 attributes 지정
      as: 'Followers',
    }, {
      model: User,
      attributes: ['id', 'nick'],
      as: 'Followings',
    }],
  })
    .then(user => done(null, user))
    .catch(err => done(err));
});
...
```



#### 해시태그 검색 기능

##### 3) 팔로잉/팔로워 숫자와 팔로우 버튼 표시

```javascript
// ./routes/page.js

...
router.use((req, res, next) => {
	res.locals.user = req.user;
	res.locals.followerCount = req.user ? req.user.Followers.length : 0;
	res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  // followerIdList는 게시글 작성자의 아이디가 존재하지 않으면 팔로우 버튼을 보여주기 위해서.
	res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
	next();
});

...

// 해시태그 조회 라우터
router.get('/hashtag', async (req, res, next) => {
  // 쿼리스트링으로 해시태그 이름을 받고, 없으면 메인 페이지로 리다이렉트.
	const query = req.query.hashtag;
	if (!query) {
		return res.redirect('/');
	}
	try {
    // DB에서 해시태그를 검색하고 있다면 시퀄라이즈 getPosts 메서드로 모든 게시글 조회.
		const hashtag = await Hashtag.findOne({ where: { title: query } });
		let posts = [];
		if (hashtag) {
			posts = await hashtag.getPosts({ include: [{ model: User }] });
		}
    // 조회 후 메인 페이지 렌더 시 twits에 조회된 게시글만 추가.
		return res.render('main', {
			title: `${query} | NodeBird`,
			twits: posts,
		});
	} catch (error) {
		console.error(error);
		next(error);
	}
});
...
```



#### 최종 app.js

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');

dotenv.config();
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
app.set('port', process.env.PORT || 8001);
passportConfig();
app.set('view engine', 'html');
nunjucks.configure('views', {
	express: app,
	watch: true,
});

sequelize.sync({ force: false })
	.then(() => {
		console.log('데이터베이스 연결 성공');
	})
	.catch((err) => {
		console.error(err);
	});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
// uploads 폴더 내 사진들이 /img 주소로 제공된다.
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.COOKIE_SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
	},
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);

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



#### 9.5.1 스스로 해보기

- 팔로잉 끊기(시퀄라이즈의 `destroy` 메서드와 라우터 활용)
- 프로필 정보 변경하기(시퀄라이즈의 `update` 메서드와 라우터 활용)
- 게시글 좋아요 누르기 및 좋아요 취소하기(사용자-게시글 모델 간 N:M 관계 정립 후 라우터 활용)
- 게시글 삭제하기(등록자와 현재 로그인한 사용자가 같을 때, 시퀄라이즈의 `destroy` 메서드와 라우터 활용)
- 매번 데이터베이스를 조회하지 않도록 `deserializeUser` 캐싱하기(객체 선언 후 객체에 사용자 정보 저장, 객체 안에 캐싱된 값이 있으면 조회)

#### 

#### 9.5.2 핵심 정리

- 서버는 요청에 응답하는 것이 핵심 의무이므로 요청을 수락하든 거절하든 상관없이 반드시 응답해야 한다. 이때 한 번만 응답해야 에러가 발생하지 않는다.
- 개발 시 서버를 매번 수동으로 재시작하지 않으려면 `nodemon`을 사용하는 것이 좋다.
- `dotenv` 패키지와 `.env` 파일로 유출되면 안되는 비밀 키를 관리한다.
- 라우터는 `routes` 폴더에, 데이터베이스는 `models` 폴더에, html 파일은 `views` 폴더에 구분하여 저장하면 프로젝트 규모가 커져도 관리하기 쉽다.
- 데이터베이스를 구성하기 전에 데이터 간 1:1, 1:N, N:M 관계를 잘 파악하자.
- `routes/middlewares.js` 처럼 라우터 내에 미들웨어를 사용할 수 있다.
- Passport의 인증 과정을 기억해두자. 특히 `serializeUser와` `deserializeUser가` 언제 호출되는지 파악하고 있어야 한다.
- 프런트엔드 form태그의 인코딩 방식이 multipart일 때는 `multer`같은 multipart 처리용 패키지를 사용하는 것이 좋다.