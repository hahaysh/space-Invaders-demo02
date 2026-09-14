---
name: game-check
description: 우주 방어 게임의 기능 변경 후 또는 검증 요청 시 PRD와 TEST_PLAN에 따라 모델 규칙, 실제 브라우저 입력·DOM·Canvas, 빌드와 로컬 하위 경로를 검사하고 실제 결과와 미확인을 구분해 보고한다.
---

# 우주 방어 검증

현재 격리 worktree에서 AGENTS.md, PRD.md, TRD.md, TEST_PLAN.md, TEST_RESULTS.md와 package.json의 실제 scripts 및 기존 tests를 먼저 읽는다. 수치·게임 규칙을 복제하지 말고 PRD를 따른다.

TEST_PLAN의 요구사항별 경로와 실행 순서를 적용한다. 기존 `npm test`, `npm run dev`, `npm run test:e2e`, `npm run build`, `npm run preview`를 재사용하고 하위 경로는 계획의 preview 인자를 사용한다.
의존성 설치는 선택한 명령이 missing-dependency로 실패했을 때만 공개 registry의 `npm ci`를 사용하고 정상 lock을 보존한다. Chromium이 없다는 실제 실패 시에만 `npm run browser:install`을 사용한다.

순수 모델의 제어 시간·경계 검사와 실제 브라우저 키/버튼·DOM/Canvas 검사를 분리한다. 앱 전역 모델 노출·치트·테스트 전용 게임 상태 주입은 금지한다. Playwright clock, 합성 입력 정리 이벤트, 일반 시간 입력, 사람 직접 플레이를 서로 구분한다.

서버의 소유 shell·PID·포트·HTTP 응답을 확인한다. 다른 프로젝트 서버를 검사하거나 모르는 PID를 종료하지 않는다. 소유 서버와 브라우저만 정리하고 종료·포트 해제를 확인한다.

TEST_RESULTS.md에 실제 시각·명령·환경·소요 시간·결과·실패 원인·미실행/미확인을 기록한다. 실패를 숨기거나 기대값을 낮추지 않는다. Skill 도구의 실제 호출 응답과 단순 파일 읽기를 구분한다. 파일을 읽었다는 이유로 App 인식·호출·자동 적용을 성공이라고 쓰지 않는다.

요청 범위 밖의 코드 수정·설정 trust 변경·PR·병합·배포는 하지 않는다. 읽기/검사 전용 요청이면 파일도 수정하지 말고 결과를 요청자에게 보고한다. 현재 단계의 검증 결과와 남은 확인 사항을 간결하게 보고한다.
