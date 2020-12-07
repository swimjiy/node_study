# 4장 http 모듈로 서버 만들기 🚀

### 4.1 요청과 응답 이해하기

서버는 클라이언트가 있기에 동작한다. 클라이언트로부터 요청(request)을 받으면, 읽고 처리한 뒤 응답(response)을 보낸다.

요청이 왔을 때 어떤 작업을 수행할 지 이벤트 리스너를 미리 등록해야 한다.



> **NOTE: localhost와 포트란?**
>
> localhost는 현재 컴퓨터의 내부 주소를 가리킨다. IP로는 127.0.0.1.
>
> 포트는 서버 내에서 프로세스를 구분하는 번호다. 
>
> 유명한 포트 번호 : 21(FTP), 80(HTTP), 443(HTTPS), 3306(MYSQL)
>
> 리눅스와 맥에서는 1024번 이하의 포트에 연결할 때 관리자 권한이 필요하므로 명령어 앞에 sudo를 붙여야 한다.



#### 기본 사용 방법 

```javascript
const http = require('http');

// 방법 1 (listen 메서드에 콜백 함수)
http.createServer((req, res) => { // param: 요청에 대한 콜백 함수
	res.writeHead(200, { 'Content-Type': 'text/html; charset=uft-8' });
  // writeHead: 응답에 대한 정보(헤더)를 기록하는 메서드
  
	res.write('<h1>Hello Node!</h1>');
  // write: 클라이언트로 보낼 데이터(body)를 기록하는 메서드
  
	res.end('<p>Hello Server!</p>')
  // end: 응답을 종료하는 메서드
})
	.listen(8080, () => {
  // listen: 클라이언트에 공개한 포트 번호 및 연결 완료 후 실행될 콜백 함수
		console.log('8080번 포트에서 서버 대기 중입니다!');
	})

// 방법 2 (listening 이벤트 리스너)
const server = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/html; charset=uft-8' });
	res.write('<h1>Hello Node!</h1>');
	res.end('<p>Hello Server!</p>')
})
server.listen(8080);
server.on('listening', () => {
	console.log('8080번 포트에서 서버 대기 중입니다!');
})
server.on('error', (err) => {
	console.error(err);
})

```



#### HTML 파일을 fs 모듈로 읽어오기

```javascript
const http = require('http');
const fs = require('fs').promises;

http.createServer(async (req, res) => {
	try {
		const data = await fs.readFile('./server2.html');
    // fs로 HTML 파일을 읽고, 버퍼를 클라이언트에 보낸다.
		res.writeHead(200, { 'Content-Type': 'text/html; charset=uft-8' });
		res.end(data);
	} catch (err) {
		console.log(err);
		res.writeHead(500, { 'Content-Type': 'plain; charset=uft-8' });
		res.end(err.message);
	} 
})
.listen(8081, () => {
	console.log('8081번 포트에서 서버 대기 중입니다!');
})

```



> **NOTE: HTTP 상태 코드**
>
> 브라우저는 서버에서 보내주는 상태 코드를 보고 요청이 성공했는지 실패했는지 판단한다.
>
> - 2XX : 성공을 알리는 상태 코드. 200(성공), 201(작성됨)
> - 3XX : 리다이렉션(다른 페이지로 이동)을 알리는 상태 코드. 301(영구 이동), 302(임시 이동), 304(수정되지 않음)
> - 4XX : 요청 오류. 400(잘못된 요청), 401(권한 없음), 403(금지됨), 404(찾을 수 없음)
> - 5XX : 서버 오류. writeHead로 직접 보내는 경우는 거의 없고, 예기치 못한 에러 발생 시 서버가 알아서 보낸다. 500(내부 서버 오류), 502(불량 게이트웨이), 503(서비스를 사용할 수 없음)



### 4.2 REST와 라우팅 사용하기

서버에 요청을 보낼 때 주소를 통해 요청의 내용을 표현한다. 그러므로 서버가 이해하기 쉬운 주소를 사용하는 것이 좋다 = REST

#### REST란

REpresentational State Transfer의 줄임말.

서버의 자원을 정의하고 자원에 대한 주소를 지정하는 방법 또는 약속.

주소의 의미를 명확히 전달하기 위해 명사로 구성된다. (`/user`, `/post`)



#### HTTP 요청 메서드

주소 외에 HTTP 요청 메서드를 사용.

| HTTP 요청 메서드 종류 | 설명                                                         |
| --------------------- | ------------------------------------------------------------ |
| `GET`                 | 서버 자원을 가져오고자 할 때 사용.<br />요청의 본문에 데이터를 넣지 않는다.<br />데이터를 서버로 보내야 한다면 쿼리스트링을 사용. |
| `POST`                | 서버에 자원을 새로 등록하고자 할 때 사용<br />요청의 본문에 새로 등록한 데이터를 넣어 보냄. |
| `PUT`                 | 서버의 자원을 요청에 들어 있는 자원으로 치환할 때 사용.<br />요청의 본문에 치환할 데이터를 넣어 보냄. |
| `PATCH`               | 서버 자원의 일부만 수정하고자 할 때 사용<br />요청의 본문에 일부 수정할 데이터를 넣어 보냄. |
| `DELETE`              | 서버의 자원을 삭제하고자 할 때 사용.<br />요청의 본문에 데이터를 넣지 않는다. |
| `OPTIONS`             | 요청을 하기 전에 통신 옵션을 설명하기 위해 사용.             |



#### REST의 장점

- 주소와 메서드만 보고 요청의 내용을 알아볼 수 있다.
- GET의 경우 브라우저에서 캐싱이 가능하여 성능 향상도 기대.
- 클라이언트가 누구든 상관 없이 같은 방식으로 서버와 소통할 수 있다. 
- 서버와 클라이언트가 분리되어 있으므로 추후 서버를 확장할 때 클라이언트에 구애받지 않는다.



#### RESTful한 웹 서버 만들기

> RESTful : REST를 따르는 서버를 일컫는 말



```javascript
const http = require('http');
const fs = require('fs').promises;

const users = {}; // 데이터 저장용

http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET') {
      if (req.url === '/') {
        const data = await fs.readFile('./restFront.html');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(data);
      } else if (req.url === '/about') {
        const data = await fs.readFile('./about.html');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(data);
      } else if (req.url === '/users') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(users));
      }
      // /도 /about도 /users도 아니면
      try {
        const data = await fs.readFile(`.${req.url}`);
        return res.end(data);
      } catch (err) {
        // 주소에 해당하는 라우트를 못 찾았다는 404 Not Found error 발생
      }
    } else if (req.method === 'POST') {
      if (req.url === '/user') {
        let body = '';
        // 요청의 body를 stream 형식으로 받음
        req.on('data', (data) => {
          body += data;
        });
        // 요청의 body를 다 받은 후 실행됨
        return req.on('end', () => {
          console.log('POST 본문(Body):', body);
          const { name } = JSON.parse(body);
          const id = Date.now();
          users[id] = name;
          res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('ok');
        });
      }
    } else if (req.method === 'PUT') {
      if (req.url.startsWith('/user/')) {
        const key = req.url.split('/')[2];
        let body = '';
        req.on('data', (data) => {
          body += data;
        });
        return req.on('end', () => {
          console.log('PUT 본문(Body):', body);
          users[key] = JSON.parse(body).name;
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('ok');
        });
      }
    } else if (req.method === 'DELETE') {
      if (req.url.startsWith('/user/')) {
        const key = req.url.split('/')[2];
        delete users[key];
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('ok');
      }
    }
    res.writeHead(404);
    return res.end('NOT FOUND');
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.message);
  }
})
  .listen(8082, () => {
    console.log('8082번 포트에서 서버 대기 중입니다');
  });

```



> **NOTE: res.end 앞에 return을 붙이는 이유**
>
> 노드도 일반적으로 자바스크립트 문법을 따르므로 return을 붙이지 않는 한 함수가 종료되지 않는다.
>
> return을 붙이지 않아서 res.end 같은 메서드가 여러 번 실행된다면 에러 발생.



### 4.3 쿠키와 세션 이해하기



### 4.4 https와 http2



### 4.5 cluster



### 4.6 함께 보면 좋은 자료