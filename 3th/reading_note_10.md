# 10장 웹 API 서버 만들기 🚀

[TOC]

### 10.1 API 서버 이해하기

**API**: Application Programming Interface의 두문자어로 다른 애플리케이션에서 현재 프로그램의 기능을 사용할 수 있게 허용하는 접점.

**웹 API**:  다른 웹 서비스의 기능을 사용하거나 자원을 가져올 수 있는 창구.

**웹 API 서버**: 서버에 API를 올려서 URL을 통해 접근할 수 있게 만든 것.



### 10.2 프로젝트 구조 갖추기

#### 1) 패키지 설정

```json
// package.json
{
  "name": "nodebird-api",
  "version": "0.0.1",
  "description": "NodeBird API 서버",
  "main": "app.js",
  "scripts": {
    "start": "nodemon app",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "jiy",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.0.0",
    "cookie-parser": "^1.4.5",
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "express-session": "^1.17.1",
    "morgan": "^1.10.0",
    "mysql2": "^2.1.0",
    "nunjucks": "^3.2.1",
    "passport": "^0.4.1",
    "passport-kakao": "1.0.0",
    "passport-local": "^1.0.0",
    "sequelize": "^5.21.7",
    "uuid": "^7.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.3"
  }
}
```



#### 2) 도메인 모델 추가

```javascript
// ./models/domain.js

const Sequelize = require('sequelize');

module.exports = class Domain extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
			// 도메인 모델: 인터넷 주소(host), 도메인 종류(type), 클라이언트 비밀 키(clientSecret)
      host: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('free', 'premium'),
        // ENUM: 넣을 수 있는 값을 제한하는 데이터 형식.
        // 무료/프리미엄은 사용량 제한을 구현하기 위한 구분값.
        allowNull: false,
      },
      clientSecret: { // 다른 개발자들이 NodeBird의 API를 사용할 때 필요한 비밀 키. 유출 주의.
        type: Sequelize.UUID, // UUID: 충돌 가능성이 매우 적은 랜덤한 문자열
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'Domain',
      tableName: 'domains',
    });
  }

  static associate(db) {
    db.Domain.belongsTo(db.User);
  }
};
```



#### 3) 새로 생성한 도메인 모델을 시퀄라이즈와 연결

```javascript
// ./models/index.js
...
const Domain = require('./domain');
db.Domain = Domain;
Domain.init(sequelize);
Domain.associate(db);
...
```

```javascript
// ./models/user.js
...
static associate(db) {
		db.User.hasMany(db.Post);
		db.User.belongsToMany(db.User, {
			foreignKey: 'followingId',
			as: 'Followers',
			through: 'Follow',
		});
		db.User.belongsToMany(db.User, {
			foreignKey: 'followerId',
			as: 'Followings',
			through: 'Follow',
		});
		db.User.hasMany(db.Domain);
	}
}
...
```



#### 도메인을 등록하는 이유

등록한 도메인에서만 API를 사용할 수 있게 하기 위해서.

웹 브라우저에서 요청을 보낼 때, 응답을 하는 곳과 도메인이 다르면 CORS에러가 발생할 수 있으므로 API 서버 쪽에서 미리 허용할 도메인을 등록해야 한다.

다만! CORS는 브라우저에서 발생하는 에러이므로 서버에서 서버로 요청을 보내는 경우에는 발생하지 않는다.



### 10.3 JWT 토큰으로 인증하기

다른 클라이언트가 데이터를 가져가기 때문에 별도의 인증 과정이 필요 = JWT.

**JWT**: JSON Web Token의 약어로, JSON형식의 데이터를 저장하는 토큰. 내용을 볼 수 있기 때문에 민감한 내용은 넣지 않는다.

**JWT 구성**

- 헤더: 토큰 종류와 해시 알고리즘 정보가 들어 있다.
- 페이로드: 토큰의 내용물이 인코딩된 부분.
- 시그니처: 일련의 문자열이며, 시그니처를 통해 토큰이 변조되었는지 여부를 확인할 수 있다.

https://jwt.io/ 에서 토큰 내용을 확인할 수 있음.

**JWT 장점**

- 페이로드 부분이 노출되어 내용을 볼 수 있다. => 내용이 없는 랜덤한 토큰이면 매 요청마다 토큰의 주인,권한을 확인해야 함.
- JWT 비밀 키를 알지 않는 이상 변조가 불가능하다. => 내용물을 믿고 사용할 수 있음.

**JWT 단점**

- 용량이 크다. => 내용이 들어있기도 하고 매 요청 시 토큰이 오고 가서 데이터양이 증가. => 필요할 때만 사용하자.



#### 1) JWT 설치

```bash
$ npm i jsonwebtoken
```




#### 2) API 만들기

```
// .env
JWT_SECRET=jwtSecret
```

```javascript
// ./routes/middlewares.js

const jwt = require('jsonwebtoken');

exports.verifytoken = (req, res, next) => {
	try {
		// 요청 헤더에 토큰을 넣어서 보내면 jwt.verify 메서드로 토큰 검증.
		// jwt.verify(토큰, 토큰의 비밀 키);
		// 성공하면 req.decoded에 토큰의 내용(사용자ID, 닉네임, 발급자, 유효기간) 저장
		req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
		return next();
	} catch (error) {
		if (error.name === 'TokenExpiredError') { // 유효기간 초과
			return res.status(419).json({
				code: 419, // 코드는 400번대 숫자 중 마음대로
				message: '토큰이 만료되었습니다.',
			});
		}
		return res.status(401).json({
			code: 401,
			message: '유효하지 않은 토큰입니다.',
		});
	}
}
...
```

> **라우터 이름이 v1인 이유**
>
> 한 번 버전이 정해진 후에는 라우터를 함부로 수정하면 안되기 때문.

```javascript
// ./routes/v1.js

const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken } = require('./middlewares');
const { Domain, User } = require('../models');

const router = express.Router();

// POST /v1/token : 토큰을 발급하는 라우터
router.post('/token', async (req, res) => {
  const { clientSecret } = req.body;
  try {
		// clientSecret 로 등록된 도메인인지 확인
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
		}
		// 등록된 도메인이라면 jwt.sign 메서드로 토큰 발급
		// jwt.sign(토큰 내용, 토큰 비밀키, 토큰 설정)
    const token = jwt.sign({
      id: domain.User.id,
      nick: domain.User.nick,
    }, process.env.JWT_SECRET, {
      expiresIn: '1m', // 1분
      issuer: 'nodebird', // 발급자
    });
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

// GET /v1/test : 사용자가 발급받은 토큰을 테스트해볼 수 있는 라우터
// verifyToken로 토큰을 검증하고, 성공하면 토큰의 내용을 응답으로 보냄.
router.get('/test', verifyToken, (req, res) => {
  res.json(req.decoded);
});

module.exports = router;
```

라우터 서버에 연결
```javascript
// ./app.js

const v1 = require('./routes/v1');

app.use('/v1', v1);
```



### 10.4 다른 서비스에서 호출하기

API를 사용하는 서비스 만들기 = NodeCat

#### 1) 기본 설정

```json
// package.json
{
  "name": "nodecat",
  "version": "0.0.1",
  "description": "노드버드 2차 서비스",
  "main": "app.js",
  "scripts": {
    "start": "nodemon app",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "jiy",
  "license": "MIT",
  "dependencies": {
    "axios": "^0.19.2",
    "cookie-parser": "^1.4.5",
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "express-session": "^1.17.1",
    "morgan": "^1.10.0",
    "nunjucks": "^3.2.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.3"
  }
}
```



#### 2) 토큰 테스트 라우터 만들기

요청이 왔을 때 세션에 발급받은 토큰이 저장되어 있지 않다면, axios POST로 비밀키를 넣어 토큰을 발급.

axios GET으로 토큰이 유효한지 테스트. 인증용 토큰은 주로 본문 대신 authorization headers에 넣는다.

```javascript
// ./routes/index.js

const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/test', async (req, res, next) => { // 토큰 테스트 라우터
  try {
    if (!req.session.jwt) { // 세션에 토큰이 없으면 토큰 발급 시도
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {
        clientSecret: process.env.CLIENT_SECRET,
      });
      if (tokenResult.data && tokenResult.data.code === 200) { // 토큰 발급 성공
        req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
      } else { // 토큰 발급 실패
        return res.json(tokenResult.data); // 발급 실패 사유 응답
      }
    }
    // 발급받은 토큰 테스트
    const result = await axios.get('http://localhost:8002/v1/test', {
      headers: { authorization: req.session.jwt },
    });
    return res.json(result.data);
  } catch (error) {
    console.error(error);
    if (error.response.status === 419) { // 토큰 만료 시
      return res.json(error.response.data);
    }
    return next(error);
  }
});

module.exports = router;
```





### 10.5 SNS API 서버 만들기

나머지 API 라우터 만들기

#### nodebird-api

```javascript
const { Domain, User, Post, Hashtag } = require('../models');
...
// 내가 올린 포스트를 가져오는 라우터
router.get('/posts/my', verifyToken, (req, res) => {
  Post.findAll({ where: { userId: req.decoded.id } })
    .then((posts) => {
      console.log(posts);
      res.json({
        code: 200,
        payload: posts,
      });
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({
        code: 500,
        message: '서버 에러',
      });
    });
});

// 해시태그 검색 결과를 가져오는 라우터
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
    if (!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다',
      });
    }
    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});
...
```



#### nodecat

```javascript
// ./routes/index.js

const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = 'http://localhost:8002/v1';

axios.defaults.headers.origin = 'http://localhost:4000'; // origin 헤더 추가

// NodeBird API에 요청을 보내는 함수. 자주 재사용되므로 분리
const request = async (req, api) => {
  try {
    if (!req.session.jwt) { // 세션에 토큰이 없으면
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장
    }
    return await axios.get(`${URL}${api}`, {
      headers: { authorization: req.session.jwt },
    }); // API 요청
  } catch (error) {
    if (error.response.status === 419) { // 토큰 만료시 토큰 재발급 받기
      delete req.session.jwt;
      return request(req, api);
    } // 419 외의 다른 에러면
    return error.response;
  }
};

// 자신이 작성한 포스트를 json형식으로 가져오는 라우터
router.get('/mypost', async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 해시태그를 검색하는 라우터
router.get('/search/:hashtag', async (req, res, next) => {
  try {
    const result = await request(
      req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
    );
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

module.exports = router;
```





### 10.6 사용량 제한 구현하기

인증된 사용자라 해도 과도하게 API를 사용하면 API서버에 무리가 간다.따라서 사용 횟수를 제한하여 서버 트래픽을 줄이자.



#### 1) 패키지 설치

```bash
$ npm i express-rate-limit
```



#### 2) 미들웨어 추가

```javascript
// ./routes/middlewares.js

const RateLimit = require('express-rate-limit');
...
// 라우터에 사용량 제한을 거는 미들웨어
exports.apiLimiter = new RateLimit({
  windowMs: 60 * 1000, // 기준 시간. 1분
  max: 10, // 허용 횟수
  delayMs: 0, // 호출 간격
  handler(req, res) { // 제한 초과 시 콜백 함수
    res.status(this.statusCode).json({
      code: this.statusCode, // 기본값 429
      message: '1분에 한 번만 요청할 수 있습니다.',
    });
  },
});

// 사용하면 안되는 라우터에 붙이는 미들웨어
exports.deprecated = (req, res) => {
  res.status(410).json({
    code: 410,
    message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
  });
};
```



#### 3) v2 라우터 만들기 & v1 라우터에 경고 추가

```javascript
// ./routes/v2.js

...
const { verifyToken, apiLimiter } = require('./middlewares');
...
// 중간에 apiLimiter를 추가한다.
router.get('/test', verifyToken, apiLimiter, (req, res) => {
  res.json(req.decoded);
});
```

```javascript
// ./routes/v1.js

...
const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

router.use(deprecated);
...
```

라우터 서버에 연결
```javascript
// ./app.js

const v2 = require('./routes/v2');

app.use('/v2', v2);
```



#### 4) NodeCat에서 v2 호출해보기

```javascript
// ./routes/index.js

...
const URL = 'http://localhost:8002/v2';
...
```



#### 참고

- 현재는 nodebird-api 서버가 재시작되면 사용량 또한 초기화되므로 실제 서비스에서 사용량을 저장할 DB를 따로 마련하는 것이 좋다. i.e., 레디스
- 다만 express-rate-limit는 DB연결을 지원하지 않으므로 새 패키지를 찾거나 직접 구현.



### 10.7 CORS 이해하기

**CORS(Cross-Origin Resource Sharing)**: 요청을 보내는 클라이언트와 요청을 받는 서버의 도메인이 다를 경우 생기는 문제.

**CORS 해결**: 응답 헤더에 Access-Control-Allow-Origin 헤더를 넣어야 한다.



#### 1) NodeBird API에 응답 헤더 조작하기

```bash
$ npm i cors
```

```javascript
// ./routes/v2.js

const cors = require('cors');

...

const router = express.Router();

// v2의 모든 라우터에 Access-Control-Allow-Origin 헤더가 자동 추가.
router.use(cors({
	credentials: true, // 다른 도메인 간에 쿠키 공유 가능. 
  // axios에서도 도메인이 다른 경우 withCredentials: true,
}));

...
```



#### 2) NodeCat의 프런트에서 API 호출해보기

```javascript
// ./routes/index.js

// 프런트 화면을 렌더링하는 라우터
router.get('/', (req, res) => {
  res.render('main', { key: process.env.CLIENT_SECRET });
});
```

```html
<!-- ./views/main.html -->

<!DOCTYPE html>
<html>
  <head>
    <title>프론트 API 요청</title>
  </head>
  <body>
  <div id="result"></div>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script>
    axios.post('http://localhost:8002/v2/token', {
      clientSecret: '{{key}}',
    })
      .then((res) => {
        document.querySelector('#result').textContent = JSON.stringify(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  </script>
  </body>
</html>
```



#### 3) NodeBird API에서 호스트와 비밀 키 일치 여부 확인

**하는 이유**: 요청을 보내는 주체가 클라이언트라서 비밀키가 모두에게 노출되기 때문.

**결과**: 특정한 도메인만 허용해서 다른 도메인에서의 요청을 차단할 수 있다.

```javascript
// ./routes/v2.js

const url = require('url');
...
const router = express.Router();

router.use(async (req, res, next) => {
	// 도메인 모델로 클라이언트의 도메닝과 호스트가 일치하는지 검사.
  const domain = await Domain.findOne({
		// url.parse() : 프로토콜(http, https 등)을 떼어내기 위해 사용.
    where: { host: url.parse(req.get('origin')).host },
	});
	// 일치하는 것이 있다면 cors를 사용. 없다면 next();
  if (domain) {
    cors({
      origin: req.get('origin'), // origin에 허용할 도메인 작성. 여러 개면 배열.
      credentials: true,
    })(req, res, next);
  } else {
    next();
  }
});
...
```





> **NOTE: 프록시 서버**
>
> 서버에서 서버로 요청할 땐 CORS가 발생하지 않는 것을 이용하여 CORS를 해결할 수 있다.
>
> http-proxy-middleware 등 패키지 참고.
>
> 1. 브라우저와 도메인이 같은 서버를 만들고
> 2. 브라우저에서는 API 서버 대신 프록시 서버에 요청을 보낸다.
> 3. 프록시 서버에서 요청을 받아 다시 API 서버로 요청을 보낸다.





### 10.8 프로젝트 마무리하기

#### 10.8.1 스스로 해보기

- 팔로워나 팔로잉 목록을 가져오는 API 만들기 (`nodebird-api`에 새로운 라우터 추가)
- 무료 도메인과 프리미엄 도메인 간에 사용량 제한을 다르게 적용하기(`apiLimiter`를 두 개 만들어서 도메인별로 다르게 적용. 9.3.1절의 `POST /auth/login` 라우터 참조)
- 클라이언트용 비밀 키와 서버용 비밀 키를 구분해서 발급하기(`Domain` 모델 수정)
- 클라이언트를 위해 API 문서 작성하기(`swagger`나 `apidoc` 사용)



#### 10.8.2 핵심 정리

- API는 다른 애플리케이션의 기능을 사용할 수 있게 해주는 창구이다. 
- 모바일 서버를 구성할 때 서버를 REST API 방식으로 구현하면 된다.
- API 사용자가 API를 쉽게 사용할 수 있도록 사용 방법, 요청 형식, 응답 내용에 관한 문서를 준비하자.
- `JWT 토큰`의 내용은 공개되며 변조될 수 있다는 것을 기억하자. 단, 시그니처를 확인하면 변조되었는지 체크할 수 있다.
- 토큰을 사용하여. API의 오남용을 막습니다. 요청 헤더에 토큰이 있는지를 항상 확인하는 것이 좋다.
- `app.use` 외에도 router.use를 활용하여 라우터 간에 공통되는 로직을 처리할 수 있다.
- `cors`나 passport.authenticate 처럼 미들웨어 내에서 미들웨어를 실행할 수 있다. 미들웨어를 선택적으로 적용하거나 커스터마이징할 때 사용하자.
- 브라우저와 서버의 도메인이 다르면 요청이 거절된다는 특성(`CORS`)을 이해하자. 서버와 서버간의 요청에서는 `CORS`가 발생하지 않는다.