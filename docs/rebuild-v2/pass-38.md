# Rebuild V2 · Pass 38

## 결과

- 실행 버전: `rebuild-v2-pass38`
- 기준 커밋: `0cc8de8`
- 범위: 정밀 점프 구역과 거대 방향 전환 구역만
- 충돌 변경: `0`
- 장면: `5`
- 런타임 자산: `8`개 (`6`개 신규, `2`개 공유)
- 정적 정의: `45/45`
- 런타임 감사: `85/85`

## 시각 품질 반영

13차의 짧은 점프 컷, 반전 착지, 긴 홀드 점프와 14차의 초대형 방향 전환을 37차와 같은 사실적 고밀도 고딕 산업 자산으로 교체했다. 정밀 구역은 진입, 짧은 착지, 반전 포켓, 긴 복귀의 네 장면으로 나눴다. 거대 방향 전환은 축소 개요 카메라 안에서 상부 곡선, 수직 낙하 구조, 하부 역방향 램프 세 자산을 동시에 합성해 하나의 초대형 방으로 읽히게 했다.

카메라가 가로로 100px 이동할 때 원경은 `5px`, 중간 깊이는 `16px`, 주요 구조물은 `46~50px`, 전경은 `108px` 이동한다. 명암은 심연 그림자, 청흑색 석재, 산화 청록 반사광, 제한된 황동 정비등의 네 층으로 분리했다.

12개 대표 화면의 최소 플레이어 대비는 `7.5841:1`, 평면 임시색 최대 비율은 `0.956%`, 크로마키 누출은 `0`이었다.

## 끊기지 않는 구조물

정밀 점프 회랑과 거대 곡선의 모든 주요 교각·기둥·트러스를 이미지 하단까지 연장했다.

- 원본 하단 불투명 범위: `9.03~71.29%`
- 실제 배치 최소 하단: `766px`
- 화면 높이: `680px`
- 화면 밖 최소 연장: `86px`

따라서 다리 아래 기둥이나 구조물 다리가 화면 안에서 중단되어 보이지 않는다.

## 장면 구성

1. `precision_entry`: 37차 가시 회랑과 짧은 점프 진입
2. `precision_short`: 점프 컷과 낮은 천장 착지
3. `precision_turn`: 좌측 반전 포켓과 긴 점프 이륙
4. `precision_return`: 긴 홀드 점프 착지와 13차 출구
5. `giant_curve_overview`: 상부 생존 점프, 가파른 하강, 자연 낙하, 하부 역방향 복귀를 한 화면에 합성

## 생성 자산과 최종 프롬프트

기본 제공 `imagegen` 모드를 사용했다. 투명 구조물은 완전 평면 `#ff00ff` 배경으로 생성한 뒤 soft matte와 despill로 알파를 추출했다. 생성 원본은 `docs/rebuild-v2/assets/pass38-source/`, 런타임 자산은 `assets/v2/pass38/`에 저장했다.

### `precision-curve-far.webp`

```text
Use case: stylized-concept. Opaque 2D game far-background plate: a vast abandoned Gothic-industrial precision-jump gallery flowing into a colossal U-turn excavation chamber, straight-on wide side-scrolling view. Many receding pointed arches, blue-black wet masonry, distant iron catwalk silhouettes, a huge circular descending vault and deep abyss. High-end realistic dark fantasy environment concept art with at least four value planes, teal moonlight, sparse amber maintenance lamps and atmospheric depth. No foreground platform, character, enemy, spikes, UI, text, logo or watermark.
```

### `precision-entry.png`

```text
Use case: stylized-concept. Transparent midground cutout of an abandoned Gothic-industrial precision-jump entry gallery: descending stone runway, one narrow spike gap, low ribbed ceiling, huge pointed arches, pipes, buttresses and lamps. Bridge supports continue through the bottom edge with no chopped feet. High-end realistic dark fantasy side view, teal rim light, blue-black shadows and amber lamps. Perfectly flat solid #ff00ff chroma-key background; no magenta in the structure, character, enemy, UI, text or watermark.
```

### `precision-return.png`

```text
Use case: stylized-concept. Transparent midground cutout of a Gothic-industrial precision reversal pocket and long-jump gallery: left stone turnaround wall, wide abyss gap, long lower landing ledge, broken vault ribs, iron trusses and continuous columns plunging beyond the bottom. High-end realistic metroidvania environment, four value planes. Perfectly flat uniform #ff00ff background; no character, enemy, spikes, UI, labels or watermark.
```

### `curve-upper.png`

```text
Use case: stylized-concept. Transparent upper half of a colossal Gothic-industrial direction-turn chamber: broad descending stone curve from upper right toward lower left, one small survival gap, monumental concentric ribs, pipework, lamps and gigantic buttresses continuing through the bottom edge. High-end realistic dark fantasy side view with readable gameplay corridor. Perfectly flat #ff00ff background; no character, enemy, spikes, UI, text or watermark.
```

### `curve-drop.png`

```text
Use case: stylized-concept. Transparent steep descending lip and vertical abyss shaft of a colossal Gothic-industrial U-turn chamber: left drop buttress, broken concentric vault ribs, deep open shaft, immense pipes and trusses continuing through the bottom, sparse lamps for scale. Realistic wet stone, iron and oxidized copper in a straight side view. Perfectly flat #ff00ff background; no character, enemy, spikes, UI, text or watermark.
```

### `curve-lower.png`

```text
Use case: stylized-concept. Transparent lower return arc and bridge handoff of a colossal Gothic-industrial U-turn chamber: long stone ramp rising left to right beneath huge pointed arches, massive under-bridge trusses and column legs crossing the bottom edge, exit vault on the right. High-end realistic dark fantasy side view with blue-black stone, teal rim light and subdued amber lamps. Perfectly flat #ff00ff background; no character, enemy, spikes, UI, text or watermark.
```

`foreground-frame.png`과 `route-stone.png`은 승인된 33차·31차 자산을 공유한다.

## 집중 브라우저 검사

- 대표 카메라: `12`개, 장면: `5`개
- 자산 로드: `8/8`
- 최소 대비: `7.5841:1`
- 최대 평면 플레이스홀더: `0.009564`
- 크로마키 누출: `0`
- 원경/전경 100px 변위: `5px / 108px`
- 최소 구조 배치 하단: `766px`
- 결과: `pass-38-focused-results.json`

좌표 배치는 화면 검사 전용이며 전체 이동 통과 주장에는 사용하지 않는다.

## 전체 실제 키보드 검사

- 입력: `KeyA`, `KeyB`, `KeyD`, `KeyE`, `KeyF`, `ShiftLeft`, `Space`
- 좌표 도우미: 사용하지 않음
- 정밀 짧은 점프·반전·긴 점프: 모두 통과
- 거대 곡선 상부·자연 낙하·하부 복귀: 모두 통과
- 최종 프레임: `22,501`
- 최종 위치: `(24267.62, 12045.54)`
- 최종 바닥: `pass23_exit_slope`
- 리셋·붕괴석 접촉·콘솔/페이지 오류: 모두 `0`
- 결과: `pass-38-browser-results.json`

## 40차 이후 화면 보정

38~40차에서도 현재 사실적 고밀도 스타일을 유지한다. 40차 통합과 사이트 자동 실행 검증이 끝난 뒤 먼 배경의 미세 흐림, 형태 단순화, 캐릭터와 환경의 윤곽·채도·명암 통합을 전 구역에 적용한다.

## 증거 화면

- `assets/pass38-precision-entry.png`
- `assets/pass38-precision-turn.png`
- `assets/pass38-precision-return.png`
- `assets/pass38-curve-entry.png`
- `assets/pass38-curve-upper.png`
- `assets/pass38-curve-drop.png`
- `assets/pass38-curve-lower.png`
- `assets/pass38-blueprint.png`
- `assets/pass38-final-exit.png`

## 다음 범위

39차는 붕괴 다리 피날레와 추격 종료 뒤의 정밀 애프터쇼크 구역을 같은 패럴랙스·명암·하단 연속 기준으로 교체한다.
