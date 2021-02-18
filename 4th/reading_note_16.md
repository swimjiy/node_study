# 16장 서버리스 노드 개발 🚀

[TOC]

### 16.1 서버리스 이해하기

#### 서버리스(Serverless)란?

- 서버를 클라우드 서비스가 대신 관리해주므로 개발자나 운영자가 서버를 관리하는 데 드는 부담이 줄어든다는 의미.

- **개발자가 서비스 로직에만 집중할 수 있는 환경 제공**
- AWS EC2나 구글 컴퓨트 엔진과는 달리 VM 인스턴스를 미리 구매하지 않아도 된다.

#### 서버리스 서비스 예시

- AWS - 람다, API 게이트웨이, S3
- GCP - 앱 엔진, 파이어베이스, 클라우드 펑션스, 클라우드 스토리지

#### 서버리스의 종류

- FaaS: 특정한 동작을 수행하는 로직을 저장하고 요청이 들어올 때 로직을 실행하는 서비스. 이미지 리사이징 등을 함수로. (람다, 클라우드 펑션스)
- 클라우드 데이터 저장소: 이미지 같은 데이터를 저장하고 보여준다. 노드 서버가 다른 서버에 비해 정적 파일을 제공하는 데 유리하지 않으므로 위임하면 좋음. (S3, 클라우드 스토리지)

> Q: 노드가 이미지 리사이징을 하기 버겁고, 노드 서버가 정적 파일을 제공하는 데 유리하지 않기 때문에 쓰면 좋다는데, 왜 노드는 그걸 잘 못하는 걸까.



### 16.2 AWS S3 사용하기

![스크린샷 2021-02-18 오후 11.22.26](/Users/imjiyoung/Library/Application Support/typora-user-images/스크린샷 2021-02-18 오후 11.22.26.png)

#### 버킷을 만들자

1. 먼저 회원가입 하고 S3 버킷 만들기 시작
2. 버킷 이름(고유)과 리전(현재 위치와 가까울 수록 좋음)
3. 웹 서비스에서 사용하기 위해 퍼블릭 액세스 허용
4. 권한 > 버킷 정책 > 버킷 정책 편집기에 아래의 코드를 추가하여 권한 추가

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AddPerm",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject", # S3으로부터 데이터를 가져오는 권한
        "s3:PutObject"  # S3에 데이터를 넣는 권한
      ],
      "Resource": "arn:aws:s3:::nodebirdtestbucket/*"
    }
  ]
}
```

5. 계정 이름 > 내 보안 자격 증명 > 새 액세스 키 만들기 로 AWS 키 발급 받기



#### 내 코드에 S3을 연결하자

1. 필요 패키지 설치
   - multer-s3: multer에서 s3로 업로드
   - aws-sdk: aws 기능을 노드에서도 사용할 수 있음

```bash
$ npm i multer-s3 aws-sdk
```

2. `.env` 에 아까 저장한 AWS키 추가
3. 아래 코드 추가

```javascript
// routes/post.js
...
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
...
// AWS 설정
AWS.config.update({
	accessKeyId: process.env.AWSAccessKeyId,
	secretAccessKey: process.env.AWSSecretKey,
	region: 'ap-northeast-2',
});

const uploads = multer({
	// multer의 storage 옵션을 multerS3으로 교체.
	storage: multerS3({
		s3: new AWS.S3(),
		bucket: 'nodebirdtestbucket',
		key(req, file, cb) {
			cb(null, `original/${Date.now()}${path.basename(file.originalname)}`);
		}
	}),
	// storage: multer.diskStorage({
	// 	destination(req, file, cb) {
	// 		cb(null, 'uploads/');
	// 	}, filename(req, file, cb) {
	// 		const ext = path.extname(file.originalname);
	// 		cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
	// 	},
	// }),
	limits: { fileSize: 5 * 1024 * 1024 },
});

// 이미지 하나를 업로드받은 뒤 이미지의 저장 경로를 클라이언트로 응답
router.post('/img', isLoggedIn, uploads.single('img'), (req, res) => {
	console.log(req.file);
	// res.json({ url: `/img/${req.file.filename}` });
	// S3 버킷 이미지 주소가 담겨 있으며 이를 클라이언트에 보냄.
	res.json({ url: req.file.location });
});
...
```



![스크린샷 2021-02-19 오전 1.26.02](/Users/imjiyoung/Library/Application Support/typora-user-images/스크린샷 2021-02-19 오전 1.26.02.png)



### 16.3 AWS 람다 사용하기





### 16.4 구글 클라우드 스토리지 사용하기





### 16.5 구글 클라우드 펑션스 사용하기