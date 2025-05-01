# ALPS Blog

An ALPS profile example for ASD

<!-- Container for the ASDs -->

[<img src="profile.svg" alt="application state diagram">](profile.title.svg)

<div class="legend">
    <div class="legend-item" title="A state element (e.g.  HTML.SPAN, HTML.INPUT, etc.).">
        <span class="legend-icon semantic"></span>
        Semantic
    </div>
    <div class="legend-item" title="A hypermedia control that triggers a safe, idempotent state
      transition (e.g.  HTTP.GET or HTTP.HEAD).">
        <span class="legend-icon safe"></span>
        Safe
    </div>
    <div class="legend-item" title="A hypermedia control that triggers an unsafe, non-
      idempotent state transition (e.g.  HTTP.POST).">
        <span class="legend-icon unsafe"></span>
        Unsafe
    </div>
    <div class="legend-item" title="A hypermedia control that triggers an unsafe,
      idempotent state transition (e.g.  HTTP.PUT or HTTP.DELETE).">
        <span class="legend-icon idempotent"></span>
        Idempotent
    </div>
</div>



## Semantic Descriptors

| Type | ID | Title | Contained | Extra Info |
| :--: | :-- | :---- | :-- | :-- |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="About"></a>[About](#About) | <span style="white-space: normal;"></span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goBlog">goBlog</a> | <span style="white-space: normal;"></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="articleBody"></a>[articleBody](#articleBody) | <span style="white-space: normal;"></span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/articleBody" target="_blank">schema.org/articleBody</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="Blog"></a>[Blog](#Blog) | <span style="white-space: normal;">Blog post list</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#BlogPosting">BlogPosting</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goAbout">goAbout</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goBlogPosting">goBlogPosting</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doPost">doPost</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="BlogPosting"></a>[BlogPosting](#BlogPosting) | <span style="white-space: normal;">Blog post item</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#dateCreated">dateCreated</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#articleBody">articleBody</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goBlog">goBlog</a> | <span style="white-space: normal;"></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="dateCreated"></a>[dateCreated](#dateCreated) | <span style="white-space: normal;"></span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/dateCreated" target="_blank">schema.org/dateCreated</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon unsafe"></span></span> | <a id="doPost"></a>[doPost](#doPost) | <span style="white-space: normal;">post article</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#articleBody">articleBody</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://activitystrea.ms/specs/json/1.0/#post-verb" target="_blank">activitystrea.ms/specs/json...</a></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Blog">Blog</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goAbout"></a>[goAbout](#goAbout) | <span style="white-space: normal;">to about</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#About">About</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goBlog"></a>[goBlog](#goBlog) | <span style="white-space: normal;">to blog</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Blog">Blog</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goBlogPosting"></a>[goBlogPosting](#goBlogPosting) | <span style="white-space: normal;">to blog posting</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#BlogPosting">BlogPosting</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goStart"></a>[goStart](#goStart) | <span style="white-space: normal;">to start</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Blog">Blog</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="id"></a>[id](#id) | <span style="white-space: normal;"></span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/identifier" target="_blank">schema.org/identifier</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="Index"></a>[Index](#Index) | <span style="white-space: normal;">Index Page</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goBlog">goBlog</a> | <span style="white-space: normal;"></span> |

## Links
* <a rel="issue" href="https://github.com/alps-asd/app-state-diagram/issues">issue</a>


---

## Profile
<pre><code>&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;
&lt;alps
     xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot;
     xsi:noNamespaceSchemaLocation=&quot;https://alps-io.github.io/schemas/alps.xsd&quot;&gt;
    &lt;title&gt;ALPS Blog&lt;/title&gt;
    &lt;doc&gt;An ALPS profile example for ASD&lt;/doc&gt;
    &lt;link href=&quot;https://github.com/alps-asd/app-state-diagram/issues&quot; rel=&quot;issue&quot;/&gt;

    &lt;!-- Ontology --&gt;
    &lt;descriptor id=&quot;id&quot; def=&quot;https://schema.org/identifier&quot;/&gt;
    &lt;descriptor id=&quot;articleBody&quot; def=&quot;https://schema.org/articleBody&quot;/&gt;
    &lt;descriptor id=&quot;dateCreated&quot; def=&quot;https://schema.org/dateCreated&quot;/&gt;

    &lt;!-- Taxonomy --&gt;
    &lt;descriptor id=&quot;Index&quot; title=&quot;Index Page&quot;&gt;
        &lt;descriptor href=&quot;#goBlog&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;About&quot;&gt;
        &lt;descriptor href=&quot;#goBlog&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;Blog&quot; href=&quot;https://schema.org/Blog&quot; title=&quot;Blog post list&quot; rel=&quot;collection&quot;&gt;
        &lt;descriptor href=&quot;#goAbout&quot;/&gt;
        &lt;descriptor href=&quot;#doPost&quot;/&gt;
        &lt;descriptor href=&quot;#goBlogPosting&quot;/&gt;
        &lt;descriptor href=&quot;#BlogPosting&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;BlogPosting&quot; href=&quot;https://schema.org/BlogPosting&quot; title=&quot;Blog post item&quot;&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#dateCreated&quot;/&gt;
        &lt;descriptor href=&quot;#articleBody&quot;/&gt;
        &lt;descriptor href=&quot;#goBlog&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;!-- Choreography --&gt;
    &lt;descriptor id=&quot;goStart&quot; type=&quot;safe&quot; title=&quot;to start&quot; rt=&quot;#Blog&quot;/&gt;
    &lt;descriptor id=&quot;goAbout&quot; type=&quot;safe&quot; title=&quot;to about&quot; rt=&quot;#About&quot;/&gt;
    &lt;descriptor id=&quot;goBlog&quot; type=&quot;safe&quot; title=&quot;to blog&quot; rt=&quot;#Blog&quot;/&gt;
    &lt;descriptor id=&quot;goBlogPosting&quot; type=&quot;safe&quot; title=&quot;to blog posting&quot; rt=&quot;#BlogPosting&quot;&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doPost&quot; def=&quot;https://activitystrea.ms/specs/json/1.0/#post-verb&quot; type=&quot;unsafe&quot; title=&quot;post article&quot; rt=&quot;#Blog&quot;&gt;
        &lt;descriptor href=&quot;#articleBody&quot;/&gt;
    &lt;/descriptor&gt;
&lt;/alps&gt;
</code></pre>