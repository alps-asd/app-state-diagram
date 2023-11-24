# ALPS Blog

An ALPS profile example for ASD

<!-- Container for the ASD -->
<div id="graphId" style="text-align: center; "></div>
<div id="graphName" style="text-align: center; display: none;"></div>
<script>
    function renderGraph(graphId, dotString) {
        var graphviz = d3.select(graphId).graphviz();
        graphviz.renderDot(dotString).on('end', function() {
            applySmoothScrollToLinks(document.querySelectorAll('svg a[*|href^="#"]'));
        });
    }

    renderGraph("#graphId", '{{ dotId }}');
    renderGraph("#graphName", '{{ dotName }}');

    document.addEventListener('DOMContentLoaded', function() {
    const graphIdElement = document.getElementById('graphId');
    const graphNameElement = document.getElementById('graphName');

    document.getElementById('show_id').addEventListener('change', function(e) {
        if (e.target.checked) {
            graphIdElement.style.display = 'block';
            graphNameElement.style.display = 'none';
        }
    });

    document.getElementById('show_name').addEventListener('change', function(e) {
        if (e.target.checked) {
            graphNameElement.style.display = 'block';
            graphIdElement.style.display = 'none';
        }
    });
});

function setupTagEventListener(eventName, titles, color) {
    document.addEventListener('tagon-' + eventName, function() {
        titles.forEach(function(title) {
            changeColorByTitle(title, color, color);
        });
    });
    document.addEventListener('tagoff-' + eventName, function() {
        titles.forEach(function(title) {
            changeColorByTitle(title, 'lightgrey', 'black');
        });
    });
}

function setupTagTrigger() {
    var checkboxes = document.querySelectorAll('.tag-trigger-checkbox');

    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                var eventName = 'tagon-' + this.getAttribute('data-tag');
                document.dispatchEvent(new CustomEvent(eventName));
            } else {
                var eventName = 'tagoff-' + this.getAttribute('data-tag');
                document.dispatchEvent(new CustomEvent(eventName));
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
 
 setupTagTrigger();
});

function changeColorByTitle(titleOrClass, newNodeColor, newEdgeColor) {
    // タイトルとクラス名で要素を探す
    var elements = Array.from(document.getElementsByTagName('g'));

    elements.forEach(function(element) {
        var titleElement = element.getElementsByTagName('title')[0];
        var title = titleElement ? titleElement.textContent : '';

        // タイトルが一致するか、クラス名が含まれる場合に色を変更
        if (title === titleOrClass || element.classList.contains(titleOrClass)) {
            var polygons = Array.from(element.getElementsByTagName('polygon'));
            var paths = Array.from(element.getElementsByTagName('path'));

            polygons.forEach(function(polygon) {
                polygon.setAttribute('fill', newNodeColor);
            });

            paths.forEach(function(path) {
                path.setAttribute('stroke', newEdgeColor);
            });
        }
    });
}

</script>
<div id="selector" style="">
    <input type="radio" id="show_id" name="graph_selector" checked>
    <label for="show_id">id<ID/label>
    <input type="radio" id="show_name" name="graph_selector">
    <label for="show_name">name</label>
</div>
<style>
#selector {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}
</style>
---



## Semantic Descriptors

 
### <a id="About">About</a>
 * type: semantic
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | to blog |

### <a id="articleBody">articleBody</a>
 * type: semantic
 * def: [https://schema.org/articleBody](https://schema.org/articleBody)

### <a id="Blog">Blog</a>
 * type: semantic
 * title: Blog post list
 * href: [https://schema.org/Blog](https://schema.org/Blog)
 * rel: collection
 * descriptor

| id | type | title |
|---|---|---|
| [BlogPosting](#BlogPosting) | semantic | Blog post item |
| [goAbout](#goAbout) | safe | to about |
| [goBlogPosting](#goBlogPosting) | safe | to blog posting |
| [doPost](#doPost) | unsafe | post article |

### <a id="BlogPosting">BlogPosting</a>
 * type: semantic
 * title: Blog post item
 * href: [https://schema.org/BlogPosting](https://schema.org/BlogPosting)
 * descriptor

| id | type | title |
|---|---|---|
| [id](#id) | semantic |  |
| [dateCreated](#dateCreated) | semantic |  |
| [articleBody](#articleBody) | semantic |  |
| [goBlog](#goBlog) | safe | to blog |

### <a id="dateCreated">dateCreated</a>
 * type: semantic
 * def: [https://schema.org/dateCreated](https://schema.org/dateCreated)

### <a id="doPost">doPost</a>
 * type: unsafe
 * title: post article
 * def: [https://activitystrea.ms/specs/json/1.0/#post-verb](https://activitystrea.ms/specs/json/1.0/#post-verb)
 * rt: [Blog](#Blog)
 * descriptor

| id | type | title |
|---|---|---|
| [articleBody](#articleBody) | semantic |  |

### <a id="goAbout">goAbout</a>
 * type: safe
 * title: to about
 * rt: [About](#About)

### <a id="goBlog">goBlog</a>
 * type: safe
 * title: to blog
 * rt: [Blog](#Blog)

### <a id="goBlogPosting">goBlogPosting</a>
 * type: safe
 * title: to blog posting
 * rt: [BlogPosting](#BlogPosting)
 * descriptor

| id | type | title |
|---|---|---|
| [id](#id) | semantic |  |

### <a id="goStart">goStart</a>
 * type: safe
 * title: to start
 * rt: [Blog](#Blog)

### <a id="id">id</a>
 * type: semantic
 * def: [https://schema.org/identifier](https://schema.org/identifier)

### <a id="Index">Index</a>
 * type: semantic
 * title: Index Page
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | to blog |



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