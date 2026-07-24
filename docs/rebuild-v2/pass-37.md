# Rebuild V2 · Pass 37

## 결과

- 실행 버전: `rebuild-v2-pass37`
- 기준 커밋: `dee8906`
- 범위: 세 집게 추격실과 공중 대시 가시 회랑만
- 충돌 변경: `0`
- 장면: `7`
- 런타임 자산: `8`개 (`6`개 신규, `2`개 공유)
- 정적 정의: `44/44`
- 런타임 감사: `80/80`

## 시각 품질 반영

11·12차의 단색 회색 구조와 선형 집게·가시를 36차와 같은 사실적 고밀도 고딕 산업 자산으로 교체했다. 세 집게실은 진입, 공중 정점, 하단 방향 전환, 출구 선반으로 나누고, 공중 대시 구간은 이륙, 가시 참호, 착지 회랑으로 나눴다. 별도 집게 장치 자산에는 기계식 갈고리, 청록 에너지 렌즈, 매달린 사슬과 황동 성소를 포함했다.

카메라가 가로로 100px 이동할 때 원경은 `5px`, 중간 깊이는 `16px`, 주요 구조물은 `48px`, 전경은 `108px` 이동한다. 명암은 심연 그림자, 청흑색 석재, 청록 반사광, 제한된 주황 정비등의 네 층으로 분리했다.

12개 대표 화면의 최소 플레이어 대비는 `9.0182:1`, 평면 임시색 최대 비율은 `0.658%`, 크로마키 누출은 `0`이었다.

## 끊기지 않는 구조물

집게실과 가시 회랑의 모든 주요 교각·기둥·트러스를 이미지 하단까지 연장했다.

- 원본 하단 불투명 범위: `15.37~59.33%`
- 실제 배치 최소 하단: `872px`
- 화면 높이: `680px`

따라서 다리 아래 기둥이나 구조물 다리가 화면 안에서 중단되어 보이지 않는다.

## 장면 구성

1. `grapple_entry`: 36차 출구와 첫 집게 진입
2. `grapple_apex`: 세 집게가 매달린 공중 정점
3. `grapple_turn`: 세 번째 집게 뒤 하단 좌회전
4. `grapple_exit`: 낮은 출구 선반
5. `dash_takeoff`: 왼쪽 공중 대시 이륙부
6. `dash_trench`: 철제 가시 참호
7. `dash_exit`: 착지와 다음 정밀 구간 연결부

## 생성 자산과 최종 프롬프트

기본 제공 `imagegen` 모드를 사용했다. 투명 구조물은 완전 평면 `#ff00ff` 배경으로 생성한 뒤 soft matte와 despill로 알파를 추출했다. 생성 원본은 `docs/rebuild-v2/assets/pass37-source/`, 런타임 자산은 `assets/v2/pass37/`에 저장했다.

### `grapple-far.webp`

```text
Wide 16:9 opaque far-background environment plate for a side-scrolling 2D dark fantasy game, matching a lavish realistic Gothic-industrial underground cathedral. An immense abyssal grapple nave connected to a lower spike corridor: distant pointed arches, deep teal fog, ribbed iron buttresses, suspended bridges, enormous chains, pipes and tiny restrained amber maintenance lamps. Four clear value planes from near-black abyss through blue-black masonry and cool teal rim light to sparse warm highlights. Strong atmospheric depth but no playable foreground platform, no character, no hooks, no spikes, no UI, no text, no logo, no watermark. Full frame covered, cinematic high-detail environment concept art, straight side view, seamless dark edges.
```

### `grapple-nave.png`

```text
Wide 16:9 transparent-ready side-view environment structure plate for a high-detail realistic Gothic-industrial 2D game. A colossal triple-grapple chase nave: three distinct suspended mechanical hook shrines arranged from high right to lower left, broken pointed vaults, oxidized bronze trusses, huge chains, pipes, turbine housings, narrow launch ramp at upper left and sweeping hanging ribs around a deep central void. Main load-bearing columns and bridge legs must continue fully through the bottom edge so no support ends are visible. Cool teal rim light, blue-black masonry, sparse amber lamps, extremely detailed dark fantasy cathedral machinery. Keep the central aerial traversal space readable and mostly open. PERFECTLY FLAT SOLID #ff00ff BACKGROUND everywhere outside the structure, no gradients or shadows on the magenta. No character, no rope line, no UI, no text, no logo, no watermark.
```

### `grapple-exit.png`

```text
Wide 16:9 transparent-ready side-view structure plate for a realistic high-detail Gothic-industrial 2D game. Lower half of a triple-grapple chase chamber turning sharply down and left into a broad exit shelf: shattered cathedral arches, a huge curved boulder chute behind the route, ribbed oxidized-bronze bridge understructure, pipes, gears, hanging chains and sparse amber lamps. The playable upper exit shelf is visually clean, while every lower bridge pier, truss and load-bearing column extends continuously through the bottom edge of the image with no visible cut-off feet. Blue-black stone, cool teal abyss light, restrained warm highlights, detailed dark fantasy machinery. PERFECTLY FLAT SOLID #ff00ff BACKGROUND everywhere outside the structure, no magenta shading. No character, no hooks, no rope, no spikes, no UI, no text, no logo, no watermark.
```

### `dash-spike.png`

```text
Wide 16:9 transparent-ready side-view environment structure plate for a realistic high-detail Gothic-industrial 2D action game. A long low air-dash spike corridor descending from upper right to lower left: armored stone-and-oxidized-bronze takeoff shelf, deep central hazard trench, reinforced landing shelf, pointed arches, heavy pipes, turbine housings, chains and railings. Include an unmistakable bed of twelve large dark iron spikes with restrained hot amber-red edge glow in the central trench, but keep the aerial dash lane above them open and readable. All bridge trusses, piers and structural legs continue beyond the bottom edge, never ending visibly in frame. Four-value lighting with near-black abyss, blue-black masonry, teal rim light, sparse amber lamps. PERFECTLY FLAT SOLID #ff00ff BACKGROUND everywhere outside structures, no magenta shading. No character, no boulder, no UI, no text, no logo, no watermark.
```

### `dash-exit.png`

```text
Wide 16:9 transparent-ready side-view environment structure plate for a realistic high-detail Gothic-industrial 2D game. The landing and exit half of an underground air-dash hazard corridor: broad reinforced lower-left recovery shelf, short sloped exit continuing left, looming low pointed vault overhead, massive oxidized-bronze pipes, gears, railings, fractured masonry and a distant barred gate. A compact remnant of the spike trench sits only at the far right edge. Every bridge pier, arch support and truss extends continuously through the bottom edge so no support foot or chopped leg is visible. Near-black abyss, blue-black stone, teal rim light, sparse amber lamps, cinematic dark fantasy detail. PERFECTLY FLAT SOLID #ff00ff BACKGROUND everywhere outside the structure, no magenta gradients. No character, no boulder, no UI, no text, no logo, no watermark.
```

### `grapple-anchor.png`

```text
A single ornate Gothic-industrial grapple anchor apparatus, centered and isolated, full object visible: narrow suspended bronze shrine, heavy vertical chain entering from the top edge, large articulated dark-steel hook ring at the bottom, small teal energy lens and restrained amber indicator lights. Realistic high-detail dark fantasy game asset, straight side view, strong readable silhouette, no floor, no environment. PERFECTLY FLAT SOLID #ff00ff BACKGROUND with no gradients or shadows. No character, no rope to player, no UI, no text, no logo, no watermark.
```

`foreground-frame.png`과 `route-stone.png`은 승인된 33차·31차 자산을 공유한다.

## 집중 브라우저 검사

- 대표 카메라: `12`개, 장면: `7`개
- 자산 로드: `8/8`
- 최소 대비: `9.0182:1`
- 최대 평면 플레이스홀더: `0.006576`
- 크로마키 누출: `0`
- 원경/전경 100px 변위: `5px / 108px`
- 최소 구조 배치 하단: `872px`
- 결과: `pass-37-focused-results.json`

좌표 배치는 화면 검사 전용이며 전체 이동 통과 주장에는 사용하지 않는다.

## 전체 실제 키보드 검사

- 입력: `KeyA`, `KeyB`, `KeyD`, `KeyE`, `KeyF`, `ShiftLeft`, `Space`
- 좌표 도우미: 사용하지 않음
- 세 집게: `3/3`
- 공중 대시 가시 통과: `1/1`
- 최종 프레임: `21,999`
- 최종 위치: `(24267.72, 12045.53)`
- 최종 바닥: `pass23_exit_slope`
- 리셋·붕괴석 접촉·콘솔/페이지 오류: 모두 `0`
- 결과: `pass-37-browser-results.json`

## 40차 이후 화면 보정

37~40차에서도 현재 사실적 고밀도 스타일을 유지한다. 40차 통합과 사이트 자동 실행 검증이 끝난 뒤 먼 배경의 미세 흐림, 형태 단순화, 캐릭터와 환경의 윤곽·채도·명암 통합을 전 구역에 적용한다.

## 증거 화면

- `assets/pass37-grapple-entry.png`
- `assets/pass37-grapple-apex.png`
- `assets/pass37-grapple-turn.png`
- `assets/pass37-grapple-exit.png`
- `assets/pass37-dash-takeoff.png`
- `assets/pass37-dash-trench.png`
- `assets/pass37-dash-exit.png`
- `assets/pass37-blueprint.png`
- `assets/pass37-final-exit.png`

## 다음 범위

38차는 가시 회랑 이후의 정밀 점프·거대 방향 전환 연결부를 같은 패럴랙스·명암·하단 연속 기준으로 교체한다.
