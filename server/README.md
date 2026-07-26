# Coreless 계정·클라우드 저장 서버

현재 게임은 서버 없이 게스트로 실행되며 브라우저에 저장한다. 최종 사이트
주소가 정해지면 `.env.example`을 `.env`로 복사하고 PostgreSQL과 네 OAuth
공급자를 연결한다. `.env`는 GitHub나 채팅에 올리지 않는다.

1. `sql/001_auth_and_saves.sql`을 데이터베이스에 적용한다.
2. `npm ci`를 실행한다.
3. `.env`의 주소, 데이터베이스, 공급자 값을 채운다.
4. `npm start`를 실행한다.

게임 저장은 revision을 사용한다. 다른 기기의 새 저장이 있으면 서버는
`409 save-conflict`를 반환하며, 클라이언트가 어느 기록을 사용할지 묻는다.
