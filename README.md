# 인간주식 / Human Stock

폐쇄형 크루 안에서 친구의 성취를 주식처럼 사고파는 소셜 성장 게임 MVP.

## 포함된 파일

- `PRD.md` — 기능명세/PRD v5
- `index.html` — 모바일 우선 MVP 화면
- `styles.css` — 화이트 금융앱 + 게임형 UI 스타일
- `app.js` — mock 데이터, 화면 이동, 매수/매도, 인증, 베팅 로직

## 현재 MVP 범위

- 온보딩 / 크루 생성
- 크루 홈
- 종목 상세
- FV vs 시장가
- 매수/매도 mock
- 일과 인증 mock
- AI 속보 mock
- 내일의 너 Long/Short 베팅 mock
- 리더보드

## 실행 방법

```bash
cd /Users/nanayong/Projects/human-stock
python3 -m http.server 8097
```

브라우저에서 `http://127.0.0.1:8097` 접속.

## 주의

- 실제 온체인/AI/사진 위조 탐지는 아직 연결하지 않음.
- 모든 가격·뉴스·베팅은 mock 데이터임.
