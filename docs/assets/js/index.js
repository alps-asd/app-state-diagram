// Applies smooth scroll to links
const applySmoothScrollToLinks = (links) => {
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetName = link.getAttribute('href').slice(1);
            const targetElement = document.querySelector(`[name="${targetName}"]`);
            if (!targetElement) {
                console.error("Target element not found for link:", link.getAttribute('href'));
                return;
            }
            smoothScrollTo(targetElement);
        });
    });
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

    const ease = (t, b, c, d) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animate);
    history.pushState(null, null, '#' + targetElement.getAttribute('name'));
};

// Renders the graph and applies smooth scroll to links
const renderGraph = (graphId, dotString) => {
    const graphviz = d3.select(graphId).graphviz();
    graphviz.renderDot(dotString).on('end', () => {
        applySmoothScrollToLinks(document.querySelectorAll('svg a[*|href^="#"]'));
    });
};

// Sets up event listeners for tags
const setupTagEventListener = (eventName, titles, color) => {
    document.addEventListener('tagon-' + eventName, () => {
        titles.forEach(title => {
            changeColorByTitle(title, color, color);
        });
    });
    document.addEventListener('tagoff-' + eventName, () => {
        titles.forEach(title => {
            changeColorByTitle(title, 'lightgrey', 'black');
        });
    });
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
const setupModeSwitch = () => {
    const graphIdElement = document.getElementById('graphId');
    const graphNameElement = document.getElementById('graphName');

    document.getElementById('show_id').addEventListener('change', (e) => {
        if (e.target.checked) {
            graphIdElement.style.display = 'block';
            graphNameElement.style.display = 'none';
        }
    });

    document.getElementById('show_name').addEventListener('change', (e) => {
        if (e.target.checked) {
            graphNameElement.style.display = 'block';
            graphIdElement.style.display = 'none';
        }
    });
};
