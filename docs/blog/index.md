# ALPS Blog

An ALPS profile example for ASD

<!-- Container for the ASDs -->

[<img src="profile.svg" alt="application state diagram">](profile.title.svg)




## Semantic Descriptors

| Type | ID | Title | Contained | Extra Info |
| :--: | :-- | :---- | :-- | :-- |
| semantic | <a id="About"></a>[About](#About) | <span style="white-space: normal;">About Us</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goBlog">goBlog</a> | <span style="white-space: normal;"></span> |
| semantic | <a id="articleBody"></a>[articleBody](#articleBody) | <span style="white-space: normal;">article body</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/articleBody" target="_blank">schema.org/articleBody</a></span></span></span></span> |
| semantic | <a id="Blog"></a>[Blog](#Blog) | <span style="white-space: normal;">Blog Post List</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#BlogPosting">BlogPosting</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goAbout">goAbout</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goBlogPosting">goBlogPosting</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doPost">doPost</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/Blog" target="_blank">schema.org/Blog</a></span></span><br><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-collection">collection</a></span></span></span></span></span> |
| semantic | <a id="BlogPosting"></a>[BlogPosting](#BlogPosting) | <span style="white-space: normal;">Blog Post</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#dateCreated">dateCreated</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#articleBody">articleBody</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goBlog">goBlog</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/BlogPosting" target="_blank">schema.org/BlogPosting</a></span></span><br><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-item">item</a></span></span></span></span></span> |
| semantic | <a id="dateCreated"></a>[dateCreated](#dateCreated) | <span style="white-space: normal;">create date</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/dateCreated" target="_blank">schema.org/dateCreated</a></span></span></span></span> |
| unsafe | <a id="doPost"></a>[doPost](#doPost) | <span style="white-space: normal;">Post the article</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#articleBody">articleBody</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://activitystrea.ms/specs/json/1.0/#post-verb" target="_blank">activitystrea.ms/specs/json...</a></span></span><br><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><br><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Blog">Blog</a></span></span></span></span> |
| safe | <a id="goAbout"></a>[goAbout](#goAbout) | <span style="white-space: normal;">Go to About</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#About">About</a></span></span></span></span> |
| safe | <a id="goBlog"></a>[goBlog](#goBlog) | <span style="white-space: normal;">See the blog post list</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><br><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Blog">Blog</a></span></span></span></span> |
| safe | <a id="goBlogPosting"></a>[goBlogPosting](#goBlogPosting) | <span style="white-space: normal;">See the blog post</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">item</span></span><br><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#BlogPosting">BlogPosting</a></span></span></span></span> |
| safe | <a id="goStart"></a>[goStart](#goStart) | <span style="white-space: normal;">Go to Home</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><br><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Blog">Blog</a></span></span></span></span> |
| semantic | <a id="id"></a>[id](#id) | <span style="white-space: normal;">identifier</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/identifier" target="_blank">schema.org/identifier</a></span></span></span></span> |
| semantic | <a id="Index"></a>[Index](#Index) | <span style="white-space: normal;">Home</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goBlog">goBlog</a> | <span style="white-space: normal;"></span> |

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
    &lt;descriptor id=&quot;id&quot; def=&quot;https://schema.org/identifier&quot; title=&quot;identifier&quot;/&gt;
    &lt;descriptor id=&quot;articleBody&quot; def=&quot;https://schema.org/articleBody&quot; title=&quot;article body&quot;/&gt;
    &lt;descriptor id=&quot;dateCreated&quot; def=&quot;https://schema.org/dateCreated&quot; title=&quot;create date&quot;/&gt;

    &lt;!-- Taxonomy --&gt;
    &lt;descriptor id=&quot;Index&quot; title=&quot;Home&quot;&gt;
        &lt;descriptor href=&quot;#goBlog&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;About&quot; title=&quot;About Us&quot;&gt;
        &lt;descriptor href=&quot;#goBlog&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;Blog&quot; def=&quot;https://schema.org/Blog&quot; title=&quot;Blog Post List&quot; tag=&quot;collection&quot;&gt;
        &lt;descriptor href=&quot;#goAbout&quot;/&gt;
        &lt;descriptor href=&quot;#doPost&quot;/&gt;
        &lt;descriptor href=&quot;#goBlogPosting&quot;/&gt;
        &lt;descriptor href=&quot;#BlogPosting&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;BlogPosting&quot; def=&quot;https://schema.org/BlogPosting&quot; title=&quot;Blog Post&quot; tag=&quot;item&quot;&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#dateCreated&quot;/&gt;
        &lt;descriptor href=&quot;#articleBody&quot;/&gt;
        &lt;descriptor href=&quot;#goBlog&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;!-- Choreography --&gt;
    &lt;descriptor id=&quot;goStart&quot; type=&quot;safe&quot; rt=&quot;#Blog&quot; rel=&quot;collection&quot; title=&quot;Go to Home&quot;/&gt;
    &lt;descriptor id=&quot;goAbout&quot; type=&quot;safe&quot; rt=&quot;#About&quot; title=&quot;Go to About&quot;/&gt;
    &lt;descriptor id=&quot;goBlog&quot; type=&quot;safe&quot; rt=&quot;#Blog&quot; rel=&quot;collection&quot; title=&quot;See the blog post list&quot;/&gt;
    &lt;descriptor id=&quot;goBlogPosting&quot; type=&quot;safe&quot; rel=&quot;item&quot; rt=&quot;#BlogPosting&quot; title=&quot;See the blog post&quot;&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doPost&quot; def=&quot;https://activitystrea.ms/specs/json/1.0/#post-verb&quot; type=&quot;unsafe&quot; rel=&quot;collection&quot; rt=&quot;#Blog&quot; title=&quot;Post the article&quot;&gt;
        &lt;descriptor href=&quot;#articleBody&quot;/&gt;
    &lt;/descriptor&gt;
&lt;/alps&gt;
</code></pre>