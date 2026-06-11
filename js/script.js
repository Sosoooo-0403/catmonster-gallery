/* ==========================================================================
   CatMonster - script.js
   このファイルはページ上の演出とUI操作をまとめて管理する
   - ローディング画面の非表示
   - スクロール時の出現アニメーション
   - ヒーローのパララックス演出
   - ギャラリー切り替え
   - ランダム警告シグナル
   - Aboutルーレット
   - 画像モーダル
   ========================================================================== */

/* ---- 初期化 ---- */
// DOMの構築が終わった段階で、ページ機能を初期化する。
// あわせて、ページ内の画像読み込み完了を待ってからローダーを閉じる。
document.addEventListener("DOMContentLoaded", function () {
    initializePageFeatures();
    waitForImagesAndHideLoader();
});

/**
 * ページ内の機能をまとめて初期化する
 * 各関数は、対象要素が見つからない場合は何もせず終了する設計
 */
function initializePageFeatures() {
    initScrollReveal();
    initHeroParallax();
    initGallerySwitcher();
    initRandomSignal();
    initAboutRoulette();
    initModal();
}

/**
 * ローディング画面を閉じる
 * body に is-loaded を付与して CSS 側のフェードアウトを発火させる
 */
function hideLoader() {
    const loader = document.querySelector(".loading-container");
    if (!loader) return;

    document.body.classList.add("is-loaded");

    // フェードアウト後にDOM上から見えなくする
    window.setTimeout(function () {
        loader.setAttribute("hidden", "");
    }, 850);
}

/**
 * Hero + About + GalleryのVOIDカテゴリまで読み込み完了したら
 * ローダーを閉じる
 *
 * 待機対象:
 * - Hero内の動画
 * - Hero内の画像
 * - Aboutルーレット画像
 * - VOIDカテゴリ内の画像
 *
 * それ以外の画像は待たないので、体感速度を改善しやすい
 */
function waitForImagesAndHideLoader() {
    const targetImages = [];
    const targetVideo = document.getElementById("video");

    // Hero内の画像を対象にする
    const heroImages = document.querySelectorAll(".hero img");

    // Aboutルーレット画像を対象にする
    const aboutImage = document.getElementById("about-roulette-image");

    // GalleryのVOIDカテゴリ内画像を対象にする
    const voidImages = document.querySelectorAll(".cat-space .gallery-img");

    heroImages.forEach((img) => targetImages.push(img));
    if (aboutImage) targetImages.push(aboutImage);
    voidImages.forEach((img) => targetImages.push(img));

    let totalTargets = 0;
    let finishedTargets = 0;
    let isFinished = false;

    /**
     * すべて完了したらローダーを消す
     */
    function handleOneFinished() {
        finishedTargets += 1;

        if (finishedTargets >= totalTargets && !isFinished) {
            isFinished = true;
            hideLoader();
        }
    }

    /**
     * 画像の監視を登録する
     */
    function watchImage(img) {
        if (!img || !img.getAttribute("src")) return;

        totalTargets += 1;

        if (img.complete) {
            handleOneFinished();
        } else {
            img.addEventListener("load", handleOneFinished, { once: true });
            img.addEventListener("error", handleOneFinished, { once: true });
        }
    }

    /**
     * 動画の監視を登録する
     * canplaythrough は重めなので、loadeddata か loadedmetadata を使う方が早い
     */
    function watchVideo(video) {
        if (!video) return;

        totalTargets += 1;

        if (video.readyState >= 2) {
            handleOneFinished();
        } else {
            video.addEventListener("loadeddata", handleOneFinished, { once: true });
            video.addEventListener("error", handleOneFinished, { once: true });
        }
    }

    // 対象を監視開始
    watchVideo(targetVideo);
    targetImages.forEach(watchImage);

    // 対象が何もなければ即終了
    if (totalTargets === 0) {
        hideLoader();
        return;
    }

    // 念のための保険
    window.setTimeout(function () {
        if (!isFinished) {
            isFinished = true;
            hideLoader();
        }
    }, 4000);
}

/* ---- スクロール出現アニメーション ---- */
/**
 * スクロールで要素を順次表示する
 * IntersectionObserver を使うことで、常時 scroll 監視するより軽量
 */
function initScrollReveal() {
    const targets = document.querySelectorAll(
        ".section-title, .category-header, .img-wrap, .gallery-switcher"
    );

    if (!targets.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
    });

    targets.forEach((target) => observer.observe(target));
}

/* ---- ヒーローの軽いパララックス ---- */
/**
 * ヒーローエリアのパララックス演出
 * マウス位置に応じてタイトルと画像トラックを少しだけ移動させる
 */
function initHeroParallax() {
    const hero = document.querySelector(".hero");
    const titleArea = document.querySelector(".hero-title-area");
    const slideTrack = document.querySelector(".slide-track");

    if (!hero || !titleArea || !slideTrack) return;

    hero.addEventListener("mousemove", (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        titleArea.style.transform = `translate(${x * 12}px, ${y * 12}px)`;
        slideTrack.style.transform = `translate(${x * 20}px, ${y * 8}px)`;
    });

    hero.addEventListener("mouseleave", () => {
        titleArea.style.transform = "";
        slideTrack.style.transform = "";
    });
}

/* ---- ギャラリー切り替え ---- */
/**
 * ギャラリー切り替えボタンを初期化する
 * data-target に設定されたセレクタの位置までスムーズスクロールする
 */
function initGallerySwitcher() {
    const buttons = document.querySelectorAll(".gallery-switcher button[data-target]");
    const randomBtn = document.getElementById("random-cat");

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");

            const target = document.querySelector(btn.dataset.target);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    if (randomBtn) {
        randomBtn.addEventListener("click", () => {
            const wraps = document.querySelectorAll(".img-wrap");
            if (!wraps.length) return;

            const randomWrap = wraps[Math.floor(Math.random() * wraps.length)];
            randomWrap.scrollIntoView({ behavior: "smooth", block: "center" });
            randomWrap.classList.add("surprise-hit");

            setTimeout(() => {
                randomWrap.classList.remove("surprise-hit");
            }, 1200);
        });
    }
}

/* ---- ランダム警告シグナル ---- */
/**
 * 一定間隔で警告シグナルをランダム表示する
 * サイト世界観を補強するための演出
 */
function initRandomSignal() {
    const signal = document.getElementById("warning-signal");
    if (!signal) return;

    setInterval(() => {
        if (Math.random() < 0.22) {
            signal.classList.add("show");
            setTimeout(() => signal.classList.remove("show"), 1800);
        }
    }, 9000);
}

/* ---- ギャラリー画像の共通データ取得 ---- */
/**
 * ギャラリー上の .img-wrap から猫データを収集する
 * これにより、HTML上の data-* 属性を
 * ルーレット・モーダルなど複数機能で共通利用できる
 *
 * @returns {Array<{
 *   element: HTMLElement,
 *   src: string,
 *   alt: string,
 *   name: string,
 *   type: string,
 *   danger: string
 * }>}
 */
function getGalleryCats() {
    const wraps = Array.from(document.querySelectorAll(".img-wrap"));

    return wraps.map((wrap) => {
        const img = wrap.querySelector(".gallery-img");

        return {
            element: wrap,
            src: wrap.dataset.src || (img ? img.src : ""),
            alt: img ? img.alt : "CatMonster",
            name: wrap.dataset.name || "UNKNOWN",
            type: wrap.dataset.type || "分類: 未確認異形種",
            danger: wrap.dataset.danger || "危険度: S"
        };
    }).filter((cat) => cat.src);
}

/* ---- About ランダム正体判定 ---- */
/**
 * Aboutセクションのルーレット機能
 * START で高速切り替え、STOP で現在の猫を確定する
 */
function initAboutRoulette() {
    const toggleBtn = document.getElementById("about-roulette-toggle");
    const image = document.getElementById("about-roulette-image");
    const nameEl = document.getElementById("about-roulette-name");
    const typeEl = document.getElementById("about-roulette-type");
    const dangerEl = document.getElementById("about-roulette-danger");

    if (!toggleBtn || !image || !nameEl || !typeEl || !dangerEl) return;

    const cats = getGalleryCats();
    if (!cats.length) return;

    let intervalId = null;
    let isRunning = false;
    let currentIndex = 0;

    /**
     * ルーレットの表示領域を更新する
     * @param {Object} cat - 表示する猫データ
     */
    function renderCat(cat) {
        image.src = cat.src;
        image.alt = cat.alt || "CatMonster";
        nameEl.textContent = cat.name;
        typeEl.textContent = cat.type;
        dangerEl.textContent = cat.danger;
    }

    /**
     * 次に表示するインデックスを決める
     * 同じ画像が連続しないように currentIndex と異なる値を返す
     */
    function pickNextIndex() {
        if (cats.length === 1) return 0;

        let nextIndex = Math.floor(Math.random() * cats.length);
        while (nextIndex === currentIndex) {
            nextIndex = Math.floor(Math.random() * cats.length);
        }
        return nextIndex;
    }

    /**
     * ルーレット開始
     * ボタン文言・状態クラス・ARIA属性も同時に更新する
     */
    function startRoulette() {
        if (isRunning) return;

        isRunning = true;
        toggleBtn.textContent = "STOP";
        toggleBtn.classList.add("is-running");
        toggleBtn.setAttribute("aria-pressed", "true");
        image.classList.add("is-spinning");

        intervalId = setInterval(() => {
            currentIndex = pickNextIndex();
            renderCat(cats[currentIndex]);
        }, 90);
    }

    /**
     * ルーレット停止
     * タイマーを解除し、見た目と状態を元に戻す
     */
    function stopRoulette() {
        if (!isRunning) return;

        isRunning = false;
        clearInterval(intervalId);
        intervalId = null;

        toggleBtn.textContent = "START";
        toggleBtn.classList.remove("is-running");
        toggleBtn.setAttribute("aria-pressed", "false");
        image.classList.remove("is-spinning");
    }

    // 初期表示
    renderCat(cats[currentIndex]);

    toggleBtn.addEventListener("click", () => {
        if (isRunning) {
            stopRoulette();
        } else {
            startRoulette();
        }
    });
}

/* ---- モーダル ---- */
/**
 * ギャラリー画像のモーダル機能
 * 画像拡大、メタ情報表示、ダウンロード導線を扱う
 */
function initModal() {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.getElementById("modal-close");
    const modalName = document.getElementById("modal-name");
    const modalType = document.getElementById("modal-type");
    const modalDanger = document.getElementById("modal-danger");
    const downloadBtn = document.getElementById("modal-download");
    const cats = getGalleryCats();

    if (!modal || !modalImg || !closeBtn || !cats.length) return;

    const fallbackData = [
        { name: "VX-VOID", type: "分類: 銀河系生息種", danger: "危険度: A+" },
        { name: "SHD-09", type: "分類: 悪霊結合種", danger: "危険度: S" },
        { name: "WSP-13", type: "分類: 魂吸収種", danger: "危険度: EX" }
    ];

    /**
     * 万一データが不足している場合の予備情報を返す
     */
    function pickFallback() {
        return fallbackData[Math.floor(Math.random() * fallbackData.length)];
    }

    /**
     * 画像URLと個体名からダウンロード用ファイル名を作る
     * クエリ文字列や不正な文字を除去して安全な名前に整える
     */
    function getFileNameFromSrc(src, name) {
        const cleanSrc = src.split("?")[0].split("#")[0];
        const extMatch = cleanSrc.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        const ext = extMatch ? extMatch[0] : ".png";
        const safeName = (name || "catmonster")
            .replace(/[^\w\-]+/g, "_")
            .replace(/^_+|_+$/g, "");

        return `${safeName || "catmonster"}${ext}`;
    }

    /**
     * ダウンロードボタンのリンク先と属性を設定する
     */
    function setupDownload(src, fileName) {
        if (!downloadBtn || !src) return;

        downloadBtn.href = src;
        downloadBtn.setAttribute("download", fileName);
        downloadBtn.setAttribute("target", "_blank");
        downloadBtn.setAttribute("rel", "noopener");
    }

    /**
     * モーダルを開いて選択した猫の情報を反映する
     */
    function openModal(cat) {
        const data = cat || pickFallback();

        modalImg.src = data.src;
        modalImg.alt = data.alt || "CatMonster 拡大画像";

        if (modalName) modalName.textContent = data.name || "UNKNOWN";
        if (modalType) modalType.textContent = data.type || "分類: 未確認異形種";
        if (modalDanger) modalDanger.textContent = data.danger || "危険度: S";

        setupDownload(data.src, getFileNameFromSrc(data.src, data.name));

        modal.classList.add("open");
        document.body.style.overflow = "hidden";

        // 一度クラスを外して再付与することで、
        // 毎回グリッチ演出が再生されるようにする
        modalImg.classList.remove("glitch-once");
        void modalImg.offsetWidth;
        modalImg.classList.add("glitch-once");
    }

    /**
     * モーダルを閉じる
     * 閉じた後に画像URLを外して、次回表示時の状態を安定させる
     */
    function closeModal() {
        modal.classList.remove("open");
        document.body.style.overflow = "";

        setTimeout(() => {
            modalImg.src = "";
            modalImg.classList.remove("glitch-once");

            if (downloadBtn) {
                downloadBtn.href = "#";
                downloadBtn.setAttribute("download", "catmonster.png");
            }
        }, 350);
    }

    // 各画像カードをクリックしたらモーダル表示
    cats.forEach((cat) => {
        cat.element.addEventListener("click", function () {
            openModal(cat);
        });
    });

    // 閉じるボタン
    closeBtn.addEventListener("click", closeModal);

    // 背景クリックで閉じる
    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
    });

    // Escキーで閉じる
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.classList.contains("open")) {
            closeModal();
        }
    });
}