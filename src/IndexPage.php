<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function array_keys;
use function dirname;
use function htmlspecialchars;
use function implode;
use function nl2br;
use function pathinfo;
use function sprintf;
use function str_replace;
use function strtoupper;
use function uasort;

use const PATHINFO_BASENAME;
use const PHP_EOL;

final class IndexPage
{
    /** @var string */
    public $content;

    /** @var string */
    public $file;

    public function __construct(Profile $profile, string $mode = DumpDocs::MODE_HTML)
    {
        $semanticMd = PHP_EOL . (new DumpDocs())->getSemanticDescriptorMarkDown($profile, $profile->alpsFile);
        $profilePath = pathinfo($profile->alpsFile, PATHINFO_BASENAME);
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
        $semantics = $this->semantics($descriptors, $ext);
        $tags = $this->tags($profile->tags, $ext);
        $htmlTitle = htmlspecialchars($profile->title ?: 'ALPS');
        $htmlDoc = nl2br(htmlspecialchars($profile->doc));
        $profileImage = $mode === DumpDocs::MODE_HTML ? 'docs/asd.html' : 'docs/asd.md';
        $md = <<<EOT
# {$htmlTitle}

{$htmlDoc}

 * [ALPS]({$profilePath})
 * [Application State Diagram]($profileImage)

---

## Semantic Descriptors

 {$semanticMd}
 
 * [Semantic Descriptors](docs/descriptors.{$ext}){$tags}{$linkRelations}
EOT;
        $this->file = sprintf('%s/index.%s', dirname($profile->alpsFile), $ext);
        if ($mode === DumpDocs::MODE_MARKDOWN) {
            $this->content = $md;

            return;
        }

        $html = (new MdToHtml())($htmlTitle, $md);

        $this->content = str_replace('</head>', <<<'EOT'
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Get all anchor tags on the page
    const links = document.querySelectorAll('a[href^="#"]');

    // Set a click event for each link
    links.forEach((link) => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        // Get the 'name' attribute pointed to by the link
        const targetName = this.getAttribute('href').slice(1); // Remove the hash
        const targetElement = document.querySelector(`[name="${targetName}"]`);

        if (!targetElement) {
            console.error("Target element not found for link:", this.getAttribute('href'));
            return;
        }

        // Get the absolute position on the page of the target element
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;

        // Get the current scroll position
        const startPosition = window.pageYOffset;

        // Calculate the distance to scroll
        const distance = targetPosition - startPosition;

        // Set animation duration
        const duration = 1000; // 1 second
        let startTime = null;

        // Animation function
        const animate = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const run = ease(timeElapsed, startPosition, distance, duration);
          window.scrollTo(0, run);
          if (timeElapsed < duration) requestAnimationFrame(animate);
        };

        // Easing function
        const ease = (t, b, c, d) => {
          t /= d / 2;
          if (t < 1) return (c / 2) * t * t + b;
          t--;
          return (-c / 2) * (t * (t - 2) - 1) + b;
        };

        // Start the animation
        requestAnimationFrame(animate);

        // Update URL after the scroll
        history.pushState(null, null, '#' + targetName);
      });
    });
})
</script>
</head>
EOT, $html);
    }

    /** @param array<string, AbstractDescriptor> $semantics */
    private function semantics(array $semantics, string $ext): string
    {
        $lines = [];
        foreach ($semantics as $semantic) {
            $href = sprintf('docs/descriptors.%s#%s', $ext, $semantic->id);
            $lines[] = sprintf('   * [%s](%s)', $semantic->id, $href);
        }

        return implode(PHP_EOL, $lines);
    }

    /** @param array<string, list<string>> $tags */
    private function tags(array $tags, string $ext): string
    {
        if ($tags === []) {
            return '';
        }

        $lines = [];
        $tagKeys = array_keys($tags);
        foreach ($tagKeys as $tag) {
            $href = "docs/tag.{$tag}.{$ext}";
            $lines[] = "   * [{$tag}]({$href})";
        }

        return PHP_EOL . ' * Tags' . PHP_EOL . implode(PHP_EOL, $lines);
    }

    private function linkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return PHP_EOL . ' * Links' . PHP_EOL . $linkRelations;
    }
}
