<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use stdClass;

use function assert;
use function basename;
use function dirname;
use function explode;
use function file_put_contents;
use function filter_var;
use function implode;
use function is_dir;
use function is_string;
use function ksort;
use function mkdir;
use function property_exists;
use function sprintf;
use function str_replace;
use function strpos;
use function substr;
use function usort;

use const FILTER_VALIDATE_URL;
use const PHP_EOL;
use const SORT_FLAG_CASE;
use const SORT_STRING;

/** @psalm-suppress MissingConstructor */
final class DumpDocs
{
    public const MODE_HTML = 'html';
    public const MODE_MARKDOWN = 'markdown';

    /** @var array<string, AbstractDescriptor> */
    private $descriptors = [];

    /** @var "html"|"md" */
    private $ext = 'md';

    public function __invoke(Profile $profile, string $alpsFile, string $format = self::MODE_HTML): void
    {
        $this->ext = $format === self::MODE_MARKDOWN ? 'md' : self::MODE_HTML;
        $asdFile = sprintf('../%s', basename(str_replace(['xml', 'json'], 'svg', $alpsFile)));

        $markDown = $this->getSemanticDescriptorMarkDown($profile, $asdFile);

        $docsDir = $this->mkDir(dirname($alpsFile), 'docs');
        $basePath = sprintf('%s/descriptors', $docsDir);
        $title = 'Semantic Descriptors';
        $this->fileOutput($title, $markDown, $basePath, $format);

        $this->dumpImage($profile->title, $docsDir, $format, $alpsFile, '');
        $this->dumpImage($profile->title, $docsDir, $format, $alpsFile, 'title.');
    }

    private function dumpImage(string $title, string $docsDir, string $format, string $alpsFile, string $type): void
    {
        $imgSrc = str_replace(['json', 'xml'], "{$type}svg", basename($alpsFile));
        $format === self::MODE_HTML ?
            $this->dumpImageHtml($title, $docsDir, $imgSrc, $type) :
            $this->dumpImageMd($docsDir, $imgSrc, $type);
    }

    private function dumpImageMd(string $docsDir, string $imgSrc, string $type): void
    {
        $isIdMode = $type === '';
        $link = $isIdMode ? 'id | [title](asd.title.md)' : '[id](asd.md) | title';
        $html = <<<EOT
{$link}

[<img src="../{$imgSrc}" alt="application state diagram">](../{$imgSrc})
EOT;
        file_put_contents($docsDir . "/asd.{$type}md", $html);
    }

    private function dumpImageHtml(string $title, string $docsDir, string $imgSrc, string $type): void
    {
        $isIdMode = $type === '';
        $link = $isIdMode ? '<ul class="diagram-mode"> <li class="diagram-mode__item"> <span class="diagram-mode__text">id</span> </li><li class="diagram-mode__item"> <a href="asd.title.html" class="diagram-mode__link">title</a> </li></ul>' : '<ul class="diagram-mode"> <li class="diagram-mode__item"> <a href="asd.html" class="diagram-mode__link">id</a> </li><li class="diagram-mode__item"> <span class="diagram-mode__text">title</span> </li></ul>';
        $html = <<<EOT
<html lang="en">
<head>
    <title>{$title}</title>
    <meta charset="UTF-8">
    <style>
      :root {
        --color-text-base: #24292e;
        --color-border-base: #eaecef;
        --color-link-base: #3366cc;
        --font-size-base: 1rem;
      }

      body {
        font-family: sans-serif;
      }

      .diagram-mode {
        margin-block-end: 2rem;
        border-bottom: 1px solid var(--color-border-base);
        font-size: var(--font-size-base);
      }

      .diagram-mode__item {
        display: inline-flex;
        margin-inline: 0.5rem;
        list-style: none;
        color: var(--color-text-base);
      }

      .diagram-mode__text {
        display: inline-flex;
        position: relative;
        box-sizing: border-box;
        max-height: 4em;
        margin-block-end: -1px;
        padding-block: 1.5rem 0.5rem;
        border-bottom: 1px solid;
        text-decoration: none;
        color: var(--color-text-base);
      }

      .diagram-mode__link {
        display: inline-flex;
        position: relative;
        box-sizing: border-box;
        max-height: 4em;
        margin-block-end: -1px;
        padding-block: 1.5rem 0.5rem;
        cursor: pointer;
        color: var(--color-link-base);
        text-decoration: none;
      }

      .diagram-mode__link:hover,
      .diagram-mode__link:focus {
        border-bottom: 1px solid;
      }
    </style>
</head>
<body>
    <div>{$link}</div>
    <iframe src="../{$imgSrc}" style="border:0; width:100%; height:95%" allow="fullscreen"></iframe>
</body>
</html>

EOT;
        file_put_contents($docsDir . "/asd.{$type}html", $html);
    }

    private function convertHtml(string $title, string $markdown): string
    {
        return (new MdToHtml())($title, $markdown) . PHP_EOL;
    }

    private function fileOutput(string $title, string $markDown, string $basePath, string $format): void
    {
        $file = sprintf('%s.%s', $basePath, $this->ext);
        if ($format === self::MODE_MARKDOWN) {
            file_put_contents($file, $markDown);

            return;
        }

        $html = $this->convertHtml($title, $markDown);
        $JsHtml = str_replace('</head>', <<<'EOT'
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
        file_put_contents($file, $JsHtml);
    }

    private function mkDir(string $baseDir, string $dirName): string
    {
        $dir = sprintf('%s/%s', $baseDir, $dirName);
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true); // @codeCoverageIgnore
        }

        return $dir;
    }

    private function getSemanticDoc(AbstractDescriptor $descriptor, string $asd, string $title): string
    {
        $descriptorSemantic = $this->getDescriptorInDescriptor($descriptor);
        $rt = $this->getRt($descriptor);
        $description = '';
        $description .= $this->getDescriptorProp('type', $descriptor);
        $description .= $this->getDescriptorProp('title', $descriptor);
        $description .= $this->getDescriptorProp('href', $descriptor);
        $description .= $this->getDescriptorKeyValue('doc', (string) ($descriptor->doc->value ?? ''));
        $description .= $this->getDescriptorProp('def', $descriptor);
        $description .= $this->getDescriptorProp('rel', $descriptor);
        $description .= $this->getTag($descriptor->tags);
        $linkRelations = $this->getLinkRelations($descriptor->linkRelations);
        $titleHeader = $title ? sprintf('%s: Semantic Descriptor', $title) : 'Semantic Descriptor';

        return <<<EOT
### <a name="{$descriptor->id}">{$descriptor->id}</a>
{$description}{$rt}{$linkRelations}{$descriptorSemantic}

EOT;
    }

    private function getDescriptorProp(string $key, AbstractDescriptor $descriptor): string
    {
        if (! property_exists($descriptor, $key) || ! $descriptor->{$key}) {
            return '';
        }

        $value = (string) $descriptor->{$key};
        if ($this->isUrl($value)) {
            return " * {$key}: [{$value}]({$value})" . PHP_EOL;
        }

        if ($this->isFragment($value)) {
            [, $id] = explode('#', $value);

            return " * {$key}: [{$id}](semantic.{$id}.{$this->ext})" . PHP_EOL;
        }

        return " * {$key}: {$value}" . PHP_EOL;
    }

    private function isUrl(string $text): bool
    {
        return filter_var($text, FILTER_VALIDATE_URL) !== false;
    }

    private function isFragment(string $text): bool
    {
        return $text[0] === '#';
    }

    private function getDescriptorKeyValue(string $key, string $value): string
    {
        if (! $value) {
            return '';
        }

        return " * {$key}: {$value}" . PHP_EOL;
    }

    private function getRt(AbstractDescriptor $descriptor): string
    {
        if ($descriptor instanceof SemanticDescriptor) {
            return '';
        }

        assert($descriptor instanceof TransDescriptor);

        return sprintf(' * rt: [%s](#%s)', $descriptor->rt, $descriptor->rt) . PHP_EOL;
    }

    private function getDescriptorInDescriptor(AbstractDescriptor $descriptor): string
    {
        if ($descriptor->descriptor === []) {
            return '';
        }

        $descriptors = $this->getInlineDescriptors($descriptor->descriptor);

        $table = sprintf(' * descriptor%s%s| id | type | title |%s|---|---|---|%s', PHP_EOL, PHP_EOL, PHP_EOL, PHP_EOL);
        foreach ($descriptors as $descriptor) {
            $table .= sprintf('| %s | %s | %s |', $descriptor->htmlLink($this->ext), $descriptor->type, $descriptor->title) . PHP_EOL;
        }

        return $table;
    }

    /**
     * @param non-empty-list<stdClass> $inlineDescriptors
     *
     * @return non-empty-list<AbstractDescriptor>
     */
    private function getInlineDescriptors(array $inlineDescriptors): array
    {
        $descriptors = [];
        foreach ($inlineDescriptors as $descriptor) {
            if (isset($descriptor->id)) {
                assert(is_string($descriptor->id));
                $descriptors[] = $this->descriptors[$descriptor->id];
                continue;
            }

            assert(is_string($descriptor->href));
            $id = substr($descriptor->href, (int) strpos($descriptor->href, '#') + 1);
            assert(isset($this->descriptors[$id]));

            $original = clone $this->descriptors[$id];
            if (isset($descriptor->title)) {
                $original->title = (string) $descriptor->title;
            }

            $descriptors[] = $original;
        }

        usort($descriptors, static function (AbstractDescriptor $a, AbstractDescriptor $b): int {
            $order = ['semantic' => 0, 'safe' => 1, 'unsafe' => 2, 'idempotent' => 3];

            return $order[$a->type] <=> $order[$b->type];
        });

        assert($descriptors !== []);

        return $descriptors;
    }

    /** @param list<string> $tags */
    private function getTag(array $tags): string
    {
        if ($tags === []) {
            return '';
        }

        return " * tag: {$this->getTagString($tags)}";
    }

    /** @param list<string> $tags */
    private function getTagString(array $tags): string
    {
        $string = [];
        foreach ($tags as $tag) {
            $string[] = "[{$tag}](tag.{$tag}.{$this->ext})";
        }

        return implode(', ', $string) . PHP_EOL;
    }

    public function getSemanticDescriptorMarkDown(Profile $profile, string $asdFile): string
    {
        $descriptors = $this->descriptors = $profile->descriptors;
        $markDown = '';
        ksort($descriptors, SORT_FLAG_CASE | SORT_STRING);
        foreach ($descriptors as $descriptor) {
            $markDown .= $this->getSemanticDoc($descriptor, $asdFile, $profile->title);
        }

        return $markDown;
    }

    /** @param list<string> $descriptorIds */
    private function getTagDoc(string $tag, array $descriptorIds, string $title, string $asd): string
    {
        $list = '';
        foreach ($descriptorIds as $descriptorId) {
            $descriptor = $this->descriptors[$descriptorId];
            $list .= " * {$descriptor->htmlLink($this->ext)}" . PHP_EOL;
        }

        $titleHeader = $title ? sprintf('%s: Tag', $title) : 'Tag';

        return <<<EOT
{$titleHeader}
# {$tag}

{$list}
---

[home](../index.{$this->ext}) | [asd]({$asd}) | {$tag} 
EOT;
    }

    private function getLinkRelations(LinkRelations $linkRelations): string
    {
        if ((string) $linkRelations === '') {
            return '';
        }

        return ' * links' . PHP_EOL . $linkRelations . PHP_EOL;
    }
}
