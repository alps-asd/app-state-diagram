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
        $descriptors = new Descriptors();
        foreach ($alpsFile->descriptors as $descriptor) {
            if ($this->isFilteredAnd($descriptor, $andTags)) {
                $descriptors->add($descriptor);
            }
        }

        foreach ($alpsFile->descriptors as $descriptor) {
            if ($this->isFilteredOr($descriptor, $orTags)) {
                $descriptors->add($descriptor);
            }
        }

        $this->descriptors = $descriptors->descriptors;
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

    private function isFilteredOr(AbstractDescriptor $descriptor, array $andTags): bool
    {
        foreach ($andTags as $tag) {
            if (in_array($tag, $descriptor->tags)) {
                return true;
            }
        }

        return false;
    }
}
