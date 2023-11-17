<script src="https://d3js.org/d3.v5.min.js"></script>
<script src="https://unpkg.com/viz.js@1.8.1/viz.js" type="javascript/worker"></script>
<script src="https://unpkg.com/d3-graphviz@2.1.0/build/d3-graphviz.min.js"></script>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        applySmoothScrollToLinks(document.querySelectorAll('a[href^="#"]'));
    });

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
</script>
