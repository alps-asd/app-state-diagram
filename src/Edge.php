<?php

declare(strict_types=1);

namespace Koriym\AppStateDiagram;

use Stringable;

use function assert;
use function count;
use function htmlspecialchars;
use function sprintf;

use const PHP_EOL;

final class Edge implements Stringable
{
    public function __construct(
        private readonly AbstractProfile $profile
    ) {
    }

    public function __toString(): string
    {
        $graph = '';
        /** @psalm-suppress MixedArgumentTypeCoercion */
        $groupedLinks = $this->groupEdges($this->profile->links);
        foreach ($groupedLinks as $link) {
            $graph .= count($link) === 1 ? $this->singleLink($link) : $this->multipleLink($link);
        }

        return $graph;
    }

    /**
     * Generates colored Unicode square characters according to transition type.
     */
    private function getTypeSymbolUnicode(string $type): string
    {
        $color = match ($type) {
            'safe' => '#00A86B',       // 緑系
            'unsafe' => '#FF4136',     // 赤系
            'idempotent' => '#FFDC00', // 黄系
            default => '#000000',      // 予期しないタイプは黒 (念のため)
        };
        $symbol = '■'; // Unicode Black Square (U+25A0)

        return sprintf('<font color="%s">%s</font>', $color, $symbol);
    }

    /**
     * 単一の遷移を表すエッジのDOT言語文字列を生成します。
     * ラベルにUnicodeシンボルとテキストを含むHTMLライクテーブルを使用します。
     *
     * @param list<Link> $links
     */
    private function singleLink(array $links): string
    {
        $link = $links[0];
        $trans = $link->transDescriptor;
        $symbolUnicode = $this->getTypeSymbolUnicode($trans->type);
        $labelHtml = $link->label; // LabelNameInterfaceから取得したテキストラベル
        $tooltip = $trans->title ?: $trans->id;

        // valign="middle" を追加して垂直中央揃えを試みる
        $labelContent = sprintf(
            '<table border="0" cellborder="0" cellspacing="0" cellpadding="0"><tr><td valign="middle" href="#%s" tooltip="%s (%s)">%s %s</td></tr></table>',
            $trans->id,
            htmlspecialchars($tooltip),
            $trans->type,
            $symbolUnicode,
            $labelHtml
        );

        $base = '    %s -> %s [label=<%s> URL="#%s" target="_parent" fontsize=13 class="%s" penwidth=1.5];' . PHP_EOL;

        return sprintf($base, $link->from, $link->to, $labelContent, $trans->id, $trans->id);
    }

    /**
     * 同じノード間に複数の遷移がある場合のエッジのDOT言語文字列を生成します。
     * ラベルに各遷移のUnicodeシンボルとテキストを含むHTMLライクテーブルを使用します。
     *
     * @param list<Link> $links
     */
    private function multipleLink(array $links): string
    {
        assert(isset($links[0]));
        $trs = ''; // テーブルの行 (<tr>) を格納する文字列
        foreach ($links as $link) {
            $trans = $link->transDescriptor;
            $symbolUnicode = $this->getTypeSymbolUnicode($trans->type);
            $labelHtml = $link->label;
            $tooltip = $trans->title ?: $trans->id;

            $trs .= sprintf(
                '<tr><td valign="middle" align="left" href="#%s" tooltip="%s (%s)">%s %s</td></tr>',
                $trans->id,
                htmlspecialchars($tooltip),
                $trans->type,
                $symbolUnicode,
                $labelHtml
            );
        }

        // fontsize=13 はそのまま
        $base = '    %s -> %s [label=<<table border="0" cellborder="0" cellspacing="0" cellpadding="0">%s</table>> fontsize=13];' . PHP_EOL;

        return sprintf($base, $links[0]->from, $links[0]->to, $trs);
    }

    /**
     * リンクを from -> to のキーでグループ化します。
     *
     * @param array<string, Link> $links
     *
     * @return array<string, list<Link>>
     */
    private function groupEdges(array $links): array
    {
        $groupedLinks = [];
        foreach ($links as $link) {
            $fromTo = $link->from . $link->to;
            $groupedLinks[$fromTo][] = $link;
        }

        return $groupedLinks;
    }
}
