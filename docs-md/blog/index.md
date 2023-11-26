# ALPS Blog

An ALPS profile example for ASD

<!-- Container for the ASDs -->
<img src="profile.svg">
---


## Tags
* <input type="checkbox" id="tag-collection" class="tag-trigger-checkbox" data-tag="collection" name="tag-collection"><label for="tag-collection"> collection</label>
* <input type="checkbox" id="tag-item" class="tag-trigger-checkbox" data-tag="item" name="tag-item"><label for="tag-item"> item</label>

## Semantic Descriptors

 
### <a id="About">About</a>
 * type: semantic
 * title: About Us
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | See the blog post list |

### <a id="articleBody">articleBody</a>
 * type: semantic
 * title: article body
 * def: [https://schema.org/articleBody](https://schema.org/articleBody)

### <a id="Blog">Blog</a>
 * type: semantic
 * title: Blog Post List
 * def: [https://schema.org/Blog](https://schema.org/Blog)
 * tag: [collection](#tag-collection)
 * descriptor

| id | type | title |
|---|---|---|
| [BlogPosting](#BlogPosting) | semantic | Blog Post |
| [goAbout](#goAbout) | safe | Go to About |
| [goBlogPosting](#goBlogPosting) | safe | See the blog post |
| [doPost](#doPost) | unsafe | Post the article |

### <a id="BlogPosting">BlogPosting</a>
 * type: semantic
 * title: Blog Post
 * def: [https://schema.org/BlogPosting](https://schema.org/BlogPosting)
 * tag: [item](#tag-item)
 * descriptor

| id | type | title |
|---|---|---|
| [id](#id) | semantic | identifier |
| [dateCreated](#dateCreated) | semantic | create date |
| [articleBody](#articleBody) | semantic | article body |
| [goBlog](#goBlog) | safe | See the blog post list |

### <a id="dateCreated">dateCreated</a>
 * type: semantic
 * title: create date
 * def: [https://schema.org/dateCreated](https://schema.org/dateCreated)

### <a id="doPost">doPost</a>
 * type: unsafe
 * title: Post the article
 * def: [https://activitystrea.ms/specs/json/1.0/#post-verb](https://activitystrea.ms/specs/json/1.0/#post-verb)
 * rel: collection
 * rt: [Blog](#Blog)
 * descriptor

| id | type | title |
|---|---|---|
| [articleBody](#articleBody) | semantic | article body |

### <a id="goAbout">goAbout</a>
 * type: safe
 * title: Go to About
 * rt: [About](#About)

### <a id="goBlog">goBlog</a>
 * type: safe
 * title: See the blog post list
 * rel: collection
 * rt: [Blog](#Blog)

### <a id="goBlogPosting">goBlogPosting</a>
 * type: safe
 * title: See the blog post
 * rel: item
 * rt: [BlogPosting](#BlogPosting)
 * descriptor

| id | type | title |
|---|---|---|
| [id](#id) | semantic | identifier |

### <a id="goStart">goStart</a>
 * type: safe
 * title: Go to Home
 * rel: collection
 * rt: [Blog](#Blog)

### <a id="id">id</a>
 * type: semantic
 * title: identifier
 * def: [https://schema.org/identifier](https://schema.org/identifier)

### <a id="Index">Index</a>
 * type: semantic
 * title: Home
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | See the blog post list |



---

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