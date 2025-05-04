# app-state-diagram

This is a sample ALPS profile demonstrating the semantic descriptors and operations for a basic e-commerce system. It includes product listing, shopping cart management, and checkout process, serving as an educational example for ALPS implementation in online shopping contexts.

<!-- Container for the ASDs -->

[<img src="profile.svg" alt="application state diagram">](profile.title.svg)
<div class="selector-container"><span class="selector-label">Tags:</span>
<span class="selector-option"><input type="checkbox" id="tag-collection" class="tag-trigger-checkbox" data-tag="collection" name="tag-collection"><label for="tag-collection"> collection</label></span>
<span class="selector-option"><input type="checkbox" id="tag-item" class="tag-trigger-checkbox" data-tag="item" name="tag-item"><label for="tag-item"> item</label></span></div>
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
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="address"></a>[address](#address) | <span style="white-space: normal;">address</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/address" target="_blank">schema.org/address</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="Cart"></a>[Cart](#Cart) | <span style="white-space: normal;">Shopping Cart</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goProductList">goProductList</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goCheckout">goCheckout</a><br><span class="type-indicator-small idempotent" title="Idempotent"></span><a href="#doUpdateQuantity">doUpdateQuantity</a><br><span class="type-indicator-small idempotent" title="Idempotent"></span><a href="#doRemoveItem">doRemoveItem</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/Cart" target="_blank">schema.org/Cart</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-collection">collection</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Displays the user&#039;s shopping cart, allowing updates or checkout initiation.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="Checkout"></a>[Checkout](#Checkout) | <span style="white-space: normal;">Checkout</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#email">email</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#address">address</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goPayment">goPayment</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-collection">collection</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Captures user information and prepares for payment after shopping is complete.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="description"></a>[description](#description) | <span style="white-space: normal;">description</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/description" target="_blank">schema.org/description</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon unsafe"></span></span> | <a id="doAddToCart"></a>[doAddToCart](#doAddToCart) | <span style="white-space: normal;">Add product to cart</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#quantity">quantity</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Cart">Cart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Adds selected product and quantity to the shopping cart.</span></span></span></span> |
| <span class="legend"><span class="legend-icon idempotent"></span></span> | <a id="doPayment"></a>[doPayment](#doPayment) | <span style="white-space: normal;">Complete payment</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ProductList">ProductList</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Processes the final payment and returns user to the product list.</span></span></span></span> |
| <span class="legend"><span class="legend-icon idempotent"></span></span> | <a id="doRemoveItem"></a>[doRemoveItem](#doRemoveItem) | <span style="white-space: normal;">Remove item from cart</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Cart">Cart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Removes a specific product from the shopping cart.</span></span></span></span> |
| <span class="legend"><span class="legend-icon idempotent"></span></span> | <a id="doUpdateQuantity"></a>[doUpdateQuantity](#doUpdateQuantity) | <span style="white-space: normal;">Update item quantity</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#quantity">quantity</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Cart">Cart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Updates the quantity of a product already in the cart.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="email"></a>[email](#email) | <span style="white-space: normal;">email</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/email" target="_blank">schema.org/email</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goCart"></a>[goCart](#goCart) | <span style="white-space: normal;">View shopping cart</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Cart">Cart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Displays the current items in the user&#039;s shopping cart.</span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goCheckout"></a>[goCheckout](#goCheckout) | <span style="white-space: normal;">Proceed to checkout</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Checkout">Checkout</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Initiates the checkout process after confirming cart items.</span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goPayment"></a>[goPayment](#goPayment) | <span style="white-space: normal;">Proceed to payment</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Payment">Payment</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Redirects user to the payment screen after entering delivery details.</span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goProductDetail"></a>[goProductDetail](#goProductDetail) | <span style="white-space: normal;">View product details</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ProductDetail">ProductDetail</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Returns detailed view of a selected product.</span></span></span></span> |
| <span class="legend"><span class="legend-icon safe"></span></span> | <a id="goProductList"></a>[goProductList](#goProductList) | <span style="white-space: normal;">View product list</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ProductList">ProductList</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Returns the list of all available products.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="id"></a>[id](#id) | <span style="white-space: normal;">identifier</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/identifier" target="_blank">schema.org/identifier</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="name"></a>[name](#name) | <span style="white-space: normal;">name</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/name" target="_blank">schema.org/name</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="Payment"></a>[Payment](#Payment) | <span style="white-space: normal;">Payment</span> | <span class="type-indicator-small idempotent" title="Idempotent"></span><a href="#doPayment">doPayment</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/PayAction" target="_blank">schema.org/PayAction</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-item">item</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Handles the final payment process for the placed order.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="price"></a>[price](#price) | <span style="white-space: normal;">price</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/price" target="_blank">schema.org/price</a></span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="ProductDetail"></a>[ProductDetail](#ProductDetail) | <span style="white-space: normal;">Product Detail</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#name">name</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#description">description</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#price">price</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goProductList">goProductList</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doAddToCart">doAddToCart</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/Product" target="_blank">schema.org/Product</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-item">item</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag clickable" data-full="Shows detailed information about a single product, such as description and price.Shows detailed information about a single product, such as description and price." title="Shows detailed information about a single product, such as description and price.Shows detailed information about a single product, such as description and price.">Shows detailed information about a single product, such as description and price.Shows detailed information about a single product, such as description and price.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="ProductList"></a>[ProductList](#ProductList) | <span style="white-space: normal;">Product List</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#name">name</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#description">description</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goProductDetail">goProductDetail</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goCart">goCart</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goProductList">goProductList</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/ItemList" target="_blank">schema.org/ItemList</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-collection">collection</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">Displays a list of available products that the user can browse or select from.</span></span></span></span> |
| <span class="legend"><span class="legend-icon semantic"></span></span> | <a id="quantity"></a>[quantity](#quantity) | <span style="white-space: normal;">quantity</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/Quantity" target="_blank">schema.org/Quantity</a></span></span></span></span> |




---

## Profile
<pre><code>&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;
&lt;alps
        xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot;
        xsi:noNamespaceSchemaLocation=&quot;https://alps-io.github.io/schemas/alps.xsd&quot;&gt;
    &lt;title&gt;app-state-diagram&lt;/title&gt;
    &lt;doc&gt;This is a sample ALPS profile demonstrating the semantic descriptors and operations for a basic e-commerce system. It includes product listing, shopping cart management, and checkout process, serving as an educational example for ALPS implementation in online shopping contexts.&lt;/doc&gt;

    &lt;!-- Ontology --&gt;
    &lt;descriptor id=&quot;id&quot; def=&quot;https://schema.org/identifier&quot; title=&quot;identifier&quot;/&gt;
    &lt;descriptor id=&quot;name&quot; def=&quot;https://schema.org/name&quot; title=&quot;name&quot;/&gt;
    &lt;descriptor id=&quot;description&quot; def=&quot;https://schema.org/description&quot; title=&quot;description&quot;/&gt;
    &lt;descriptor id=&quot;price&quot; def=&quot;https://schema.org/price&quot; title=&quot;price&quot;/&gt;
    &lt;descriptor id=&quot;quantity&quot; def=&quot;https://schema.org/Quantity&quot; title=&quot;quantity&quot;/&gt;
    &lt;descriptor id=&quot;email&quot; def=&quot;https://schema.org/email&quot; title=&quot;email&quot;/&gt;
    &lt;descriptor id=&quot;address&quot; def=&quot;https://schema.org/address&quot; title=&quot;address&quot;/&gt;

    &lt;!-- Taxonomy --&gt;
    &lt;descriptor id=&quot;ProductList&quot; def=&quot;https://schema.org/ItemList&quot; title=&quot;Product List&quot; tag=&quot;collection&quot;&gt;
        &lt;doc&gt;Displays a list of available products that the user can browse or select from.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#name&quot;/&gt;
        &lt;descriptor href=&quot;#description&quot;/&gt;
        &lt;descriptor href=&quot;#goProductDetail&quot;/&gt;
        &lt;descriptor href=&quot;#goCart&quot;/&gt;
        &lt;descriptor href=&quot;#goProductList&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;ProductDetail&quot; def=&quot;https://schema.org/Product&quot; title=&quot;Product Detail&quot; tag=&quot;item&quot;&gt;
        &lt;doc&gt;Shows detailed information about a single product, such as description and price.Shows detailed information about a single product, such as description and price.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#name&quot;/&gt;
        &lt;descriptor href=&quot;#description&quot;/&gt;
        &lt;descriptor href=&quot;#price&quot;/&gt;
        &lt;descriptor href=&quot;#goProductList&quot;/&gt;
        &lt;descriptor href=&quot;#doAddToCart&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Cart&quot; def=&quot;https://schema.org/Cart&quot; title=&quot;Shopping Cart&quot; tag=&quot;collection&quot;&gt;
        &lt;doc&gt;Displays the user&#039;s shopping cart, allowing updates or checkout initiation.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#goProductList&quot;/&gt;
        &lt;descriptor href=&quot;#goCheckout&quot;/&gt;
        &lt;descriptor href=&quot;#doUpdateQuantity&quot;/&gt;
        &lt;descriptor href=&quot;#doRemoveItem&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Checkout&quot; title=&quot;Checkout&quot; tag=&quot;collection&quot;&gt;
        &lt;doc&gt;Captures user information and prepares for payment after shopping is complete.&lt;/doc&gt;
        &lt;descriptor href=&quot;#email&quot;/&gt;
        &lt;descriptor href=&quot;#address&quot;/&gt;
        &lt;descriptor href=&quot;#goPayment&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Payment&quot; def=&quot;https://schema.org/PayAction&quot; title=&quot;Payment&quot; tag=&quot;item&quot;&gt;
        &lt;doc&gt;Handles the final payment process for the placed order.&lt;/doc&gt;
        &lt;descriptor href=&quot;#doPayment&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;!-- Choreography --&gt;
    &lt;descriptor id=&quot;goProductList&quot; type=&quot;safe&quot; rt=&quot;#ProductList&quot; title=&quot;View product list&quot;&gt;
        &lt;doc&gt;Returns the list of all available products.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;goProductDetail&quot; type=&quot;safe&quot; rt=&quot;#ProductDetail&quot; title=&quot;View product details&quot;&gt;
        &lt;doc&gt;Returns detailed view of a selected product.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;goCart&quot; type=&quot;safe&quot; rt=&quot;#Cart&quot; title=&quot;View shopping cart&quot;&gt;
        &lt;doc&gt;Displays the current items in the user&#039;s shopping cart.&lt;/doc&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;goCheckout&quot; type=&quot;safe&quot; rt=&quot;#Checkout&quot; title=&quot;Proceed to checkout&quot;&gt;
        &lt;doc&gt;Initiates the checkout process after confirming cart items.&lt;/doc&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;goPayment&quot; type=&quot;safe&quot; rt=&quot;#Payment&quot; title=&quot;Proceed to payment&quot;&gt;
        &lt;doc&gt;Redirects user to the payment screen after entering delivery details.&lt;/doc&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;doAddToCart&quot; type=&quot;unsafe&quot; rt=&quot;#Cart&quot; title=&quot;Add product to cart&quot;&gt;
        &lt;doc&gt;Adds selected product and quantity to the shopping cart.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#quantity&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;doUpdateQuantity&quot; type=&quot;idempotent&quot; rt=&quot;#Cart&quot; title=&quot;Update item quantity&quot;&gt;
        &lt;doc&gt;Updates the quantity of a product already in the cart.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#quantity&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;doRemoveItem&quot; type=&quot;idempotent&quot; rt=&quot;#Cart&quot; title=&quot;Remove item from cart&quot;&gt;
        &lt;doc&gt;Removes a specific product from the shopping cart.&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;doPayment&quot; type=&quot;idempotent&quot; rt=&quot;#ProductList&quot; title=&quot;Complete payment&quot;&gt;
        &lt;doc&gt;Processes the final payment and returns user to the product list.&lt;/doc&gt;
    &lt;/descriptor&gt;
&lt;/alps&gt;
</code></pre>