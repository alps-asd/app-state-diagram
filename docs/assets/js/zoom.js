// グラフズーム機能のセットアップ（+/-ボタンのみ）
let currentScale = 1;
const minScale = 0.1;
const maxScale = 3;

function setupGraphZoom() {
    console.log("Setting up zoom controls...");
    const zoomControlsContainer = document.querySelector('#zoom-controls-container');
    if (!zoomControlsContainer) {
        console.log('Zoom controls container not found');
        return;
    }

    // グローバルなズームコントロールを追加
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls global-zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-button" data-zoom="in">+</button>
        <button class="zoom-button" data-zoom="out">−</button>
        <button class="zoom-button" data-zoom="reset">1:1</button>
    `;
    zoomControlsContainer.appendChild(zoomControls);
    
    // SVG要素の監視と初期設定
    setupSvgObservers();
    
    // ズームイン
    zoomControls.querySelector('[data-zoom="in"]').addEventListener('click', () => {
        currentScale = Math.min(currentScale * 1.2, maxScale);
        updateAllSvgZoom(zoomControls);
    });

    // ズームアウト
    zoomControls.querySelector('[data-zoom="out"]').addEventListener('click', () => {
        currentScale = Math.max(currentScale / 1.2, minScale);
        updateAllSvgZoom(zoomControls);
    });

    // リセット
    zoomControls.querySelector('[data-zoom="reset"]').addEventListener('click', () => {
        currentScale = 1;
        updateAllSvgZoom(zoomControls);
    });
}

function setupSvgObservers() {
    const containers = ['#asd-graph-id', '#asd-graph-name'];
    
    containers.forEach(containerId => {
        const container = document.querySelector(containerId);
        if (!container) {
            console.log(`Container ${containerId} not found`);
            return;
        }
        
        // SVGを探す
        let svg = container.querySelector('svg');
        
        // SVGが見つからない場合は監視して再試行
        if (!svg) {
            console.log(`SVG not found in ${containerId}, setting up observer`);
            // SVG要素が追加されるのを監視
            const observer = new MutationObserver((mutations, obs) => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes.length) {
                        svg = container.querySelector('svg');
                        if (svg) {
                            console.log('SVG found in ' + containerId + ' after waiting');
                            obs.disconnect(); // 監視を停止
                            // 初期ズームを適用
                            svg.style.transform = `scale(${currentScale})`;
                        }
                    }
                });
            });
            
            observer.observe(container, { childList: true, subtree: true });
        } else {
            console.log(`SVG found immediately ${containerId}`);
            // 初期ズームを適用
            svg.style.transform = `scale(${currentScale})`;
        }
    });
}

function updateAllSvgZoom(zoomControls) {
    // 両方のコンテナのSVGを取得して同じスケールを適用
    const containers = ['#asd-graph-id', '#asd-graph-name'];
    
    containers.forEach(containerId => {
        const container = document.querySelector(containerId);
        if (!container) return;
        
        const svg = container.querySelector('svg');
        if (svg) {
            // transform-originはCSSで設定済み（top left）
            svg.style.transform = `scale(${currentScale})`;
        }
    });
    
    // ボタン状態の更新
    const zoomIn = zoomControls.querySelector('[data-zoom="in"]');
    const zoomOut = zoomControls.querySelector('[data-zoom="out"]');
    
    zoomIn.disabled = currentScale >= maxScale;
    zoomOut.disabled = currentScale <= minScale;
}