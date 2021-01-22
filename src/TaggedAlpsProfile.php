<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use function in_array;

final class TaggedAlpsProfile extends AbstractProfile
{
    /**
     * @param list<string> $orTags
     * @param list<string> $andTags
     */
    public function __construct(AbstractProfile $alpsFile, array $orTags, array $andTags)
    {
        $filtered = [];
        foreach ($alpsFile->descriptors as $descriptor) {
            if ($this->isFilteredAnd($descriptor, $andTags)) {
                $filtered[] = $descriptor;
            }
        }
    }

    private function isFilteredAnd(AbstractDescriptor $descriptor, array $andTags): bool
    {
        foreach ($andTags as $tag) {
            if (! in_array($tag, $descriptor->tags)) {
                return false;
            }
        }

        return true;
    }
}
