# Coreless Rebuild V2 — Pass 01

## 목적

rebuild/mega-room-40pass 브랜치의 활성 제작선을 1차부터 다시 시작한다. 이전 08C 결과는 Git 기록과 기준 SHA로 보존하되, 새 실행 페이지에서는 불러오지 않는다.

- 이전 기준 SHA: f57ea9eeb878c03a61aadf0801be53be3afa562e
- 작업 브랜치: rebuild/mega-room-40pass
- Draft PR: #1
- 새 실행 버전: rebuild-v2-pass01

## 이전 08C 실행 확인

기존 브랜치 파일을 그대로 복원한 뒤 Chromium에서 실행했다.

- 페이지 제목: Coreless · Rebuild 40-pass 08C
- F8 입력 전: PASS 07 · 14/14
- 실제 F8 입력 후: PASS 08C · 18/18
- 실제 입력: D, Space, Shift
- Canvas: 1200×680
- 콘솔 오류: 0건
- 페이지 오류: 0건

### 확인된 문제

1. 활성 실행 코드가 압축 payload와 eval에 의존해 이후 차수의 구조를 읽고 수정하기 어렵다.
2. 1~7차와 8차가 서로 다른 압축 실행본으로 분리되어 있다.
3. F8 디버그 진입을 기준으로 8차가 활성화되어 일반 플레이 진입 구조와 다르다.
4. 큰 설명 패널과 디버그 HUD가 게임 화면을 가린다.
5. 현재 08C의 네 개 수평 레인 구조는 새 10구역 초대형 맵 설계와 맞지 않는다.

## 이번 차수 변경

- 활성 페이지를 src/v2/main.js 모듈 진입점으로 교체했다.
- 새 실행 코드를 압축하지 않고 읽을 수 있는 JavaScript 모듈로 분리했다.
- 1200×680 Canvas와 전체 화면 중심의 최소 UI를 구성했다.
- 10개 구역의 순서만 설정하고 실제 좌표는 2차로 남겼다.
- 이전 08C와 pass07 payload는 삭제하지 않고 활성 페이지에서만 제외했다.
- 실제 입력 이벤트를 확인할 수 있는 입력 probe를 추가했다.
- 단일 애니메이션 루프와 구조 감사 API를 추가했다.

## 실제 Chromium 키보드 검사

- Canvas 포커스: 성공
- 실제 입력: D, Space, Shift, A, R
- keydown: 5회
- keyup: 5회
- 기록된 코드: KeyA, KeyD, KeyR, ShiftLeft, Space
- 콘솔 오류: 0건
- 페이지 오류: 0건

## 결정적 검사

- 페이지 제목: 통과
- Canvas 1200×680: 통과
- Canvas 포커스: 통과
- 구조 감사 10/10: 통과
- 애니메이션 루프 작동: 통과
- 실제 키 입력 기록: 통과
- 기존 08C 전역 상태 미생성: 통과
- 콘솔·페이지 오류 없음: 통과

## GitHub Actions 확인

- Rebuild V2 Browser Verify: 성공
- 실행 기록: https://github.com/2010kangwoo-sketch/coreless-metroidvania/actions/runs/29191006228
- 기존 Pass 08 Browser Verify는 index.html 변경으로 함께 실행된 뒤 실패했다.
- 실패 원인은 새 실행본에 F8·pass08 전역 상태가 존재하지 않는데도 구형 검증기가 이를 계속 요구했기 때문이다.
- 새 코드의 실행 오류가 아니며, 구형 08C 워크플로를 활성 제작선에서 제거했다.

## 스크린샷

- docs/rebuild-v2/assets/pass01-current-08c.png
- docs/rebuild-v2/assets/pass01-foundation.png

## 아직 남은 한계

- 이번 차수는 새 실행 기반만 만든 차수다.
- 플레이어 이동 물리는 아직 구현하지 않았다.
- 10개 구역의 실제 좌표와 전체 경로는 아직 만들지 않았다.
- 키 입력이 기록되는 것만 확인했으며, 이동 완주를 주장하지 않는다.
- 2차에서 참고 설계도를 실제 좌표·고도·카메라 경계로 변환해야 한다.
