# Rebuild V2 · Pass 34

## 결과

- 실행 버전: `rebuild-v2-pass34`
- 기준 커밋: `139a4b5`
- 범위: 5구역 파괴 미로만
- 충돌 변경: `0`
- 장면: `4`
- 런타임 자산: `8`개 (`6`개 신규, `2`개 공유)
- 정적 정의: `73/73`
- 런타임 감사: `65/65`

## 요청 반영

### 바닥보다 느린 배경

카메라가 가로로 100px 이동할 때 각 화면층은 다음 거리만 움직인다.

- 먼 원경: `7px` (`0.07`)
- 중간 깊이: `18px` (`0.18`)
- 주요 구조물: `46~48px` (`0.46~0.48`)
- 가까운 전경: `108px` (`1.08`)

집중 브라우저 검사에서도 먼 원경과 전경의 변위가 각각 `7px / 108px`로 측정됐다. 충돌 바닥과 플레이어는 원래 월드 좌표로 움직이므로 배경만 더 느리게 흐른다.

### 여러 명암층

네 장면 모두 다음 네 값 영역을 분리했다.

1. 가장 먼 구조물의 깊은 청흑색 그림자
2. 차가운 청록 중간톤
3. 석재·금속 가장자리의 밝은 청록 반사광
4. 용광로·등불의 제한된 주황 강조광

바닥에는 접촉 그림자, 얇은 청록 반사광과 별도의 표면 텍스처를 적용했다. 12개 대표 카메라의 최소 캐릭터 대비는 `7.55:1`, 기존 평면 플레이스홀더 색의 최대 화면 비율은 `2.34%`였다.

### 끊기지 않는 다리와 받침

서쪽 볼트, 중앙 미로, 고지대 갤러리, 동쪽 급하강 구조의 모든 주요 받침이 이미지 하단을 관통하도록 제작했다.

- 서쪽 구조 원본 하단 불투명 범위: `21.89%`
- 중앙 구조 원본 하단 불투명 범위: `38.30%`
- 고지대 구조 원본 하단 불투명 범위: `26.87%`
- 동쪽 구조 원본 하단 불투명 범위: `37.04%`
- 가장 낮은 실제 화면 배치 하단: `786.8px`
- 화면 높이: `680px`

따라서 가장 낮은 출구 카메라에서도 교각의 발, 캡 또는 잘린 끝이 화면 안에 나타나지 않는다.

### 파괴문 이미지 교체

기존 회색 사각형과 선으로 그린 파괴문을 하나의 투명 스프라이트 시트에서 잘라 쓰는 세 장식 문으로 교체했다.

- `west_braced_gate`: X자 보강문
- `middle_lattice_gate`: 격자문
- `east_split_gate`: 분할 기둥문

렌더링만 교체했으며 충돌 크기와 대시 파괴 판정은 그대로다. 전체 키보드 검사에서 세 문 모두 실제 대시로 파괴됐다.

## 장면 구성

1. `west_demolition_corridor`
   - 5구역 진입 상승로, 서쪽 평탄 회랑, 첫 급하강
2. `central_sink_maze`
   - 낮은 회랑, 첫 상승 능선, 중앙 격자문과 두 번째 상승
3. `high_foundry_gallery`
   - 높은 상부 갤러리와 동쪽 하강 트러스
4. `east_breaker_drop`
   - 마지막 파괴문, 동쪽 능선, 급격한 출구 낙하

입구는 380px 범위에서 33차 터널과 혼합하며 내부 장면은 세 개의 180px 교차 혼합으로 연결한다.

## 생성 자산과 프롬프트

기본 제공 `imagegen` 도구로 현재의 사실적이고 고밀도인 고딕·산업 스타일을 유지해 생성했다. 투명 조각은 균일한 `#ff00ff` 크로마 배경으로 생성한 뒤 soft matte와 despill을 적용했다.

### `destruction-far.webp`

```text
Very wide 2D side-scrolling destruction-maze foundry and chase corridor far background. Realistic, high-detail ruined Gothic-industrial architecture, oxidized brass, wet dark stone, teal atmospheric light and sparse amber furnace lamps. Four distinct value planes with deep silhouettes, cool midtone architecture, misty cyan distance and restrained warm accents. No playable floor, character, UI, text, logo or watermark. Preserve the current realistic detail level until the post-pass-40 polish stage.
```

### `west-vault.png`

```text
Transparent-ready wide side-view west demolition corridor: rising entry, level Gothic foundry vault and deep sinking bridge. Ornate stone-and-brass ribs, pipes, gears, braces and small lamps. Every major pier and support continues straight through the bottom image edge with no visible foot, cap or truncated end. Deep shadow, cool teal midtones and restrained amber accents on perfectly flat #ff00ff; no character, UI, text, logo or watermark.
```

### `central-maze.png`

```text
Transparent-ready side-view central destruction maze: downward lower hall followed by a sharp mechanical rise, dense gears, pistons, Gothic arches and crossing trusses. Keep the playable corridor readable. Every bridge pier and vertical support crosses the bottom image edge without a visible termination. Realistic high detail, teal reflected light and warm brass lamps on perfectly flat #ff00ff; no character, UI, text, logo or watermark.
```

### `high-gallery.png`

```text
Transparent-ready elevated foundry gallery with a steep rise, long upper hall and mechanical descent. Monumental arches, suspended chains, rails, gears and stone-and-brass bridgework. All supporting legs continue through the image bottom with no foot, stump, cap or floating end. Four value planes, realistic high detail, teal atmospheric light and sparse amber accents on perfectly flat #ff00ff; no character, UI, text, logo or watermark.
```

### `east-breaker.png`

```text
Transparent-ready east breaker corridor: level hall, final rising ridge and dramatic steep exit drop. Dense ruined Gothic-industrial columns, machinery, pipes, braces and a deep abyss. Every support under every bridge span extends straight through the bottom image edge so no truncated leg is visible. Realistic high detail with dark teal shadows and amber highlights on perfectly flat #ff00ff; no character, UI, text, logo or watermark.
```

### `dash-gates.png`

```text
Transparent-ready sprite sheet with three completely separated tall narrow Gothic-industrial breakable gates: an X cross-braced gate, a dense lattice gate and a split-pillar gate. Ornate oxidized brass and dark stone, teal edge light, restrained warm highlights, consistent scale and no overlap. Perfectly flat #ff00ff background; no floor, character, UI, labels, text, logo or watermark.
```

원본은 `docs/rebuild-v2/assets/pass34-source/`, 런타임 투명 처리본은 `assets/v2/pass34/`에 저장했다. `foreground-frame.png`과 `route-stone.png`은 각각 33차와 31차의 승인 자산을 공유한다.

## 집중 브라우저 검사

- 대표 카메라: `12`개
- 통과: `true`
- 자산 로드: `8/8`
- 최소 대비: `7.5476:1`
- 최대 평면 플레이스홀더: `0.02334`
- 보이는 세로 이음새: `0`
- 캐릭터 안전영역 전경 가림: `0`
- 원경/전경 100px 변위: `7px / 108px`
- 최소 구조 배치 하단: `786.8px`
- 결과: `pass-34-focused-results.json`

집중 검사에서 플레이어 위치를 바꾼 것은 화면 검사 전용 좌표 도우미이며 전체 이동 통과 주장에 사용하지 않는다.

## 전체 실제 키보드 검사

- 입력: `KeyA`, `KeyB`, `KeyD`, `KeyE`, `KeyF`, `ShiftLeft`, `Space`
- 좌표 도우미: 사용하지 않음
- 완료 프레임: `21,937`
- 최종 프레임: `22,000`
- 최종 위치: `(24267.27, 12045.57)`
- 최종 바닥: `pass23_exit_slope`
- 5구역 파괴문: `3/3`
- 리셋: `0`
- 붕괴석 접촉: `0`
- 콘솔/페이지 오류: `0/0`
- 전체 결정적 조건: 모두 통과
- 결과: `pass-34-browser-results.json`

## 40차 이후 화면 보정 계약

사용자 요청에 따라 34~40차에서는 현재의 사실적이고 고밀도인 배경 스타일을 그대로 유지한다. 40차 전체 통합과 사이트 진입 즉시 실행 검증이 완전히 끝난 뒤에만 별도 화면 보정 단계에서 다음 작업을 수행한다.

1. 먼 배경의 미세 흐림 처리
2. 지나치게 현실적인 미세 형태와 재질의 선택적 단순화
3. 캐릭터와 배경의 윤곽·채도·명암 통합

이 후처리는 현재 자산을 다시 만드는 것이 아니라, 완성된 전 구역을 같은 기준으로 한 번에 조정해 구역별 편차를 막는 방식으로 진행한다.

## 증거 화면

- `assets/pass34-maze-entry.png`
- `assets/pass34-west-gate.png`
- `assets/pass34-middle-gate.png`
- `assets/pass34-high-gallery.png`
- `assets/pass34-east-gate.png`
- `assets/pass34-exit-drop.png`
- `assets/pass34-blueprint.png`
- `assets/pass34-exit.png`

## 한계와 다음 범위

34차는 파괴 미로만 최종 래스터 범위를 확장한다. 35차는 다음 거대 곡선·대시 구간을 같은 패럴랙스·명암·하단 연속 기준으로 교체해야 한다. 붕괴 파편 애니메이션과 추격석 자체의 최종 이미지화는 이후 해당 장면 제작 범위에서 다룬다.
