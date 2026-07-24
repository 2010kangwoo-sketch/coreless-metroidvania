# Rebuild V2 · Pass 36

## 결과

- 실행 버전: `rebuild-v2-pass36`
- 기준 커밋: `8bc6f6a`
- 범위: 첫 내부 하강과 이중 벽 추격 구간만
- 충돌 변경: `0`
- 장면: `9`
- 런타임 자산: `9`개 (`7`개 신규, `2`개 공유)
- 정적 정의: `46/46`
- 런타임 감사: `75/75`

## 시각 품질 반영

기존 9·10차 회색 블록을 고밀도 고딕 산업 지하 성당 아트로 교체했다. 내부 진입, 상단 회랑, 중앙 U턴, 하단 물결 회랑, 출구 상승, 벽 샤프트 2개, 하부 추격 회랑, 최종 출구를 별도 카메라 장면으로 분리했다. 두 샤프트는 첫 번째의 온전한 기계식 벽과 두 번째의 파손·심연광 벽으로 구분해 반복 복사처럼 보이지 않게 했다.

카메라가 가로로 100px 이동할 때 원경은 `5px`, 중간 깊이는 `16px`, 주요 구조물은 `46~50px`, 전경은 `108px` 움직인다. 집중 검사에서 원경·전경 변위는 정확히 `5px / 108px`였다.

명암은 네 층으로 분리했다.

1. 심연의 거의 검은 그림자
2. 청흑색 석재와 산화 금속 중간톤
3. 샤프트 아래에서 올라오는 청록 반사광
4. 제한된 주황 정비등

15개 대표 화면의 최소 플레이어 대비는 `6.7646:1`, 평면 임시색 최대 비율은 `0.416%`, 크로마키 누출은 `0`이었다.

## 끊기지 않는 구조물

내부 회랑, 두 샤프트, 하부 회랑, 출구 상승부의 모든 주요 기둥과 교각을 이미지 하단 밖까지 연장했다.

- 원본 하단 불투명 범위: `36.4~80.6%`
- 실제 배치 최소 하단: `843px`
- 화면 높이: `680px`

따라서 구조물 다리나 벽 받침의 끝이 화면 안에서 보이지 않는다. 실제 벽 점프 충돌 4면에는 공유 석재 래스터 면을 정확히 덧씌워, 벽 그래픽과 물리 면이 따로 노는 문제도 막았다.

## 장면 구성

1. `internal_entry`: 35차 출구와 내부 하강 진입
2. `upper_gallery`: 오른쪽으로 내려가는 상단 회랑
3. `middle_return`: 첫 낙하 뒤 왼쪽 U턴
4. `lower_wave`: 두 번째 낙하 뒤 물결 회랑
5. `internal_exit`: 이중 벽 구간으로 오르는 출구
6. `shaft_one`: 첫 강제 벽 점프 샤프트
7. `shaft_two`: 더 깊고 파손된 두 번째 샤프트
8. `lower_hall`: 낮은 천장의 추격 회랑
9. `exit_rise`: 우측 회복 선반으로 오르는 출구

내부 하강의 세 세로 전환에는 X범위를, 이후 다섯 가로 전환에는 Y범위를 함께 지정했다. 이 조건은 멀리 떨어진 장면에 잘못된 교차 페이드가 적용되어 회색 지형이 다시 보이는 문제를 시각 검사에서 발견한 뒤 추가했다.

## 생성 자산과 최종 프롬프트

기본 제공 `imagegen` 모드를 사용했다. 투명 구조물은 완전 평면 `#ff00ff` 배경으로 생성하고 soft matte와 despill로 알파를 추출했다. 원본은 `docs/rebuild-v2/assets/pass36-source/`, 런타임 자산은 `assets/v2/pass36/`에 저장했다.

### `internal-far.webp`

```text
Vast buried Gothic-industrial cathedral interior descending underground; enormous shadowy nave, pointed arches, distant bridges, ribbed iron buttresses, pipes, chains and tiny warm lamps. Rich realistic dark-fantasy environment concept art with four depth planes, blue-green mist and sparse amber accents. Wide opaque far background with no playable platform, character, UI, text, logo or watermark.
```

### `internal-descent.png`

```text
Transparent-ready buried Gothic-industrial first internal descent with three stacked traversable galleries, right-side first drop, middle return and lower landing. Full-width ruined stone-and-oxidized-bronze vault, pointed arches, pipes, chains, railings and lamps. All load-bearing columns extend through the bottom edge. Perfectly flat #ff00ff background; no character, text, UI or watermark.
```

### `internal-lower.png`

```text
Transparent-ready lower return gallery undulating across three wave segments and climbing steeply at right into a fortified exit vault. Heavy ribs, railings, gears, pipes and dense arches; every support crosses the bottom edge. Cool teal rim light and restrained amber lamps on perfectly flat #ff00ff.
```

### `shaft-one.png`

```text
Transparent-ready first forced double-wall descent shaft: massive ribbed left wall and broken right wall forming a narrow vertical wall-jump chamber, upper entry slope, lower pit and right exit lip. Ornate Gothic-industrial masonry, bronze braces, chains, gears and fracture scars. Both walls continue through the bottom edge on perfectly flat #ff00ff.
```

### `shaft-two.png`

```text
Transparent-ready deeper second double-wall shaft, visibly more damaged than the first: forked left wall, arched right wall, deep pit, broad exit lip, torn bronze ribs, pipes and fractured masonry. Strong cyan abyss up-light and sparse amber lamps. Structural legs cross the bottom edge on perfectly flat #ff00ff.
```

### `lower-hall.png`

```text
Transparent-ready long low-ceiling Gothic-industrial chase hall with oppressive split arches, huge oxidized pipes, turbines, chains, collapsed masonry and maintenance lamps. Continuous lower bridge trusses and all support legs extend beyond the bottom edge. Wide side-on plate on perfectly flat #ff00ff.
```

### `exit-rise.png`

```text
Transparent-ready chase exit hall changing from a ruined low corridor into a sweeping reinforced stone-and-bronze rise and broad right recovery shelf. Pointed arches, pipes, turbines, chains and railings; understructure forms continuous columns through the bottom edge. Blue-green edge light and amber lamps on perfectly flat #ff00ff.
```

`foreground-frame.png`과 `route-stone.png`은 승인된 33차·31차 자산을 공유한다.

## 집중 브라우저 검사

- 대표 카메라: `15`개, 장면: `9`개
- 자산 로드: `9/9`
- 최소 대비: `6.7646:1`
- 최대 평면 플레이스홀더: `0.004164`
- 크로마키 누출: `0`
- 원경/전경 100px 변위: `5px / 108px`
- 최소 구조 배치 하단: `843px`
- 결과: `pass-36-focused-results.json`

좌표 배치는 화면 검사 전용이며 전체 이동 통과 주장에는 사용하지 않는다.

## 전체 실제 키보드 검사

- 입력: `KeyA`, `KeyB`, `KeyD`, `KeyE`, `KeyF`, `ShiftLeft`, `Space`
- 좌표 도우미: 사용하지 않음
- 내부 하강: `2/2`
- 이중 벽 샤프트: `2/2`
- 최종 프레임: `21,992`
- 최종 위치: `(24256.10, 12046.69)`
- 최종 바닥: `pass23_exit_slope`
- 리셋·붕괴석 접촉·콘솔/페이지 오류: 모두 `0`
- 결과: `pass-36-browser-results.json`

## 40차 이후 화면 보정

36~40차에서도 현재 사실적 고밀도 스타일을 유지한다. 40차 통합과 사이트 자동 실행 검증이 끝난 뒤 먼 배경의 미세 흐림, 형태 단순화, 캐릭터와 환경의 윤곽·채도·명암 통합을 전 구역에 한 번에 적용한다.

## 증거 화면

- `assets/pass36-internal-entry.png`
- `assets/pass36-lower-wave.png`
- `assets/pass36-shaft-one.png`
- `assets/pass36-shaft-two.png`
- `assets/pass36-lower-hall.png`
- `assets/pass36-exit-shelf.png`
- `assets/pass36-blueprint.png`
- `assets/pass36-exit.png`

## 다음 범위

37차는 세 집게 추격실과 공중 대시 가시 회랑을 같은 패럴랙스·명암·하단 연속 기준으로 교체한다.
