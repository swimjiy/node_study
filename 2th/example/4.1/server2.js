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
