// Applies smooth scroll to links
const ease = (t, b, c, d) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
};

// Smoothly scrolls to the target element
const smoothScrollTo = (targetElement) => {
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let startTime = null;

    const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    history.pushState(null, null, '#' + targetElement.getAttribute('name'));
};

const applySmoothScrollToLinks = (links) => {
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href') || link.getAttribute('xlink:href');
            if (!href) {
                console.error("No href found for link:", link);
                return;
            }
            const targetName = href.startsWith('#') ? href.slice(1) : href;
            const targetElement = document.querySelector(`[id="${targetName}"]`);
            if (!targetElement) {
                console.error("Target element not found for link:", href);
                return;
            }
            smoothScrollTo(targetElement);

            // URLを更新
            history.pushState(null, null, href);
        });
    });
};

// Renders the graph and applies smooth scroll to links
const renderGraph = (graphId, dotString) => {
    d3.select(graphId).graphviz()
        .zoom(false)
        .renderDot(dotString).on('end', () => {
            applySmoothScrollToLinks(document.querySelectorAll('svg a[*|href^="#"]'));
    });
};

// Sets up event listeners for tags
const setupTagEventListener = (eventName, titles, color, defaultColor = 'lightgrey', defaultEdgeColor = 'black') => {
    const changeColor = (useDefault) => {
        titles.forEach(title => {
            changeColorByTitle(title, useDefault ? defaultColor : color, useDefault ? defaultEdgeColor : color);
        });
    };

    document.addEventListener(`tagon-${eventName}`, () => changeColor(false));
    document.addEventListener(`tagoff-${eventName}`, () => changeColor(true));
};

// Sets up triggers for tags
const setupTagTrigger = () => {
    const checkboxes = document.querySelectorAll('.tag-trigger-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            this.checked ?
                document.dispatchEvent(new CustomEvent('tagon-' + this.getAttribute('data-tag'))) :
                document.dispatchEvent(new CustomEvent('tagoff-' + this.getAttribute('data-tag')));
        });
    });
};

// Changes color of elements by title or class
const changeColorByTitle = (titleOrClass, newNodeColor, newEdgeColor) => {
    const elements = Array.from(document.getElementsByTagName('g'));

    elements.forEach(element => {
        const titleElement = element.getElementsByTagName('title')[0];
        const title = titleElement ? titleElement.textContent : '';

        if (title === titleOrClass || element.classList.contains(titleOrClass)) {
            const polygons = Array.from(element.getElementsByTagName('polygon'));
            const paths = Array.from(element.getElementsByTagName('path'));

            polygons.forEach(polygon => {
                polygon.setAttribute('fill', newNodeColor);
            });

            paths.forEach(path => {
                path.setAttribute('stroke', newEdgeColor);
            });
        }
    });
};

// Sets up mode switch for graph display
const setupModeSwitch = (switchId, graphId, otherGraphId) => {
    document.getElementById(switchId).addEventListener('change', (e) => {
        document.getElementById(graphId).style.display = e.target.checked ? 'block' : 'none';
        document.getElementById(otherGraphId).style.display = e.target.checked ? 'none' : 'block';
    });
};

const setupTagClick = () => {
    document.querySelectorAll('.meta-tag.tag-tag a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tagName = link.textContent.trim();
            const checkbox = document.querySelector(`#tag-${tagName}`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
}
const setupDocClick = () => {
    // Define constants for better maintainability
    const MAX_LENGTH = 140;
    const TRUNCATE_LENGTH = 70;
    document.querySelectorAll('.doc-tag').forEach(el => {
        const full = el.dataset.full;
        if (!full || full.length <= MAX_LENGTH) return;
        const short = full.slice(0, TRUNCATE_LENGTH) + '...';
        el.innerText = short;
        el.classList.add('expandable');
        el.classList.add('clickable');
        // Make element keyboard accessible
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-expanded', 'false');
        el.setAttribute('aria-label', 'Expand to read more');
        const toggleExpansion = () => {
            const expanded = el.classList.toggle('expanded');
            el.innerText = expanded ? full : short;
            el.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            el.setAttribute('aria-label', expanded ? 'Collapse text' : 'Expand to read more');
        };
        el.addEventListener('click', toggleExpansion);
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleExpansion();
            }
        });
    });
};

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

