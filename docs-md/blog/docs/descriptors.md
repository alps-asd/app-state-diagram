### <a name="About">About</a>
 * type: semantic
 * title: About Us
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | See the blog post list |

### <a name="articleBody">articleBody</a>
 * type: semantic
 * title: article body
 * def: [https://schema.org/articleBody](https://schema.org/articleBody)

### <a name="Blog">Blog</a>
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

### <a name="BlogPosting">BlogPosting</a>
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

### <a name="dateCreated">dateCreated</a>
 * type: semantic
 * title: create date
 * def: [https://schema.org/dateCreated](https://schema.org/dateCreated)

### <a name="doPost">doPost</a>
 * type: unsafe
 * title: Post the article
 * def: [https://activitystrea.ms/specs/json/1.0/#post-verb](https://activitystrea.ms/specs/json/1.0/#post-verb)
 * rel: collection
 * rt: [Blog](#Blog)
 * descriptor

| id | type | title |
|---|---|---|
| [articleBody](#articleBody) | semantic | article body |

### <a name="goAbout">goAbout</a>
 * type: safe
 * title: Go to About
 * rt: [About](#About)

### <a name="goBlog">goBlog</a>
 * type: safe
 * title: See the blog post list
 * rel: collection
 * rt: [Blog](#Blog)

### <a name="goBlogPosting">goBlogPosting</a>
 * type: safe
 * title: See the blog post
 * rel: item
 * rt: [BlogPosting](#BlogPosting)
 * descriptor

| id | type | title |
|---|---|---|
| [id](#id) | semantic | identifier |

### <a name="goStart">goStart</a>
 * type: safe
 * title: Go to Home
 * rel: collection
 * rt: [Blog](#Blog)

### <a name="id">id</a>
 * type: semantic
 * title: identifier
 * def: [https://schema.org/identifier](https://schema.org/identifier)

### <a name="Index">Index</a>
 * type: semantic
 * title: Home
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | See the blog post list |

