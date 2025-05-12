<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_keys;
use function assert;
use function basename;
use function count;
use function dirname;
use function file_get_contents;
use function htmlspecialchars;
use function implode;
use function nl2br;
use function preg_replace;
use function sprintf;
use function str_replace;
use function strtoupper;
use function uasort;

use const ENT_QUOTES;
use const PHP_EOL;

/** @psalm-suppress InvalidPropertyFetch */
final class IndexPage
{
    /** @var string */
    public $content;

    /** @var string */
    public $file;

    /** @SuppressWarnings(PHPMD.ExcessiveMethodLength)  */
    public function __construct(Config $config)
    {
        $index = $this->getElements($config);
        $indexJsFile = dirname(__DIR__, 1) . '/docs/assets/js/asd@0.1.0.js';
        $indexJs = sprintf('<script>%s</script>', (string) file_get_contents($indexJsFile));
        $header = <<<EOT
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://unpkg.com/@hpcc-js/wasm/dist/graphviz.umd.js" type="javascript/worker"></script>
    <script src="https://unpkg.com/d3-graphviz@5.6.0/build/d3-graphviz.min.js"></script>
{$indexJs}
EOT;
        $legend = $config->outputMode === DumpDocs::MODE_MARKDOWN ? '' : IndexPageElements::LEGEND;
        $tags = $config->outputMode === DumpDocs::MODE_MARKDOWN ? '' : $index->tags;
        $asd = $config->outputMode === DumpDocs::MODE_MARKDOWN ? $this->getMarkdownImage($config->profile) : <<< EOTJS
<div id="svg-container">
    <div id="asd-graph-id" style="text-align: center; "></div>
    <div id="asd-graph-name" style="text-align: center; display: none;"></div>
</div>
<script>
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            await Promise.all([
                    renderGraph("#asd-graph-id", '{{ dotId }}'),
                    renderGraph("#asd-graph-name", '{{ dotName }}')
            ]);
            setupTagTrigger();
            setupModeSwitch('asd-show-id', 'asd-graph-id', 'asd-graph-name');
            setupModeSwitch('asd-show-name', 'asd-graph-name', 'asd-graph-id');
            applySmoothScrollToLinks(document.querySelectorAll('a[href^="#"]'));
            setupTagClick();
            setupDocClick();
            {$index->setUpTagEvents}

            // 新機能の初期化
            enhanceProfileSection();
            setupSearch();

            // SVGが確実に読み込まれた後にズーム機能を設定（重要）
            setTimeout(() => {
                setupGraphZoom();
            }, 1000);
        } catch (error) {
               console.error("Error in main process:", error);
        }});
        
    // Profile折りたたみ機能のためのDOM構造を作成
    function enhanceProfileSection() {
        const profileHeader = document.querySelector('h2:last-of-type');
        const profilePre = profileHeader.nextElementSibling;
        
        if (profileHeader && profilePre && profilePre.tagName === 'PRE') {
            // プロファイルセクションの構造を変更
            const section = document.createElement('div');
            section.className = 'profile-section';
            
            const header = document.createElement('div');
            header.className = 'profile-header';
            header.innerHTML = `
                <div>
                    <span class="profile-toggle">▶</span>
                    <span>Profile</span>
                </div>
                <button class="copy-button">Copy</button>
            `;
            
            const content = document.createElement('div');
            content.className = 'profile-content';
            content.appendChild(profilePre.cloneNode(true));
            
            section.appendChild(header);
            section.appendChild(content);
            
            // 元のh2とpreを置き換える
            profileHeader.replaceWith(section);
            profilePre.remove();
            
            // 折りたたみとコピー機能をセットアップ
            setupProfileCollapse();
            setupCopyButton();
        }
    }

    // Profile折りたたみ機能
    function setupProfileCollapse() {
        const profileHeader = document.querySelector('.profile-header');
        const profileContent = document.querySelector('.profile-content');
        const profileToggle = document.querySelector('.profile-toggle');
        
        if (!profileHeader || !profileContent || !profileToggle) return;
        
        // 初期状態は折りたたんだ状態
        profileContent.classList.remove('visible');
        
        profileHeader.addEventListener('click', (e) => {
            // コピーボタンがクリックされた場合は折りたたみ処理をスキップ
            if (e.target.classList.contains('copy-button')) return;
            
            profileContent.classList.toggle('visible');
            profileToggle.classList.toggle('expanded');
        });
    }

    // コピー機能
    function setupCopyButton() {
        const copyButton = document.querySelector('.copy-button');
        if (!copyButton) return;
        
        copyButton.addEventListener('click', async (e) => {
            e.stopPropagation(); // 親要素のクリックイベントを防ぐ
            
            const profileContent = document.querySelector('.profile-content pre code');
            if (!profileContent) return;
            
            try {
                await navigator.clipboard.writeText(profileContent.textContent);
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
    }

    // 検索機能
    function setupSearch() {
        // 検索ボックスを追加
        const semanticHeader = document.querySelector('h2:nth-of-type(1)');
        if (!semanticHeader) return;
        
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667zm5.334 1L10 11" 
                      stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input type="text" class="search-input" placeholder="Search semantic descriptors...">
            <span class="search-clear">×</span>
        `;
        
        // h2の下にテーブルがあるので、その間に挿入
        const table = semanticHeader.nextElementSibling;
        if (table && table.tagName === 'TABLE') {
            semanticHeader.after(searchContainer);
        }
        
        const searchInput = searchContainer.querySelector('.search-input');
        const searchClear = searchContainer.querySelector('.search-clear');
        const tableRows = table.querySelectorAll('tbody tr');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            searchClear.classList.toggle('visible', query.length > 0);

            tableRows.forEach(row => {
                // すべての行のテキストを検索対象とする
                const text = row.textContent.toLowerCase();
                const isVisible = query === '' || text.includes(query);
                row.classList.toggle('hidden', !isVisible);

                // マッチしたセルのみにhighlightクラスを追加
                if (query !== '' && isVisible) {
                    // すべてのセルを確認
                    const cells = row.querySelectorAll('td');
                    cells.forEach(cell => {
                        const cellText = cell.textContent.toLowerCase();
                        if (cellText.includes(query)) {
                            cell.classList.add('highlight');
                        } else {
                            cell.classList.remove('highlight');
                        }
                    });
                } else {
                    // ハイライトをクリア
                    const cells = row.querySelectorAll('td');
                    cells.forEach(cell => {
                        cell.classList.remove('highlight');
                    });
                }
            });
        });
        
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            tableRows.forEach(row => {
                row.classList.remove('hidden');

                // すべてのセルからハイライトを削除
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.classList.remove('highlight');
                });
            });
        });
    }

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
                console.log(`Container \${containerId} not found`);
                return;
            }
            
            // SVGを探す
            let svg = container.querySelector('svg');
            
            // SVGが見つからない場合は監視して再試行
            if (!svg) {
                console.log(`SVG not found in \${containerId}, setting up observer`);
                // SVG要素が追加されるのを監視
                const observer = new MutationObserver((mutations, obs) => {
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes.length) {
                            svg = container.querySelector('svg');
                            if (svg) {
                                console.log(`SVG found in \${containerId} after waiting`);
                                obs.disconnect(); // 監視を停止
                                // 初期ズームを適用
                                svg.style.transform = `scale(\${currentScale})`;
                            }
                        }
                    });
                });
                
                observer.observe(container, { childList: true, subtree: true });
            } else {
                console.log(`SVG found immediately \${containerId}`);
                // 初期ズームを適用
                svg.style.transform = `scale(\${currentScale})`;
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
                svg.style.transform = `scale(\${currentScale})`;
            }
        });
        
        // ボタン状態の更新
        const zoomIn = zoomControls.querySelector('[data-zoom="in"]');
        const zoomOut = zoomControls.querySelector('[data-zoom="out"]');
        
        zoomIn.disabled = currentScale >= maxScale;
        zoomOut.disabled = currentScale <= minScale;
    }
</script>
<div id="zoom-controls-container" style="margin-bottom: 10px;"></div>
<div class="asd-view-selector">
    <span class="selector-label">View:</span>
    <input type="radio" id="asd-show-id" checked name="asd-view-selector">
    <label for="asd-show-id">id</label>
    <input type="radio" id="asd-show-name" name="asd-view-selector">
    <label for="asd-show-name">title</label>
</div>
EOTJS;

        $md = <<<EOT
# {$index->htmlTitle}

{$index->htmlDoc}

<!-- Container for the ASDs -->

{$asd}
{$tags}
{$legend}

{$index->semanticMd}
{$index->linkRelations}


---

## Profile
<pre><code>{$index->alpsProfile}</code></pre>
EOT;
        $this->file = sprintf('%s/index.%s', dirname($index->profile->alpsFile), $index->ext);
        if ($index->mode === DumpDocs::MODE_MARKDOWN) {
            $this->content = $md;

            return;
        }

        // HTML format
        $legendTypeMd = $this->getLegendTypeMd($md);
        assert($legendTypeMd !== '', 'Regexp failed');
        $html = (new MdToHtml())($index->htmlTitle, $legendTypeMd);
        $escapedDotId = str_replace("\n", '', $index->dotId);
        $escapedDotName = str_replace("\n", '', $index->dotName);
        $plusHeaderHtml = str_replace(
            '</head>',
            $header . '</head>',
            $html
        );
        $this->content = str_replace(['{{ dotId }}', '{{ dotName }}', '{{ dotName }}'], [$escapedDotId, $escapedDotName], $plusHeaderHtml);
    }

    private function getLegendTypeMd(string $md): string
    {
        $pattern = '/^(\|\s*)(semantic|safe|unsafe|idempotent)(\s*\|)/m';
        $replacement = '$1<span class="legend"><span class="legend-icon $2"></span></span>$3';

        return (string) preg_replace($pattern, $replacement, $md);
    }

    private function getMarkdownImage(string $profile): string
    {
        $baseProfile = basename($profile);
        $imageFile = str_replace(['.xml', '.json'], '.svg', $baseProfile);
        $imageTitleFile = str_replace(['.xml', '.json'], '.title.svg', $baseProfile);

        return sprintf(
            '[<img src="%s" alt="application state diagram">](%s)',
            $imageFile,
            $imageTitleFile
        );
    }

    /** @param array<string, list<string>> $tags */
    private function tags(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        $lines = ['<span class="selector-label">Tags:</span>'];
        $tagKeys = array_keys($tags);
        foreach ($tagKeys as $tag) {
            $lines[] = sprintf('<span class="selector-option"><input type="checkbox" id="tag-%s" class="tag-trigger-checkbox" data-tag="%s" name="tag-%s"><label for="tag-%s"> %s</label></span>', $tag, $tag, $tag, $tag, $tag);
        }

        return sprintf('<div class="selector-container">%s</div>', implode(PHP_EOL, $lines));
    }

    private function linkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return '## Links' . PHP_EOL . (string) $linkRelations;
    }

    private function getSetupTagEvents(Config $config): string
    {
        $setUpTagEvents = '';
        $tags = (new Profile($config->profile, new LabelName(), true))->tags;
        $colors = [
            'LightGreen',
            'SkyBlue',
            'LightCoral',
            'LightSalmon',
            'Khaki',
            'Plum',
            'Wheat',
        ];
        $numberOfColors = count($colors);
        $i = 0;
        foreach ($tags as $tag => $ids) {
            $idArr = [];
            foreach ($ids as $id) {
                $idArr[] .= "'{$id}'";
            }

            $setUpTagEvents .= sprintf("setupTagEventListener('%s', [%s], '%s'); ", $tag, implode(', ', $idArr), $colors[$i++ % $numberOfColors]);
        }

        return $setUpTagEvents;
    }

    private function getElements(Config $config): IndexPageElements
    {
        $draw = new DrawDiagram();
        $profile = new Profile($config->profile, new LabelName(), true);
        $titleProfile = new Profile($config->profile, new LabelNameTitle(), true);
        $dotId = $draw($profile, new LabelName());
        $dotName = $draw($titleProfile, new LabelNameTitle());
        $mode = $config->outputMode;
        $alpsProfile = htmlspecialchars(
            (string) file_get_contents($profile->alpsFile),
            ENT_QUOTES,
            'UTF-8'
        );

        $semanticMd = PHP_EOL . (new DumpDocs())->getSemanticDescriptorMarkDown($profile);
        $descriptors = $profile->descriptors;
        uasort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $compareId = strtoupper($a->id) <=> strtoupper($b->id);
            if ($compareId !== 0) {
                return $compareId;
            }

            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });
        $linkRelations = $this->linkRelations($profile->linkRelations);
        $ext = $mode === DumpDocs::MODE_MARKDOWN ? 'md' : DumpDocs::MODE_HTML;
        $tags = $this->tags($profile->tags);
        $htmlTitle = htmlspecialchars($profile->title ?: 'ALPS');
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $setUpTagEvents = $this->getSetupTagEvents($config);

        return new IndexPageElements(
            $profile,
            $dotId,
            $dotName,
            $mode,
            $alpsProfile,
            $semanticMd,
            $linkRelations,
            $ext,
            $tags,
            $htmlTitle,
            $htmlDoc,
            $setUpTagEvents
        );
    }
}
