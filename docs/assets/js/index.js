
function applySmoothScrollToLinks(links) {
    links.forEach((link) => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetName = this.getAttribute('href').slice(1);
            const targetElement = document.querySelector(`[name="${targetName}"]`);
            if (!targetElement) {
                console.error("Target element not found for link:", this.getAttribute('href'));
                return;
            }
            smoothScrollTo(targetElement);
        });
    });}

function smoothScrollTo(targetElement) {
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

    const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animate);
    history.pushState(null, null, '#' + targetElement.getAttribute('name'));
}
function renderGraph(graphId, dotString) {
    var graphviz = d3.select(graphId).graphviz();
    graphviz.renderDot(dotString).on('end', function () {
        applySmoothScrollToLinks(document.querySelectorAll('svg a[*|href^="#"]'));
    });
}

function setupTagEventListener(eventName, titles, color) {
    document.addEventListener('tagon-' + eventName, function () {
        titles.forEach(function (title) {
            changeColorByTitle(title, color, color);
        });
    });
    document.addEventListener('tagoff-' + eventName, function () {
        titles.forEach(function (title) {
            changeColorByTitle(title, 'lightgrey', 'black');
        });
    });
}

function setupTagTrigger() {
    var checkboxes = document.querySelectorAll('.tag-trigger-checkbox');
    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                var eventName = 'tagon-' + this.getAttribute('data-tag');
                document.dispatchEvent(new CustomEvent(eventName));
            } else {
                var eventName = 'tagoff-' + this.getAttribute('data-tag');
                document.dispatchEvent(new CustomEvent(eventName));
            }
        });
    });
}

function changeColorByTitle(titleOrClass, newNodeColor, newEdgeColor) {
    // タイトルとクラス名で要素を探す
    var elements = Array.from(document.getElementsByTagName('g'));

    elements.forEach(function (element) {
        var titleElement = element.getElementsByTagName('title')[0];
        var title = titleElement ? titleElement.textContent : '';

        // タイトルが一致するか、クラス名が含まれる場合に色を変更
        if (title === titleOrClass || element.classList.contains(titleOrClass)) {
            var polygons = Array.from(element.getElementsByTagName('polygon'));
            var paths = Array.from(element.getElementsByTagName('path'));

            polygons.forEach(function (polygon) {
                polygon.setAttribute('fill', newNodeColor);
            });

            paths.forEach(function (path) {
                path.setAttribute('stroke', newEdgeColor);
            });
        }
    });
}

function setupModeSwitch() {
    const graphIdElement = document.getElementById('graphId');
    const graphNameElement = document.getElementById('graphName');
    document.getElementById('show_id').addEventListener('change', function (e) {
        if (e.target.checked) {
            graphIdElement.style.display = 'block';
            graphNameElement.style.display = 'none';
        }
    });
    document.getElementById('show_name').addEventListener('change', function (e) {
        if (e.target.checked) {
            graphNameElement.style.display = 'block';
            graphIdElement.style.display = 'none';
        }
    });
}
