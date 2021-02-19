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

![](https://github.com/swimjiy/node_study/blob/main/4th/img_01.png?raw=true)



#### 1. 버킷을 만들자

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



#### 2. 내 코드에 S3을 연결하자

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



#### 결과

![](https://github.com/swimjiy/node_study/blob/main/4th/img_09.png?raw=true)



### 16.3 AWS 람다 사용하기

#### [Nodebird와 AWS 요청 프로세스]

> Nodebird → original 폴더에 이미지 업로드 → S3에 도착 → S3에서 람다 트리거 → 람다에서 리사이징된 이미지를 S3에 저장



#### 1. 람다에 올릴 함수 만들기

```javascript
const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

// 1. handler: 람다 호출 시 실행되는 함수.
// event: 호출 상황에 대한 정보, context: 실행되는 함수 환경에 대한 정보, callback(에러 여부, 반환 값): 함수가 완료되었는지를 람다에게 알리는 함수.
exports.handler = async (event, context, callback) => {
  // 2. event 객체로부터 버킷 이름(Bucket), 파일 경로(Key)를 받아옴.
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = event.Records[0].s3.object.key;
  // 3. Key를 통해 파일명, 확장자를 얻음.
  const filename = Key.split('/')[Key.split('/').length - 1];
  const ext = Key.split('.')[Key.split('.').length - 1];
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext; // sharp에서는 jpg 대신 jpeg 사용.
  console.log('name', filename, 'ext', ext);
  try {
    // 4. 버킷으로부터 파일을 불러옴.
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버퍼로 가져오기.
    console.log('original', s3Object.Body.length);
    // 5. sharp 함수에 파일 버퍼(s3Object.Body) 를 넣고, resize 메서드로 크기 지정.
    const resizedImage = await sharp(s3Object.Body)
      .resize(200, 200, { fit: 'inside' })
      .toFormat(requiredFormat)
      .toBuffer(); // 리사이징된 이미지 결과를 버퍼로 출력
    // 6. 리사이징된 이미지를 thumb 폴더에 저장
    await s3.putObject({
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage,
    }).promise();
    console.log('put', resizedImage.length);
    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
}
```



#### 2. Lightsail로 S3에 람다 파일 업로드하기

##### [토막 개념: Lightsail]

![](https://github.com/swimjiy/node_study/blob/main/4th/img_03.png?raw=true)

- Lightsail 쓰는 이유 -  `sharp`가 윈도용과 맥용, 리눅스용으로 구분되므로 빌드할 때 리눅스 환경에서 해야 람다(리눅스)랑 호환됨.

- 15.3에 Lightsail 가입 방법 나와있음.

- 가입 옵션 - 위치: 서울, 이미지 플랫폼: Linux, 이미지 블루프린트: Node.js

- 참고 - Lightsail은 첫 달은 무료지만 이후 매달 최소 3.5 달러 부과. 무료 배포 서비스로는 Heroku, OpenShift 등이 있고 AWS도 가입 후 1년간 특정 지역에 한해 EC2 무료 티어 제공.

##### 2-1. github에 아까 만들어 둔 폴더 레포 생성해서 저장하기. 

https://github.com/swimjiy/aws-upload

##### 2-2. Lightsail 인스턴스 SSH에 접속해서 레포 clone 받고 zip파일 만들기.

![](https://github.com/swimjiy/node_study/blob/main/4th/img_04.png?raw=true)

```bash
$ clone 하고 npm i 하고...
$ sudo zip -r aws-upload.zip ./*
```



##### 2-3 Lightsail에서 S3으로 파일 업로드하기

```bash
# 1. 업로드에 필요한 aws-cli 설치 + 설정
# https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/install-cliv2-linux.html
$ curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
$ sudo unzip awscliv2.zip
$ sudo ./aws/install
$ aws configure
AWS Access Key ID [None]: 키 아이디
AWS Secret Access Key [None]: 시크릿 액세스 아이디
Default region name [None]: ap-northeast-2
Default output format [None]: json

# 2. s3 버킷에 올리기
$ aws s3 cp "aws-upload.zip" s3://nodebirdtestbucket # 버킷명
```



#### 3. 람다 서비스 설정

##### 3-1. 생성 및 파일 업로드

함수 생성

![](https://github.com/swimjiy/node_study/blob/main/4th/img_05.png?raw=true)



함수 코드 > 우측 작업 드롭다운 > Amazon S3에서 파일 업로드

```
https://nodebirdtestbucket.s3.ap-northeast-2.amazonaws.com/aws-upload.zip
```



##### 3-2. 기본 설정 편집

근데 책이랑 좀 다름. 핸들러가 없음.

![](https://github.com/swimjiy/node_study/blob/main/4th/img_06.png?raw=true)



##### 3-3. 트리거 추가

s3에 이미지를 업로드 할 때마다 람다 함수 실행.

![](https://github.com/swimjiy/node_study/blob/main/4th/img_07.png?raw=true)



#### 4. Nodebird에서 람다 적용

```javascript
// routes/post.js
...
router.post('/img', isLoggedIn, uploads.single('img'), (req, res) => {
	console.log(req.file);
	// 기존 주소에서 original 폴더 부분을 thumb 폴더로 교체
	const originalUrl = req.file.location;
	const url = originalUrl.replace(/\/original\//, '/thumb/');
	res.json({ url, originalUrl });
});
...
```

```html
// views/main.html
<div class="twit-img">
  <img
    src="{{twit.img}}"
    alt="섬네일"
    <!-- 리사이징 이미지를 불러오는 데 실패하면 원본 이미지 사용 -->
    onerror="this.src = this.src.replace(/\/thumb\//, '/original/');"
  >
</div>

axios.post('/post/img', formData)
  .then((res) => {
    // 미리기 시에는 원본을 보여주고, 저장 후에 리사이징 이미지를 보여줌.
    document.getElementById('img-url').value = res.data.url;
    // 기존 코드: document.getElementById('img-preview').src = res.data.url;
    document.getElementById('img-preview').src = res.data.originalUrl;
    document.getElementById('img-preview').style.display = 'inline';
  })
  .catch((err) => {
    console.error(err);
  });
});
```



#### 결과

![](https://github.com/swimjiy/node_study/blob/main/4th/img_08.png?raw=true)



### 16.4 구글 클라우드 스토리지 사용하기

### 16.5 구글 클라우드 펑션스 사용하기