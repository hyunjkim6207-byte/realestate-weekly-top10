# 이음홈톡 · 부동산 주간뉴스 TOP 10 대시보드

카카오톡 공유용 세로형 카드 이미지. **매주 월요일 발행하는 주간 브리핑**이다. "리포트 만들어줘" 같은 요청이 오면 아래 절차를 그대로 따른다 (매번 다시 물어볼 필요 없음).

## 발행 주기

- 매주 월요일, **직전 1주일(월~일)** 기준 부동산 뉴스를 정리해 발행한다.
- 커버 날짜 표기는 기간형으로 쓴다: 예) "8월 12일 – 8월 18일" (`output/report.html`의 `.cover-date`, `output/cover-only.html`, `output/artifact.html` 3곳 모두 동일하게 갱신).
- 타이틀은 "부동산 주간뉴스 TOP 10"으로 고정한다 ("부동산 뉴스 TOP 10"이 아님 — 2026-08-18에 주간지로 개편함).
- 브랜드 서브텍스트도 "Weekly Real Estate Brief"로 통일 (`.brand-sub`, footer `.doc-footer`).

## 작업 절차

1. **리서치**: 발행일 기준 지난 1주일간의 부동산 관련 뉴스를 웹 검색으로 10개 수집한다.
   - 정부 정책(세제개편, 대출규제, 종부세·양도세), 서울 시세 동향, 재건축/재개발, 비아파트(빌라)·임대시장, 실수요자(2030 등) 반응 등 카테고리를 고루 섞는다.
   - 항목별로 실제 기사 제목·언론사·URL·2~3문장 요약을 확보한다. **URL은 검색 결과에 실제로 뜬 것만 사용하고 지어내지 않는다.**
   - 확실도가 낮은 항목(단일 근거 기사를 못 찾음)은 사용자에게 알리고 다른 이슈로 교체할지 확인한다.
   - 서로 다른 항목이 같은 URL/같은 통계를 인용하는 중복이 없는지 확인한다 — 겹치면 더 구체적인 소재를 다룬 기사로 교체.
   - 지난주와 주제가 겹치는 이슈(예: 세제개편 후속 통계)는 최신 수치로 업데이트된 것이면 포함 가능하나, 가능한 새 소재를 우선한다.
   - Top3(커버 카드용)는 임팩트가 가장 큰 이슈로 선정한다.

2. **제작**: 아래 3개 파일의 커버(Top3)와 본문(10개 리스트)을 모두 동일한 내용으로 갈아끼운다.
   - `output/report.html` — PNG 렌더링용 소스 (링크 없음)
   - `output/cover-only.html` — OG 미리보기 이미지용 (커버만)
   - `output/artifact.html` — Netlify/Artifact 배포용 (각 항목이 `<a href="원문URL">`로 감싸짐)
   - 커버(`.top3` 안 3개 `.top3-card`): 번호, 헤드라인, 서브캡션
   - 본문(`.list-wrap` 안 10개 `.list-item`): 번호, 제목, 요약, 언론사명/도메인
   - 날짜 표기(`.cover-date`)를 발행 주간의 기간으로 갱신한다.

3. **렌더링**: PNG 2종(전체 카드뉴스 + OG 커버 썸네일)을 만든다.
   ```
   cd "C:\AI\카드뉴스"
   node render-realestate-top10.js   # output/report.html → output/부동산주간뉴스Top10_{날짜}.png
   node render-og-cover.js           # output/cover-only.html → netlify-deploy/og-image.png
   ```
   - 파일명(`부동산주간뉴스Top10_{날짜}.png`)이 바뀌면 `render-realestate-top10.js` 상단 `outPath`도 같이 수정한다. 날짜는 발행일(월요일) 기준.
   - Node 모듈은 이 프로젝트에 없고 `C:\AI\카드뉴스\node_modules`의 puppeteer를 재사용한다 (그래서 스크립트가 그 폴더에 있음).

## 디자인 확정 사항 (임의로 바꾸지 말 것)

- **폭 600px**, 세로로 긴 카드 비율. 카카오톡 공유에 적합한 사이즈.
- **색상**: 커버는 블루-틸 그라데이션(`#6ba0ac → #588e9c → #497b8c`), 포인트는 골드 그라데이션(`#eecf95 → #c9a15c`), 타이틀 텍스트는 아이보리-골드 그라데이션(`#fff6d6 → #ffe9a8 → #f3d383`) + 얇은 골드 테두리(`-webkit-text-stroke`)로 굵게 강조.
- **본문 배경**: 위→아래 은은한 그라데이션(`#fefdfb → #fbf8f2 → #f6f0e4`), 순백보다 살짝 밝은 크림톤 유지.
- **Top3 카드**: 원형 골드 배지(숫자) + 흰 카드, 배경에 다른 색 얼룩(radial-gradient 장식)은 넣지 않는다 — 과거 시도에서 지저분해 보인다는 피드백으로 제거함.
- **본문 리스트 번호(1~10)**: 검정(`#1a1a1a`). 골드로 하지 말 것 — 사용자가 명시적으로 검정 요청.
- **로고**: `assets/logo-transparent.png` (이음홈톡 방패 로고, 배경 투명 처리됨). 원본은 `logo-mark.png`. 배경 흰색을 투명화할 때는 RGB 235 이상인 픽셀을 투명 처리하는 방식을 사용했음(Pillow).
- **날짜 중복 금지**: 커버 상단(`8월 18일`)에 이미 날짜가 있으므로 `cover-footer`에는 날짜를 넣지 않는다.

## 파일 구조

```
뉴스Top-10 대시보드/
├── CLAUDE.md              ← 이 파일
├── logo-mark.png          ← 원본 로고 (흰 배경)
├── assets/
│   └── logo-transparent.png  ← 배경 투명화된 로고 (실사용)
├── output/
│   ├── report.html         ← 전체 리포트(커버+10개 리스트) 소스, 재렌더링 시 이 파일을 덮어씀
│   ├── cover-only.html      ← 커버(로고+타이틀+Top3)만 담은 소스, OG 미리보기 이미지용
│   ├── artifact.html        ← Claude Artifact 게시용(og 없음, 링크 클릭 가능, 라이트/다크 테마 대응)
│   └── 부동산뉴스Top10_{날짜}.png  ← 카톡 파일첨부용 전체 세로 이미지
└── netlify-deploy/
    ├── index.html           ← Netlify 배포용 완전 문서(artifact.html + OG 메타태그)
    └── og-image.png          ← 카톡 미리보기 썸네일 (cover-only.html 렌더링 결과, 1200×1059)
```

## 클릭 가능한 링크로 카톡 공유 (권장 — 뉴스 클릭 시 원문 이동)

이미지 파일만 보내면 클릭해도 아무 데도 안 간다. 원문 기사로 바로 이동하게 하려면 웹페이지로 배포해야 한다.

1. **`output/artifact.html` 갱신**은 2번 작업(제작) 때 이미 완료되어 있어야 한다 — 각 `.top3-card`와 `.list-item`이 `<a href="원문URL" target="_blank">`로 감싸져 있는지 확인한다. 라이트/다크 테마 CSS 변수(`:root`, `@media prefers-color-scheme: dark`, `:root[data-theme="dark"]`)가 이미 잡혀 있으니 유지한다. 로고는 상대경로(`../assets/...`)가 아니라 base64 data URI로 인라인해야 한다 (Netlify 배포 시 정적 파일 경로가 달라짐):
   ```
   python3 -c "
   import base64
   with open('output/artifact.html','r',encoding='utf-8') as f: html=f.read()
   with open('assets/logo-transparent.png','rb') as f: b64=base64.b64encode(f.read()).decode('ascii')
   html = html.replace('__LOGO_DATA_URI__', 'data:image/png;base64,'+b64)  # 신규 작성 시엔 img src를 __LOGO_DATA_URI__ 플레이스홀더로 넣고 치환
   with open('output/artifact.html','w',encoding='utf-8') as f: f.write(html)
   "
   ```

2. **`output/cover-only.html` 갱신**: 커버 섹션(로고+타이틀+Top3)만 담은 별도 소스. 카톡 미리보기(OG 카드)에 쓸 이미지 전용이라 폭을 1200px로 키워서 렌더링한다. 전체 세로 리스트를 OG 이미지로 쓰면 미리보기에서 심하게 잘리므로 반드시 커버만 별도로 만든다.
   ```
   cd "C:\AI\카드뉴스"
   node render-og-cover.js   # output/cover-only.html → netlify-deploy/og-image.png (1200×1059 근처)
   ```

3. **`netlify-deploy/index.html` 조립**: `output/artifact.html`을 완전한 HTML 문서로 감싸고 `<head>`에 OG 메타태그를 추가한다 (제목, 설명, `og:image`는 아래 4번의 배포 도메인 + `/og-image.png`, `og:image:width`/`height`는 2번에서 실제로 나온 PNG 크기와 일치시킨다).

4. **Netlify 배포**:
   ```
   cd "C:\AI\업무\뉴스레터_대시보드\뉴스Top-10 대시보드\netlify-deploy"
   netlify deploy --dir . --prod
   ```
   - 최초 1회는 `netlify login`으로 브라우저 인증 필요. 이후는 로그인 유지됨.
   - 첫 배포 시 사이트가 랜덤 이름으로 자동 생성된다 (예: `realestate-weekly-top10.netlify.app`). 이후 같은 폴더에서 재배포하면 같은 도메인이 유지된다 — 새 리포트를 만들 때마다 매번 이 도메인을 재사용한다(새 사이트로 만들지 않는다).
   - 배포 후 이 URL을 카톡에 붙여넣으면 og-image.png가 미리보기로, 클릭 시 실제 페이지로 이동한다.

## 이미지 파일만 보낼 때 (클릭 불필요, 빠르게 공유만 할 때)

완성된 PNG(`output/부동산뉴스Top10_{날짜}.png`)를 카카오톡 채팅방에 이미지 파일로 직접 첨부해서 보내면 된다. 이 경우 원문 링크로는 연결되지 않는다.

## 자동화 (매주 월요일 08:00 KST 자동 발행)

이 프로젝트는 클라우드 크론 루틴으로 매주 자동 발행되도록 설정되어 있다. **컴퓨터가 꺼져 있어도 동작한다** (Anthropic 클라우드 인프라에서 실행되며 로컬 PC와 무관).

- **GitHub 저장소**: https://github.com/hyunjkim6207-byte/realestate-weekly-top10 (public). 클라우드 에이전트는 이 저장소를 clone해서 작업한다 — 로컬 PC 파일에는 접근하지 못하므로, render 스크립트(`scripts/render-realestate-top10.js`, `scripts/render-og-cover.js`)와 `package.json`이 저장소 안에 포함되어 있다.
- **배포 URL**: https://realestate-weekly-top10.netlify.app (Netlify 사이트 이름 = GitHub 저장소 이름으로 통일함)
- **배포 방식**: Netlify가 이 GitHub 저장소(`master` 브랜치)에 **자동배포로 연동**되어 있다 (base directory: `netlify-deploy`). 즉 클라우드 에이전트는 `git push`만 하면 되고, Netlify API를 직접 호출할 필요가 없다 — 클라우드 샌드박스 환경은 `api.netlify.com`으로의 아웃바운드 연결(CONNECT)이 방화벽에 막혀 있어서 `netlify-cli`로 직접 배포하는 방식은 동작하지 않는다는 것이 확인됨(2026-08-26 테스트).
- **GitHub push 권한**: 클라우드 에이전트가 이 저장소에 push하려면 Claude GitHub App이 저장소(또는 계정 전체)에 설치되어 있어야 한다 (https://github.com/apps/claude/installations/select_target 에서 설치/확인). 설치 안 돼 있으면 push가 403으로 실패한다.
- **크론 루틴**: 이름 "부동산 주간뉴스 TOP10 자동발행", ID `trig_01FCr9TT9FJPDyAkFsWvBoDH`, 크론 `0 23 * * 0` (UTC 일요일 23시 = 월요일 08:00 KST). 관리 링크: https://claude.ai/code/routines/trig_01FCr9TT9FJPDyAkFsWvBoDH
- 루틴 실행 시마다: (1) 그 시점 기준 지난 7일 부동산 뉴스 리서치 → (2) `output/*.html` 3종 갱신 → (3) puppeteer로 PNG 2종 렌더링(클라우드 샌드박스에서 정상 동작 확인됨, `--no-sandbox` 필요) → (4) `netlify-deploy/index.html` 재조립 → (5) git commit & push → (6) push가 Netlify 자동배포를 트리거.
- 수동으로 지금 당장 1회 실행해보고 싶으면 `RemoteTrigger`의 `run` 액션으로 `trig_01FCr9TT9FJPDyAkFsWvBoDH`를 실행하면 된다.
