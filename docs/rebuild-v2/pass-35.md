# Rebuild V2 · Pass 35

## 결과

- 실행 버전: `rebuild-v2-pass35`
- 기준 커밋: `46066d9`
- 범위: 6구역 거대 곡선과 역방향 대시 회랑만
- 충돌 변경: `0`
- 장면: `6`
- 런타임 자산: `10`개 (`8`개 신규, `2`개 공유)
- 정적 정의: `50/50`
- 런타임 감사: `70/70`

## 요청 반영

### 패럴랙스와 명암

카메라가 가로로 100px 이동할 때 원경은 `6px`, 중간 깊이는 `17px`, 주요 구조물은 `45~49px`, 전경은 `107px` 움직인다. 집중 검사에서도 원경·전경 변위가 `6px / 107px`로 측정됐다.

네 명암층은 깊은 청흑색 그림자, 차가운 청록 중간톤, 얇은 청록 반사광, 제한된 주황 용광로 강조광으로 분리했다. 12개 대표 카메라의 최소 캐릭터 대비는 `7.34:1`, 평면 임시색 최대 비율은 `3.67%`였다.

### 끊기지 않는 구조물

거대 곡선실과 다섯 회랑의 수직 받침은 모두 이미지 마지막 행을 관통한다.

- 원본 하단 불투명 범위: `41.6~62.3%`
- 실제 배치 최소 하단: `816px`
- 화면 높이: `680px`

따라서 가장 낮은 곡선 착지 화면에서도 교각의 발이나 잘린 끝이 보이지 않는다.

### 대시 간격

세 회랑의 250~260px 간격은 그대로 유지했다. 물리 바닥을 연장하지 않고 각 간격 양쪽에 서로 다른 파손 교각 이미지만 추가했다.

- 동쪽: 황동 아치형 파손면
- 중앙: 기어·파이프형 파손면
- 서쪽: X자 석재 보강형 파손면

전체 검사에서 세 간격 모두 실제 점프와 공중 대시로 통과했다.

## 장면 구성

1. `giant_curve_chamber`: 상부 진입, 수직 낙하, 하부 왼쪽 반전
2. `east_dash_vault`: 곡선 착지와 첫 대시 간격
3. `middle_dash_vault`: 동쪽 파도 지형과 두 번째 간격
4. `west_dash_vault`: 중앙 파도 지형과 세 번째 간격
5. `wave_gallery`: 긴 상하 파도형 교량
6. `exit_vault`: 왼쪽 상승 출구와 다음 구역 연결

34차와의 진입은 카메라 높이 3900~4250px에서 혼합한다. 내부 장면은 다섯 개의 180px 교차 혼합으로 연결한다.

## 생성 자산과 최종 프롬프트

기본 제공 `imagegen` 모드를 사용했다. 투명 구조물은 `#ff00ff` 크로마 배경으로 생성한 뒤 soft matte와 despill로 알파를 추출했다. 모든 프롬프트에는 현재의 사실적 고밀도 스타일을 40차까지 유지하고, 캐릭터·UI·문자·워터마크를 넣지 않는 조건을 공통으로 적용했다.

### `dash-far.webp`

```text
Very wide ruined Gothic-industrial underground city behind a huge clockwise plunge chamber and long leftward dash corridor. Realistic painterly high detail, wet dark stone, oxidized brass, teal atmospheric depth, sparse amber furnace lamps and four value planes. Distant-only plate with no playable floor, character, UI, text, logo or watermark.
```

### `curve-chamber.png`

```text
Transparent-ready monumental side-view plunge chamber framing a short upper ledge, near-vertical right turning descent and broad lower landing curving left. Massive crescent stone-and-brass track, gears, chains, arches and buttresses. Every pier continues through the bottom edge. Perfectly flat #ff00ff background; no character, UI, text, logo or watermark.
```

### `east-dash-vault.png`

```text
Transparent-ready wide Gothic-industrial sprint vault with a descending-then-rising bridge and one clear broken dash gap. Arches, gears, pipes and chains; all piers cross the bottom edge. Realistic dark stone, oxidized brass, teal midtones and amber lamps on perfectly flat #ff00ff.
```

### `middle-dash-vault.png`

```text
Transparent-ready very wide ruined gallery with a wave-shaped bridge and central broken dash gap, flying buttresses, huge gears and suspended machinery. Keep the route open; all towers and piers extend through the bottom edge. Realistic high detail on perfectly flat #ff00ff.
```

### `west-dash-vault.png`

```text
Transparent-ready wide leftward sprint corridor with a rising wave bridge and broken dash gap near the right side. Layered arches, counterweights, pipes and chains; every structural leg continues through the bottom edge. Realistic high detail on perfectly flat #ff00ff.
```

### `wave-gallery.png`

```text
Transparent-ready very wide Gothic-industrial gallery with a playable deck undulating down, up, down and up. Pointed arches, broken railings, gears, roots and pipes; all piers cross the bottom boundary. Dark wet stone, aged brass, teal edge light and restrained amber lamps on perfectly flat #ff00ff.
```

### `exit-vault.png`

```text
Transparent-ready ruined left exit corridor with a gentle rise toward the left, monumental arches, mechanical towers and an open handoff doorway. Every support continues through the bottom edge. Realistic dark stone and oxidized brass on perfectly flat #ff00ff.
```

### `dash-gap-ends.png`

```text
Transparent-ready sprite sheet containing three separated pairs of broken Gothic-industrial bridge ends: X-braced stone, gear-and-pipe machinery and pointed-arch brass truss. Six isolated inward-facing pieces with large gaps, crisp edges and perfectly flat #ff00ff background.
```

원본은 `docs/rebuild-v2/assets/pass35-source/`, 런타임 자산은 `assets/v2/pass35/`에 저장했다. `foreground-frame.png`과 `route-stone.png`은 승인된 33차·31차 자산을 공유한다.

## 집중 브라우저 검사

- 대표 카메라: `12`개, 장면: `6`개
- 자산 로드: `10/10`
- 최소 대비: `7.3420:1`
- 최대 평면 플레이스홀더: `0.03668`
- 이음선: `0`
- 전경 가림: `0`
- 원경/전경 100px 변위: `6px / 107px`
- 최소 구조 배치 하단: `816px`
- 결과: `pass-35-focused-results.json`

좌표 변경은 화면 검사 전용이며 전체 이동 통과 주장에는 사용하지 않는다.

## 전체 실제 키보드 검사

- 입력: `KeyA`, `KeyB`, `KeyD`, `KeyE`, `KeyF`, `ShiftLeft`, `Space`
- 좌표 도우미: 사용하지 않음
- 거대 곡선 방향 전환: `1/1`
- 대시 간격: `3/3`
- 완료 프레임: `21,940`
- 최종 프레임: `22,004`
- 최종 위치: `(24267.18, 12045.58)`
- 최종 바닥: `pass23_exit_slope`
- 리셋·붕괴석 접촉·콘솔/페이지 오류: 모두 `0`
- 결과: `pass-35-browser-results.json`

## 40차 이후 화면 보정

35~40차에서도 현재 사실적 고밀도 스타일을 유지한다. 40차 전체 통합과 사이트 자동 실행 검증이 끝난 뒤 먼 배경의 미세 흐림, 재질·형태 단순화, 캐릭터와 환경의 윤곽·채도·명암 통합을 전 구역에 한 번에 적용한다.

## 증거 화면

- `assets/pass35-curve-entry.png`
- `assets/pass35-curve-landing.png`
- `assets/pass35-east-gap.png`
- `assets/pass35-middle-gap.png`
- `assets/pass35-west-gap.png`
- `assets/pass35-wave-gallery.png`
- `assets/pass35-exit-vault.png`
- `assets/pass35-blueprint.png`
- `assets/pass35-exit.png`

## 다음 범위

36차는 다음 내부 하강·이중벽 추격 구간을 같은 패럴랙스·명암·하단 연속 기준으로 교체한다.
