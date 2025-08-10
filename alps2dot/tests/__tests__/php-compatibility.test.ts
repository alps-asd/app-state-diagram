import { Alps2Dot } from '../../src/index';
import { readFileSync } from 'fs';

describe('PHP版互換性テスト', () => {
  const alps2dot = new Alps2Dot();
  const profileXml = readFileSync('/Users/akihito/git/app-state-diagram/tests/Fake/config/profile.xml', 'utf-8');

  test('ノード仕様: semantic descriptorのみがノードになる', () => {
    const result = alps2dot.convertWithLabel(profileXml, 'id', 'xml');
    
    // transition descriptors (doPost, goBlog, goAbout, goBlogPosting) はノードにならない
    expect(result).not.toMatch(/doPost \[/);
    expect(result).not.toMatch(/goBlog \[/);
    expect(result).not.toMatch(/goAbout \[/);
    expect(result).not.toMatch(/goBlogPosting \[/);
    
    // semantic descriptors (About, Blog, BlogPosting, Index) のみがノードになる
    expect(result).toMatch(/About \[label="About"/);
    expect(result).toMatch(/Blog \[label="Blog"/);
    expect(result).toMatch(/BlogPosting \[label="BlogPosting"/);
    expect(result).toMatch(/Index \[label="Index"/);
  });

  test('エッジ仕様: semantic → semantic のエッジのみ', () => {
    const result = alps2dot.convertWithLabel(profileXml, 'id', 'xml');
    
    // 正しいエッジパターン
    expect(result).toMatch(/About -> Blog \[/);
    expect(result).toMatch(/Blog -> About \[/);
    expect(result).toMatch(/Blog -> Blog \[/);  // self-loop for doPost
    expect(result).toMatch(/Blog -> BlogPosting \[/);
    expect(result).toMatch(/BlogPosting -> Blog \[/);
    expect(result).toMatch(/Index -> Blog \[/);
    
    // 間違ったエッジパターン (transition descriptor がtoになってはいけない)
    expect(result).not.toMatch(/-> doPost \[/);
    expect(result).not.toMatch(/-> goBlog \[/);
    expect(result).not.toMatch(/-> goAbout \[/);
    expect(result).not.toMatch(/-> goBlogPosting \[/);
  });

  test('ラベル仕様: transition descriptorのIDがラベルに使われる', () => {
    const result = alps2dot.convertWithLabel(profileXml, 'id', 'xml');
    
    // エッジラベルにtransition descriptorのIDが表示される
    expect(result).toMatch(/goBlog</);
    expect(result).toMatch(/goAbout</);
    expect(result).toMatch(/doPost</);
    expect(result).toMatch(/goBlogPosting</);
  });

  test('構造仕様: semantic field nodesとapp state nodesの2部構成', () => {
    const result = alps2dot.convertWithLabel(profileXml, 'id', 'xml');
    
    // semantic field nodes (margin=0.1を持つ)
    expect(result).toMatch(/Blog \[margin=0\.1/);
    expect(result).toMatch(/BlogPosting \[margin=0\.1/);
    
    // app state nodes (marginが指定されていない基本ノード)
    expect(result).toMatch(/About \[label="About" URL="#About"/);
    expect(result).toMatch(/Index \[label="Index" URL="#Index"/);
  });
});