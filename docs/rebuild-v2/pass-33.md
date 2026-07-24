# Rebuild V2 · Pass 33

## 결과

- 실행 버전: `rebuild-v2-pass33`
- 기준 커밋: `3adfe71`
- 범위: 4구역의 저천장 통로, 이동 승강 샤프트, 불균형 갤러리만
- 충돌 변경: `0`
- 장면: `3`
- 런타임 자산: `6`개 (`5`개 신규, `1`개 공유)
- 정적 정의: `61/61`
- 런타임 감사: `60/60`

## 요청 반영

### 패럴랙스

카메라가 가로로 100px 이동할 때 다음과 같이 서로 다른 속도로 움직인다.

- 먼 원경: `8px` (`0.08`)
- 중간 원경: `20px` (`0.20`)
- 주 구조물: `43~47px` (`0.43~0.47`)
- 전경: `110px` (`1.10`)

집중 브라우저 검사에서 원경/전경의 실제 변위가 `8px / 110px`로 측정됐다.

### 명암과 입체감

장면마다 다음 네 값 영역을 분리했다.

1. 깊은 구조물 그림자
2. 차가운 청록 중간톤
3. 가장자리의 밝은 청록 반사광
4. 소량의 따뜻한 황동·등불 강조광

바닥과 천장에는 별도의 접촉 그림자와 얇은 반사광을 적용했다. 아홉 카메라 샘플의 최소 캐릭터 대비는 `8.53:1`, 최대 회색 플레이스홀더 픽셀 비율은 `0.99%`였다.

### 끝나 보이지 않는 지지대

`shaft-frame.png`과 `uneven-gallery.png`의 수직 지지대는 원본 이미지 하단을 관통한다.

- 샤프트 프레임 하단 불투명 범위: `34.28%`
- 갤러리 지지대 하단 불투명 범위: `33.14%`
- 최소 화면 아래 연장 위치: 화면 하단보다 `139.36px` 아래

따라서 카메라가 가장 낮고 동쪽에 있는 샘플에서도 기둥의 발이나 잘린 끝이 보이지 않는다.

### 이동 승강판

기존 회색 사각형과 점선 이동 궤적을 제거했다. 33차 구역의 `shaft_carriage`는 공유 석재 표면, 황동 하부 트러스, 양쪽 현수 케이블과 접촉 그림자로 렌더링한다.

## 장면 구성

1. `compression_passage`
   - 낮은 리브 볼트와 두 개의 충돌 천장 보
   - 먼 수직 도시와 중간 원경을 분리
2. `bottomless_lift_shaft`
   - 하단을 관통하는 두 승강탑
   - 중앙을 비운 승강판 통로
3. `uneven_abyss_gallery`
   - 실제 바닥의 하강·상승 윤곽과 맞물리는 갤러리
   - 모든 주요 교각이 화면 밖 아래까지 연속

장면 전환은 200px 입구 혼합과 두 개의 180px 내부 교차 혼합을 사용한다.

## 생성 자산과 프롬프트

기본 제공 `imagegen` 도구를 사용했다. 32차 아트리움 캡처는 재질·조명 스타일 참고 이미지로만 사용했고 UI, 캐릭터, 구도는 복사하지 않았다. 투명 조각은 균일한 `#ff00ff` 크로마 배경으로 생성한 뒤 로컬 크로마 제거 도구의 soft matte와 despill을 적용했다.

### `tunnel-far.webp`

```text
2D side-scrolling metroidvania far-background plate. Match intricate ruined Gothic-industrial architecture, teal atmospheric light, oxidized brass, wet dark stone and painterly high detail. Create a wide underground uneven-tunnel and elevator-shaft cityscape with repeating arches, receding bridges, machinery towers and a mist-filled abyss. Use four value planes: near-dark silhouettes, cool mid-dark architecture, misty cyan distance and sparse amber lamps. Distant-only plate, no playable floor, UI, character, text, logo or watermark.
```

### `compression-vault.png`

```text
Transparent-ready side-view compression tunnel assembly: low pointed rib vaults, stone-and-brass ceiling beams, cracked columns, pipes, roots, damp mineral streaks and amber lamps. Keep the opening readable and dark with three clear value planes and contact shadows. Isolated horizontal structure on perfectly flat #ff00ff; no floor slab, character, text, UI, logo, watermark or flat gray shapes.
```

### `shaft-frame.png`

```text
Transparent-ready monumental side-view lift-shaft frame. Two Gothic-industrial support towers flank a clear central shaft and connect through gears, chains, pulleys and a pointed arch. Both towers must continue straight through the image bottom with no foot, cap, broken end, taper or floating termination. Deep shadow bands, teal reflected light, sparse amber lamps and contact shadows. Perfectly flat #ff00ff background; no ground plane, character, UI, text, logo or watermark.
```

### `uneven-gallery.png`

```text
Transparent-ready long broken side-view gallery following a descending-then-rising route. Three stone-and-brass bridge spans, pointed arches, railings, timing gaps, chains, lamps and pipework. Every bridge pier must cross the bottom image edge with no visible foot, cap, stump or termination. Use dark faces, teal midtones, restrained warm/cool edge highlights and deck contact shadows. Perfectly flat #ff00ff; no character, UI, text, logo, watermark or flat gray shapes.
```

### `foreground-frame.png`

```text
Transparent-ready sparse near-camera framing layer with left and right clusters of dark pipes, broken Gothic masonry, roots and chains. Keep the center 55 percent open and transparent. Very dark values, narrow teal rim light and warm brown reflections. Elements may cross the bottom boundary. Perfectly flat #ff00ff; no central obstruction, character, UI, text, logo or watermark.
```

원본은 `docs/rebuild-v2/assets/pass33-source/`, 투명 처리본과 원경 사본은 `docs/rebuild-v2/assets/pass33-*`, 런타임 자산은 `assets/v2/pass33/`에 저장했다.

## 집중 브라우저 검사

- 아홉 카메라 샘플과 아홉 전환 샘플
- 통과: `true`
- 자산 로드: `6/6`
- 최소 대비: `8.5185:1`
- 최대 평면 플레이스홀더: `0.009873`
- 보이는 세로 이음새: `0`
- 캐릭터 안전영역 전경 가림: `0`
- 원경/전경 100px 변위: `8px / 110px`
- 지지대 원본 하단 범위: `0.342773 / 0.331361`
- 최소 화면 하단 연장: `819.36px` (`680px` 뷰포트 기준)
- 결과: `pass-33-focused-results.json`

집중 검사의 플레이어 위치 변경은 화면 검사 전용 좌표 도우미이며 전체 이동 통과 주장에 사용하지 않는다.

## 전체 실제 키보드 검사

- 입력: `KeyA`, `KeyB`, `KeyD`, `KeyE`, `KeyF`, `ShiftLeft`, `Space`
- 좌표 도우미: 사용하지 않음
- 완료 프레임: `23,444`
- 최종 프레임: `23,507`
- 최종 위치: `(24267.23, 12045.58)`
- 최종 바닥: `pass23_exit_slope`
- 4구역 승강판 탑승: `1`
- 4구역 점프 간격 완료: 통과
- 리셋: `0`
- 붕괴석 접촉: `0`
- 콘솔/페이지 오류: `0/0`
- 전체 결정적 조건: 모두 통과
- 결과: `pass-33-browser-results.json`

## 증거 화면

- `assets/pass33-tunnel-entry.png`
- `assets/pass33-low-tunnel.png`
- `assets/pass33-shaft-carriage.png`
- `assets/pass33-uneven-gallery.png`
- `assets/pass33-zone-exit.png`
- `assets/pass33-entry-transition.png`
- `assets/pass33-blueprint.png`
- `assets/pass33-exit.png`

## 한계와 다음 범위

33차는 불균형 터널과 승강 샤프트까지만 최종 래스터 범위를 확장한다. 34차는 다음 파괴 미로 구역의 구조물, 파괴 가능한 문, 추격 공간을 같은 패럴랙스·명암·하단 연속 기준으로 교체해야 한다.
