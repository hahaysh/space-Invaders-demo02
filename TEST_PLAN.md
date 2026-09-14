# 우주 방어 검증 계획

제품 규칙·수치의 기준은 [PRD.md](PRD.md), 기술 책임은 [TRD.md](TRD.md)다.
이 문서는 확인 경로를 정의하며 실제 실행 결과는 [TEST_RESULTS.md](TEST_RESULTS.md)에만 기록한다.
05-01은 기존 검사를 재사용한다. 실제 결함이 나오면 다음 단계 입력으로 남기며 가상 결함을 만들지 않는다.

## 요구사항별 확인 경로

| 기준 | 순수 모델: `tests/model.test.js` | 브라우저: `tests/browser/game.spec.js` 및 화면 확인 |
|---|---|---|
| R01 시작 | title 불변·깨끗한 playing 진입·중복 시작 방지 | 제목·안내·시작 버튼·Enter·Tab 접근·title 이동/발사 무시 |
| R02 이동 | 속도·반대 입력 상쇄·양쪽 경계 | 화살표와 A/D 실제 입력, Canvas 위치·경계·상쇄 |
| R03 발사 | 출발 좌표/크기·속도·간격·해제 후 쿨다운·화면 밖 제거·불규칙 시간 분할 | Space 유지/해제·반복 탄환 픽셀·상승·스크롤 방지 |
| R04 편대 | 모든 초기 셀·방향·속도·양쪽 반전/하강·남은 적 경계 | 초기 편대 픽셀·우측 이동·반전/하강 |
| R05 충돌/점수 | 탄환 하나/적 하나·중복 득점 방지·충돌 통과 방지 | 실제 발사로 적 픽셀 감소·DOM 점수 증가 |
| R06 승패 | 마지막 적 제거 우선·생존 적 방어선 도달·정확한 바닥 임계값 | 무입력 자연 패배·좌우 발사 자연 승리·DOM 결과/점수 |
| R07 종료 정지 | 두 결과에서 모든 모델 필드 불변 | 종료 후 이동/발사 입력에도 Canvas 전체 이미지·점수 불변 |
| R08 재시작 | 두 결과의 중첩 상태·시간·쿨다운 초기화, title/playing 재시작 무시 | R/버튼·반복 재시작·초기 편대/점수/탄환/플레이어·잔여 입력 제거, playing Enter/R 무시 |
| R09 입력 관리 | title/종료의 진행 입력 무시 | 단발 repeat 무시·게임 키만 기본 동작 방지·blur/hidden 입력 제거·자동 일시정지 없음 |
| R10 안내/실행 | PRD와 RULES·README·scripts 대조 | UI 제목/키/목표/결과와 README 일치, 아래 build/preview 검사 |

브라우저는 실제 버튼/키 입력과 DOM/Canvas 관찰을 사용하며 앱 모델 전역 노출·상태 주입·치트를 금지한다.
E2E 시간은 Playwright clock으로 제어한다. blur/hidden·일부 repeat/defaultPrevented는 합성 이벤트 검사이며 실제 OS 탭 전환이 아니다.
충돌 동시 판정·정밀한 수치/시간/중첩 상태는 순수 모델 검사로만 주장한다.

## 실행 순서

1. 격리 경로·branch·HEAD·기준 main 이력, 실제 package scripts·테스트를 확인한다. 기존 사용자 변경은 보존한다.
2. `npm test`로 순수 모델을 검사하고 `npm run build`로 배포 산출물을 만든다. 필요한 의존성이 없다는 실제 실패 후에만 `npm ci --no-fund --no-audit --registry=https://registry.npmjs.org`로 정상 lock을 유지해 설치한다. E2E 실행 시 Chromium 없음이 확인될 때만 `npm run browser:install`을 사용한다.
3. 5173 소유권/충돌을 확인하고 `npm run dev`를 실행한다. 새 소유 shell·PID·명령행·HTTP 응답을 기록한 뒤 `npm run test:e2e`를 실행한다. 다른 프로젝트 서버를 재사용하거나 모르는 PID를 종료하지 않는다.
4. 소유 dev를 종료한다. `npm run preview`로 4173의 빌드 루트를 검사한다. HTTP·실제 시작/이동/발사·DOM/Canvas·콘솔/페이지 오류를 확인한다. 일반 시간 입력은 clock 기반 E2E와 구분한다.
5. 소유 루트 preview 종료 후 `npm run preview -- --base=/space-Invaders-demo02/`로 같은 산출물의 로컬 하위 경로를 검사한다. `/space-Invaders-demo02/`에서 문서·JS·CSS·favicon의 실제 URL, HTTP 성공 및 올바른 MIME/본문을 확인한다. SPA fallback의 HTML 200을 자산 성공으로 오인하지 않는다. 페이지 새로고침 후 시작·이동·발사 입력과 DOM/Canvas를 다시 확인한다. 로컬 preview는 Pages 공개 검증이 아니다.
6. README 조작/명령과 화면을 대조하고 가능하면 스크린샷을 세션 아티팩트에 보존한다. 사람이 직접 한 판 플레이하며 가독성·체감 조작을 확인하는 경로는 별도 수동 확인이며, 수행하지 않았으면 미확인으로 남긴다. 다른 OS/브라우저·실제 탭 전환도 마찬가지다.
7. 소유 브라우저·서버를 종료하고 해당 PID 종료·포트 해제를 확인한다. 실행 시각·명령·소요 시간·실패/원인·미실행을 결과와 이슈 #4 단계 댓글에 기록한다. diff 검토 후 허용된 feature 커밋·push만 수행한다.

## Skill 통합 확인

`.github/skills/game-check/SKILL.md` 하나만 사용한다. frontmatter는 `name: game-check`와 사용 시점을 설명하는 `description`만 두며 별도 shell script나 `allowed-tools` 일괄 승인을 추가하지 않는다.

파일 생성 다음에 제공 Skill 도구로 `game-check`를 실제 호출하고 응답을 기록한다. 명시적 파일 읽기는 호출의 증거가 아니다.
활성 세션에서 미발견이면 공식 App 문서와 제공 도구의 지원 갱신 수단만 확인한다. CLI `/skills reload`를 App UI 명령으로 위장하거나 trust 저장 파일을 변조하지 않는다.
안전한 갱신이 없으면 일반 검증임을 명시하고 현재 feature를 보존·push하여 coordinator의 같은 feature 기반 새 읽기/검사 전용 세션에 인계한다.
실제 호출 확인 전에는 IMPLEMENTATION_PLAN의 05-01을 진행, 누적 9/20으로 유지한다.
