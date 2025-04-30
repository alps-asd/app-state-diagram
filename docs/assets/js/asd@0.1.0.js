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
            const targetName = link.getAttribute('href').slice(1);
            const targetElement = document.querySelector(`[id="${targetName}"]`);
            if (!targetElement) {
                console.error("Target element not found for link:", link.getAttribute('href'));
                return;
            }
            smoothScrollTo(targetElement);
        });
    });
};


// Renders the graph and applies smooth scroll to links
const renderGraph = (graphId, dotString) => {
    d3.select(graphId).graphviz()
        .zoom(false)
        .fit(true)
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
