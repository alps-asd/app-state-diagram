### <a name="About">About</a>
 * type: semantic
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | to blog |

### <a name="articleBody">articleBody</a>
 * type: semantic
 * def: [https://schema.org/articleBody](https://schema.org/articleBody)

### <a name="Blog">Blog</a>
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

### <a name="BlogPosting">BlogPosting</a>
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

### <a name="dateCreated">dateCreated</a>
 * type: semantic
 * def: [https://schema.org/dateCreated](https://schema.org/dateCreated)

### <a name="doPost">doPost</a>
 * type: unsafe
 * title: post article
 * def: [https://activitystrea.ms/specs/json/1.0/#post-verb](https://activitystrea.ms/specs/json/1.0/#post-verb)
 * rt: [Blog](#Blog)
 * descriptor

| id | type | title |
|---|---|---|
| [articleBody](#articleBody) | semantic |  |

### <a name="goAbout">goAbout</a>
 * type: safe
 * title: to about
 * rt: [About](#About)

### <a name="goBlog">goBlog</a>
 * type: safe
 * title: to blog
 * rt: [Blog](#Blog)

### <a name="goBlogPosting">goBlogPosting</a>
 * type: safe
 * title: to blog posting
 * rt: [BlogPosting](#BlogPosting)
 * descriptor

| id | type | title |
|---|---|---|
| [id](#id) | semantic |  |

### <a name="goStart">goStart</a>
 * type: safe
 * title: to start
 * rt: [Blog](#Blog)

### <a name="id">id</a>
 * type: semantic
 * def: [https://schema.org/identifier](https://schema.org/identifier)

### <a name="Index">Index</a>
 * type: semantic
 * title: Index Page
 * descriptor

| id | type | title |
|---|---|---|
| [goBlog](#goBlog) | safe | to blog |

