# 우주 방어 구현 계획

## 기준 및 계획 검토

- 제품 기준은 `PRD.md`, 기술 결정은 `TRD.md`, 대상과 재미는 `ideation.md`를 따른다. 수치와 규칙을 이 문서에 복제하지 않는다.
- 2026-09-14 준비 확인: 격리 worktree의 HEAD, origin/main, 공통 조상 및 원격 main은 모두 `1de6e84915cfa8cf7cac4437ee1a280ce8996236`이었다. 네 설계 문서를 main에서 전문 읽었고 이슈 #2 본문과 댓글(없음)을 확인했다.
- 초기 브랜치 `hahaysh-issue-2-0b2b7e`를 파일 생성 전에 App 도구로 `hahaysh-space-defense-basic-game`으로 변경했다.
- 고정 안내서 `hahaysh/space-Invaders@3637e1ad7897a2e674aa85cb8f3f6154da4b3907`의 `docs/04-01-첫-게임-구현.md`를 GitHub API로 직접 전문 읽었다. 원본 안내서나 샘플을 복사하지 않는다.
- M1을 먼저 검토하고 이 파일을 코드 및 설치보다 먼저 작성했다. 순서는 순수 모델 → 입력과 렌더링 → Node 및 실제 브라우저 검사 → diff 검토 → 커밋·feature push·이슈 기록이다.
- 사용자 위임 승인에 따른 자동 실행이다. 사람이 App Plan/Interactive UI를 직접 승인·전환했다거나 App 지침이 자동 적용되었다고 주장하지 않는다.

## 마일스톤

| 작업 | 요구사항 | 예상 변경 | 실제 확인 방법 | 상태 |
|---|---|---|---|---|
| M1 / 04-01 | R01~R03, R09의 시작·진행 입력 | manifest/lock, Vite, 순수 모델, HTML/CSS/Canvas UI, Node 및 브라우저 검사 | 시작 버튼·Enter, 실제 키, DOM 및 Canvas 픽셀, 모델 시간·경계, 서버 응답, build | 실제 완료, 아래 실행 기록 참조 |
| M2 / 04-02 | R04~R08 및 종료 입력 | 편대·충돌·점수·승패·재시작과 관련 검사 | 모델 경계·충돌·우선순위·초기화, 실제 브라우저 입력·결과 | 실제 완료, 아래 04-02 실행 기록 참조 |
| M3 / 04-03 | R10 및 기본 게임 인도 | README, 실제 명령 기반 App 설정, 검증 정리 | 실행·조작 대조, 명령 재실행, PR 리뷰·검사 | 완료, PR #3 병합 및 원격 main 확인; App trust/Run은 미확인 |

M1에는 적·점수·승패·재시작이 없었으며 M2에서 추가했다. 일시정지·난이도·목숨·적 공격·배포는 이번 작업에서 제외한다.

## 20단계 진행표

| 순서 | 단계 | 상태 | 근거 |
|---|---|---|---|
| 1 | 01-01 | 완료 | 기존 Initial commit `23f9d7b` 보존 |
| 2 | 01-02 | 완료 | `cae937f` |
| 3 | 02-01 | 완료 | `72fa938` |
| 4 | 02-02 | 완료 | `36d74e2` |
| 5 | 02-03 | 완료 | `e76acf8` |
| 6 | 03-01 | 완료 | 문서 PR #1 병합 `1de6e849`, 이슈 #2 및 현재 격리 새 세션 확인 |
| 7 | 04-01 | 완료 | M1 구현, Node 8/8·Chromium 5/5·build, 실제 결과는 아래 기록 |
| 8 | 04-02 | 완료 | M1 회귀 포함 Node 19/19·Chromium 8/8·build, 자연 승패·정지·재시작 확인 |
| 9 | 04-03 | 완료 | PR #3 정상 병합 `4c416e85`, 이슈 #2 완료 댓글과 원격 main 확인 |
| 10 | 05-01 | 완료 | 동일 feature HEAD의 새 읽기/검사 세션에서 Skill 실제 발견·호출 및 검증 성공, 아래 복구 근거 참조 |
| 11 | 05-02 | 완료 | PRD 전체 기준과 실제 검증 증거 대조, 제품 결함·필수 검사 누락 없음; 수정/중복 suite 불필요 |
| 12 | 06-01 | 예정 | 미실행 |
| 13 | 06-02 | 예정 | 미실행 |
| 14 | 06-03 | 예정 | 미실행 |
| 15 | 07-01 | 예정 | 미실행 |
| 16 | 07-02 | 예정 | 미실행 |
| 17 | 08-01 | 예정 | 미실행 |
| 18 | 08-02 | 예정 | 미실행 |
| 19 | 09-01 | 예정 | 미실행 |
| 20 | 09-02 | 예정 | 미실행 |

앞 단계 커밋 근거는 이슈 #2와 coordinator 전달 내용이다. 이 세션에서 앞 단계를 다시 수행한 것은 아니다.

## 04-01 실행 기록

- 2026-09-14 12:25 +09:00: Node `v24.14.1`, npm `10.8.3` 확인.
- `npm view vite version engines --json`은 `8.3.0-beta.0`을 반환했다. 사전판을 제외하고 `npm view vite@8 version engines --json`으로 안정판 `8.2.2`를 선택했다.
- `npm view @playwright/test version engines --json` 및 해당 버전 dependencies 조회로 안정판 `1.63.0`을 확인했다. 두 패키지 모두 현재 Node와 호환된다.
- 위 정확한 버전과 실행 scripts를 manifest에 먼저 정의한 뒤 `npm install --no-fund --no-audit`를 실행했다(18개 패키지, npm 표시 약 1분). Chromium이 이미 실행 가능하여 `npm run browser:install`은 실행하지 않았다.

### 실제 검사 및 검토

검증 환경은 Windows, 위 Node/npm, Playwright Chromium이다. 다음 시간은 2026-09-14 +09:00이며 소요 시간은 각 도구의 출력값이다.

| 시각 | 실제 명령·검사 | 결과 |
|---|---|---|
| 12:27~12:29 | `npm test`, `npm run build`, `npm ls --depth=0` | 최초 Node 7/7, build 571ms, manifest와 설치 버전 일치 |
| 12:29 | `npm run test:e2e` | Chromium 5/5, 28.3초 |
| 12:30 | `npm test && npm run test:e2e && npm run build` | 불규칙 프레임 간격 검사를 추가하고 발사 시각에서 하위 갱신을 나누도록 보강한 뒤 Node 8/8, 249ms; Chromium 5/5, 14.3초; build 143ms |
| 12:31 | 위 세 명령 재실행 | favicon 보완 뒤 Node 8/8, 178ms; Chromium 5/5, 13.6초; build 136ms |
| 12:32 | 별도 Playwright 브라우저 도구의 실제 버튼 클릭·ArrowRight/Space 입력, DOM 및 Canvas 읽기 | 진행 상태, 이동 후 우주선 픽셀 x=461, 탄환 픽셀 99 확인. 가상 시계 없는 실제 시간 입력. 수정 후 콘솔 오류 0 |
| 12:34 | 공개 npm lockfile로 `npm ci --no-fund --no-audit --registry=https://registry.npmjs.org` | 18개 패키지, 7초. 후속 엄격 검사에서 불필요한 로컬 링크를 발견하여 아래 절차로 제거 |
| 12:34 | `npm test && npm run build`, `npm run test:e2e` | Node 8/8, 185ms; build 859ms; Chromium 5/5, 14.0초 |
| 12:36 | worktree에서 `npm install --package-lock-only --ignore-scripts --no-fund --no-audit --registry=https://registry.npmjs.org` | manifest 기준 lockfile 정규화, 로컬 링크 제거. 공개 registry URL 및 인증정보 부재, manifest/lock 일치 검사 통과 |
| 12:36 | `npm ci --no-fund --no-audit --registry=https://registry.npmjs.org && npm test && npm run build` | 최종 clean install 18개, 3초; Node 8/8, 173ms; build 417ms |
| 12:37 | `npm run test:e2e` | 최종 Chromium 5/5, 12.6초 |
| 12:32~12:37 | application/test 전체 staged diff 및 `git diff --cached --check` 검토 | 기존 네 문서 변경 없음, 생성물 제외, M2 기능·전역 모델·치트 없음. 빌드 HTML의 자산·favicon 경로가 상대 경로임을 확인 |

Node 검사는 PRD의 초기 상태·좌표·속도·양쪽 경계·반대 입력·탄환 출발/간격/제거·불규칙 시간 분할을 확인한다.
Chromium 검사는 실제 버튼·키보드 입력 및 DOM/Canvas 픽셀로 시작·이동·반대 입력·경계·연속 발사·키 해제·스크롤 방지를 확인한다.
시간 제어가 필요한 E2E는 Playwright clock을 사용하며 앱 모델을 읽거나 쓰지 않는다.
blur 및 비표시 처리는 브라우저 이벤트를 합성하고 `document.hidden`을 테스트 안에서만 일시 대체하여 검증했다.
반복 Enter와 defaultPrevented의 세부 분기는 합성 KeyboardEvent로도 검사했다. 이 부분을 실제 OS 포커스·탭 전환이나 사람 입력 검증으로 간주하지 않는다.
별도 도구에서 title/playing 스크린샷을 캡처하고 진행 화면의 우주선·탄환·한국어 안내를 확인했다. 이미지는 세션 아티팩트로 보존하며 저장소에 넣지 않는다.

### 발견·실패 및 보완

- 최초 일반 브라우저 탐색에서 `/favicon.ico` HTTP 404 콘솔 오류를 발견했다. 자체 도형 SVG와 명시적 favicon 링크를 추가하고 HTTP 검사 및 브라우저 재탐색으로 해소했다. 테스트 assertion 실패는 발생하지 않았다.
- lockfile 검토에서 환경 기본 패키지 미러 주소를 발견했다. 공개 레지스트리의 동일 고정 버전을 재확인하고, 별도 세션 아티팩트 디렉터리에서 `npm install --package-lock-only --ignore-scripts --no-fund --no-audit --registry=https://registry.npmjs.org --prefix <artifact-dir>`로 새 lockfile을 생성했다. 생성 파일을 적용하고 위 `npm ci` 및 전체 검사를 다시 실행했다. 환경 미러 주소는 커밋하지 않는다.
- 위 `--prefix` 생성은 공개 패키지 주소 외에 작업 디렉터리의 불필요한 자기 참조 file 링크를 추가했다. 최종 엄격 URL 검사에서 실패로 검출했으며, 현재 worktree의 원래 manifest로 `npm install --package-lock-only`를 다시 실행해 제거했다. 최종 lockfile에는 로컬 링크·환경 경로·인증정보가 없고 manifest와 일치한다. 그 뒤 소유 서버를 종료하고 clean install·Node·build·Chromium 검사를 모두 다시 실행했다.
- lockfile 검사 명령의 `ConvertFrom-Json`은 빈 문자열 키 때문에 실패했다. `ConvertFrom-Json -AsHashtable`로 재실행하여 공개 레지스트리의 43개 resolved 항목을 확인했다.
- 스크린샷 도구에서 세션 아티팩트 절대 경로를 직접 지정한 첫 저장 요청은 허용 루트 밖이라는 오류로 실패했다. 도구의 허용 worktree에 상대 경로로 저장한 뒤 세션 아티팩트로 옮겼다.
- 위 도구 오류와 제품 결함을 구분했으며 의도적으로 실패를 만들거나 테스트 수를 맞추지 않았다.

### 서버 및 재실행

- 실행: 이 worktree에서 `npm run dev`; 별도 셸에서 `npm test`, `npm run test:e2e`, `npm run build`.
- E2E는 명시적으로 먼저 시작한 dev 서버가 필요하다. 자동 서버 재사용으로 다른 프로세스의 앱을 검사하지 않도록 이 세션이 서버의 명령행·소유권을 확인했다.
- 최초 서버: shell `m1-dev`, Node PID `16836`, `http://127.0.0.1:5173/`, HTTP 200. lockfile 재설치 전에 해당 소유 shell만 종료했고 기존 PID 종료도 확인했다.
- 중간 서버: shell `m1-dev-final`, Node PID `33984`, HTTP 200 확인 후 최종 lockfile clean install을 위해 소유 shell만 종료했다.
- 최종 서버: shell `m1-dev-verified`, Node PID `17652`, 부모 PID `14424`, 같은 URL/포트, HTTP 200. 해당 worktree의 Vite 명령행과 `--strictPort` 확인. 미리보기를 위해 세션에 연결된 상태로 유지하며 종료가 필요하면 소유 shell만 종료한다. 영구 분리 프로세스가 아니다.

### 인도 범위 및 미확인

- 완료: **[04-01, 7/20]**, M1 title/playing·시작·이동·발사 및 시작/진행 입력 정리.
- 미구현: M2의 적·점수·충돌·승패·재시작, M3의 README/App 설정. `.github`, PR·병합·배포 작업은 하지 않았다.
- 미확인: 사람 직접 플레이·App UI 직접 승인/모드 전환·App 지침 자동 적용, 실제 OS 탭 비표시 전환, 다른 브라우저/OS, preview 명령 실행.
- 다음은 coordinator의 별도 04-02 전달을 기다린다. 현재 기본 게임 이슈 전체를 완료한 것은 아니다.
- 원격 기록: 2026-09-14, 구현 커밋 `705303d13f6dfe3776ebc090be979ccbd2618940`을 작성한 뒤 `git push --set-upstream origin hahaysh-space-defense-basic-game` 성공. `git ls-remote --heads origin hahaysh-space-defense-basic-game`으로 동일 SHA를 확인했다. 강제 push, main 변경, PR 생성은 하지 않았다.
- 이 원격 결과 기록은 별도 문서 커밋으로 남긴다. 그 최종 HEAD와 검증·미확인·다음 단계는 이슈 #2 댓글 및 coordinator 완료 보고에 기록한다.

## 04-02 계획 및 실행 기록

### 구현 전 검토

- 2026-09-14 12:44~12:45 +09:00, 고정 SHA `3637e1ad7897a2e674aa85cb8f3f6154da4b3907`의 `docs/04-02-핵심-게임-완성.md`를 GitHub contents API raw 응답으로 직접 전문 읽었다. 이슈 #2 최신 본문·전체 댓글, PRD/TRD 및 M1 모델/UI/검사를 확인했다.
- 시작 HEAD는 `f3ca87fc008aa72b5ecc7cd0891cf4fda291c770`, 기존 feature branch와 clean worktree를 확인했다. 이전 네 설계 문서, 공개 registry manifest/lock을 유지한다. 의존성 변경이나 설치는 계획하지 않는다.
- 기존 소유 dev shell `m1-dev-verified`, PID `17652`, 포트 `5173`, HTTP 200 및 이 worktree의 Vite 명령행을 재확인했다.
- 순서는 아래 표와 같다. 제품 수치·승패·입력 규칙은 PRD를 그대로 참조하며 새 게임 수치를 정하지 않는다. M3 README/`.github`, PR·병합·배포는 아직 실행하지 않는다.

| 순서 | 변경 | 검사 |
|---|---|---|
| 1 | 순수 모델에 초기 편대·방향·점수 추가, 이동 경계 반전·하강 | PRD 전체 배치·속도·좌우 경계·하강·제거 후 남은 편대 경계 |
| 2 | 탄환/적 충돌·중복 제거 방지·점수, 충돌 후 won/lost 결정 | 단일/중복 충돌·마지막 적 제거 우선·방어선 도달·종료 후 모델 전체 불변 |
| 3 | 점수·방어선·적 그리기, 결과 및 재시작 버튼/R, 상태 전환 때 입력·시간 초기화 | 실제 키/DOM/Canvas로 점수·결과·정지·재시작·반복키·반복 새 게임 |
| 4 | M1 회귀와 M2 검사·build, diff 검토 후 인도 | 모델 제어 조건과 실제 브라우저 입력을 구분, 실패를 삭제하지 않고 실제 원인과 보완 기록 |

M1 발사/화면 밖 제거 검사는 M2 적과의 의도된 충돌을 피하는 모델 배치 또는 실제 플레이 위치에서 동일 기준을 확인한다.
브라우저 승패는 앱 상태를 주입하지 않고 실제 입력과 시간 진행으로 관찰한다. 자연 플레이가 어려운 동시 판정은 순수 모델에서만 검증한다.
사람 직접 플레이·App UI 승인·지침 자동 적용은 확인하지 않았으며 이번에도 사용자 위임 실행으로 기록한다.

### 실제 구현 및 검증

- 모델: PRD 편대·방향·점수, 살아 있는 적 기준 경계와 반전·하강, 탄환별 단일 충돌 처리, 중복 득점 방지, 충돌 후 승리 우선 판정을 연결했다. 종료 시 남은 하위 갱신을 중단하여 모델 시간도 멈춘다.
- UI: 적·점선 방어선, DOM 점수·승패 안내, 재시작 버튼과 반복 아닌 R을 추가했다. 시작·재시작·종료 시 입력을 비우고 시간 기준을 정리하며 단일 루프/리스너 구조를 유지한다.
- 변경 파일은 이 계획과 `src/model.js`, `src/main.js`, `index.html`, `tests/model.test.js`, `tests/browser/game.spec.js`의 여섯 파일이다. 기존 네 설계 문서·manifest·공개 registry lockfile·스타일은 변경하지 않았다.

| 시각 (2026-09-14 +09:00) | 실제 명령·관찰 | 결과 |
|---|---|---|
| 12:45~12:49 | `npm test` | Node 19/19 통과, 175ms. M1 규칙 및 편대 전체 배치/속도/양쪽 경계, 충돌 중복, 마지막 적/방어선 동시 판정, 종료 전체 상태 불변, 두 결과의 새 모델 초기화 |
| 12:45~12:49 | `node --input-type=module -e`로 실제 모델에 시간과 정상 입력만 제공하는 자연 진행 탐색 | 무입력은 모델 시간 약 54.25초에 패배. 중앙 고정 발사는 일부 적만 제거하고 패배하므로 브라우저 승리 검사는 정상 좌우 이동+발사로 구성했다. 앱 전역 API나 치트를 추가하지 않았다 |
| 12:48~12:49 | `npm run test:e2e` | Chromium 8/8 통과, runner 표시 1.1분. M1 5개 회귀 + M2 3개 검사. 자연 패배/반복 재시작 검사 37.4초, 자연 승리/재시작 검사 9.8초 |
| 12:48~12:49 | `npm run build` | 성공, 153ms |
| 12:50 | 별도 Playwright 브라우저에서 실제 시작 버튼·Space 입력, 일반 시간 진행 | DOM 점수 40, 진행 상태, 적/탄환 Canvas 픽셀 관찰. 스크린샷에서 편대 빈자리·탄환·방어선·한국어 안내 확인. 콘솔 오류 0 |
| 12:50 | `git diff --check`, runtime/test 전체 diff 검토, Node manifest/lock 검증 | 변경 범위·우선순위·초기화 검토 완료. 공개 registry/로컬 링크·인증정보 부재와 manifest 일치 유지 |

모델 검사는 제어된 배치·시간으로 마지막 적 충돌과 방어선 도달을 같은 하위 갱신에서 발생시키고 승리 우선 및 그 즉시 시간 중단을 확인했다.
브라우저에는 모델을 읽고 쓰는 API를 노출하지 않았다. 실제 키 입력과 Playwright clock으로 정상 편대 이동/발사 과정을 진행해 패배와 전체 승리를 모두 만들었다.
승리 점수·적 픽셀 부재와 두 결과에서 Canvas 전체 이미지 불변을 확인했으며, R/버튼으로 여러 번 재시작한 후 초기 편대·플레이어·탄환·점수 및 이동 속도를 검사했다.
모델 시간·쿨다운·방향·중첩 객체 초기화는 Node에서 확인하고, 시작 전 누르고 있던 이동/발사 입력이 재시작 뒤 남지 않는지는 Chromium에서 확인했다.

### 실패·검사 조정·미확인

- M2 실제 검사에서 assertion 실패·build 실패·제품 오류는 발견되지 않았다. 통과 뒤 중복으로 전체 suite를 재실행하거나 일부러 실패를 만들지 않았다.
- 기존 M1 탄환 검사 두 개는 제어 모델에서 적을 발사 경로 밖에 두었다. 브라우저 발사 회귀는 실제 ArrowLeft로 왼쪽 가장자리까지 이동해 적과 충돌하지 않는 경로에서 출발·속도·간격·화면 밖 제거를 확인한다. 적과의 충돌로 탄환이 사라지는 M2 정상 동작을 실패로 오인하지 않기 위한 사전 범위 조정이며 검사를 삭제하거나 실패 기대값을 낮춘 것이 아니다.
- 중앙 고정 발사 자연 진행의 패배는 요구사항 위반이나 테스트 실패가 아니다. 승리 경로는 좌우 이동하며 발사하는 실제 조작으로 검증했다.
- M1에서 구분한 합성 blur/hidden/defaultPrevented 검사를 유지했고 반복 R 무시도 합성 이벤트로 검사했다. 이를 실제 OS 탭 비표시 전환으로 기록하지 않는다.
- 사람 직접 플레이·사람 App UI 승인/모드 전환·App 지침 자동 적용·다른 OS/브라우저·실제 OS 탭 전환은 미확인이다. 자연 승리의 자동 Chromium 검증을 사람이 직접 플레이한 것으로 기록하지 않는다.

### 인도

- 완료: **[04-02, 8/20]**. M1과 M2가 구현되었으며 기본 게임 이슈 전체 완료는 아니다.
- 서버: 기존 소유 shell `m1-dev-verified`, PID `17652`/부모 `14424`, `http://127.0.0.1:5173/`, strictPort, HTTP 200을 확인해 그대로 사용했다. 이번 단계에서 재설치·재시작·다른 프로세스 종료는 하지 않았다.
- `m2-playing.png`는 세션 아티팩트로 보존하고 저장소에서는 제외한다.
- 검토한 여섯 파일만 한국어 구현 커밋으로 남기고 정상 feature push 후 원격 SHA를 확인한다. 실제 최종 SHA·원격 결과·검증·미확인은 이슈 #2 단계 댓글과 coordinator 보고에 기록한다.
- 남은 M3: README와 실제 명령 기반 `.github` App 설정. 별도 04-03 전달까지 착수하지 않으며 PR·병합·배포도 하지 않는다.

## 04-03 계획 및 실행 기록

### 작성 전 검토

- 2026-09-14 12:54 +09:00, 같은 feature branch/격리 세션의 HEAD `d7e987d86be42035c837ddfc5d3b9a4bb708c919`와 clean 상태를 확인했다. 고정 SHA `3637e1ad7897a2e674aa85cb8f3f6154da4b3907`의 `docs/04-03-App-설정과-README.md`를 GitHub contents API raw 응답으로 직접 전문 읽었다.
- 공식 [저장소 설정 문서](https://docs.github.com/copilot/reference/github-copilot-app-reference/repository-configuration)를 직접 확인했다. `scripts`는 `name`/`command` 목록이며 `triggers`를 생략하면 수동이다. 파일 외부 변경 후 현재 설정을 review/accept하기 전에는 App에 적용되었다고 할 수 없다.
- 계획: 기존 package scripts에 맞는 수동 Run/Test와 README만 추가 → 명령·조작·설정 형식 대조 → Node/Chromium/build 및 preview 확인 → 소유 서버/브라우저 정리 → diff 검토·한국어 커밋·정상 push → main 대상 기본 코드 PR 생성·메타데이터/검사/리뷰 스레드 확인.
- App에는 `Run: npm run dev`, `Test: npm test`만 정의한다. 자동 설치·삭제·triggers·추가 instructions·allowed-tools·다른 `.github` 커스터마이징은 넣지 않는다.
- README는 설치·실행·조작·검사·build/preview를 담당하고 수치의 기준은 PRD로 연결한다. 공개 URL은 배포 예정으로만 표시한다.
- UI 관찰 시도: 공식 제공 Computer Use 도구가 GitHub Copilot 창을 발견했으나, 해당 창의 `get_window_state`가 `actions are blocked for this application by built-in safety policy`로 거부되었다. 다른 수단이나 파일 변조로 우회하지 않는다. 현재 설정 trust review/accept·App Run은 미확인으로 남기는 것을 사용자 위임에서 허용했다.
- 기존 소유 dev PID `17652`, 포트 `5173`, HTTP 200을 재확인했다. 검증 중 중복 dev 서버를 띄우지 않는다. 종료 시 소유 shell/브라우저만 정리하고 포트 해제를 확인한다.
- 이번 세션은 PR 병합을 하지 않는다. **04-03은 병합 및 원격 main 확인 전까지 진행**으로 유지하며, coordinator가 이후 이슈 댓글에서 확정한다.

### 로컬 작성·검증 결과

- 추가 파일은 `README.md`와 `.github/github-app.yml`이다. App 설정은 수동 `Run: npm run dev`, `Test: npm test`의 `name`/`command` 목록만 포함한다. 기존 게임 코드·의존성·설계 문서는 수정하지 않았다.
- README의 조작·명령·포트·문서 링크를 실제 UI 및 package scripts와 대조했다. Node 일회성 검사로 최소 설정 내용, dev/preview strictPort, README의 npm script 이름과 로컬 링크 존재, 배포 예정 및 trust 미확인 표기를 확인했다.
- 2026-09-14 12:56~12:57 +09:00, `npm test && npm run test:e2e && npm run build`를 실행했다. Node **19/19, 273ms**, Chromium **8/8, 1.1분**, build **167ms**로 모두 통과했다. 설치를 다시 하거나 의존성을 변경하지 않았다.
- 12:58, 기존 소유 dev shell을 종료한 뒤 `npm run preview`로 production build를 확인했다. 소유 shell `m3-preview`, Node PID `6624`/부모 `41072`, `http://127.0.0.1:4173/`, strictPort, HTTP 200 및 이 worktree의 명령행을 확인했다.
- preview에서 실제 시작 버튼·ArrowRight·Space 입력으로 진행 DOM과 우주선 이동·적/탄환 Canvas 픽셀을 확인했다. 콘솔 오류 0. preview는 로컬 확인이며 배포가 아니다.
- README에 있는 `npm ci`는 M1의 실제 clean install 근거를 유지한다. `npm run browser:install`은 필요한 환경용으로 명시했으며 이 환경에서는 미실행임을 밝혀 두었다.

### 종료 및 제약

- 12:58~12:59, 소유 dev `m1-dev-verified`/PID `17652`와 preview `m3-preview`/PID `6624`를 해당 shell 도구로 종료했다. Playwright 소유 페이지는 close 도구에서 열린 탭 없음 응답을 확인했다.
- 12:59 `Get-NetTCPConnection -LocalPort 5173,4173 -State Listen` 결과는 **0개**, 두 서버 PID도 더 이상 존재하지 않았다. 다음 세션이 사용할 포트를 해제했다. 모르는 프로세스는 종료하지 않았다.
- 내장 browser canvas에는 닫기 액션이 없으며 `about:blank` 전환 요청도 지원 URL 형식 밖이라는 도구 오류로 거부됐다. 그 패널 자체의 닫힘은 미확인이다. 패널의 대상 게임 서버와 Playwright 소유 페이지는 위와 같이 종료했다.
- 종료 사실을 이슈 #2 [즉시 기록 댓글](https://github.com/hahaysh/space-Invaders-demo02/issues/2#issuecomment-5658774690)에 보존했다.
- 현재 App 설정 trust review/accept와 App Run은 미확인이다. App 창 조회의 안전 정책 거부를 우회하지 않았고, 파일을 읽거나 터미널 명령을 실행한 사실만으로 App 적용·인간 UI 승인을 주장하지 않는다. 사용자는 이 한계를 허용했다.
- 제품/검사/build 실패는 없었다. UI 조회 및 canvas URL 도구 거부는 실행 환경 제약으로 구분한다. 사람 직접 플레이·실제 OS 탭 전환·다른 OS/브라우저도 여전히 미확인이다.

### PR 인도 기준

- M1/M2와 README의 기본 게임 수용 기준은 로컬 검사로 확인했다. 명시적으로 허용된 App UI 미확인 및 합성 이벤트 범위는 PR에 공개한다.
- 전체 feature diff와 로컬 결과를 검토하고 한국어 커밋·정상 feature push 후 main 대상 PR을 생성한다. 이 PR은 **기본 코드 병합이며 배포가 아니다**.
- PR 생성 후 base/head·변경 파일·검사·리뷰 스레드를 읽어 검토하고 최종 SHA/PR/검증/미확인을 이슈 #2와 coordinator에 보고한다. 생성된 PR 번호와 원격 결과 때문에 추가 기록 커밋을 반복하지 않는다.
- 04-03은 계속 **진행**, 완료 누적은 **8/20**이다. PR 병합 및 원격 main 포함 여부는 coordinator가 후속 확인하고 이슈 댓글에서 완료를 확정한다.

## 05-01 계획 검토 및 진행

- 2026-09-14 13:04~13:06 +09:00: 새 격리 worktree의 HEAD, origin/main, 원격 main 및 공통 조상이 모두 `4c416e85e6235eb66744b1867248ca5623fec53a`임을 확인했다. PR #3은 13:02:48 +09:00 정상 병합되었고 이슈 #2 완료 댓글도 확인했다. 위 04-03 기록은 병합 전 이력으로 보존하며 현재 완료 누적은 **9/20**이다.
- 파일 변경 전 App 도구로 브랜치를 `hahaysh-space-defense-validation-first-deploy`로 변경했다. main checkout·demo01·원본 sample에 접근하지 않고 이 worktree만 사용한다.
- 고정 안내서 `hahaysh/space-Invaders@3637e1ad7897a2e674aa85cb8f3f6154da4b3907`의 `docs/05-01-게임-검증과-Skill.md`를 GitHub contents API raw 응답으로 직접 전문 읽었다. AGENTS·ideation·PRD·TRD, 기존 계획·README·실제 scripts·모델/UI·기존 테스트 및 이슈 #4/#2 본문·전체 댓글을 검토했다.
- 검토한 순서: `TEST_PLAN.md`에 R01~R10 경로 정의 → `TEST_RESULTS.md`와 최소 `.github/skills/game-check/SKILL.md` 작성 → 제공 Skill 도구의 실제 호출 시도 → 기존 검사와 build/preview/하위 경로 실행 → 결과·실패·미확인 기록 → diff 검토·한국어 커밋·정상 feature push 및 원격 확인.
- 사용자 추천승인 위임에 따른 실행이며 인간 App Plan/Interactive 승인·UI 조작으로 기록하지 않는다. Skill 파일 작성/읽기와 실제 인식/호출을 분리한다. 안전한 갱신을 제공하지 않으면 같은 feature 기반 coordinator의 새 읽기/검사 전용 세션에 인계한다.
- 실제 실행과 실패·환경·소유 서버 기록은 [TEST_RESULTS.md](TEST_RESULTS.md), 요구사항별 재현 절차는 [TEST_PLAN.md](TEST_PLAN.md)를 단일 기준으로 삼는다. Skill 실제 호출까지 확인하기 전에는 **9/20, 05-01 진행**을 유지한다.
- 05-02 결함 수정, Pages 설정, workflow, PR 생성·병합·공개는 이 단계에서 하지 않는다. App trust/Run UI는 이전 안전 정책 거부를 우회하지 않고 미확인으로 유지한다.
- 결과: 일반 검증을 수행하고 소유 서버/브라우저를 정리했다. 실제 Skill 도구는 `game-check not found`를 반환했고 안전한 활성 세션 갱신 수단을 확인하지 못했다. 상세 증거는 TEST_RESULTS에 보존한다. feature 커밋·push 후 coordinator의 같은 feature 기반 읽기/검사 전용 새 세션으로 인계하며 **9/20**을 유지한다.

### 05-01 복구 확인 및 완료

- 2026-09-14 13:31 +09:00, 유일 작성자인 이 세션이 [검사 전용 세션의 원격 근거](https://github.com/hahaysh/space-Invaders-demo02/issues/4#issuecomment-5659022509)를 GitHub API로 직접 읽었다. 앞의 9/20·미발견 기록은 최초 인계 당시 이력이다.
- coordinator가 만든 새 읽기/검사 전용 세션은 동일 feature HEAD `2cace6da82ee5af88ad2e4a1025e8a89e0080dfa`에서 `game-check`를 발견하고 첫 `functions.skill` 호출의 `loaded successfully` 응답과 현재 격리 worktree의 skill-context를 확인했다. 추적 파일·HEAD를 바꾸지 않았으며 소유 서버·브라우저도 종료했다.
- 단순 파일 읽기가 아닌 **명시적 Skill 도구 호출 성공**이다. 이 원래 세션의 최초 호출 실패가 소급해서 성공한 것은 아니며 App UI 승인·무요청 자동 적용·AGENTS 자동 로드도 확인한 것이 아니다.
- 일반 검증과 Skill 호출 후 검증의 상세 결과·실패/복구·미확인은 TEST_RESULTS에 구분했다. **05-01 완료, 누적 10/20**으로 갱신하고 두 기록 파일만 검토·커밋·정상 feature push한다. 다음 05-02는 이 기록을 원격에 보존한 뒤 별도 고정 안내서 검토로 진입한다. 06 단계는 아직 실행하지 않는다.

## 05-02 실제 결과 분류 및 완료

- 2026-09-14 13:33 +09:00, 05-01 복구 기록 커밋 `e8b102b4a3afe367d6460af5b306fb3a3f5aa33e`의 정상 feature push·원격 SHA 일치·clean 및 [05-01 완료 댓글](https://github.com/hahaysh/space-Invaders-demo02/issues/4#issuecomment-5659060325)을 확인한 뒤 진입했다.
- 고정 SHA `3637e1ad7897a2e674aa85cb8f3f6154da4b3907`의 `docs/05-02-결함-수정과-회귀-검증.md`를 GitHub contents API raw 응답으로 직접 전문 읽었다. 같은 이슈/격리 세션/feature를 유지한다.
- 계획 검토: 전체 PRD와 TEST_PLAN의 R01~R10을 기존 테스트 내용·이 세션 실행 결과·Skill 호출 후 검사 전용 세션 결과에 대조 → 실제 제품 결함/필수 검사 누락/환경 실패/미실행 분류 → 부족한 필수 증거가 있을 때만 최소 검사 또는 확인된 결함 수정 → 결과와 진행표만 기록한다.
- 대조 결과는 TEST_RESULTS의 05-02 절에 기록했다. 필수 기능의 확인 근거가 모두 있고 배포 준비를 막는 제품 결함·검사 누락은 발견되지 않았다. 최초 Vite 미설치와 Skill 미발견은 복구된 실행 환경/도구 발견 문제로 구분했다.
- 검사 대상 `2cace6da` 이후 현재까지 게임·tests·manifest/lock·Skill·빌드 설정의 변경은 없으며 기록 문서 두 개만 바뀌었다. 따라서 안내서의 통과 경로를 적용해 코드 수정·가상 버그·추가 이슈·중복 suite·Skill 재호출·서버 재시작 없이 기존 실제 근거를 검토했다.
- **05-02 완료, 누적 11/20**. 이번 변경은 TEST_RESULTS와 이 계획뿐이다. 관련 diff·기록 일치 확인 후 한국어 상세 커밋·정상 feature push·원격 확인 및 이슈 #4 댓글로 인계한다. 공개 배포 완료가 아니며 이슈를 닫지 않는다. 06-01/06-02/06-03·Pages·workflow·PR·병합은 시작하지 않고 보고 후 멈춘다.
