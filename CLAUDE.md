# 이음홈톡 · 부동산 주간뉴스 TOP 10 대시보드

카카오톡 공유용 세로형 카드 이미지. **매주 월요일 발행하는 주간 브리핑**이다. "리포트 만들어줘" 같은 요청이 오면 아래 절차를 그대로 따른다 (매번 다시 물어볼 필요 없음).

평상시에는 **클라우드 크론 루틴이 알아서 발행**한다 (맨 아래 "자동화" 섹션). 아래 수동 절차는 루틴이 실패했거나, 발행 내용/디자인을 사람이 직접 고칠 때 쓴다.

## 발행 주기

- 매주 월요일, **직전 1주일(월~일)** 기준 부동산 뉴스를 정리해 발행한다.
- 커버 날짜 표기는 기간형으로 쓴다: 예) "8월 25일 – 8월 31일" (`output/report.html`, `output/cover-only.html`, `output/artifact.html`, `netlify-deploy/index.html` 4곳의 `.cover-date`를 모두 동일하게 갱신).
- 타이틀은 "부동산 주간뉴스 TOP 10"으로 고정한다 ("부동산 뉴스 TOP 10"이 아님 — 2026-08-18에 주간지로 개편함).

## 작업 절차

1. **리서치**: 발행일 기준 지난 1주일간의 부동산 관련 뉴스를 웹 검색으로 10개 수집한다.
   - 정부 정책(세제개편, 대출규제, 종부세·양도세), 서울 시세 동향, 재건축/재개발, 비아파트(빌라)·임대시장, 실수요자(2030 등) 반응 등 카테고리를 고루 섞는다.
   - 항목별로 실제 기사 제목·언론사·URL·2~3문장 요약을 확보한다. **URL은 검색 결과에 실제로 뜬 것만 사용하고 지어내지 않는다.**
   - 확실도가 낮은 항목(단일 근거 기사를 못 찾음)은 사용자에게 알리고 다른 이슈로 교체할지 확인한다.
   - 서로 다른 항목이 같은 URL/같은 통계를 인용하는 중복이 없는지 확인한다 — 겹치면 더 구체적인 소재를 다룬 기사로 교체. (`npm run check`가 URL 중복은 자동으로 잡아준다.)
   - 지난주와 주제가 겹치는 이슈(예: 세제개편 후속 통계)는 최신 수치로 업데이트된 것이면 포함 가능하나, 가능한 새 소재를 우선한다.
   - Top3(커버 카드용)는 임팩트가 가장 큰 이슈로 선정한다.

2. **제작**: 아래 **4개 파일**의 커버(Top3)와 본문(10개 리스트)을 모두 동일한 내용으로 갈아끼운다.
   - `output/report.html` — PNG 렌더링용 소스 (**링크 없음**, 커버+10개)
   - `output/cover-only.html` — OG 미리보기 이미지용 (**커버만**, 리스트 없음)
   - `output/artifact.html` — Claude Artifact 게시용 (각 항목이 `<a href="원문URL">`로 감싸짐)
   - `netlify-deploy/index.html` — Netlify 배포용. `artifact.html`의 `<div class="sheet">` 본문과 **완전히 동일해야 하고**, 여기에 `<head>`+OG 메타태그만 더한 형태다.
   - 커버(`.top3` 안 3개 `.top3-card`): 번호, 헤드라인, 서브캡션
   - 본문(`.list-wrap` 안 10개 `.list-item`): 번호, 제목, 요약, 언론사명/도메인
   - 날짜 표기(`.cover-date`)를 발행 주간의 기간으로 갱신한다.

3. **렌더링**: PNG 2종(전체 카드뉴스 + OG 커버 썸네일)을 만든다.
   ```
   cd "C:\AI\카드뉴스"
   node render-realestate-top10.js   # output/report.html → output/부동산주간뉴스Top10_{오늘날짜}.png
   node render-og-cover.js           # output/cover-only.html → netlify-deploy/og-image.png
   ```
   - 출력 파일명의 날짜는 **실행일 기준으로 자동 생성**된다. 스크립트를 손으로 고칠 필요 없다.
   - `C:\AI\카드뉴스`의 두 파일은 **얇은 포워더**일 뿐이고, 실제 로직은 이 저장소의 `scripts/`에 있다 (단일 소스). 그 폴더를 거치는 이유는 puppeteer가 `C:\AI\카드뉴스\node_modules`에만 설치돼 있기 때문이다.
   - 이 프로젝트에서 직접 돌리려면 (동일한 결과):
     ```
     cd "C:\AI\업무\뉴스레터_대시보드\뉴스Top-10 대시보드"
     NODE_PATH="C:/AI/카드뉴스/node_modules" npm run render
     ```
   - `render:og`는 렌더링 후 **`index.html`의 `og:image:width/height`를 실제 PNG 크기로 자동 갱신**한다. 이 값을 손으로 적지 말 것 (환경마다 커버 높이가 10~20px씩 달라진다).

4. **검증**: 커밋/배포 전에 반드시 돌린다.
   ```
   npm run check
   ```
   4개 문서의 날짜 일치, 로고(구 로고 잔존 여부), 브랜드 텍스트 재등장, 리스트 10개/Top3 3개, 링크 수와 URL 중복, div/a 태그 균형, `artifact.html`↔`index.html` 본문 일치, OG 메타와 실제 PNG 크기 일치, 병합 충돌 마커까지 확인한다. 실패하면 비정상 종료(exit 1)한다.

## 디자인 확정 사항 (임의로 바꾸지 말 것)

- **폭 600px**, 세로로 긴 카드 비율. 카카오톡 공유에 적합한 사이즈. (OG용 `cover-only.html`만 1200px 폭.)
- **색상**: 커버는 블루-틸 그라데이션(`#6ba0ac → #588e9c → #497b8c`), 포인트는 골드 그라데이션(`#eecf95 → #c9a15c`), 타이틀 텍스트는 아이보리-골드 그라데이션(`#fff6d6 → #ffe9a8 → #f3d383`) + 얇은 골드 테두리(`-webkit-text-stroke`)로 굵게 강조.
- **본문 배경**: 위→아래 은은한 그라데이션(`#fefdfb → #fbf8f2 → #f6f0e4`), 순백보다 살짝 밝은 크림톤 유지.
- **Top3 카드**: 원형 골드 배지(숫자) + 흰 카드, 배경에 다른 색 얼룩(radial-gradient 장식)은 넣지 않는다 — 과거 시도에서 지저분해 보인다는 피드백으로 제거함.
- **본문 리스트 번호(1~10)**: 검정(`#1a1a1a`). 골드로 하지 말 것 — 사용자가 명시적으로 검정 요청.
- **로고**: `assets/logo_iemhometok.png` (이음홈톡 원형 배지 로고, 500×500 RGBA, 모서리 투명). 2026-08-31에 기존 방패 로고(`logo-transparent.png`)에서 교체함 — 예전 로고로 되돌리지 말 것.
  - 표시 크기: `report.html`/`artifact.html`/`index.html` 64px, `cover-only.html` 128px. 원형 배지라 `border-radius: 50%`를 함께 준다.
  - **커버 상단에는 로고만 넣고 브랜드 텍스트는 넣지 않는다** (2026-08-31 변경). 배지 안에 이미 '이음홈톡' 글자가 들어 있어서 옆에 `.brand-text`(brand-name/brand-sub)를 두면 이름이 두 번 나온다. 관련 CSS도 제거된 상태이니 되살리지 말 것. 문서 하단 `.doc-footer`의 'ⓒ 이음홈톡 · Weekly Real Estate Brief'는 그대로 유지한다.
  - base64 인라인용으로는 256px로 줄인 `assets/logo_iemhometok_256.png`를 쓴다 (원본 394KB는 문서에 그대로 넣기엔 큼).
- **다크 테마**: `artifact.html`과 `index.html`에만 라이트/다크 CSS 변수(`:root`, `@media prefers-color-scheme: dark`, `:root[data-theme="dark"]`)가 있다. PNG로 렌더링되는 `report.html`/`cover-only.html`에는 넣지 않는다 (항상 라이트로 찍혀야 함).
- **날짜 중복 금지**: 커버 상단에 이미 날짜가 있으므로 `cover-footer`에는 날짜를 넣지 않는다.

## 파일 구조

```
뉴스Top-10 대시보드/
├── CLAUDE.md              ← 이 파일
├── package.json           ← npm run render / render:og / render:full / check
├── assets/
│   ├── logo_iemhometok.png      ← 현재 사용 로고 (원형 배지, 500px)
│   ├── logo_iemhometok_256.png  ← base64 인라인용 축소본
│   ├── logo-transparent.png     ← 구 방패 로고 (미사용, 참고용 보관)
│   └── IEUM_HOMETOK_Lower_Transparent.png  ← 미사용
├── scripts/
│   ├── render-realestate-top10.js  ← report.html → 전체 PNG (실행일로 파일명 자동)
│   ├── render-og-cover.js          ← cover-only.html → og-image.png (+OG 메타 자동 동기화)
│   └── check.js                    ← 발행 전 정합성 검사 (npm run check)
├── output/
│   ├── report.html         ← 전체 리포트(커버+10개 리스트) 소스, 링크 없음
│   ├── cover-only.html      ← 커버만 담은 소스, OG 미리보기 이미지용 (1200px 폭)
│   ├── artifact.html        ← Artifact 게시용(링크 클릭 가능, 라이트/다크 테마 대응)
│   └── 부동산주간뉴스Top10_{날짜}.png  ← 카톡 파일첨부용 전체 세로 이미지
└── netlify-deploy/
    ├── index.html           ← Netlify 배포용 완전 문서(artifact.html 본문 + OG 메타태그)
    └── og-image.png          ← 카톡 미리보기 썸네일 (cover-only.html 렌더링 결과)
```

`netlify.toml`은 두지 않는다 — Netlify UI에 base directory가 `netlify-deploy`로 잡혀 있어서, 저장소 루트의 `netlify.toml`은 무시되고 경로만 꼬인다.

## 클릭 가능한 링크로 카톡 공유 (권장 — 뉴스 클릭 시 원문 이동)

이미지 파일만 보내면 클릭해도 아무 데도 안 간다. 원문 기사로 바로 이동하게 하려면 웹페이지로 배포해야 한다.

1. **`output/artifact.html` 갱신**은 2번 작업(제작) 때 이미 완료되어 있어야 한다 — 각 `.top3-card`와 `.list-item`이 `<a href="원문URL" target="_blank" rel="noopener">`로 감싸져 있는지 확인한다. 로고는 상대경로(`../assets/...`)가 아니라 **base64 data URI로 인라인**해야 한다 (Netlify 배포 시 정적 파일 경로가 달라짐). 기존 파일에 이미 인라인돼 있으니 보통은 그대로 두면 되고, 로고를 교체할 때만 다시 넣는다:
   ```
   python -c "
   import base64, re
   with open('assets/logo_iemhometok_256.png','rb') as f:
       uri = 'data:image/png;base64,' + base64.b64encode(f.read()).decode('ascii')
   for p in ['output/artifact.html','netlify-deploy/index.html']:
       with open(p, encoding='utf-8') as f: h = f.read()
       h = re.sub(r'<img src=\"data:image/png;base64,[^\"]+\"', '<img src=\"'+uri+'\"', h)
       with open(p, 'w', encoding='utf-8') as f: f.write(h)
   "
   ```

2. **`output/cover-only.html` 갱신**: 커버 섹션(로고+타이틀+Top3)만 담은 별도 소스. 카톡 미리보기(OG 카드)에 쓸 이미지 전용이라 폭을 1200px로 키워서 렌더링한다. 전체 세로 리스트를 OG 이미지로 쓰면 미리보기에서 심하게 잘리므로 반드시 커버만 별도로 만든다.

3. **`netlify-deploy/index.html` 조립**: `output/artifact.html`의 `<div class="sheet">` 본문을 그대로 쓰고 `<head>`에 OG 메타태그를 더한다. `title`/`og:title`/`og:description`은 이번 주 내용에 맞게 갱신하고, `og:image`·`og:url`은 `https://realestate-weekly-top10.netlify.app` 도메인을 유지한다. **`og:image:width/height`는 손대지 않는다** — `npm run render:og`가 실제 PNG에서 읽어 자동으로 맞춘다.

4. **배포**: `git push`만 하면 된다. Netlify가 `master` 브랜치에 자동배포로 연동돼 있다.
   ```
   npm run check && git add -A && git commit -m "Weekly update: {기간}" && git push
   ```
   - `netlify deploy` CLI는 쓰지 않는다 (클라우드 루틴에서는 아예 막혀 있고, 로컬에서도 자동배포와 이중으로 꼬인다).
   - 배포 후 이 URL을 카톡에 붙여넣으면 og-image.png가 미리보기로, 클릭 시 실제 페이지로 이동한다.
   - **push 전 `git fetch`로 원격 확인**: 크론 루틴이 이미 그 주 발행을 push해뒀을 수 있다. 그러면 같은 파일이 충돌하므로, 원격 내용을 확인한 뒤 rebase해서 올린다.

## 이미지 파일만 보낼 때 (클릭 불필요, 빠르게 공유만 할 때)

완성된 PNG(`output/부동산주간뉴스Top10_{날짜}.png`)를 카카오톡 채팅방에 이미지 파일로 직접 첨부해서 보내면 된다. 이 경우 원문 링크로는 연결되지 않는다.

## 자동화 (매주 월요일 08:00 KST 자동 발행)

이 프로젝트는 클라우드 크론 루틴으로 매주 자동 발행되도록 설정되어 있다. **컴퓨터가 꺼져 있어도 동작한다** (Anthropic 클라우드 인프라에서 실행되며 로컬 PC와 무관).

- **GitHub 저장소**: https://github.com/hyunjkim6207-byte/realestate-weekly-top10 (public). 클라우드 에이전트는 이 저장소를 clone해서 작업한다 — 로컬 PC 파일에는 접근하지 못하므로, render 스크립트와 `package.json`이 저장소 안에 포함되어 있다.
- **배포 URL**: https://realestate-weekly-top10.netlify.app (Netlify 사이트 이름 = GitHub 저장소 이름으로 통일함)
- **배포 방식**: Netlify가 이 GitHub 저장소(`master` 브랜치)에 **자동배포로 연동**되어 있다 (base directory: `netlify-deploy`). 즉 클라우드 에이전트는 `git push`만 하면 되고, Netlify API를 직접 호출할 필요가 없다 — 클라우드 샌드박스 환경은 `api.netlify.com`으로의 아웃바운드 연결(CONNECT)이 방화벽에 막혀 있어서 `netlify-cli`로 직접 배포하는 방식은 동작하지 않는다는 것이 확인됨(2026-08-26 테스트).
- **GitHub push 권한**: 클라우드 에이전트가 이 저장소에 push하려면 Claude GitHub App이 저장소(또는 계정 전체)에 설치되어 있어야 한다 (https://github.com/apps/claude/installations/select_target 에서 설치/확인). 설치 안 돼 있으면 push가 403으로 실패한다.
- **크론 루틴**: 이름 "부동산 주간뉴스 TOP10 자동발행", ID `trig_01FCr9TT9FJPDyAkFsWvBoDH`, 크론 `0 23 * * 0` (UTC 일요일 23시 = 월요일 08:00 KST). 관리 링크: https://claude.ai/code/routines/trig_01FCr9TT9FJPDyAkFsWvBoDH
- 루틴 실행 시마다: (1) 그 시점 기준 지난 7일 부동산 뉴스 리서치 → (2) `output/*.html` 3종 갱신 → (3) `npm install` 후 puppeteer로 PNG 2종 렌더링(클라우드 샌드박스에서 정상 동작 확인됨, `--no-sandbox` 필요) → (4) `netlify-deploy/index.html` 재조립 → (5) `npm run check` → (6) git commit & push → (7) push가 Netlify 자동배포를 트리거.
- 수동으로 지금 당장 1회 실행해보고 싶으면 `RemoteTrigger`의 `run` 액션으로 `trig_01FCr9TT9FJPDyAkFsWvBoDH`를 실행하면 된다.

### 알려진 특이사항

- **렌더링 높이는 환경마다 다르다.** 클라우드(puppeteer 23.11.1)와 로컬(24.x)은 폰트·Chrome 버전 차이로 커버 PNG 높이가 10~20px 달라진다. 그래서 `og:image:height`를 사람이 적으면 반드시 틀어진다 — `render:og`의 자동 동기화에 맡기고, `npm run check`로 확인한다.
- **주간 PNG가 매주 저장소에 쌓인다** (1개당 약 1MB). 저장소가 너무 커지면 오래된 `output/부동산주간뉴스Top10_*.png`를 정리한다. 최신 것과 직전 것 정도만 남기면 충분하다.
