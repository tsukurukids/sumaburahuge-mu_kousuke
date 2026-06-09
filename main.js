/**
 * スマブラ風アクションゲーム プロトタイプ
 * 操作方法：
 *   矢印キー：移動、ジャンプ
 *   Space：通常攻撃
 *   W/A/S/D：スマッシュ攻撃
 *   H：必殺技（方向キーとの組み合わせで4種類）
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 600;

let gameStarted = false;
let cpuLevel = 1; // CPのつよさ（1〜7）
let selectedStage = 'tour'; // 選ばれたステージ（デフォルトはツアー）

// ステージのプラットフォーム（戦場風ステージ用）
let platforms = [];

// マグマの高さ（マグマステージ用）
let magmaY = 550;
let stageOffset = 0; // マグマステージの足場揺れ用

let selectedChar = null;
let isPuckPlaced = false;

// マウスについてくる手の動き
const hand = document.getElementById('selection-hand');
const puck = document.getElementById('selection-puck');
const startPrompt = document.getElementById('start-prompt');

// メッセージ部分をタップ（クリック）してもゲームが始まるようにするよ
startPrompt.addEventListener('click', () => {
    if (!gameStarted && isPuckPlaced) {
        startGame(selectedChar);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!gameStarted) {
        // 手のアイコン（指先）をマウスの真ん中に合わせるよ
        hand.style.left = (e.clientX - 15) + 'px';
        hand.style.top = (e.clientY - 15) + 'px';

        // チップが置かれていないときは、手といっしょに動かすよ
        if (!isPuckPlaced) {
            puck.style.left = (e.clientX - 17) + 'px';
            puck.style.top = (e.clientY + 15) + 'px';
        }
    }
});

let isMobile = false; // モバイル（タッチ）モードかどうか

// 端末を選んだときの処理
document.querySelectorAll('.device-button').forEach(button => {
    button.addEventListener('click', () => {
        isMobile = (button.getAttribute('data-device') === 'mobile');
        if (isMobile) {
            hand.style.display = 'none';
        } else {
            hand.style.display = 'block';
        }
        document.getElementById('device-section').style.display = 'none';
        document.getElementById('stage-section').style.display = 'block';
        document.getElementById('selection-title').innerText = '⚔️ ステージをえらぼう！';
    });
});

// 「次へ」ボタンでキャラクター選択に移動
document.getElementById('next-to-char').addEventListener('click', () => {
    document.getElementById('stage-section').style.display = 'none';
    document.getElementById('char-section').style.display = 'block';
    document.getElementById('selection-title').innerText = '⚔️ プレイヤーをえらぼう！';
});

// キャラクターを選んだ（チップを置いた）ときの処理
document.querySelectorAll('.char-button').forEach(button => {
    button.addEventListener('click', (e) => {
        if (gameStarted || button.classList.contains('placeholder')) return;

        // もしすでに選んでいたら、キャンセル（戻る）するよ
        if (isPuckPlaced) {
            isPuckPlaced = false;
            selectedChar = null;
            startPrompt.style.display = 'none';
            return;
        }

        // 手のポインター（指先）あたりにチップを移動させたいので調整
        isPuckPlaced = true;
        selectedChar = button.getAttribute('data-type');

        // 【NEW!】スロットの名前を更新するよ
        const charName = button.querySelector('.char-name').innerText;
        document.getElementById('p1-name').innerText = charName;

        const rect = button.getBoundingClientRect();
        puck.style.left = (rect.left + rect.width / 2 - 17) + 'px';
        puck.style.top = (rect.top + rect.height / 2 - 17) + 'px';

        startPrompt.style.display = 'block';
    });
});

// CPのつよさを選ぶ処理
document.querySelectorAll('.level-button').forEach(button => {
    button.addEventListener('click', () => {
        if (gameStarted) return;
        document.querySelectorAll('.level-button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        cpuLevel = parseInt(button.getAttribute('data-level'));
    });
});

// ステージを選んだときの処理
document.querySelectorAll('.stage-button').forEach(button => {
    button.addEventListener('click', () => {
        if (gameStarted) return;
        document.querySelectorAll('.stage-button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        selectedStage = button.getAttribute('data-stage');
    });
});

function startGame(type) {
    // CPUのキャラをランダム（お任せ）で決めるよ！
    const charList = ['robot', 'hero', 'kirby', 'pikachu', 'mario', 'hinohi', 'sans', 'charizard', 'lucario', 'duo', 'pooh'];
    const cpuType = charList[Math.floor(Math.random() * charList.length)];

    // 状態をリセット（次の選択のため）
    isPuckPlaced = false;
    selectedChar = null;
    startPrompt.style.display = 'none';

    // 1. 最初（さいしょ）に選択画面を隠すよ
    document.getElementById('selection-screen').style.display = 'none';
    hand.style.display = 'none';
    puck.style.display = 'none'; // 試合中はチップを消すよ！

    // 【NEW!】試合が始まったら操作方法を表示するよ！（スマホモードの時は表示しない）
    if (!isMobile) {
        document.getElementById('controls').style.display = 'block';
    }

    // 技（わざ）リストを表示するよ！
    updateMoveList(type);

    // 2. 「Ready?」を表示（ひょうじ）するよ！
    const readyGoPanel = document.getElementById('ready-go');
    readyGoPanel.innerText = 'Ready?';
    readyGoPanel.style.display = 'block';

    // 3. 1秒（びょう）したら「GO!」に変えるよ！
    setTimeout(() => {
        readyGoPanel.innerText = 'GO!';

        // 4. さらに0.5秒したら、いよいよゲームスタート！
        setTimeout(() => {
            readyGoPanel.style.display = 'none';
            gameStarted = true;
            document.getElementById('damage-display').style.display = 'flex'; // ダメージ表示！

            player.type = type; // 選んだキャラにするよ

            // CPUの設定！
            cpu.type = cpuType;

            // ストックの設定！
            player.stock = 3;
            cpu.stock = 3;
            if (player.updateStockDisplay) player.updateStockDisplay();
            if (cpu.updateStockDisplay) cpu.updateStockDisplay();

            // 【NEW!】CPUの名前をスロット（記録用）に表示（もし必要なら）
            document.getElementById('cpu-name').innerText = cpuType.toUpperCase();

            cpu.x = 800; // 右側に配置
            cpu.isCPU = true; // CPUだよフラグ
            cpu.cpuLevel = cpuLevel; // 選んだレベルをセット

            if (type === 'hero' || cpuType === 'hero') {
                document.getElementById('mp-bar-container').style.display = 'flex';
                if (type === 'hero') player.mp = 100;
                if (cpuType === 'hero') cpu.mp = 100;
            }
            document.getElementById('gameCanvas').style.display = 'block';
            document.getElementById('move-list-container').style.display = 'block'; // 技リストを表示
            if (isMobile) {
                document.getElementById('touch-controls').style.display = 'flex';
            }
        }, 500);
    }, 1000);
}

function updateMoveList(type) {
    const list = document.getElementById('move-list-content');
    let moves = "";
    if (type === 'robot') {
        moves = "ロボット：[H]プラズマ / [H+横]アーム / [H+上]上昇 / [H+下]ビーム";
    } else if (type === 'hero') {
        moves = "ゆうしゃ：[H]火球 / [H+横]いなずま / [H+上]バギ / [H+下]カウンター";
    } else if (type === 'kirby') {
        moves = "カービィ：[H]吸い込み / [H+横]ハンマー / [H+上]カッター / [H+下]ストーン";
    } else if (type === 'pikachu') {
        moves = "ピカチュウ：[H]電撃 / [H+横]突進 / [H+上]ジャンプ / [H+下]かみなり";
    } else if (type === 'mario') {
        moves = "マリオ：[H]ファイア / [H+横]マント / [H+上]ジャンプ殴り / [H+下]ヒップドロップ";
    } else if (type === 'hinohi') {
        moves = "ヒノヒ：[H]天照 / [H+横]ソーラーレイ / [H+上]サンライズ / [H+下]陽炎";
    } else if (type === 'sans') {
        moves = "サンズ：[H]ブラスター / [H+横]ボーン / [H+上]ワープ / [H+下]青い心";
    } else if (type === 'charizard') {
        moves = "リザードン：[H]火炎放射 / [H+横]フレアドライブ / [H+上]そらをとぶ / [H+下]いわくだき";
    } else if (type === 'lucario') {
        moves = "ルカリオ：[H]はどうだん / [H+横]はっけい / [H+上]しんそく / [H+下]かげぶんしん";
    } else if (type === 'duo') {
        moves = "最強コンビ：[H]茈・解 / [H+横]蒼・開 / [H+上]赤 / [H+下]領域展開";
    } else if (type === 'pooh') {
        moves = "プーさん：[H]タックル / [H+横]ガトリング / [H+上]ロケット / [H+下]赤麟躍動";
    } else if (type === 'legend') {
        moves = "究極のでんせつ：[H]光線 / [H+横]高速突進 / [H+上]大空上昇 / [H+下]時空崩壊";
    }
    if (isMobile) {
        moves = moves.replace(/\[H\+横\]/g, '横必殺')
                     .replace(/\[H\+上\]/g, '上必殺')
                     .replace(/\[H\+下\]/g, '下必殺')
                     .replace(/\[H\]/g, '必殺');
    }
    list.innerText = moves;
}

const keys = {};
let projectiles = [];
let animationFrame = 0; // アニメーション用のカウンター

// 宇宙を流れる星たちを追加するよ！
let stars = [];
for (let i = 0; i < 80; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2
    });
}

// ----------------------------------------------------
// 【NEW!】世界（せかい）を旅する仕組み
// ----------------------------------------------------
// 0: 宇宙, 1: 大自然, 2: 海の中
const stageSequence = [2, 1, 0, 1];
let stageIndex = 0;
let stageTimer = 0;
const stageMaxTime = 600; // 10秒くらいで次の場所へ！

// キーボードが押されたとき
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') player.jump();
    if (e.code === 'Space') {
        if (!gameStarted && isPuckPlaced) {
            startGame(selectedChar);
        } else {
            player.attack('normal');
        }
    }
    if (e.code === 'KeyW') player.attack('smash_up');
    if (e.code === 'KeyA') player.attack('smash_left');
    if (e.code === 'KeyS') player.attack('smash_down');
    if (e.code === 'KeyD') player.attack('smash_right');
    if (e.code === 'KeyH') {
        if (keys['ArrowUp']) player.special('up');
        else if (keys['ArrowDown']) player.special('down');
        else if (keys['ArrowLeft'] || keys['ArrowRight']) player.special('side');
        else player.special('neutral');
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// 📱 スマホ用タッチ操作の処理 📱
const touchButtons = {
    'btn-up': 'ArrowUp',
    'btn-down': 'ArrowDown',
    'btn-left': 'ArrowLeft',
    'btn-right': 'ArrowRight'
};

for (let id in touchButtons) {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[touchButtons[id]] = true;
            if (id === 'btn-up' && gameStarted) player.jump();
            btn.classList.add('active');
        }, { passive: false });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[touchButtons[id]] = false;
            btn.classList.remove('active');
        }, { passive: false });
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            keys[touchButtons[id]] = false;
            btn.classList.remove('active');
        }, { passive: false });
    }
}

// 📱 スマホ用アクションボタンのジョイスティック化 📱
function setupActionJoystick(btnId, attackCallback) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    // 指の動きに合わせる「ノブ（内側の丸）」を作るよ
    const knob = document.createElement('div');
    knob.style.position = 'absolute';
    knob.style.width = '30px';
    knob.style.height = '30px';
    knob.style.background = 'rgba(255, 255, 255, 0.8)';
    knob.style.borderRadius = '50%';
    knob.style.top = '50%';
    knob.style.left = '50%';
    knob.style.transform = 'translate(-50%, -50%)';
    knob.style.pointerEvents = 'none';
    knob.style.display = 'none';
    btn.style.position = 'relative';
    btn.appendChild(knob);

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let currentDir = null; // 'up', 'down', 'left', 'right', ニュートラルは null

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        isDragging = true;
        btn.classList.add('active');
        knob.style.display = 'block';
        knob.style.transform = 'translate(-50%, -50%)';
        currentDir = null;

        // ゆうしゃの「ため」開始処理
        if (btnId === 'btn-special' && gameStarted && player.type === 'hero') {
            keys['KeyH'] = true;
        }
    }, { passive: false });

    btn.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDragging) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const dist = Math.hypot(dx, dy);

        // ノブを動かす（最大30pxまで）
        const maxDist = 30;
        const uiDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * uiDist;
        const knobY = Math.sin(angle) * uiDist;
        knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        // 20px以上動かしたら方向決定！
        if (dist > 20) {
            if (Math.abs(dx) > Math.abs(dy)) {
                currentDir = dx > 0 ? 'right' : 'left';
            } else {
                currentDir = dy > 0 ? 'down' : 'up';
            }
        } else {
            currentDir = null;
        }

        // ゆうしゃ用に一時的に方向を保存
        if (btnId === 'btn-special' && gameStarted && player.type === 'hero') {
            player.touchForceDir = currentDir;
        }
    }, { passive: false });

    const handleEnd = (e) => {
        e.preventDefault();
        if (!isDragging) return;
        isDragging = false;
        btn.classList.remove('active');
        knob.style.display = 'none';

        if (gameStarted) {
            if (btnId === 'btn-special' && player.type === 'hero') {
                keys['KeyH'] = false; // これで update() 内で技が発動する
            } else {
                attackCallback(currentDir);
            }
        } else if (!gameStarted && isPuckPlaced && btnId === 'btn-normal') {
            startGame(selectedChar);
        }
        currentDir = null;
        if (player) player.touchForceDir = null;
    };

    btn.addEventListener('touchend', handleEnd, { passive: false });
    btn.addEventListener('touchcancel', handleEnd, { passive: false });
}

// 各ボタンにジョイスティック機能をセット！
setupActionJoystick('btn-normal', (dir) => {
    player.attack('normal');
});

setupActionJoystick('btn-smash', (dir) => {
    if (dir === 'up') player.attack('smash_up');
    else if (dir === 'down') player.attack('smash_down');
    else if (dir === 'left') player.attack('smash_left');
    else if (dir === 'right') player.attack('smash_right');
    else {
        // ニュートラルなら向いている方向にスマッシュ！
        if (player.direction === -1) player.attack('smash_left');
        else player.attack('smash_right');
    }
});

setupActionJoystick('btn-special', (dir) => {
    if (dir === 'up') player.special('up');
    else if (dir === 'down') player.special('down');
    else if (dir === 'left' || dir === 'right') {
        player.direction = (dir === 'right') ? 1 : -1; // 振り向く
        player.special('side');
    }
    else player.special('neutral');
});

/**
 * 飛び道具（プラズマ・ショット）のクラス
 */
class Projectile {
    constructor(x, y, vx, vy, color, type, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 6; // すこし小さく
        this.color = color;
        this.type = type;
        this.owner = owner; // 誰が出した技か覚えておくよ
        this.gravity = 0.3;
        this.bounce = 0.6;
        this.life = 100;
        this.damage = this.getProjectileDamage(type);
    }

    getProjectileDamage(type) {
        // --- Robot ---
        if (type === 'robot_plasma') return 8;

        // --- Hero ---
        if (type === 'hero_mera') return 10;
        if (type === 'hero_merazoma') return 25; // チャージしたメラゾーマは超強力！
        if (type === 'hero_dein') return 12;      // 通常デイン
        if (type === 'hero_kazap') return 22;     // ためデイン
        if (type === 'hero_woosh') return 6;      // バギ

        // --- Kirby ---
        if (type === 'kirby_star') return 8;
        if (type === 'kirby_plasma') return 8;

        // --- Pikachu ---
        if (type === 'pikachu_lightning') return 6;
        if (type === 'pikachu_bolt') return 20;

        // --- Mario ---
        if (type === 'mario_fireball') return 12;

        // --- Hinohi ---
        if (type === 'hinohi_amaterasu') return 20;
        if (type === 'hinohi_solar_ray') return 15;

        // --- Sans ---
        if (type === 'sans_blast') return 25;
        if (type === 'sans_bone') return 10;

        // --- Duo ---
        if (type === 'duo_murasaki') return 15;
        if (type === 'duo_kai') return 8;
        if (type === 'duo_ao') return 3;
        if (type === 'duo_aka') return 18;
        if (type === 'duo_fuga') return 12;
        if (type === 'duo_domain') return 2;

        // --- Pooh ---
        if (type === 'pooh_bullet') return 3;

        // --- Charizard ---
        if (type === 'charizard_flame') return 5;

        // --- Legend ---
        if (type === 'legend_judgment_ray') return 20; // 宇宙からの光線
        if (type === 'legend_tornado') return 8;       // 竜巻
        if (type === 'legend_aka') return 22;
        if (type === 'legend_shadow') return 15;

        // --- Gimmicks / Others ---
        if (type === 'meteor') return 25;
        if (type === 'thunder') return 25;
        if (type === 'explosion') return 18;
        if (type === 'honey') return 8;

        return 5;
    }

    update() {
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx *= 0.5; this.vy *= 0.5; // 動けないけど少し減速
            return; // 何もできない！
        }

        if (this.type === 'robot_plasma') {
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y + this.radius > stageY && this.y < stageY + 50 &&
                this.x > stageX && this.x < stageX + stageW &&
                this.vy > 0) {
                this.y = stageY - this.radius;
                this.vy *= -this.bounce;
            }
        }
        else if (this.type === 'hero_mera') {
            this.x += this.vx;
            this.y += this.vy;
        }
        else if (this.type === 'hero_merazoma') {
            this.x += this.vx;
            this.y += this.vy;
            // 巨大化するチャージ火炎
            this.radius = Math.min(30, this.radius + 0.3);
        }
        else if (this.type === 'hero_dein') {
            this.y += this.vy;
            this.x += this.vx;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y > stageY && this.x > stageX && this.x < stageX + stageW) {
                this.life = 0;
            }
        }
        else if (this.type === 'hero_kazap') {
            this.y += this.vy;
            this.x += this.vx;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y > stageY && this.x > stageX && this.x < stageX + stageW) {
                this.life = 0;
            }
        }
        else if (this.type === 'hero_woosh') {
            this.vx *= 0.95;
            this.x += this.vx;
        }
        else if (this.type === 'kirby_star') {
            this.x += this.vx; this.radius *= 0.98;
        }
        else if (this.type === 'kirby_plasma') {
            this.x += this.vx; this.radius += 1.0;
        }
        else if (this.type === 'pikachu_lightning') {
            this.vy += 0.4;
            this.x += this.vx;
            this.y += this.vy;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y + this.radius > stageY && this.y < stageY + 50 &&
                this.x > stageX && this.x < stageX + stageW && this.vy > 0) {
                this.y = stageY - this.radius;
                this.vy *= -0.7;
            }
        }
        else if (this.type === 'pikachu_bolt') {
            this.y += this.vy;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y > stageY && this.x > stageX && this.x < stageX + stageW) {
                this.life = 0;
            }
        }
        else if (this.type === 'mario_fireball') {
            this.x += this.vx;
            this.y += this.vy;
            if (this.life <= 30) {
                this.radius += 1;
                this.vx *= 0.8;
            }
        }
        else if (this.type === 'hinohi_amaterasu') {
            this.radius += 10;
        }
        else if (this.type === 'hinohi_solar_ray') {
            this.x += this.vx;
        }
        else if (this.type === 'sans_blast') {
            this.vx = 0; this.vy = 0;
            if (this.life > 10) this.radius = Math.min(80, this.radius + 8);
            else this.radius *= 0.8;
        }
        else if (this.type === 'sans_bone') {
            this.x += this.vx; this.y += Math.sin(this.life * 0.1) * 5;
        }
        else if (this.type === 'duo_murasaki') {
            this.x += this.vx; this.radius += 0.2;
        }
        else if (this.type === 'duo_kai') {
            this.x += this.vx; this.y += (Math.random() - 0.5) * 10;
        }
        else if (this.type === 'duo_ao') {
            this.x += this.vx;
            const other = (this.owner === player) ? cpu : player;
            const dx = this.x - other.x; const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                other.vx += dx * 0.05; other.vy += dy * 0.05;
            }
        }
        else if (this.type === 'duo_aka') {
            this.vx *= 0.9; this.vy *= 0.9;
            this.radius += 10;
            if (this.radius > 100) this.life = 0;
        }
        else if (this.type === 'duo_fuga') {
            this.x += this.vx; this.vy += 0.1;
            this.radius += 0.5;
        }
        else if (this.type === 'duo_domain') {
            if (this.owner) {
                this.x = this.owner.x + 12.5;
                this.y = this.owner.y + 20;
            }
            this.radius = Math.min(350, this.radius + 6);
            const other = (this.owner === player) ? cpu : player;
            const dx = this.x - (other.x + 12.5); const dy = this.y - (other.y + 20);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius) {
                other.stunTimer = 10;
                other.damagePercent += 0.2;
            }
        }
        else if (this.type === 'pooh_bullet') {
            this.x += this.vx; this.y += this.vy;
        }
        else if (this.type === 'legend_judgment_ray') {
            this.y += this.vy;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y > stageY && this.x > stageX && this.x < stageX + stageW) {
                this.life = 0;
            }
        }
        else if (this.type === 'legend_tornado') {
            this.x += this.vx;
            this.y += this.vy;
        }
        else if (this.type === 'legend_aka') {
            this.vx *= 0.9; this.vy *= 0.9;
            this.radius += 12;
            if (this.radius > 150) this.life = 0;
        }
        else if (this.type === 'legend_shadow') {
            this.x += this.vx;
            this.radius += 6;
            const other = (this.owner === player) ? cpu : player;
            const dx = this.x - other.x; const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius) {
                other.vx += dx * 0.08; other.vy += dy * 0.08;
            }
            if (this.radius > 120) this.life = 0;
        }
        else if (this.type === 'arrow') {
            this.x += this.vx; this.y += this.vy; this.vy += 0.1;
        }
        else if (this.type === 'boomerang') {
            this.x += this.vx;
            const dx = this.owner.x + 12 - this.x; const dy = this.owner.y + 20 - this.y;
            this.vx += dx * 0.01; this.vy += dy * 0.01;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && this.life < 80) this.life = 0;
        }
        else if (this.type === 'bomb' || this.type === 'tnt') {
            this.x += this.vx; this.y += this.vy; this.vy += 0.5;
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y + this.radius > stageY && this.x > stageX && this.x < stageX + stageW) {
                this.y = stageY - this.radius; this.vy *= -0.4; this.vx *= 0.8;
            }
            if (this.life === 1) { this.type = 'explosion'; this.radius = 50; this.life = 10; }
        }
        else if (this.type === 'block') {
            const stageY = 400; const stageX = 250; const stageW = 500;
            if (this.y + this.radius > stageY && this.x > stageX && this.x < stageX + stageW) {
                this.y = stageY - this.radius; this.vy = 0; this.vx = 0;
            } else { this.vy += 0.5; this.x += this.vx; this.y += this.vy; }
            if (this.life < 20) this.radius *= 0.9;
        }
        else if (this.type === 'explosion') {
            this.radius += 5;
        }
        else if (this.type === 'charizard_flame') {
            this.x += this.vx; this.radius += 1.2; this.life -= 2;
        }
        else if (this.type === 'meteor') {
            this.x += this.vx; this.y += this.vy;
            this.radius = 20;
            if (this.y > 600) this.life = 0;
        }
        else if (this.type === 'thunder') {
            this.y += 15;
            if (this.y > 400) this.life = 0;
        }
        else if (this.type === 'honey_domain') {
            this.radius = Math.min(300, this.radius + 15);
            const other = (this.owner === player) ? cpu : player;
            const dx = this.x - (other.x + 12.5); const dy = this.y - (other.y + 20);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius) {
                other.honeyStuckTimer = 900;
            }
        }
        this.life--;
    }

    draw() {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        if (this.type === 'robot_plasma') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
        }
        else if (this.type === 'hero_mera') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = '#e67e22'; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#f39c12'; ctx.fill();
        }
        else if (this.type === 'hero_merazoma') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + Math.random() * 6, 0, Math.PI * 2);
            ctx.fillStyle = '#d35400'; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c40f'; ctx.fill();
        }
        else if (this.type === 'hero_dein') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x - 3, this.y - 120, 6, 240);
        }
        else if (this.type === 'hero_kazap') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x - 8, this.y - 150, 16, 300);
        }
        else if (this.type === 'hero_woosh') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(this.x, this.y + (i * 10), 20 + Math.sin(animationFrame * 0.5 + i) * 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        else if (this.type === 'kirby_star') {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                let r = (i % 2 === 0) ? this.radius : this.radius * 0.5;
                ctx.lineTo(this.x + Math.cos(animationFrame * 0.1 + i * Math.PI * 0.4) * r, this.y + Math.sin(animationFrame * 0.1 + i * Math.PI * 0.4) * r);
            }
            ctx.fill();
        }
        else if (this.type === 'kirby_plasma') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#00d2ff'; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
        }
        else if (this.type === 'pikachu_lightning') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
        }
        else if (this.type === 'pikachu_bolt') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x - 5, this.y - 100, 10, 200);
        }
        else if (this.type === 'mario_fireball') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + Math.random() * 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4500'; ctx.fill();
            ctx.fillStyle = '#ff9d00'; ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'hinohi_amaterasu') {
            let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, '#f1c40f'); grad.addColorStop(0.7, '#e67e22'); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'hinohi_solar_ray') {
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 20; ctx.shadowColor = '#f1c40f';
            ctx.fillRect(this.x - 20, this.y - 2, 40, 4);
        }
        else if (this.type === 'sans_blast') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 30; ctx.shadowColor = '#00d2ff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        else if (this.type === 'sans_bone') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x - 5, this.y - 15, 10, 30);
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(this.x - 5, this.y - 15, 10, 30);
        }
        else if (this.type === 'duo_murasaki') {
            ctx.fillStyle = '#9b59b6';
            ctx.shadowBlur = 20; ctx.shadowColor = '#000';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        else if (this.type === 'duo_kai') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - 15, this.y);
            ctx.lineTo(this.x + 15, this.y);
            ctx.stroke();
        }
        else if (this.type === 'duo_ao') {
            ctx.fillStyle = '#3498db';
            ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
            ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        else if (this.type === 'duo_aka') {
            ctx.fillStyle = '#e74c3c';
            ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        else if (this.type === 'duo_fuga') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x - 10, this.y - 3, 20, 6);
        }
        else if (this.type === 'duo_domain') {
            ctx.save();
            ctx.globalAlpha = 0.95;
            let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, '#000'); grad.addColorStop(0.8, '#0a001a'); grad.addColorStop(1, '#000');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = '#fff';
            for (let i = 0; i < 30; i++) {
                let r = (animationFrame * 2 + i * 50) % this.radius;
                let ang = i * 2.5;
                ctx.beginPath(); ctx.arc(this.x + Math.cos(ang) * r, this.y + Math.sin(ang) * r, 1, 0, Math.PI * 2); ctx.fill();
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                ctx.beginPath();
                let x1 = this.x + (Math.random() - 0.5) * this.radius * 2;
                let y1 = this.y + (Math.random() - 0.5) * this.radius * 2;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x1 + (Math.random() - 0.5) * 50, y1 + (Math.random() - 0.5) * 50);
                ctx.stroke();
            }

            ctx.translate(this.x, this.y);
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#b33939';
            ctx.fillRect(-40, -20, 80, 40);
            ctx.fillStyle = '#2d3436'; ctx.beginPath(); ctx.moveTo(-50, -20); ctx.lineTo(0, -50); ctx.lineTo(50, -20); ctx.fill();
            ctx.restore();
        }
        else if (this.type === 'pooh_bullet') {
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
            if (Math.random() < 0.2) {
                ctx.shadowBlur = 10; ctx.shadowColor = '#000';
                ctx.strokeStyle = '#e74c3c'; ctx.stroke();
            }
        }
        else if (this.type === 'legend_judgment_ray') {
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 30; ctx.shadowColor = '#f1c40f';
            ctx.fillRect(this.x - 8, this.y - 120, 16, 240);
        }
        else if (this.type === 'legend_tornado') {
            ctx.strokeStyle = '#00d2ff';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(this.x, this.y + (i * 10), 20 + Math.sin(animationFrame * 0.5 + i) * 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        else if (this.type === 'legend_aka') {
            let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, '#fff'); grad.addColorStop(0.3, 'rgba(231, 76, 60, 0.8)'); grad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'legend_shadow') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'honey') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x - 8, this.y - 8, 16, 16);
            ctx.fillStyle = '#d35400'; ctx.fillRect(this.x - 8, this.y - 8, 16, 4);
        }
        else if (this.type === 'honey_domain') {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.stroke();
            ctx.restore();
        }
        else if (this.type === 'meteor') {
            ctx.fillStyle = '#7f8c8d';
            ctx.shadowBlur = 30; ctx.shadowColor = '#e67e22';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'thunder') {
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 30; ctx.shadowColor = '#f1c40f';
            ctx.fillRect(this.x - 10, this.y - 50, 20, 100);
        }
        else if (this.type === 'arrow') {
            ctx.fillStyle = '#fff'; ctx.fillRect(this.x - 10, this.y - 1, 20, 2);
        }
        else if (this.type === 'boomerang') {
            ctx.fillStyle = '#fff'; ctx.fillRect(this.x - 6, this.y - 6, 12, 12);
        }
        else if (this.type === 'bomb') {
            ctx.fillStyle = '#34495e'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'tnt') {
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x - 12, this.y - 12, 24, 24);
        }
        else if (this.type === 'block') {
            ctx.fillStyle = '#795548'; ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        }
        else if (this.type === 'explosion') {
            ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        else if (this.type === 'charizard_flame') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = '#e67e22'; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3300'; ctx.fill();
        }

        ctx.shadowBlur = 0;
    }
}

/**
 * プレイヤーキャラクターのクラス（プロトタイプ・ロボット）
 */
class Character {
    constructor(isPlayer = false) {
        this.isPlayer = isPlayer; // プレイヤーかどうかを保存するよ
        this.isCPU = !isPlayer;   // プレイヤーじゃないならCPUだよ
        this._hitbox = null;
        this.reset();

        // 【最強コンビ用】サブキャラ（相方）の座標履歴
        this.history = [];
        for (let i = 0; i < 10; i++) this.history.push({ x: this.x, y: this.y });
    }

    get hitbox() {
        return this._hitbox;
    }

    set hitbox(val) {
        if (val === null) {
            this._hitbox = null;
            return;
        }

        let dx = val.x - this.x;
        let dy = val.y - this.y;

        if (Math.abs(dx - this.width) < 1) {
            // widthはすでに縮小されているのでそのまま
        } else {
            dx *= this.scale;
        }

        if (dy > this.height - 10 && dy < this.height + 10) {
            const originalOffset = dy - this.height;
            dy = this.height + originalOffset * this.scale;
        } else {
            dy *= this.scale;
        }

        this._hitbox = {
            x: this.x + dx,
            y: this.y + dy,
            w: val.w * this.scale,
            h: val.h * this.scale,
            isScaled: true
        };
    }

    reset() {
        this.scale = 0.6; // 【NEW!】キャラクターのサイズ縮小率（60%）
        this.x = canvas.width / 2 + (this.isPlayer ? -150 : 150);
        this.y = 200;
        this.width = 25 * this.scale;
        this.height = 40 * this.scale;
        this.vx = 0;
        this.vy = 0;
        this.direction = (this.isPlayer ? 1 : -1);
        this.speed = 6 * this.scale;
        this.gravity = 0.5 * this.scale;
        this.jumpPower = -12 * this.scale;
        this.isGrounded = false;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.canSpecialUp = true;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackType = '';
        this.hitbox = null;
        this.isHanging = false;

        // 【ゆうしゃ専用】
        this.mp = 100;
        this.chargeTimer = 0;
        this.isCharging = false;
        this.attackIsCharged = false;

        // 【カービィ専用】
        this.isFull = false;
        this.copiedAbility = null;

        // ダメージ％
        this.damagePercent = 0;
        // ダメージ倍率（最強コンビ用）
        this.damageMultiplier = 1.0;
        this.stunTimer = 0; // スタン状態（領域用）
        this.honeyStuckTimer = 0; // 【NEW!】プーさんのハチミツ漬けタイマー
        this.isRedMode = false;   // 【NEW!】赤麟躍動モード！

        // 歴史をリセット
        this.history = [];
        for (let i = 0; i < 15; i++) this.history.push({ x: this.x, y: this.y });
    }

    update(target = null) {
        // 座標履歴の更新
        this.history.push({ x: this.x, y: this.y, dir: this.direction, grounded: this.isGrounded, attacking: this.isAttacking, atkType: this.attackType });
        if (this.history.length > 15) this.history.shift();

        // CPUのAI（人工知能）の動き
        if (this.isCPU && target) {
            this.handleAI(target);
        }

        // 崖につかまっているとき
        if (this.isHanging) {
            this.vx = 0; this.vy = 0;
            if (keys['ArrowUp']) { this.isHanging = false; this.vy = this.jumpPower; this.jumpCount = 1; }
            if (keys['ArrowDown']) { this.isHanging = false; }
            return;
        }

        // Hキー長押し（チャージ）の管理
        if (this.type === 'hero' && keys['KeyH'] && !this.isAttacking) {
            this.isCharging = true;
            this.chargeTimer++;
            if (this.chargeTimer > 100) this.chargeTimer = 100; // 最大までためる
        } else if (this.isCharging) {
            // 離したら技が出る！
            this.isCharging = false;
            this.triggerHeroSpecial();
            this.chargeTimer = 0;
        }

        // MPの自動回復（ちょっとだけ速くしたよ！）
        if (this.type === 'hero' && this.mp < 100) this.mp += 0.1;
        if (this.type === 'hero') {
            document.getElementById('mp-fill').style.width = this.mp + '%';
        }

        // 1. 左右の移動（攻撃中やチャージ中は動けない）
        if (!this.isAttacking && !this.isCharging) {
            if (keys['ArrowLeft']) {
                this.vx = -this.speed;
                this.direction = -1;
            } else if (keys['ArrowRight']) {
                this.vx = this.speed;
                this.direction = 1;
            } else {
                this.vx *= 0.8; // 少しずつ止まる（なめらか！）
                if (Math.abs(this.vx) < 0.1) this.vx = 0;
            }
        }

        // 2. 重力をかける
        if (this.type === 'steve' && this.attackType === 'special_up' && this.isAttacking) {
            // エリトラ滑空（ゆっくり落ちる）
            this.vy = Math.min(this.vy + 0.1, 2);
            this.vx = this.direction * 7;
        } else {
            this.vy += this.gravity;
        }
        this.x += this.vx;
        this.y += this.vy;

        // 【NEW!】水と隕石ステージの水の流れ（足場にいるとき流される）
        if (selectedStage === 'meteor_flood' && this.isGrounded && this.y > 380) {
            this.x += 1.5; // 右にさらさら流されるよ
        }

        // 【NEW!】オールマイトのふにょふにょスマッシュ（上下に揺れる）
        if (this.type === 'allmight' && this.isAttacking && this.attackType === 'special_side') {
            this.vy = Math.sin(animationFrame * 0.5) * 15;
        }

        // 【NEW!】プーさんのハチミツ漬け状態
        if (this.honeyStuckTimer > 0) {
            this.honeyStuckTimer--;
            this.vx = 0; this.vy = 0; // 動けない！
        }

        // 3. 地面（終点の浮いている島）との当たり判定
        const stageY = 400 + (selectedStage === 'magma' ? Math.sin(animationFrame * 0.05) * 30 : 0);
        const stageX = (selectedStage === 'under') ? 50 : 250;
        const stageW = (selectedStage === 'under') ? 900 : 500;

        // 【NEW!】水と隕石ステージの当たり判定（ちょっと広い）
        if (selectedStage === 'meteor_flood') {
            // 水のステージは地面がすこし低いよ
        }

        if (this.y + this.height > stageY && this.y + this.height < stageY + 50 &&
            this.x + this.width > stageX && this.x < stageX + stageW &&
            this.vy >= 0) {
            this.y = stageY - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
            this.canSpecialUp = true;
            this.isGliding = false; // 滑空（かっくう）おわり
            this.isKokusen = false; // 黒閃（こくせん）おわり
        } else {
            this.isGrounded = false;
        }

        // --- すり抜け床（プラットフォーム）の判定 ---
        if (selectedStage === 'dimension') {
            platforms.forEach(p => {
                if (this.vy >= 0 && this.y + this.height > p.y && this.y + this.height < p.y + 20 &&
                    this.x + this.width > p.x && this.x < p.x + p.w && !keys['ArrowDown']) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.jumpCount = 0;
                    this.canSpecialUp = true;
                }
            });
        }

        // --- マグマのダメージ判定 ---
        if (selectedStage === 'magma' && this.y > 520) {
            this.takeDamage({ x: this.x, y: 600 }, 15); // 下から吹っ飛ばされる
            this.vy = -18;
        }

        // --- 【NEW!】落ちないステージ（アンダーグラウンド）の壁判定 ---
        if (selectedStage === 'under') {
            // 左右の壁
            if (this.x < 50) { this.x = 50; this.vx = Math.abs(this.vx) * 0.8; }
            if (this.x > canvas.width - 50 - this.width) { this.x = canvas.width - 50 - this.width; this.vx = -Math.abs(this.vx) * 0.8; }
            // 下の床（奈落なし）
            if (this.y > 500) { this.y = 500; this.vy = -Math.abs(this.vy) * 0.5; this.isGrounded = true; this.jumpCount = 0; }
        } else {
            // 画面の外に落ちたら、ミス！（上方向も追加！）
            if (this.y > canvas.height + 100 || this.y < -150 || this.x < -100 || this.x > canvas.width + 100) {
                this.stock--;
                if (this.updateStockDisplay) this.updateStockDisplay();
                if (this.stock <= 0) {
                    gameStarted = false;
                    const readyGoPanel = document.getElementById('ready-go');
                    readyGoPanel.innerText = this.isPlayer ? 'LOSE...' : 'WIN!';
                    readyGoPanel.style.color = this.isPlayer ? '#e74c3c' : '#f1c40f';
                    readyGoPanel.style.display = 'block';
                    setTimeout(() => { location.reload(); }, 3000);
                } else {
                    this.reset();
                }
            }
        }

        // 崖（がけ）つかまりの判定
        if (!this.isGrounded && this.vy > 0) {
            if (Math.abs(this.x + this.width - stageX) < 15 && Math.abs(this.y + 10 - stageY) < 20) {
                this.isHanging = true;
                this.x = stageX - this.width + 5;
                this.y = stageY - 10;
                this.direction = 1;
            }
            if (Math.abs(this.x - (stageX + stageW)) < 15 && Math.abs(this.y + 10 - stageY) < 20) {
                this.isHanging = true;
                this.x = stageX + stageW - 5;
                this.y = stageY - 10;
                this.direction = -1;
            }
        }

        // 4. 攻撃のタイマー管理
        if (this.isAttacking) {
            this.attackTimer--;

            // 攻撃の当たり判定（相手へのヒット）
            const other = (this === player) ? cpu : player;
            if (this.hitbox && this.checkHit(this.hitbox, other)) {
                if (this.type === 'mario' && this.attackType === 'special_side') {
                    // マントはダメージなしで相手の向きを反転させる
                    other.direction *= -1;
                    other.vx = this.direction * 5; // 少し押し出す
                } else {
                    let damage = this.getAttackDamage(this.attackType);
                    if (this.type === 'duo') {
                        damage *= 1.2; // 最強コンビ倍率（1.5から1.2に調整）
                        if (this.attackType === 'normal') {
                            damage *= 1.4; // 黒閃はさらに1.4倍（2から1.4に調整）
                            // 画面フラッシュ演出
                            ctx.fillStyle = 'rgba(0,0,0,0.8)';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                    }
                    other.takeDamage(this, damage);
                }
                this.hitbox = null; // 一回当たったら消すよ
            }

            // 【NEW!】マントによる飛び道具の反射
            if (this.type === 'mario' && this.attackType === 'special_side' && this.hitbox) {
                projectiles.forEach(p => {
                    if (p.owner !== this && this.checkHit(this.hitbox, { x: p.x - p.radius, y: p.y - p.radius, w: p.radius * 2, h: p.radius * 2 })) {
                        p.vx *= -1.5;
                        p.owner = this; // 自分の飛び道具になる
                    }
                });
            }

            // 【カービィのすいこみ判定】
            if (this.type === 'kirby' && this.attackType === 'special_neutral' && !this.isFull) {
                const dx = this.x + (this.direction * 20) - other.x;
                if (Math.abs(dx) < 100) other.x += dx * 0.1;

                if (Math.abs(dx) < 30 && Math.abs(this.y - other.y) < 30) {
                    this.isFull = true;
                    other.x = -2000; // 画面外に隠す
                }
            }

            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.hitbox = null;
                this.isKokusen = false; // 【NEW!】攻撃が終わったら黒閃もおわり
            }
        }

        // 飛び道具（とびどうぐ）に当たったかな？
        projectiles.forEach(p => {
            // 自分の技（owner）じゃないときだけ当たるよ！
            if (p.life > 0 && p.owner !== this && this.checkHit({ x: p.x - p.radius, y: p.y - p.radius, w: p.radius * 2, h: p.radius * 2 }, this)) {
                let damage = p.damage;
                if (p.owner && p.owner.type === 'duo') damage *= 1.2; // 弾も1.2倍！
                if (p.type === 'duo_domain') {
                    this.stunTimer = 15; // 領域内は脳に情報が流れ込んで動けない！
                    // 【NEW!】領域の中心へ強力に吸い寄せるよ！
                    const dx = p.x - (this.x + 12.5);
                    const dy = p.y - (this.y + 20);
                    this.vx += dx * 0.1; this.vy += dy * 0.1;
                }
                this.takeDamage(p, damage);
                if (p.type !== 'explosion' && p.type !== 'duo_aka' && p.type !== 'legend_aka' && p.type !== 'duo_domain' && p.type !== 'honey_domain') p.life = 0; // 爆発・領域展開以外は消える
            }
        });
    }

    attack(type) {
        if (this.isAttacking) return;

        // 【カービィがほおばり中のとき】
        if (this.type === 'kirby' && this.isFull && type === 'normal') {
            this.spitStar();
            return;
        }

        this.isAttacking = true;
        this.attackType = type;
        this.attackTimer = 18;

        if (type === 'normal') {
            this.hitbox = { x: this.x + (this.direction === 1 ? this.width : -35), y: this.y + 15, w: 35, h: 30 };
        } else if (type === 'smash_up') {
            this.hitbox = { x: this.x - 10, y: this.y - 35, w: 60, h: 35 };
        } else if (type === 'smash_left') {
            this.hitbox = { x: this.x - 45, y: this.y + 10, w: 45, h: 40 };
            this.direction = -1;
        } else if (type === 'smash_right') {
            this.hitbox = { x: this.x + this.width, y: this.y + 10, w: 45, h: 40 };
            this.direction = 1;
        } else if (type === 'smash_down') {
            this.hitbox = { x: this.x - 20, y: this.y + this.height - 5, w: 80, h: 25 };
        }

    }

    special(type) {
        if (this.isAttacking || this.isCharging) return;

        // 【カービィの必殺技（ひっさつわざ）】
        if (this.type === 'kirby') {
            if (this.isFull && type === 'neutral') {
                this.copiedAbility = 'kirby_plasma'; // 今回はロボットのプラズマをコピー！
                this.isFull = false;
                const other = (this === player) ? cpu : player;
                other.reset(); // 相手が復活！
                return;
            }
            if (this.copiedAbility === 'kirby_plasma' && type === 'neutral') {
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 10, this.direction * 10, 0, '#00d2ff', 'kirby_plasma', this));
                return;
            }

            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 60; // 長めに吸い込むよ
            } else if (type === 'side') {
                this.attackTimer = 30; // ハンマー！
                this.hitbox = { x: this.x + (this.direction * 30), y: this.y, w: 40, h: 60 };
            } else if (type === 'up') {
                this.attackTimer = 50; this.vy = -14; // カッタージャンプ
            } else if (type === 'down') {
                this.attackTimer = 40; this.vy = 20; // ストーン
                this.hitbox = { x: this.x - 5, y: this.y + this.height, w: 35, h: 20 };
            }
        }
        // 【ピカチュウの必殺技（ひっさつわざ）】
        else if (this.type === 'pikachu') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 20;
                // でんげき：ちいさな電気のたまを投げるよ！
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 10, this.direction * 8, 2, '#f1c40f', 'pikachu_lightning', this));
            } else if (type === 'side') {
                this.attackTimer = 25;
                this.vx = this.direction * 15; // でんこうせっか！
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 40, h: 40 };
            } else if (type === 'up') {
                this.attackTimer = 20; this.vy = -18; // かみなりジャンプ！
                this.hitbox = { x: this.x - 10, y: this.y - 10, w: 60, h: 40 };
            } else if (type === 'down') {
                this.attackTimer = 40;
                // かみなり：空からドーン！
                projectiles.push(new Projectile(this.x + 12, 0, 0, 15, '#fff', 'pikachu_bolt', this));
            }
        }
        // 【リンクの必殺技（ひっさつわざ）】
        else if (this.type === 'link') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 15, this.direction * 12, 0, '#fff', 'arrow', this));
            } else if (type === 'side') {
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 15, this.direction * 10, -2, '#fff', 'boomerang', this));
            } else if (type === 'up') {
                this.attackTimer = 45; this.vy = -12;
                this.hitbox = { x: this.x - 20, y: this.y - 10, w: 65, h: 50 };
            } else if (type === 'down') {
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y, this.direction * 5, -5, '#34495e', 'bomb', this));
            }
        }
        // 【マリオの必殺技】
        else if (this.type === 'mario') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 15, this.direction * 8, -4, '#ff4500', 'mario_fireball', this));
            } else if (type === 'side') {
                this.attackTimer = 30; // マント
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 30, h: 40 };
            } else if (type === 'up') {
                this.attackTimer = 30; this.vy = -15; // スーパージャンプパンチ
                this.hitbox = { x: this.x - 5, y: this.y - 20, w: 35, h: 40 };
            } else if (type === 'down') {
                this.attackTimer = 30; this.vy = 20; // ヒップドロップ
                this.hitbox = { x: this.x - 5, y: this.y + this.height, w: 35, h: 20 };
            }
        }
        // 【ヒノヒの必殺技】
        else if (this.type === 'hinohi') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 40;
                projectiles.push(new Projectile(this.x + 12, this.y + 20, 0, 0, '#fff', 'hinohi_amaterasu', this));
            } else if (type === 'side') {
                this.attackTimer = 15;
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 20, this.direction * 25, 0, '#fff', 'hinohi_solar_ray', this));
            } else if (type === 'up') {
                this.attackTimer = 30; this.vy = -20; // サンライズ
                this.hitbox = { x: this.x - 20, y: this.y - 20, w: 65, h: 40 };
            } else if (type === 'down') {
                this.attackTimer = 20;
                // 陽炎（相手の背後にワープ）
                if (target) {
                    this.x = target.x - (target.direction * 60 * this.scale);
                    this.y = target.y;
                    this.direction = target.direction;
                    this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 40, h: 40 };
                }
            }
        }
        // 【サンズの必殺技】
        else if (this.type === 'sans') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 60;
                // ブラスター召喚！目の前に極太レーザーを出す
                const bx = this.x + (this.direction * 100);
                projectiles.push(new Projectile(bx, this.y + 10, 0, 0, '#fff', 'sans_blast', this));
            } else if (type === 'side') {
                this.attackTimer = 25;
                // よこびー：骨を投げる！
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 15, this.direction * 10, 0, '#fff', 'sans_bone', this));
            } else if (type === 'up') {
                this.attackTimer = 20;
                this.x += this.direction * 150 * this.scale; // テレポート
                this.vy = -5;
            } else if (type === 'down') {
                this.attackTimer = 35;
                const other = (this === player) ? cpu : player;
                other.vy += 15; // 青い心
            }
        }
        // 【スティーブの必殺技】
        else if (this.type === 'steve') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 25;
                // 足元にブロックを置く
                projectiles.push(new Projectile(this.x + 12, this.y + 40, 0, 0, '#795548', 'block', this));
            } else if (type === 'side') {
                this.attackTimer = 45;
                this.vx = this.direction * 14; // トロッコ突進！
                this.hitbox = { x: this.x - 20, y: this.y + 10, w: 65, h: 40 };
            } else if (type === 'up') {
                this.attackTimer = 60;
                this.vy = -15; // エリトラで急上昇
            } else if (type === 'down') {
                this.attackTimer = 35;
                // TNTを設置
                projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 10, 0, 5, '#e74c3c', 'tnt', this));
            }
        }
        // 【ミュウツーの必殺技】
        else if (this.type === 'mewtwo') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 30;
                projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 15, this.direction * 8, 0, '#9b59b6', 'shadow', this));
            } else if (type === 'side') {
                this.attackTimer = 30;
                this.vx = this.direction * 10; // ねんりき突進
                this.hitbox = { x: this.x - 20, y: this.y - 10, w: 70, h: 60 };
            } else if (type === 'up') {
                this.attackTimer = 20;
                this.y -= 180; // テレポート
                this.vy = 0;
            } else if (type === 'down') {
                this.attackTimer = 45;
                this.hitbox = { x: this.x - 30, y: this.y - 10, w: 90, h: 60 }; // かなしばり
            }
        }
        // 【リザードンの必殺技】
        else if (this.type === 'charizard') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 40;
                for (let i = 0; i < 5; i++) {
                    projectiles.push(new Projectile(this.x + (this.direction * 25), this.y + 10, this.direction * (8 + Math.random() * 4), (Math.random() - 0.5) * 6, '#e67e22', 'flame', this));
                }
            } else if (type === 'side') {
                this.attackTimer = 45;
                this.vx = this.direction * 18;
                this.hitbox = { x: this.x - 30, y: this.y - 10, w: 90, h: 60 };
                this.takeDamage(this, 5);
            } else if (type === 'up') {
                this.attackTimer = 40; this.vy = -20;
                this.hitbox = { x: this.x - 10, y: this.y - 10, w: 50, h: 40 };
            } else if (type === 'down') {
                this.attackTimer = 30;
                this.hitbox = { x: this.x - 20, y: this.y + 10, w: 70, h: 45 };
            }
        }
        // 【ルカリオの必殺技】
        else if (this.type === 'lucario') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 35;
                // 波導弾！
                projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 15, this.direction * 9, 0, '#3498db', 'aura', this));
                projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 15, this.direction * 12, 0, '#3498db', 'aura', this));
            } else if (type === 'side') {
                this.attackTimer = 25;
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y + 5, w: 50, h: 40 }; // はっけい
            } else if (type === 'up') {
                this.attackTimer = 50;
                this.vx = this.direction * 15; this.vy = -12; // しんそく
            } else if (type === 'down') {
                this.attackType = 'special_down'; this.attackTimer = 40; // カウンター待機
            }
        }
        // 【ゼラオラの必殺技】
        else if (this.type === 'zeraora') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 30;
                projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + 10, this.direction * 10, 0, '#00d2ff', 'plasma', this));
            } else if (type === 'side') {
                this.attackTimer = 25;
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 40, h: 40 }; // 切り裂く
            } else if (type === 'up') {
                this.attackTimer = 40; this.vy = -16; this.vx = this.direction * 12; // ボルテッカー
            } else if (type === 'down') {
                this.attackTimer = 50;
                this.hitbox = { x: this.x - 50, y: this.y - 50, w: 125, h: 140 }; // 放電
            }
        }
        // 【最強コンビの必殺技】
        else if (this.type === 'duo') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 50;
                // 茈 ＋ 解
                projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 10, this.direction * 12, 0, '#9b59b6', 'duo_murasaki', this));
                for (let i = 0; i < 3; i++) {
                    projectiles.push(new Projectile(this.x + (this.direction * 20), this.y + (i - 1) * 20, this.direction * 20, 0, '#fff', 'duo_kai', this));
                }
            } else if (type === 'side') {
                this.attackTimer = 40;
                // 蒼 ＋ 開(フーガ)
                projectiles.push(new Projectile(this.x + (this.direction * 40), this.y + 10, this.direction * 5, 0, '#3498db', 'duo_ao', this));
                setTimeout(() => {
                    projectiles.push(new Projectile(this.x + (this.direction * 40), this.y + 10, this.direction * 25, 0, '#f1c40f', 'duo_fuga', this));
                }, 200);
            } else if (type === 'up') {
                this.attackTimer = 30;
                // 赤（足元で爆発して上昇）
                this.vy = -20;
                projectiles.push(new Projectile(this.x + 12, this.y + 40, 0, 0, '#e74c3c', 'duo_aka', this));
            } else if (type === 'down') {
                this.attackTimer = 120;
                // 領域展開（無量空処 ＆ 伏魔御厨子）
                projectiles.push(new Projectile(this.x + 12, this.y + 20, 0, 0, 'rgba(255,255,255,0.8)', 'duo_domain', this));
            }
        }
        // 【ロボットの必殺技】
        else if (this.type === 'robot') {
            if (type === 'up' && !this.canSpecialUp) return;
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 25;
                projectiles.push(new Projectile(this.x + (this.direction === 1 ? this.width : 0), this.y + 20, this.direction * 9, -4, '#00d2ff', 'robot_plasma', this));
            } else if (type === 'side') {
                this.attackTimer = 25; this.vx = this.direction * 3;
                this.hitbox = { x: this.x + (this.direction === 1 ? this.width : -25), y: this.y + 10, w: 25, h: 40 };
            } else if (type === 'up') {
                this.attackTimer = 45; this.vy = -18; this.canSpecialUp = false;
                this.hitbox = { x: this.x - 5, y: this.y - 15, w: 50, h: 25 };
            } else if (type === 'down') {
                this.attackTimer = 30; this.hitbox = { x: this.x - 15, y: this.y - 10, w: 70, h: 80 };
            }
        }
        // 【デクの必殺技】
        else if (this.type === 'deku') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 35;
                projectiles.push(new Projectile(this.x + (this.direction * 25), this.y + 15, this.direction * 15, 0, 'rgba(255,255,255,0.7)', 'delaware', this));
            } else if (type === 'side') {
                this.attackTimer = 30;
                this.vx = this.direction * 15;
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 50, h: 40 };
            } else if (type === 'up') {
                this.attackTimer = 40; this.vy = -18;
                this.hitbox = { x: this.x - 5, y: this.y - 10, w: 35, h: 30 };
            } else if (type === 'down') {
                this.attackTimer = 50;
                this.hitbox = { x: this.x - 30, y: this.y - 30, w: 85, h: 100 };
            }
        }
        // 【プーさんの必殺技（ひっさつわざ）】
        else if (this.type === 'pooh') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 30;
                this.vx = this.direction * 15; // タックル！
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 40, h: 40 };
                this.isKokusen = Math.random() < 0.2;
            } else if (type === 'side') {
                this.attackTimer = 60; // 長めにガトリング！
                this.isKokusen = Math.random() < 0.2;
            } else if (type === 'up') {
                this.attackTimer = 60; this.vy = -20; // ロケットジャンプ！
                this.isGliding = true; // 滑空モード
            } else if (type === 'down') {
                this.attackTimer = 60;
                // 赤麟躍動（せきりんやくどう）：全身の力を引き出す！
                this.isRedMode = true;
            }
        }
        // 【オールマイトの必殺技】
        else if (this.type === 'allmight') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 40;
                projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 10, this.direction * 12, 0, 'rgba(255,255,255,0.7)', 'delaware', this));
            } else if (type === 'side') {
                this.attackTimer = 50;
                this.vx = this.direction * 14;
                this.hitbox = { x: this.x + (this.direction * 20), y: this.y, w: 60, h: 50 };
            } else if (type === 'up') {
                this.attackTimer = 45; this.vy = -22;
                this.hitbox = { x: this.x - 10, y: this.y - 10, w: 45, h: 40 };
            } else if (type === 'down') {
                this.attackTimer = 80;
                this.vx = this.direction * 5;
                this.hitbox = { x: this.x + (this.direction * 10), y: this.y - 10, w: 100, h: 100 };
            }
        }
        // 【究極のでんせつの必殺技】
        else if (this.type === 'legend') {
            this.isAttacking = true;
            this.attackType = 'special_' + type;
            if (type === 'neutral') {
                this.attackTimer = 50;
                // ジャッジメント・レイ：宇宙からの光線
                projectiles.push(new Projectile(this.x + 12, 0, 0, 25, '#fff', 'legend_judgment_ray', this));
            } else if (type === 'side') {
                this.attackTimer = 40;
                this.vx = this.direction * 20; // 超高速突進
                this.hitbox = { x: this.x - 20, y: this.y - 10, w: 70, h: 60 };
            } else if (type === 'up') {
                this.attackTimer = 40; this.vy = -25; // 大空へ上昇
                projectiles.push(new Projectile(this.x + 12, this.y + 40, 0, 5, '#00d2ff', 'legend_tornado', this));
            } else if (type === 'down') {
                this.attackTimer = 100;
                // 時空崩壊：周囲に爆発を起こす
                projectiles.push(new Projectile(this.x + 12, this.y + 20, 0, 0, 'rgba(255,255,255,0.8)', 'legend_aka', this));
                projectiles.push(new Projectile(this.x + 12, this.y + 20, 0, 0, 'rgba(0,0,0,0.8)', 'legend_shadow', this));
            }
        }
        // 勇者は、押しただけ（チャージなし）で出る技
        else if (this.type === 'hero') {
            // Hが押されたら、まずはチャージを開始するだけにするよ！
            // 方向は後で判定するから、何もしないでOK
        }

        // キャラが動く技の動く量を減らす
        this.vx *= this.scale;
        this.vy *= this.scale;
    }

    triggerHeroSpecial(forceType = null) {
        let type = forceType || this.touchForceDir; // 【NEW!】タッチ操作の方向を優先
        if (!type) { // Hを離したときに決まる方向
            if (keys['ArrowUp']) type = 'up';
            else if (keys['ArrowDown']) type = 'down';
            else if (keys['ArrowLeft'] || keys['ArrowRight']) {
                type = 'side';
                if (keys['ArrowLeft']) this.direction = -1;
                if (keys['ArrowRight']) this.direction = 1;
            }
            else type = 'neutral';
        } else if (type === 'left' || type === 'right') { // タッチジョイスティックから来た場合
            this.direction = (type === 'right') ? 1 : -1;
            type = 'side';
        }

        this.attackIsCharged = this.chargeTimer > 48; // 0.8秒以上でため攻撃！
        const cost = this.getMPCost(type, this.chargeTimer);
        if (this.mp < cost) return;
        this.mp -= cost;

        this.isAttacking = true;
        this.attackType = 'special_' + type;

        if (type === 'neutral') {
            const isCharged = this.attackIsCharged;
            this.attackTimer = 35;
            const pType = isCharged ? 'hero_merazoma' : 'hero_mera';
            projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 10, this.direction * (isCharged ? 4 : 8), 0, '#ff4500', pType, this));
        } else if (type === 'side') {
            const isCharged = this.attackIsCharged;
            this.attackTimer = isCharged ? 50 : 30;
            const pType = isCharged ? 'hero_kazap' : 'hero_dein';
            const pColor = isCharged ? '#fff' : '#f1c40f';
            const dx = this.direction * (isCharged ? 120 : 60);
            projectiles.push(new Projectile(this.x + dx, 0, 0, 18, pColor, pType, this));
        } else if (type === 'up') {
            this.attackTimer = 40; this.vy = -16;
            projectiles.push(new Projectile(this.x + 10, this.y + 30, 0, 0, '#fff', 'hero_woosh', this));
        } else if (type === 'down') {
            this.attackTimer = 45;
            this.attackType = 'special_down'; // カウンター待機
        }

        this.vx *= this.scale;
        this.vy *= this.scale;
    }

    getMPCost(type, charge) {
        if (type === 'neutral') return charge > 48 ? 30 : 10;
        if (type === 'side') return charge > 48 ? 35 : 15;
        if (type === 'up') return 20;
        return 15;
    }

    spitStar() {
        this.isFull = false;
        const other = this.isPlayer ? cpu : player;
        projectiles.push(new Projectile(this.x + (this.direction * 30), this.y + 10, this.direction * 12, 0, '#fff', 'star', this));
        other.reset(); // 相手が復活！
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.vy = this.jumpPower;
            this.jumpCount++;
            this.isAttacking = false;
        }
    }

    draw() {
        ctx.save();
        // キャラクターの重心（中心）を基準にして、向き（direction）に応じた左右反転と縮小を行う
        const centerX = this.x + 12.5;
        const centerY = this.y + 20;
        ctx.translate(centerX, centerY);
        ctx.scale(this.scale * this.direction, this.scale);

        // --- 全キャラ共通のアタックモーション（ポーズの変化） ---
        if (this.isAttacking) {
            if (this.attackType.startsWith('smash') || this.attackType === 'normal') {
                ctx.rotate(0.2); // 前のめりになる
            } else if (this.attackType === 'special_up') {
                ctx.rotate(-0.2); // 上を向く
            } else if (this.attackType === 'special_down') {
                ctx.scale(1.1, 0.9); // しゃがむ（潰れる）
            } else if (this.attackType === 'special_side') {
                ctx.rotate(0.1); // 少し前へ
            }
        }

        ctx.translate(-centerX, -centerY);

        if (this.type === 'robot') this.drawRobot();
        else if (this.type === 'hero') this.drawHero();
        else if (this.type === 'pikachu') this.drawPikachu();
        else if (this.type === 'link') this.drawLink();
        else if (this.type === 'mario') this.drawMario();
        else if (this.type === 'hinohi') this.drawHinohi();
        else if (this.type === 'sans') this.drawSans();
        else if (this.type === 'steve') this.drawSteve();
        else if (this.type === 'mewtwo') this.drawMewtwo();
        else if (this.type === 'charizard') this.drawCharizard();
        else if (this.type === 'lucario') this.drawLucario();
        else if (this.type === 'zeraora') this.drawZeraora();
        else if (this.type === 'deku') this.drawDeku();
        else if (this.type === 'pooh') this.drawPooh();
        else if (this.type === 'duo') this.drawDuo();
        else if (this.type === 'allmight') this.drawAllMight();
        else if (this.type === 'legend') this.drawLegend();
        else this.drawKirby();

        ctx.restore();

        const markerColor = this.isCPU ? '#3498db' : '#e74c3c';
        const label = this.isCPU ? 'CP' : 'P1';
        ctx.fillStyle = markerColor; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText(label, this.x + (12.5 * this.scale), this.y - 15);
        ctx.beginPath();
        ctx.moveTo(this.x + (7.5 * this.scale), this.y - 10);
        ctx.lineTo(this.x + (17.5 * this.scale), this.y - 10);
        ctx.lineTo(this.x + (12.5 * this.scale), this.y - 4);
        ctx.fill();
        ctx.textAlign = 'left';
    }

    drawMario() {
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 4 : 0;

        // --- マリオの攻撃エフェクト ---
        if (this.isAttacking) {
            if (this.attackType === 'special_side') {
                // マントを描画
                ctx.fillStyle = '#f1c40f'; // 黄色いマント
                ctx.beginPath();
                ctx.moveTo(this.x + 15, this.y + 15);
                ctx.quadraticCurveTo(this.x + 35, this.y + 5, this.x + 40 + Math.sin(animationFrame) * 10, this.y + 25);
                ctx.quadraticCurveTo(this.x + 20, this.y + 40, this.x + 5, this.y + 30);
                ctx.fill();
            } else if (this.attackType.startsWith('smash') || this.attackType === 'normal') {
                // パンチの軌跡
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath(); ctx.arc(this.x + 35, this.y + 25, 10 + Math.random()*5, 0, Math.PI * 2); ctx.fill();
            }
        }

        // --- 帽子 (赤いM帽) ---
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x + 2, this.y + 2, 21, 5); // つば
        ctx.fillRect(this.x + 5, this.y - 4, 15, 7); // 帽子本体
        // 帽子のMマーク
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 9, this.y - 2, 1, 3);
        ctx.fillRect(this.x + 12, this.y - 2, 1, 3);
        ctx.fillRect(this.x + 15, this.y - 2, 1, 3);
        ctx.fillRect(this.x + 10, this.y - 1, 2, 2);
        ctx.fillRect(this.x + 13, this.y - 1, 2, 2);

        // --- 顔 (肌色) ---
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(this.x + 5, this.y + 7, 15, 10);
        // ひげ
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(this.x + 6, this.y + 13, 13, 2);
        // 鼻
        ctx.fillStyle = '#e8a87c';
        ctx.beginPath(); ctx.arc(this.x + 12 + this.direction * 3, this.y + 12, 2, 0, Math.PI * 2); ctx.fill();
        // 目
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 7 + (this.direction > 0 ? 2 : 0), this.y + 9, 3, 2);

        // --- 体 (青いオーバーオール) ---
        ctx.fillStyle = '#1a5276';
        ctx.fillRect(this.x + 5, this.y + 17, 15, 14);
        // サスペンダー
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x + 5, this.y + 17, 5, 14);
        ctx.fillRect(this.x + 15, this.y + 17, 5, 14);
        // ボタン
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 8, this.y + 19, 2, 2);
        ctx.fillRect(this.x + 15, this.y + 19, 2, 2);

        // --- 腕 ---
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(this.x + 1, this.y + 17, 4, 9);
        ctx.fillRect(this.x + 20, this.y + 17, 4, 9);
        // 白い手袋
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.x + 3, this.y + 27, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 22, this.y + 27, 3, 0, Math.PI * 2); ctx.fill();

        // --- 足 (茶色のブーツ) ---
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(this.x + 3, this.y + 31 + walk, 8, 7);
        ctx.fillRect(this.x + 14, this.y + 31 - walk, 8, 7);
        // ブーツの先 (少し丸く)
        ctx.beginPath(); ctx.arc(this.x + 6, this.y + 38 + walk, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 17, this.y + 38 - walk, 4, 0, Math.PI * 2); ctx.fill();
    }
    drawHinohi() {
        // ヒノヒ：太陽神のような少女
        const bounce = Math.sin(animationFrame * 0.1) * 3;
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 4 : 0;

        // --- 太陽のオーラ ---
        ctx.save();
        ctx.shadowBlur = 25; ctx.shadowColor = '#f39c12';
        ctx.strokeStyle = 'rgba(243,156,18,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 10 + bounce, 22, 0, Math.PI * 2); ctx.stroke();
        // 光の棘
        for (let i = 0; i < 8; i++) {
            const ang = (i * Math.PI / 4) + animationFrame * 0.03;
            ctx.strokeStyle = `rgba(255,${150 + Math.floor(Math.sin(animationFrame*0.1+i)*60)},0,0.5)`;
            ctx.beginPath();
            ctx.moveTo(this.x + 12 + Math.cos(ang) * 18, this.y + 10 + bounce + Math.sin(ang) * 18);
            ctx.lineTo(this.x + 12 + Math.cos(ang) * 26, this.y + 10 + bounce + Math.sin(ang) * 26);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // --- 髪 (炎のような赤橙) ---
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(this.x + 4, this.y + 7 + bounce);
        ctx.lineTo(this.x + 7, this.y - 4 + bounce);
        ctx.lineTo(this.x + 10, this.y + 5 + bounce); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 9, this.y + 5 + bounce);
        ctx.lineTo(this.x + 12, this.y - 6 + bounce);
        ctx.lineTo(this.x + 15, this.y + 5 + bounce); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 14, this.y + 7 + bounce);
        ctx.lineTo(this.x + 17, this.y - 2 + bounce);
        ctx.lineTo(this.x + 20, this.y + 7 + bounce); ctx.fill();

        // --- 顔 ---
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 11 + bounce, 9, 0, Math.PI * 2); ctx.fill();
        // 目 (輝く金色)
        ctx.fillStyle = '#f1c40f';
        ctx.shadowBlur = 8; ctx.shadowColor = '#f1c40f';
        ctx.beginPath(); ctx.arc(this.x + 8, this.y + 10 + bounce, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 16, this.y + 10 + bounce, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // 口 (にこっ)
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 13 + bounce, 2, 0.1, Math.PI - 0.1); ctx.stroke();

        // --- 巫女装束（白衣+緋袴） ---
        ctx.fillStyle = '#fefefe'; // 白衣
        ctx.fillRect(this.x + 5, this.y + 20 + bounce, 15, 12);
        ctx.fillStyle = '#e74c3c'; // 緋袴
        ctx.fillRect(this.x + 4, this.y + 29 + bounce, 17, 10);
        // 袖
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(this.x, this.y + 20 + bounce, 5, 8);
        ctx.fillRect(this.x + 20, this.y + 20 + bounce, 5, 8);

        // --- 足 ---
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 5, this.y + 39 + bounce + walk, 6, 5);
        ctx.fillRect(this.x + 14, this.y + 39 + bounce - walk, 6, 5);
    }
    drawSans() {
        // サンズ：UnderTaleの骸骨
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 3 : 0;
        const grin = this.isAttacking; // 攻撃中はドヤ顔

        // --- 頭蓋骨 (白くて丸い) ---
        ctx.fillStyle = '#f0ece0';
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 9, 11, 0, Math.PI * 2); ctx.fill();

        // --- 目穴 ---
        if (grin) {
            // 攻撃中：青い眼光
            ctx.fillStyle = '#00d2ff';
            ctx.shadowBlur = 15; ctx.shadowColor = '#00d2ff';
            ctx.beginPath(); ctx.arc(this.x + 8, this.y + 8, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.x + 17, this.y + 8, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath(); ctx.arc(this.x + 8, this.y + 8, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.x + 17, this.y + 8, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        // --- 大きな歯のグリン ---
        ctx.fillStyle = '#f0ece0';
        ctx.fillRect(this.x + 5, this.y + 14, 15, 5);
        ctx.fillStyle = '#1a1a1a'; // 歯の間の隙間
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(this.x + 7 + i * 3, this.y + 14, 1, 5);
        }

        // --- フード (青いパーカー) ---
        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y + 19);
        ctx.lineTo(this.x + 5, this.y + 10);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.lineTo(this.x + 23, this.y + 19);
        ctx.fill();

        // --- 体 (青いパーカー) ---
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(this.x + 3, this.y + 19, 19, 16);
        // 白いシャツが見える
        ctx.fillStyle = '#f0ece0';
        ctx.fillRect(this.x + 9, this.y + 20, 7, 12);

        // --- ポケット ---
        ctx.fillStyle = '#1a6fa8';
        ctx.fillRect(this.x + 4, this.y + 27, 5, 4);
        ctx.fillRect(this.x + 16, this.y + 27, 5, 4);

        // --- 黒いズボン ---
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x + 4, this.y + 35, 18, 6);
        // スリッパ
        ctx.fillStyle = '#c9b8a8';
        ctx.fillRect(this.x + 2, this.y + 40 + walk, 9, 4);
        ctx.fillRect(this.x + 14, this.y + 40 - walk, 9, 4);
    }
    drawSteve() {
        // スティーブ：Minecraftの主人公 (ブロック顔!)
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 4 : 0;

        // --- 頭 (ブロック状・完全に四角い) ---
        ctx.fillStyle = '#c4975f'; // 肌色
        ctx.fillRect(this.x + 4, this.y, 17, 16);
        // 髪 (茶色)
        ctx.fillStyle = '#5c3d1e';
        ctx.fillRect(this.x + 4, this.y, 17, 5);
        ctx.fillRect(this.x + 4, this.y + 5, 3, 4); // 左サイド
        ctx.fillRect(this.x + 18, this.y + 5, 3, 4); // 右サイド
        // 目 (白目+黒目, 正方形)
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 7, this.y + 7, 4, 4);
        ctx.fillRect(this.x + 14, this.y + 7, 4, 4);
        ctx.fillStyle = '#3c2c9e'; // 青い瞳
        ctx.fillRect(this.x + 8, this.y + 8, 2, 2);
        ctx.fillRect(this.x + 15, this.y + 8, 2, 2);
        // 口 (暗い線)
        ctx.fillStyle = '#8a5c35';
        ctx.fillRect(this.x + 8, this.y + 12, 9, 2);

        // --- 体 (水色シャツ) ---
        ctx.fillStyle = '#5bb8d4';
        ctx.fillRect(this.x + 3, this.y + 16, 19, 15);
        // シャツの模様
        ctx.fillStyle = '#3d9cb8';
        ctx.fillRect(this.x + 8, this.y + 18, 9, 10);

        // --- 腕 ---
        ctx.fillStyle = '#c4975f';
        ctx.fillRect(this.x, this.y + 16, 3, 13);
        ctx.fillRect(this.x + 22, this.y + 16, 3, 13);
        // 手 (道具を持つ感じ)
        ctx.fillStyle = '#a07848';
        ctx.fillRect(this.x - 1, this.y + 27, 5, 5);
        ctx.fillRect(this.x + 21, this.y + 27, 5, 5);

        // --- ズボン (紺色) ---
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(this.x + 4, this.y + 31 + walk, 7, 12);
        ctx.fillRect(this.x + 14, this.y + 31 - walk, 7, 12);
        // ブーツ
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(this.x + 3, this.y + 41 + walk, 9, 5);
        ctx.fillRect(this.x + 13, this.y + 41 - walk, 9, 5);
    }
    drawMewtwo() {
        // ミュウツー：伝説のエスパーポケモン
        const bounce = Math.sin(animationFrame * 0.1) * 3;

        // --- 念力オーラ ---
        ctx.save();
        ctx.shadowBlur = 20; ctx.shadowColor = '#9b59b6';
        ctx.strokeStyle = 'rgba(155,89,182,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 20 + bounce, 25, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();

        // --- しっぽ ---
        ctx.strokeStyle = '#c8a0e0'; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y + 32 + bounce);
        ctx.quadraticCurveTo(this.x - 18, this.y + 52 + bounce, this.x - 5, this.y + 60 + bounce);
        ctx.stroke();

        // --- 頭 (大きく丸い・白紫) ---
        ctx.fillStyle = '#dce8f0';
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 9 + bounce, 11, 0, Math.PI * 2); ctx.fill();
        // 頭のへこみ (中央上)
        ctx.fillStyle = '#b8cfe0';
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 1 + bounce, 4, 0, Math.PI * 2); ctx.fill();
        // 耳 (小さな突起)
        ctx.fillStyle = '#dce8f0';
        ctx.fillRect(this.x + 5, this.y - 2 + bounce, 4, 5);
        ctx.fillRect(this.x + 16, this.y - 2 + bounce, 4, 5);

        // --- 目 (鋭い紫) ---
        ctx.fillStyle = '#9b59b6';
        ctx.shadowBlur = 8; ctx.shadowColor = '#9b59b6';
        ctx.beginPath(); ctx.arc(this.x + 8 + (this.direction > 0 ? 1 : 0), this.y + 9 + bounce, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 17 + (this.direction > 0 ? 1 : 0), this.y + 9 + bounce, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // --- 体 (白紫の筋肉質) ---
        ctx.fillStyle = '#dce8f0';
        ctx.fillRect(this.x + 5, this.y + 19 + bounce, 15, 16);
        // 胸の紫マーク
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(this.x + 8, this.y + 21 + bounce, 9, 10);

        // --- 腕 ---
        ctx.fillStyle = '#c8a0e0';
        ctx.fillRect(this.x + 1, this.y + 19 + bounce, 4, 12);
        ctx.fillRect(this.x + 20, this.y + 19 + bounce, 4, 12);
        // 手 (丸い)
        ctx.beginPath(); ctx.arc(this.x + 3, this.y + 32 + bounce, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 22, this.y + 32 + bounce, 4, 0, Math.PI * 2); ctx.fill();

        // --- 足 ---
        ctx.fillStyle = '#dce8f0';
        ctx.fillRect(this.x + 4, this.y + 35 + bounce, 7, 10);
        ctx.fillRect(this.x + 14, this.y + 35 + bounce, 7, 10);
    }
    drawCharizard() {
        // リザードン：炎を纏う最強のドラゴン
        const wingMove = Math.sin(animationFrame * 0.15) * 10;
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 4 : 0;

        // --- リザードンの攻撃エフェクト ---
        if (this.isAttacking) {
            if (this.attackType === 'special_side') {
                // フレアドライブ
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = '#3498db';
                ctx.beginPath(); ctx.arc(this.x + 15, this.y + 20, 45 + Math.random() * 10, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath(); ctx.arc(this.x + 15, this.y + 20, 30 + Math.random() * 10, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            } else if (this.attackType.startsWith('smash') || this.attackType === 'normal') {
                // 引っ掻きエフェクト
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(this.x + 25, this.y + 5); ctx.lineTo(this.x + 50, this.y + 30); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 15); ctx.lineTo(this.x + 45, this.y + 40); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(this.x + 15, this.y + 25); ctx.lineTo(this.x + 40, this.y + 50); ctx.stroke();
            }
        }

        // --- 翼 (コウモリ型・紺色) ---
        ctx.fillStyle = '#1a237e';
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 14);
        ctx.lineTo(this.x - 28, this.y - 8 + wingMove);
        ctx.lineTo(this.x - 20, this.y + 4 + wingMove);
        ctx.lineTo(this.x - 10, this.y - 2 + wingMove);
        ctx.lineTo(this.x + 6, this.y + 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 19, this.y + 14);
        ctx.lineTo(this.x + 48, this.y - 8 - wingMove);
        ctx.lineTo(this.x + 40, this.y + 4 - wingMove);
        ctx.lineTo(this.x + 30, this.y - 2 - wingMove);
        ctx.lineTo(this.x + 19, this.y + 8);
        ctx.fill();

        // --- しっぽ (炎つき) ---
        ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x + 18, this.y + 36);
        ctx.quadraticCurveTo(this.x + 35, this.y + 40, this.x + 30, this.y + 30);
        ctx.stroke();
        // しっぽの炎
        ctx.fillStyle = '#f39c12';
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff6600';
        ctx.beginPath(); ctx.arc(this.x + 30, this.y + 28, 5 + Math.sin(animationFrame * 0.3) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.x + 30, this.y + 27, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // --- 頭 (オレンジ) ---
        ctx.fillStyle = '#e8762a';
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 9, 10, 0, Math.PI * 2); ctx.fill();
        // 角
        ctx.fillStyle = '#bf5a1e';
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 3); ctx.lineTo(this.x + 4, this.y - 5); ctx.lineTo(this.x + 10, this.y + 1); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 18, this.y + 3); ctx.lineTo(this.x + 20, this.y - 5); ctx.lineTo(this.x + 14, this.y + 1); ctx.fill();
        // 白目 + 黒目
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.x + 9, this.y + 8, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 15, this.y + 8, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(this.x + 9 + this.direction, this.y + 8, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 15 + this.direction, this.y + 8, 1.5, 0, Math.PI * 2); ctx.fill();
        // 鼻孔
        ctx.fillStyle = '#bf5a1e';
        ctx.fillRect(this.x + 10, this.y + 13, 2, 1); ctx.fillRect(this.x + 13, this.y + 13, 2, 1);

        // --- 体 (オレンジ+腹は黄色) ---
        ctx.fillStyle = '#e8762a';
        ctx.fillRect(this.x + 4, this.y + 18, 17, 18);
        ctx.fillStyle = '#f5d16a'; // 腹の黄色い部分
        ctx.fillRect(this.x + 7, this.y + 19, 11, 14);

        // --- 腕 ---
        ctx.fillStyle = '#e8762a';
        ctx.fillRect(this.x, this.y + 18, 4, 12);
        ctx.fillRect(this.x + 21, this.y + 18, 4, 12);
        ctx.beginPath(); ctx.arc(this.x + 2, this.y + 31, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 23, this.y + 31, 4, 0, Math.PI * 2); ctx.fill();

        // --- 足 ---
        ctx.fillStyle = '#e8762a';
        ctx.fillRect(this.x + 4, this.y + 36 + walk, 7, 9);
        ctx.fillRect(this.x + 14, this.y + 36 - walk, 7, 9);
        // 爪
        ctx.fillStyle = '#bf5a1e';
        ctx.fillRect(this.x + 3, this.y + 44 + walk, 3, 3);
        ctx.fillRect(this.x + 7, this.y + 44 + walk, 3, 3);
        ctx.fillRect(this.x + 13, this.y + 44 - walk, 3, 3);
        ctx.fillRect(this.x + 17, this.y + 44 - walk, 3, 3);
    }
    drawLucario() {
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 4 : 0;

        // --- 波導オーラ ---
        ctx.save();
        ctx.shadowBlur = 18; ctx.shadowColor = '#3498db';
        ctx.strokeStyle = 'rgba(52,152,219,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 22, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();

        // --- 耳 (長く尖った黒) ---
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.moveTo(this.x + 5, this.y + 5); ctx.lineTo(this.x + 3, this.y - 10); ctx.lineTo(this.x + 10, this.y + 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 5); ctx.lineTo(this.x + 22, this.y - 10); ctx.lineTo(this.x + 15, this.y + 2); ctx.fill();
        // 耳の内側 (青)
        ctx.fillStyle = '#3498db';
        ctx.beginPath(); ctx.moveTo(this.x + 6, this.y + 3); ctx.lineTo(this.x + 5, this.y - 6); ctx.lineTo(this.x + 10, this.y + 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(this.x + 19, this.y + 3); ctx.lineTo(this.x + 20, this.y - 6); ctx.lineTo(this.x + 15, this.y + 2); ctx.fill();

        // --- 頭 (青+黒のツートン) ---
        ctx.fillStyle = '#3498db';
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 9, 10, 0, Math.PI * 2); ctx.fill();
        // 顔の黒いマスク
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x + 4, this.y + 5, 17, 8);
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 5, 8, 0, Math.PI); ctx.fill();

        // --- 目 (赤く光る) ---
        ctx.fillStyle = '#e74c3c';
        ctx.shadowBlur = 10; ctx.shadowColor = '#e74c3c';
        ctx.beginPath(); ctx.arc(this.x + 8 + (this.direction > 0 ? 2 : 0), this.y + 9, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 16 + (this.direction > 0 ? 2 : 0), this.y + 9, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // --- 体 ---
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x + 4, this.y + 18, 17, 18);
        // 胸の毛 (クリーム色)
        ctx.fillStyle = '#f0e6c8';
        ctx.fillRect(this.x + 7, this.y + 19, 11, 12);
        // 胸の青いX模様
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(this.x + 7, this.y + 22, 11, 2);
        ctx.fillRect(this.x + 11, this.y + 19, 3, 9);

        // --- 腕 ---
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x, this.y + 18, 4, 14);
        ctx.fillRect(this.x + 21, this.y + 18, 4, 14);
        // 手の波導球
        ctx.fillStyle = '#3498db';
        ctx.shadowBlur = 12; ctx.shadowColor = '#3498db';
        ctx.beginPath(); ctx.arc(this.x + 2, this.y + 33, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 23, this.y + 33, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // --- 足 ---
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x + 4, this.y + 36 + walk, 7, 8);
        ctx.fillRect(this.x + 14, this.y + 36 - walk, 7, 8);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(this.x + 3, this.y + 42 + walk, 9, 4);
        ctx.fillRect(this.x + 13, this.y + 42 - walk, 9, 4);
    }
    drawZeraora() {
        // ゼラオラ：雷鳴き泣くかっこいいポケモン
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.25) * 4 : 0;

        // --- 電気オーラ ---
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = '#00d2ff';
        ctx.strokeStyle = 'rgba(0,210,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 20, 24, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();

        // --- 耳 (尖った黄色) ---
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.moveTo(this.x + 5, this.y + 4); ctx.lineTo(this.x + 2, this.y - 9); ctx.lineTo(this.x + 11, this.y + 3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 4); ctx.lineTo(this.x + 23, this.y - 9); ctx.lineTo(this.x + 14, this.y + 3); ctx.fill();
        // 耳の内側 (濃い黄)
        ctx.fillStyle = '#e1a800';
        ctx.beginPath(); ctx.moveTo(this.x + 6, this.y + 3); ctx.lineTo(this.x + 4, this.y - 6); ctx.lineTo(this.x + 10, this.y + 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(this.x + 19, this.y + 3); ctx.lineTo(this.x + 21, this.y - 6); ctx.lineTo(this.x + 15, this.y + 2); ctx.fill();

        // --- 頭 (黄色と白色のモフ) ---
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 10, 10, 0, Math.PI * 2); ctx.fill();
        // 顔の白いマズル
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 6, this.y + 10, 13, 7);
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 10, 6, 0, Math.PI); ctx.fill();

        // --- 目 (馨む水色) ---
        ctx.fillStyle = '#00d2ff';
        ctx.shadowBlur = 8; ctx.shadowColor = '#00d2ff';
        ctx.beginPath(); ctx.arc(this.x + 8, this.y + 8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 17, this.y + 8, 2, 0, Math.PI * 2); ctx.fill();
        // スリット目
        ctx.fillStyle = '#007799';
        ctx.fillRect(this.x + 6, this.y + 7, 4, 1);
        ctx.fillRect(this.x + 15, this.y + 7, 4, 1);
        ctx.shadowBlur = 0;
        // 鼻
        ctx.fillStyle = '#e1a800';
        ctx.fillRect(this.x + 11, this.y + 14, 3, 1);

        // --- 体 (黄色と濃い模様) ---
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 4, this.y + 19, 17, 17);
        // 胸の水色のライン
        ctx.fillStyle = '#00d2ff';
        ctx.shadowBlur = 6; ctx.shadowColor = '#00d2ff';
        ctx.fillRect(this.x + 6, this.y + 21, 13, 2);
        ctx.fillRect(this.x + 6, this.y + 25, 13, 2);
        ctx.shadowBlur = 0;
        // 暗色の模様
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 8, this.y + 29, 9, 5);

        // --- 腕 ---
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x, this.y + 19, 4, 13);
        ctx.fillRect(this.x + 21, this.y + 19, 4, 13);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x, this.y + 25, 4, 4);
        ctx.fillRect(this.x + 21, this.y + 25, 4, 4);

        // --- 足 ---
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + 4, this.y + 36 + walk, 7, 9);
        ctx.fillRect(this.x + 14, this.y + 36 - walk, 7, 9);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 3, this.y + 43 + walk, 9, 4);
        ctx.fillRect(this.x + 13, this.y + 43 - walk, 9, 4);
    }
    drawHero() {
        // 勇者：ドラクエの主人公
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 4 : 0;

        // --- 冒険者の冒具 — 盾 (黄色、左側) ---
        const shieldX = this.direction === 1 ? this.x - 7 : this.x + 24;
        ctx.fillStyle = '#c0932f';
        ctx.fillRect(shieldX, this.y + 14, 8, 14);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(shieldX + 1, this.y + 15, 6, 12);
        // 盾のリベット
        ctx.fillStyle = '#c0932f';
        ctx.fillRect(shieldX + 3, this.y + 15, 2, 12);
        ctx.fillRect(shieldX + 1, this.y + 20, 6, 2);

        // --- 剑 (銀色、右側) ---
        const swordX = this.direction === 1 ? this.x + 23 : this.x - 4;
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(swordX, this.y + 8, 3, 24);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(swordX - 1, this.y + 8, 1, 24);
        // 十字ガード
        ctx.fillStyle = '#d4a017';
        ctx.fillRect(swordX - 2, this.y + 17, 7, 3);
        // 剣先
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath(); ctx.moveTo(swordX, this.y + 8); ctx.lineTo(swordX + 3, this.y + 8); ctx.lineTo(swordX + 1.5, this.y + 4); ctx.fill();

        // --- バンダナ (3色の横帯) ---
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x + 4, this.y + 3, 17, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 4, this.y + 4, 17, 1);

        // --- 髪 (暗い茶色) ---
        ctx.fillStyle = '#5d3b1f';
        ctx.fillRect(this.x + 4, this.y + 7, 17, 4);
        ctx.fillRect(this.x + 4, this.y + 11, 3, 3);
        ctx.fillRect(this.x + 18, this.y + 11, 3, 3);

        // --- 顔 ---
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(this.x + 6, this.y + 11, 13, 9);
        // 目
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x + 7 + (this.direction > 0 ? 3 : 0), this.y + 13, 3, 3);
        // 口
        ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(this.x + 9, this.y + 18); ctx.lineTo(this.x + 16, this.y + 18); ctx.stroke();

        // --- 服 (紫のマント) ---
        ctx.fillStyle = '#7d3c98';
        ctx.fillRect(this.x + 4, this.y + 20, 17, 16);
        // ベルト
        ctx.fillStyle = '#5c1e8e';
        ctx.fillRect(this.x + 4, this.y + 28, 17, 3);
        // ボタン
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 11, this.y + 22, 3, 3);
        ctx.fillRect(this.x + 11, this.y + 31, 3, 3);

        // --- 足 (茶色ブーツ) ---
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(this.x + 4, this.y + 36 + walk, 7, 8);
        ctx.fillRect(this.x + 14, this.y + 36 - walk, 7, 8);
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(this.x + 3, this.y + 42 + walk, 9, 4);
        ctx.fillRect(this.x + 13, this.y + 42 - walk, 9, 4);
    }

    drawLink() {
        // リンク：緑の服（ふく）と三角帽子（ぼうし）
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 5 : 0;

        // --- 帽子（ぼうし） ---
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 5);
        ctx.lineTo(this.x + 12, this.y - 12);
        ctx.lineTo(this.x + 20, this.y + 5);
        ctx.fill();

        // --- 顔（かお） ---
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath(); ctx.arc(this.x + 12, this.y + 10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(this.x + 5, this.y + 4, 15, 4); // 髪（黄色）

        // --- 目 ---
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(this.x + 12 + (this.direction * 4), this.y + 10, 1.5, 0, Math.PI * 2); ctx.fill();

        // --- 服（ふく） ---
        ctx.fillStyle = '#27ae60'; ctx.fillRect(this.x + 5, this.y + 18, 15, 18);
        ctx.fillStyle = '#795548'; ctx.fillRect(this.x + 5, this.y + 25, 15, 3); // ベルト

        // --- 武器（ぶき） ---
        ctx.fillStyle = '#3498db'; ctx.fillRect(this.x + (this.direction === 1 ? -6 : 25), this.y + 18, 6, 12); // 盾
        ctx.fillStyle = '#bdc3c7'; ctx.fillRect(this.x + (this.direction === 1 ? 22 : -2), this.y + 12, 3, 20); // 剣

        // --- 足 ---
        ctx.fillStyle = '#795548';
        ctx.fillRect(this.x + 4, this.y + 36 + walk, 7, 6);
        ctx.fillRect(this.x + 14, this.y + 36 - walk, 7, 6);
    }
    drawPikachu() {
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 3 : 0;
        ctx.save(); ctx.translate(this.x + 5, this.y + 5); ctx.rotate(-0.3); ctx.fillStyle = '#f1c40f'; ctx.fillRect(0, -12, 5, 15); ctx.fillStyle = '#000'; ctx.fillRect(0, -12, 5, 4); ctx.restore();
        ctx.save(); ctx.translate(this.x + 20, this.y + 5); ctx.rotate(0.3); ctx.fillStyle = '#f1c40f'; ctx.fillRect(-5, -12, 5, 15); ctx.fillStyle = '#000'; ctx.fillRect(-5, -12, 5, 4); ctx.restore();
        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 12, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x + 8, this.y + 10, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(this.x + 17, this.y + 10, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(this.x + 5, this.y + 16, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(this.x + 20, this.y + 16, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(this.x + 12.5, this.y + 28, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(this.x + 2, this.y + 25 + walk, 5, 5); ctx.fillRect(this.x + 18, this.y + 25 - walk, 5, 5);
        ctx.fillRect(this.x + 5, this.y + 36 + walk, 6, 5); ctx.fillRect(this.x + 14, this.y + 36 - walk, 6, 5);
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(this.x + 5, this.y + 30); ctx.lineTo(this.x - 10, this.y + 25); ctx.lineTo(this.x - 5, this.y + 15); ctx.lineTo(this.x - 15, this.y + 10); ctx.stroke();
    }
    drawKirby() {
        const size = this.isFull ? 1.6 : 1;
        const bounce = Math.abs(Math.sin(animationFrame * 0.15)) * 3;
        ctx.fillStyle = '#ffafbd'; ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 20 + bounce, 14 * size, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; const eyeY = this.y + 16 + bounce;
        if (this.isAttacking) { ctx.fillRect(this.x + 7, eyeY, 3, 6); ctx.fillRect(this.x + 15, eyeY, 3, 6); }
        else { ctx.beginPath(); ctx.arc(this.x + 9, eyeY, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(this.x + 16, eyeY, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#ff9ff3'; ctx.beginPath(); ctx.arc(this.x + 5, eyeY + 6, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(this.x + 20, eyeY + 6, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e84393'; const legW = (this.isGrounded) ? 0 : Math.sin(animationFrame * 0.3) * 5;
        ctx.beginPath(); ctx.ellipse(this.x + 4, this.y + 34 - legW, 8 * size, 5 * size, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.x + 21, this.y + 34 + legW, 8 * size, 5 * size, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawDeku() {
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 5 : 0;
        ctx.fillStyle = '#ffeaa7'; ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 10, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#27ae60'; ctx.fillRect(this.x + 3, this.y, 19, 6);
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.x + 12 + (this.direction * 5), this.y + 10, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(this.x + 5, this.y + 19, 15, 18);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x + 4, this.y + 36 + walk, 7, 6); ctx.fillRect(this.x + 14, this.y + 36 - walk, 7, 6);
        if (this.isAttacking && this.attackType === 'special_down') {
            ctx.strokeStyle = '#00d2ff'; ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(this.x + Math.random() * 25, this.y + Math.random() * 40); ctx.lineTo(this.x + Math.random() * 25, this.y + Math.random() * 40); ctx.stroke(); }
        }
    }


    drawRobot() {
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 5 : 0;
        ctx.fillStyle = '#95a5a6'; ctx.fillRect(this.x + 5, this.y, 15, 12);
        ctx.fillStyle = '#00d2ff'; ctx.fillRect(this.x + 8, this.y + 4, 9, 3);
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(this.x + 2, this.y + 12, 21, 18);
        ctx.fillStyle = '#34495e'; ctx.fillRect(this.x + 5, this.y + 30 + walk, 6, 10); ctx.fillRect(this.x + 14, this.y + 30 - walk, 6, 10);
    }

    drawDuo() {
        const bounce = Math.sin(animationFrame * 0.1) * 2;

        // --- 1. 五条 悟 (Gojo Satoru) ---
        // 髪 (白・銀色のトゲトゲ)
        ctx.fillStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y + 10 + bounce);
        ctx.lineTo(this.x + 6, this.y + 2 + bounce);
        ctx.lineTo(this.x + 9, this.y + 10 + bounce);
        ctx.moveTo(this.x + 7, this.y + 10 + bounce);
        ctx.lineTo(this.x + 11, this.y + 1 + bounce);
        ctx.lineTo(this.x + 14, this.y + 10 + bounce);
        ctx.fill();

        // 顔 (肌色)
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(this.x + 4, this.y + 8 + bounce, 9, 8);

        // 目隠し (黒い帯) または 蒼い目 (六眼)
        if ((Math.floor(animationFrame / 60) % 4) === 0) {
            // 六眼（きらめく水色の目）
            ctx.fillStyle = '#00e5ff';
            ctx.shadowBlur = 10; ctx.shadowColor = '#00e5ff';
            ctx.fillRect(this.x + 6, this.y + 10 + bounce, 2, 2);
            ctx.fillRect(this.x + 10, this.y + 10 + bounce, 2, 2);
            ctx.shadowBlur = 0;
        } else {
            // 黒い目隠し
            ctx.fillStyle = '#111';
            ctx.fillRect(this.x + 3, this.y + 9 + bounce, 11, 4);
        }

        // 体 (黒い高専制服)
        ctx.fillStyle = '#1a1a24';
        ctx.fillRect(this.x + 3, this.y + 16 + bounce, 11, 14); // 上着
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(this.x + 4, this.y + 30 + bounce, 4, 8); // 左足
        ctx.fillRect(this.x + 9, this.y + 30 + bounce, 4, 8); // 右足

        // 無下限呪術のオーラ (無限を現す薄水色の円環)
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x + 8.5, this.y + 18 + bounce, 18, 0, Math.PI * 2);
        ctx.stroke();

        // --- 2. 両面 宿儺 (Ryomen Sukuna) ---
        // 髪 (ツンツンした薄ピンク)
        ctx.fillStyle = '#ff8fa3';
        ctx.beginPath();
        ctx.moveTo(this.x + 13, this.y + 16 - bounce);
        ctx.lineTo(this.x + 16, this.y + 6 - bounce);
        ctx.lineTo(this.x + 19, this.y + 16 - bounce);
        ctx.moveTo(this.x + 17, this.y + 16 - bounce);
        ctx.lineTo(this.x + 21, this.y + 7 - bounce);
        ctx.lineTo(this.x + 24, this.y + 16 - bounce);
        ctx.fill();

        // 顔 (肌色)
        ctx.fillStyle = '#ffd1a9';
        ctx.fillRect(this.x + 14, this.y + 14 - bounce, 9, 8);

        // 紋様 & 赤い瞳
        ctx.fillStyle = '#3a0007';
        ctx.fillRect(this.x + 15, this.y + 17 - bounce, 7, 1); // 目の下の紋様
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x + 16, this.y + 18 - bounce, 1.5, 1.5);
        ctx.fillRect(this.x + 20, this.y + 18 - bounce, 1.5, 1.5);

        // 体 (白の和服)
        ctx.fillStyle = '#eaeaea';
        ctx.fillRect(this.x + 13, this.y + 22 - bounce, 11, 14); // 着物
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(this.x + 12, this.y + 28 - bounce, 13, 3); // 帯
        ctx.fillStyle = '#8a1f1f';
        ctx.fillRect(this.x + 14, this.y + 36 - bounce, 3, 4); // 左足
        ctx.fillRect(this.x + 20, this.y + 36 - bounce, 3, 4); // 右足

        // 呪いのオーラ (禍々しい紫のオーラ)
        ctx.shadowBlur = 15; ctx.shadowColor = '#9b59b6';
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x + 18.5, this.y + 24 - bounce, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // シャドウリセット
    }

    drawPooh() {
        // プーさん：黄色（きいろ）いクマ
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.15) * 3 : 0;
        const glide = (this.isGliding && this.vy > 0) ? Math.sin(animationFrame * 0.1) * 10 : 0;

        // 【NEW!】赤麟躍動モードのエフェクト（体が赤く光る）
        if (this.isRedMode) {
            ctx.shadowBlur = 20; ctx.shadowColor = '#e74c3c';
            // 体の周りに赤いオーラ
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }

        // --- スカーフ（首に巻いている） ---
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x + 4, this.y + 20, 17, 4); // 首のスカーフ
        // 滑空（かっくう）中はスカーフがうしろになびくよ
        if (this.vy > 0 && this.isGliding) {
            ctx.beginPath();
            ctx.moveTo(this.x + 12, this.y + 22);
            ctx.lineTo(this.x - 30 * this.direction, this.y + 15 + glide);
            ctx.lineTo(this.x + 12, this.y + 26);
            ctx.fill();
        }

        // --- 顔 ---
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 12, 12, 0, Math.PI * 2); ctx.fill();
        // 耳
        ctx.beginPath(); ctx.arc(this.x + 4, this.y + 4, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + 21, this.y + 4, 5, 0, Math.PI * 2); ctx.fill();

        // --- 目と鼻 ---
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(this.x + 9, this.y + 11, 1.5, 0, Math.PI * 2); ctx.fill(); // 左目
        ctx.beginPath(); ctx.arc(this.x + 16, this.y + 11, 1.5, 0, Math.PI * 2); ctx.fill(); // 右目
        ctx.beginPath(); ctx.arc(this.x + 12.5, this.y + 14, 2, 0, Math.PI * 2); ctx.fill(); // 鼻

        // --- 体 ---
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x + 4, this.y + 24, 17, 12); // 赤い服
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 5, this.y + 36 + walk, 7, 7); // 左足
        ctx.fillRect(this.x + 13, this.y + 36 - walk, 7, 7); // 右足

        // 【NEW!】ガトリング砲の発射エフェクト
        if (this.attackType === 'special_side' && this.isAttacking) {
            ctx.fillStyle = '#bdc3c7';
            if (animationFrame % 4 === 0) {
                const bulletDir = this.direction;
                // 手・ひざ・頭から弾を出す
                projectiles.push(new Projectile(this.x + 12, this.y + 5, bulletDir * 15, (Math.random() - 0.5) * 5, '#fff', 'pooh_bullet', this));
                projectiles.push(new Projectile(this.x + 12, this.y + 25, bulletDir * 15, (Math.random() - 0.5) * 5, '#fff', 'pooh_bullet', this));
                projectiles.push(new Projectile(this.x + 12, this.y + 40, bulletDir * 15, (Math.random() - 0.5) * 5, '#fff', 'pooh_bullet', this));
            }
        }

        // 【NEW!】黒閃のエフェクト（タックル時）
        if (this.isAttacking && this.attackType === 'special_neutral' && this.isKokusen) {
            this.drawKokusenEffect();
        }

        // ロケットの火
        if (this.attackType === 'special_up' && this.vy < 0) {
            ctx.fillStyle = '#ff4500';
            ctx.beginPath(); ctx.moveTo(this.x + 5, this.y + 40); ctx.lineTo(this.x + 20, this.y + 40); ctx.lineTo(this.x + 12.5, this.y + 60); ctx.fill();
        }
    }

    drawKokusenEffect() {
        ctx.save();
        ctx.shadowBlur = 40; ctx.shadowColor = '#000';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            let sx = this.x + Math.random() * 25; let sy = this.y + Math.random() * 40;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 80);
            ctx.stroke();
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
        }
        ctx.restore();
    }

    drawAllMight() {
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.1) * 5 : 0;
        let squash = 1;
        let stretch = 1;

        // 【NEW!】ふにょふにょスマッシュ中は体が伸び縮みするよ！
        if (this.isAttacking && this.attackType === 'special_side') {
            squash = 0.7 + Math.abs(Math.sin(animationFrame * 0.4)) * 0.6;
            stretch = 1.3 - Math.abs(Math.sin(animationFrame * 0.4)) * 0.6;
        }

        ctx.save();
        // キャラクターの中心（ちゅうしん）で伸び縮みするように計算（けいさん）するよ
        ctx.translate(this.x + 12.5, this.y + 20);
        ctx.scale(stretch, squash);
        ctx.translate(-(this.x + 12.5), -(this.y + 20));

        // --- 髪の毛（黄色いピョコン） ---
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 5, this.y - 15, 4, 15);
        ctx.fillRect(this.x + 16, this.y - 15, 4, 15);
        // --- 顔 ---
        ctx.fillStyle = '#ffeaa7';
        ctx.fillRect(this.x + 2, this.y, 21, 20);
        // --- 体（ムキムキ） ---
        ctx.fillStyle = '#2980b9'; // 青いスーツ
        ctx.fillRect(this.x - 5, this.y + 20, 35, 25);
        // 赤と白の模様
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x + 10, this.y + 20, 5, 25);
        ctx.fillStyle = '#fff'; ctx.fillRect(this.x + 7, this.y + 25, 11, 4);
        // --- 足 ---
        ctx.fillStyle = '#f1c40f'; // 黄色のブーツ
        ctx.fillRect(this.x, this.y + 45 + walk, 10, 10);
        ctx.fillRect(this.x + 15, this.y + 45 - walk, 10, 10);

        // U.S.スマッシュ中のエフェクト
        if (this.isAttacking && this.attackType === 'special_down') {
            ctx.shadowBlur = 50; ctx.shadowColor = '#fff';
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
            ctx.strokeRect(this.x - 20, this.y - 20, 65, 80);
        }
    }

    drawLegend() {
        // --- 究極（きゅうきょく）のでんせつ：最強のドラゴン ---
        const walk = (Math.abs(this.vx) > 0.1) ? Math.sin(animationFrame * 0.2) * 5 : 0;
        const wingMove = Math.sin(animationFrame * 0.15) * 20;

        ctx.save();
        ctx.translate(this.x + 12.5, this.y + 20);

        // --- 背後の神々しい輪（アルセウス風） ---
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 4;
        ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let ang = (i * Math.PI / 4) + animationFrame * 0.02;
            ctx.moveTo(Math.cos(ang) * 25, Math.sin(ang) * 25);
            ctx.lineTo(Math.cos(ang) * 40, Math.sin(ang) * 40);
        }
        ctx.stroke();

        // --- 翼（つばさ） ---
        // 左：闇の翼
        ctx.fillStyle = '#9b59b6'; ctx.beginPath();
        ctx.moveTo(-10, 0); ctx.lineTo(-50, -30 + wingMove); ctx.lineTo(-40, 10 + wingMove); ctx.fill();
        // 右：炎の翼
        ctx.fillStyle = '#e67e22'; ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(50, -30 - wingMove); ctx.lineTo(40, 10 - wingMove); ctx.fill();

        // --- 体 ---
        ctx.fillStyle = '#2c3e50'; ctx.fillRect(-12, -15, 24, 40); // 鋼のような体
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); // 胸のコア

        // --- 顔 ---
        ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.arc(0, -25, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5 * this.direction, -27, 2, 0, Math.PI * 2); ctx.fill(); // 輝く目

        // --- 足 ---
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-10, 25 + walk, 8, 10); ctx.fillRect(2, 25 - walk, 8, 10);

        // --- 特殊エフェクト：オーラ ---
        ctx.strokeStyle = `hsla(${animationFrame % 360}, 100%, 50%, 0.5)`;
        ctx.lineWidth = 2; ctx.strokeRect(-15, -40, 30, 80);

        ctx.restore();
    }

    handleAI(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.abs(dx);
        // レベルが高いほど反応が早くなるよ！
        const speedMult = 0.4 + (this.cpuLevel * 0.1);
        const reaction = 0.02 + (this.cpuLevel * 0.02);

        // 復帰処理（奈落（ならく）に落ちそうなとき）
        if (selectedStage !== 'under' && (this.y > 450 || (this.x < 200 || this.x > 800) && !this.isGrounded)) {
            // ステージの真ん中に向かって移動
            if (this.x < 500) { this.vx = 5 * this.scale; this.direction = 1; }
            else { this.vx = -5 * this.scale; this.direction = -1; }

            // 下に落ちすぎたら「上必殺技」で復帰！
            if (this.y > 480 && Math.random() < 0.2) {
                this.special('up', target);
            } else if (this.y > 430 && this.jumpCount < this.maxJumps) {
                this.jump();
            }
            return; // 復帰中は攻撃より生き残ることを優先！
        }

        // 地上での戦い
        if (dist > 80) {
            if (dx > 0) { this.vx = this.speed * speedMult; this.direction = 1; }
            else { this.vx = -this.speed * speedMult; this.direction = -1; }

            // 遠距離攻撃（レベルが高いほど積極的に！）
            if (dist > 250 && Math.random() < reaction * 0.5 && !this.isAttacking) {
                this.special('neutral');
            }
        } else {
            this.vx *= 0.7;
            // 近接攻撃（目の前に相手がいたら）
            if (Math.random() < reaction && !this.isAttacking) {
                if (Math.abs(dy) < 40) {
                    const r = Math.random();
                    if (r < 0.4) this.attack('normal');
                    else if (r < 0.7) this.attack(dx > 0 ? 'smash_right' : 'smash_left');
                    else this.special('side');
                } else if (dy < -40) {
                    this.attack('smash_up');
                } else {
                    this.attack('smash_down');
                }
            }
        }

        // たまにジャンプする
        if (this.isGrounded && Math.random() < 0.01) this.jump();
    }

    checkHit(hb, other) {
        return (hb.x < other.x + other.width &&
            hb.x + hb.w > other.x &&
            hb.y < other.y + other.height &&
            hb.y + hb.h > other.y);
    }

    takeDamage(attacker, amount) {
        // 【NEW!】最強コンビと究極のでんせつはダメージを受けない！
        if (this.type === 'duo' || this.type === 'legend') return;

        // 【NEW!】カウンター状態（下必殺技の待機中）ならダメージを無効化して相手に反撃！
        if (this.isAttacking && this.attackType === 'special_down') {
            this.isAttacking = false;
            this.attackTimer = 0;
            this.hitbox = null;

            // 反撃ダメージ（最低15%、与えられそうだったダメージの1.5倍）
            const counterDamage = Math.max(15, amount * 1.5);
            
            // 攻撃した相手がProjectileやキャラクターの場合、元となるキャラクターを取得
            const realAttacker = (attacker && attacker.owner) ? attacker.owner : attacker;
            if (realAttacker && realAttacker !== this) {
                realAttacker.takeDamage(this, counterDamage);
            }

            // 派手な反撃エフェクトを描画
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 40;
            ctx.shadowColor = this.type === 'lucario' ? '#3498db' : '#f1c40f';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 100 * this.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return; // 自身はダメージを受けない
        }

        let finalDamage = amount;
        // 【NEW!】ハチミツ漬け状態ならダメージ半分、吹っ飛ばない！
        if (this.honeyStuckTimer > 0) {
            finalDamage = amount / 2;
        }

        // ダメージを増やす
        this.damagePercent += finalDamage;

        // 【NEW!】黒閃（こくせん）の特別演出（空間のゆがみ）
        if (attacker.isKokusen) {
            this.damagePercent += finalDamage * 2; // ダメージ3倍！

            // --- 空間がゆがむエフェクト ---
            ctx.save();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 15;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(this.x + 12.5, this.y + 20, 30 + i * 40 + (animationFrame % 10) * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            // 黒い火花（黒閃！）
            ctx.shadowBlur = 60; ctx.shadowColor = '#000';
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = (i % 2 === 0) ? '#000' : '#e74c3c';
                ctx.beginPath();
                let ang = Math.random() * Math.PI * 2;
                let r = 10 + Math.random() * 200;
                ctx.arc(this.x + 12.5 + Math.cos(ang) * r, this.y + 20 + Math.sin(ang) * r, 4 + Math.random() * 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 【NEW!】領域展開やハチミツ漬けでは吹っ飛ばない
        if (attacker.type === 'duo_domain' || attacker.type === 'honey_domain' || this.honeyStuckTimer > 0) {
            this.vx *= 0.2; this.vy *= 0.2;
            const displayId = this.isPlayer ? 'player-percent' : 'cpu-percent';
            const el = document.getElementById(displayId);
            if (el) el.innerText = Math.floor(this.damagePercent) + '%';
            return;
        }

        // 攻撃した人の方向に吹っ飛ばす！
        // 黒閃のときは吹っ飛ぶ力（ちから）も2.5倍！
        const knockbackMult = (attacker.isKokusen ? 2.5 : 1) * (1 + (this.damagePercent / 50));
        const knockbackX = (this.x > attacker.x ? 1 : -1) * 8 * knockbackMult * this.scale;
        const knockbackY = -6 * knockbackMult * this.scale;

        this.vx = knockbackX;
        this.vy = knockbackY;
        this.isGrounded = false;

        // パーセント表示を更新
        const displayId = this.isPlayer ? 'player-percent' : 'cpu-percent';
        const el = document.getElementById(displayId);
        if (el) {
            el.innerText = Math.floor(this.damagePercent) + '%';
            el.style.color = `hsl(0, 100%, ${Math.max(20, 100 - this.damagePercent / 2)}%)`;
        }

        // 画面をすこし揺らす（フラッシュ）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    getAttackDamage(type) {
        let damage = 5;
        switch (type) {
            case 'normal': damage = 6; break;
            case 'smash_up': damage = 14; break;
            case 'smash_down': damage = 12; break;
            case 'smash_left': damage = 15; break;
            case 'smash_right': damage = 15; break;
            case 'special_neutral': damage = 8; break;
            case 'special_side': damage = 10; break;
            case 'special_up': damage = 7; break;
            case 'special_down': damage = 15; break;
            case 'counter': damage = 20; break;
        }
        // 【NEW!】赤麟躍動モードならダメージ1.5倍！
        if (this.isRedMode) damage *= 1.5;
        return damage;
    }

    updateStockDisplay() {
        const id = this.isPlayer ? 'player-stocks' : 'cpu-stocks';
        const el = document.getElementById(id);
        if (el) {
            let hearts = '';
            for (let i = 0; i < this.stock; i++) hearts += '❤️';
            el.innerText = hearts;
        }
    }
}

// サンドバッグくんは卒業したよ！

const player = new Character(true);
const cpu = new Character(false);

function gameLoop() {
    // まだ始まっていないなら、何もしないよ
    if (!gameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }

    animationFrame++;

    // ステージの時間を進めて、次の場所へ移動（いどう）！
    stageTimer++;
    if (stageTimer > stageMaxTime) {
        stageTimer = 0;
        stageIndex = (stageIndex + 1) % stageSequence.length;
    }

    // 今どのステージにいるかな？
    const stageType = stageSequence[stageIndex];

    // --- 【NEW!】縦の移動アニメーション（ビューン！とする速さ） ---
    let vSpeed = 0;
    if (stageTimer < 60) {
        // ステージが切り替わった直後の60フレームだけ、縦に動かすよ
        // インデックスが1か2のときは「上がる」、0か3のときは「下りる」だよ
        if (stageIndex === 1 || stageIndex === 2) vSpeed = 25; // 下に流れる（上がって見える！）
        if (stageIndex === 3 || stageIndex === 0) vSpeed = -25; // 上に流れる（下りて見える！）

        // だんだんゆっくりにする（ビューン！ → さらさら）
        vSpeed *= (60 - stageTimer) / 60;
    }

    // --- 1. 背景（はいけい）を描くよ！ ---
    if (selectedStage === 'tour') {
        const stageType = stageSequence[stageIndex];
        if (stageType === 0) {
            ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            stars.forEach(s => {
                s.x -= s.speed; s.y += vSpeed;
                if (s.x < 0) s.x = canvas.width; if (s.y < 0) s.y = canvas.height; if (s.y > canvas.height) s.y = 0;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
            });
        } else if (stageType === 1) {
            ctx.fillStyle = "#87ceeb"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            stars.forEach(s => {
                s.x -= s.speed * 0.5; s.y += vSpeed;
                if (s.x < -50) s.x = canvas.width + 50; if (s.y < -50) s.y = canvas.height + 50; if (s.y > canvas.height + 50) s.y = -50;
                ctx.beginPath(); ctx.ellipse(s.x, s.y, 30, 15, 0, 0, Math.PI * 2); ctx.fill();
            });
        } else if (stageType === 2) {
            ctx.fillStyle = "#006994"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            stars.forEach(s => {
                s.y -= s.speed * 0.5; s.y += vSpeed;
                if (s.y < -20) s.y = canvas.height + 20; if (s.y > canvas.height + 20) s.y = -20;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2); ctx.stroke();
            });
        }
    } else if (selectedStage === 'sky') {
        // 【スカイウェザー】背景と雷ギミック
        ctx.fillStyle = (animationFrame % 600 < 200) ? "#87ceeb" : (animationFrame % 600 < 400 ? "#5d6d7e" : "#2c3e50");
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // 雷ギミック
        if (animationFrame % 600 > 450 && Math.random() < 0.05) {
            projectiles.push(new Projectile(Math.random() * 600 + 200, 0, 0, 0, '#fff', 'thunder', { name: 'stage' }));
        }
    } else if (selectedStage === 'under') {
        // 【アンダーグラウンド】背景
        ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#444"; ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(i * 100, 0); ctx.lineTo(i * 100, 600); ctx.stroke(); }
    } else if (selectedStage === 'magma') {
        // 【マグマドロップ】背景と流れる溶岩
        ctx.fillStyle = "#4c1111"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff4500";
        const wave = Math.sin(animationFrame * 0.05) * 10;
        ctx.fillRect(0, 550 + wave, canvas.width, 100);
        ctx.shadowBlur = 40; ctx.shadowColor = "#ff4500";
        ctx.fillRect(0, 560 + wave, canvas.width, 10);
        ctx.shadowBlur = 0;
    } else if (selectedStage === 'meteor_flood') {
        // 【水と隕石】背景：燃える空と流れる水
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(0, 0, canvas.width, canvas.height); // 暗い空
        // 流れる水
        ctx.fillStyle = "rgba(52, 152, 219, 0.6)";
        for (let i = 0; i < 5; i++) {
            const offset = (animationFrame * 5 + i * 200) % canvas.width;
            ctx.fillRect(offset, 400, 100, 200);
        }
        // 隕石を降らせる
        if (animationFrame % 60 === 0) {
            projectiles.push(new Projectile(Math.random() * canvas.width + 200, -50, -4, 8, '#e67e22', 'meteor', { name: 'stage' }));
        }
    } else if (selectedStage === 'dimension') {
        // 【ファイナル・ディメンション】サイバー背景
        ctx.fillStyle = "#0a001a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(0, 210, 255, 0.2)";
        for (let i = 0; i < canvas.width; i += 50) { ctx.beginPath(); ctx.moveTo(i + (animationFrame % 50), 0); ctx.lineTo(i + (animationFrame % 50), 600); ctx.stroke(); }
        platforms = [
            { x: 350, y: 280, w: 300 }, // 真ん中の台
            { x: 200, y: 330, w: 150 }, // 左の台
            { x: 650, y: 330, w: 150 }  // 右の台
        ];
    }

    // --- 2. 終点（しゅうてん）のステージを描くよ ---
    const stageY = 400 + (selectedStage === 'magma' ? Math.sin(animationFrame * 0.05) * 30 : 0);
    const stageX = (selectedStage === 'under') ? 50 : 250;
    const stageW = (selectedStage === 'under') ? 900 : 500;

    // ステージの色を、世界に合わせて変えるよ！
    let groundColor = "#ecf0f1";
    let baseColor = "#2c3e50";

    if (selectedStage === 'tour') {
        const stageType = stageSequence[stageIndex];
        if (stageType === 1) { groundColor = "#2ecc71"; baseColor = "#795548"; }
        else if (stageType === 2) { groundColor = "#f1c40f"; baseColor = "#1a3a4a"; }
    } else if (selectedStage === 'sky') {
        groundColor = "#fff"; baseColor = "#bdc3c7";
    } else if (selectedStage === 'under') {
        groundColor = "#333"; baseColor = "#111";
    } else if (selectedStage === 'magma') {
        groundColor = "#795548"; baseColor = "#3d2b1f";
    } else if (selectedStage === 'dimension') {
        groundColor = "#00d2ff"; baseColor = "rgba(0, 40, 80, 0.8)";
    } else if (selectedStage === 'meteor_flood') {
        groundColor = "#3498db"; baseColor = "#2980b9"; // 水の色
    }

    // すり抜け台を描く
    if (selectedStage === 'dimension') {
        ctx.fillStyle = "rgba(0, 210, 255, 0.6)"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        platforms.forEach(p => {
            ctx.fillRect(p.x, p.y, p.w, 10);
            ctx.strokeRect(p.x, p.y, p.w, 10);
        });
    }

    // 地面の光（ネオン）
    ctx.shadowBlur = 15;
    ctx.shadowColor = (selectedStage === 'tour' && stageSequence[stageIndex] === 0) ? "#00d2ff" : "rgba(0,0,0,0)";
    ctx.fillStyle = groundColor;
    ctx.fillRect(stageX, stageY, stageW, 10);
    ctx.shadowBlur = 0;

    // ステージの土台
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(stageX, stageY + 10);
    ctx.lineTo(stageX + stageW, stageY + 10);
    if (selectedStage !== 'under') {
        ctx.lineTo(stageX + stageW - 50, stageY + 80);
        ctx.lineTo(stageX + 50, stageY + 80);
    } else {
        ctx.lineTo(stageX + stageW, canvas.height);
        ctx.lineTo(stageX, canvas.height);
    }
    ctx.closePath();
    ctx.fill();

    // 縁取り
    ctx.strokeStyle = (selectedStage === 'tour' && stageSequence[stageIndex] === 0) ? "#00d2ff" : "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // アンダーグラウンドは左右に壁を描く
    if (selectedStage === 'under') {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, 50, canvas.height);
        ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(50, 0, canvas.width - 100, canvas.height);
    }

    player.update(cpu);
    player.draw();

    // CPUの更新と描画
    cpu.update(player);
    cpu.draw();

    projectiles = projectiles.filter(p => p.life > 0);
    projectiles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(gameLoop);
}

gameLoop();
