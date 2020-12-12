const http = require('http');

// 방법 1 (listen 메서드에 콜백 함수)
http.createServer((req, res) => { // param: 요청에 대한 콜백 함수
	res.writeHead(200, { 'Content-Type': 'text/html; charset=uft-8' }); // writeHead: 응답에 대한 정보(헤더)를 기록하는 메서드
	res.write('<h1>Hello Node!</h1>'); // write: 클라이언트로 보낼 데이터(body)를 기록하는 메서드
	res.end('<p>Hello Server!</p>') // end: 응답을 종료하는 메서드
})
	.listen(8080, () => { // listen: 클라이언트에 공개한 포트 번호 및 연결 완료 후 실행될 콜백 함수
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
