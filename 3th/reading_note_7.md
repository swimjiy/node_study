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
  -> create_at DATETIME NOT NULL DEFAULT now(),
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
  -> create_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

