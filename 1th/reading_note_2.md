# 2장 알아두어야 할 자바스크립트 🚀

### 2.1 ES2015+

#### 2.1.1 const, let

const, let : 이전 var와 스코프 종류가 다름. var는 함수 스코프를 가지므로 블록과 관계없이 접근할 수 있지만, const와 let은 블록 스코프라 블록 밖에서는 변수에 접근할 수 없다.

블록의 범위는 if, while, for, function 등에서 볼 수 있는 중괄호. 

블록 스코프를 사용함으로서 호이스팅 문제 해결.



#### 2.1.2 템플릿 문자열

백틱(`)으로 감싸는 문자열. 문자열 안에 변수를 넣을 수 있다.



#### 2.1.3 객체 리터럴

- 객체의 메서드에 함수를 연결할 때 콜론(:)과 function을 붙이지 않아도 된다.
- sayNode: sayNode 처럼 속성명과 변수명이 동일한 경우에는 한 번만 써도 되게 변경.
- 객체의 속성명을 동적으로 생성할 수 있다.



#### 2.1.4 화살표 함수

function 선언 대신 ⇒ 기호를 사용한다.

내부에 return문 밖에 없는 경우 return문을 줄일 수 있다.

매개 변수가 한 개면 매개변수를 소괄호로 묶어주지 않아도 된다.

this를 사용할 경우 상위 스코프의 this를 그대로 물려받을 수 있다.



#### 2.1.5 구조분해 할당

객체와 배열로부터 속성이나 요소를 쉽게 꺼낼 수 있다.

특히 노드에서는 모듈 시스템을 사용하므로 자주 사용.



#### 2.1.6 클래스

클래스 기반으로 동작하는 다른 언어들과 달리 여전히 프로토타입 기반으로 동작하지만 클래스처럼 보이게.

extends 를 이용하면서 상속받기 위한 코드가 간략해짐.



#### 2.1.7 프로미스

API들이 콜백 대신 프로미스 기반으로 재구성되며, 콜백 지옥 현상을 극복함.

프로미스 객체를 생성하고, then이나 catch를 통해 결괏값을 받는다.



#### 2.1.8 async, await

노드 7.6,  ES2017에 추가된 기능. 

then과 catch가 계속 반복되는 프로미스를 한 번 더 깔끔하게 줄일 수 있다.

```javascript
// promise
function findAndSaveUser(Users) {
	Users.findOne({})
		.then((user) => {
			user.name = 'zero';
			return user.save();
		})
		.then((user) => {
			return Users.findOne({ gender: 'm' });
		})
		.then((user) => {
			// 생략
		})
		.catch(err => {
			console.error(err);
		});
}

// async await
const findAndSaveUser = async (Users) => {
	try {
		let user = await Users.findOne({});
		user.name = 'zero';
		user = await user.save(); // 이전 프로미스가 resolve될 때까지 기다린 뒤 실행한다.
		user = await Users.findOne({ gender: 'm' });
		// 생략
	} catch (err) {
		console.error(err);
	}
}
```



### 2.2 프런트엔드 자바스크립트

#### 2.2.1 AJAX

비동기적 웹 서비스를 개발할 때 사용하는 기법.

페이지 이동 없이 서버에 요청을 보내고 응답을 받는 기술.

브라우저에서 기본적으로 XMLHttpRequest 객체를 제공하지만 서버에서는 사용할 수 없으므로 jQuery나 axios 같은 라이브러리를 이용한다. 

```javascript
// promise
axios.get('https://www.zerocho.com/api/get')
	.then((result) => {
		console.log(result);
		console.log(result.data); // {}
	})
	.catch((err) => {
		console.error(err);
	});

// async, await
(async () => {
	try {
		const result = await axios.get('https://www.zerocho.com/api/get');
		console.log(result);
		console.log(result.data); // {}
	} catch (err) {
		console.error(err);
	};
})();
```



#### 2.2.2 FormData

HTML form 태그의 데이터를 동적으로 제어할 수 있는 기능. 주로 AJAX와 함께 사용

```javascript
// async, await
(async () => {
	try {
		const formData = new FormData();
		formData.append('name', 'zerocho');
		formData.append('birth', 1994);
		const result = await axios.post('https://www.zerocho.com/api/get', formData);
		console.log(result);
		console.log(result.data);
	} catch (err) {
		console.error(err);
	};
})();
```



#### 2.2.3 encodeURIComponent, decodeURIComponent

주소에 한글이 들어가는 경우 사용. 한글 부분만 encodeURIComponent 메서드로 감싼다.

받는 쪽에서는 decodeURIComponent를 사용한다.



#### 2.2.4 데이터 속성과 dataset

데이터 속성 : HTML과 관련된 데이터를 저장하는 공식적인 방법. 

장점 : 자바스크립트로 쉽게 접근할 수 있다.

반대로 dataset에 데이터를 넣어도 HTML태그에 반영된다.
