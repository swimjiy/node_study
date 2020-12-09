# 5장 패키지 매니저 🚀

### 5.1 npm 알아보기

**Node Package Manager**의 약어.

노드가 자바스크립트 프로그램을 컴퓨터에서도 실행할 수 있게 해주는데, 이렇게 만들어진 프로그램들은 **패키지**라는 이름으로 npm에 등록되어 있다.

#### 패키지

npm에 업로드된 노드 모듈. 패키지가 다른 패키지를 사용하는 의존 관계가 가능.



### 5.2 package.json으로 패키지 관리하기

#### package.json

패키지의 버전을 관리하는 파일. 노드 프로젝트를 시작하기 전에는 무조건 만들어야 한다.

`npm init` 으로 추가.



##### npm init 명령어

| 명령어 종류      | 설명                                                         |
| ---------------- | ------------------------------------------------------------ |
| `package name`   | 패키지의 이름. `package.json` 의 `name` 속성에 저장.         |
| `version`        | 패키지의 버전.                                               |
| `entry point`    | 자바스크립트 실행 파일 진입점.<br />보통 마지막으로 `module.export` 를 하는 파일을 지정 (`index.js` 등)<br />`package.json` 의 `main` 속성에 저장. |
| `test command`   | 코드를 테스트할 때 입력할 명령어. <br />`package.json` 의 `script` 속성 안의 `test` 속성에 저장. |
| `git repository` | 코드를 저장해둔 git 저장소 주소. `package.json` 의 `repository` 속성에 저장. |
| `keywords`       | npm 공식 홈페이지에서 패키지를 쉽게 찾을 수 있도록 돕는다.<br />`package.json` 의 `keyword` 속성에 저장. |
| `license`        | 해당 패키지의 라이선스.                                      |



> **NOTE: 라이선스**
>
> ISC, MIT, BSD : 사용한 패키지와 라이선스만 밝히면 자유롭게 사용 가능.
>
> 아파치 : 사용은 자유롭지만 특허권에 대한 제한이 포함.
>
> GPL : 자신의 패키지도 GPL로 배포하고 소스 코드도 공개해야 함.



##### package.json 예시

```json
{
  "name": "nodebird",
  "version": "0.0.1",
  "description": "익스프레스로 만드는 SNS 서비스",
  "main": "server.js",
  "scripts": {
    "start": "cross-env NODE_ENV=production PORT=80 pm2 start server.js -i 0",
    "dev": "nodemon server",
    "test": "jest"
  },
  "author": "ZeroCho",
  "license": "MIT",
}
```



#### package.json scripts

npm 명령어를 저장하는 부분. 콘솔에서 npm run [스크립트 명령어] 를 입력하여 사용.

start나 test같은 스크립트는 run을 붙이지 않아도 실행된다.



> **NOTE: npm 설치 시 메시지**
>
> WARN : ERROR가 진짜 에러고 WARN은 단순한 경고.
>
> audited [숫자] packages : 패키지에 있을 수 있는 취약점을 자동으로 검사했다는 의미.
>
> npm audit으로 취약점을 검사할 수 있고 npm audit fix을 입력하면 npm이 수정 가능한 취약점을 스스로 수정한다.



#### npm 설치하기

##### 일반 패키지

`npm install [패키지] [...]` 으로 설치.

 `--save` 옵션은 npm@5부터 기본값으로 설정.

##### 개발용 패키지

 `npm install --save-dev [패키지] [...]` 으로 설치

##### 전역 설치

`npm install --global [패키지] [...]` 로 설치.

리눅스와 맥의 경우 관리자 권한이 필요하므로 앞에 `sudo`를 붙인다.

##### npx 설치

전역 설치한 패키지는 package.json에 기록되지 않아 버전 관리가 힘들다.

이를 해결하기 위해 npx를 사용하여 전역 설치와 같은 효과를 얻을 수 있다.

```bash
$ npm install --save-dev rimraf // 모듈을 devDependencies에 기록
$ npx rimraf node_modules // npx 명령어를 붙여 실행
```



> NOTE: 줄여쓰기
>
> npm install -> npm i
>
> --save-dev -> -D
>
> --global -> -g



### 5.3 패키지 버전 이해하기

모든 노드 패키지의 버전은 SemVer 방식의 버전 넘버링을 따라 세 자리로 이루어져 있다.

#### SemVer

Semantic Versioning(유의적 버전)의 약어.

새 버전을 배포한 후에는 그 버전의 내용을 절대 수정하면 안된다.

- 첫 번째 : major. 0은 초기 개발 중이며 1부터 정식 버전. 하위 호환이 되지 않는 변경.
- 두 번째 : minor. 하위 호환이 되는 기능 업데이트.
- 세 번째 : patch. 기존 기능에 문제가 있어 수정했을 경우.

<img src="https://blog.kakaocdn.net/dn/qNMai/btqB0fNikDh/jPobL7lF5O4Xc5NOHOUUKK/img.png" style="zoom:50%;" />



#### package.json 버전 문자

- `^` : minor 버전까지만 설치하거나 업데이트한다.
- `~` : patch 버전까지만 설치하거나 업데이트한다.
- `>, <, >=, <=, =` : 버전을 비교하여 설치하거나 업데이트한다. `npm i express@>1.1.1` 형태로 사용.
- `@latest` : 안정된 최신 버전의 패키지를 설치. `x` 로도 표현. `npm i express@latest === npm i express@x`
- `@next` : 가장 최근 배포판을 사용. 안정되지 않은 알파나 베다 패키지도 설치 가능.





### 5.4 기타 npm 명령어

| 명령어                                   | 설명                                                         |
| ---------------------------------------- | ------------------------------------------------------------ |
| `npm outdated`                           | 업데이트할 수 있는 패키지 확인                               |
| `npm update [패키지명]  `                | 패키지 업데이트. outdated에서 wanted에 적인 버전으로 업데이트한다. |
| `npm uninstall [패키지명]`               | 해당 패키지 제거. `npm rm [패키지명]` 과 동일.               |
| `npm search [검색어]`                    | npm 패키지 검색                                              |
| `npm info [패키지명]`                    | 패키지의 세부 정보 파악. 의존 관계, 설치 가능한 버전 정보 등 표시. |
| `npm adduser`                            | npm 계정 로그인을 위한 명령어. 패키지를 배포할 때 필요.      |
| `npm whoami`                             | 로그인한 사용자 표시                                         |
| `npm logout`                             | 로그인한 계정 로그아웃                                       |
| `npm version [버전]`                     | `package.json` 의 버전을 올린다. <br />ex) ` npm version 5.3.2, npm version minor` |
| `npm deprecate [패키지명][버전][메시지]` | 해당 패키지를 설치할 때 경고 메시지를 출력. 자신의 패키지에만 사용 가능. |
| `npm publish`                            | 자신이 만든 패키지를 배포.                                   |
| `npm unpublish`                          | 배포한 패키지를 제거.                                        |
| `npm ci`                                 | `package.json` 대신 `package-lock.json` 에 기반하여 엄격하게 설치. |



### 5.5 패키지 배포하기

1. npm 웹사이트에서 회원가입 후 `npm adduser` 로 로그인.
2. `npm publish` 로 배포. 이 때 package.json `name` 은 고유해야 한다.
3. `npm info [패키지명]` 으로 배포가 성공했는지 확인한다.
4. 삭제는 `npm unpublish [패키지명] --force` 이며  72시간이 지나면 삭제할 수 없다.