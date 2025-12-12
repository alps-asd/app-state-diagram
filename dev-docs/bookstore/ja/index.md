# ALPS Book Store

オンライン書店の書籍カタログを管理し、ユーザーの購買フローを定義するためのALPSプロファイル。このプロファイルはRESTfulなAPIとUIの両方のためのセマンティクス定義を提供します。

<!-- Container for the ASDs -->

[<img src="alps.svg" alt="application state diagram">](alps.title.svg)




## Semantic Descriptors

| Type | ID | Title | Contained | Extra Info |
| :--: | :-- | :---- | :-- | :-- |
| semantic | <a id="author"></a>[author](#author) | <span style="white-space: normal;">著者</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/author" target="_blank">schema.org/author</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍の著者名。複数の著者がいる場合はカンマ区切りで記載。</span></span></span></span> |
| semantic | <a id="Book"></a>[Book](#Book) | <span style="white-space: normal;">書籍</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#title">title</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#author">author</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#isbn">isbn</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#price">price</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#category">category</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToCatalog">goToCatalog</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doAddToCart">doAddToCart</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/Book" target="_blank">schema.org/Book</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">個別の書籍情報を表示する画面。詳細情報、レビュー、関連書籍などを表示。この画面からカートに追加可能。</span></span></span></span> |
| semantic | <a id="Catalog"></a>[Catalog](#Catalog) | <span style="white-space: normal;">書籍カタログ</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#Book">Book</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goListBooks">goListBooks</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goSearchBooks">goSearchBooks</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goGetCategories">goGetCategories</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToBookDetails">goToBookDetails</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToCart">goToCart</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/CollectionPage" target="_blank">schema.org/CollectionPage</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">全書籍の一覧表示画面。カテゴリー別フィルタリングやキーワード検索、ソート機能を提供。デフォルトでは新着順に表示。</span></span></span></span> |
| semantic | <a id="Category"></a>[Category](#Category) | <span style="white-space: normal;">カテゴリー</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#title">title</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/Category" target="_blank">schema.org/Category</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍のジャンル分類。階層構造を持ち、親カテゴリーと子カテゴリーが存在する場合がある。</span></span></span></span> |
| semantic | <a id="category"></a>[category](#category) | <span style="white-space: normal;">カテゴリー</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/category" target="_blank">schema.org/category</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍のジャンルまたはカテゴリー。複数のカテゴリーに属する場合あり。</span></span></span></span> |
| semantic | <a id="Checkout"></a>[Checkout](#Checkout) | <span style="white-space: normal;">決済画面</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goToCart">goToCart</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doUserInfo">doUserInfo</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doShippingInfo">doShippingInfo</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doPaymentInfo">doPaymentInfo</a><br><span class="type-indicator-small unsafe" title="Unsafe"></span><a href="#doPlaceOrder">doPlaceOrder</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-checkout">checkout</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">購入手続き画面。ユーザー情報、配送先、支払い方法を入力する。注文確定前に最終確認を表示。</span></span></span></span> |
| unsafe | <a id="doAddToCart"></a>[doAddToCart](#doAddToCart) | <span style="white-space: normal;">カートに追加</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#quantity">quantity</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-cart">cart</a></span></span></span><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ShoppingCart">ShoppingCart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">指定された書籍をショッピングカートに追加する。既にカートに存在する場合は数量が加算される。在庫数を超える注文はエラーとなる。</span></span></span></span> |
| unsafe | <a id="doPaymentInfo"></a>[doPaymentInfo](#doPaymentInfo) | <span style="white-space: normal;">支払い情報の入力</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#paymentMethod">paymentMethod</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-payment">payment</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Checkout">Checkout</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文の支払い方法を選択し、必要な支払い情報を入力する。クレジットカード選択時はカード情報の入力と検証を行う。</span></span></span></span> |
| unsafe | <a id="doPlaceOrder"></a>[doPlaceOrder](#doPlaceOrder) | <span style="white-space: normal;">注文の確定</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-order">order</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#OrderConfirmation">OrderConfirmation</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">ユーザーの入力情報を基に注文を確定し、注文確認画面に遷移する。支払い処理が実行され、在庫が確保される。この操作は取り消せない。</span></span></span></span> |
| idempotent | <a id="doRemoveFromCart"></a>[doRemoveFromCart](#doRemoveFromCart) | <span style="white-space: normal;">カートからアイテムを削除</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-cart">cart</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ShoppingCart">ShoppingCart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">指定されたアイテムをカートから完全に削除する。該当アイテムがカートに存在しない場合は何も変更されない。</span></span></span></span> |
| unsafe | <a id="doShippingInfo"></a>[doShippingInfo](#doShippingInfo) | <span style="white-space: normal;">配送情報の入力</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#shippingAddress">shippingAddress</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-shipping">shipping</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Checkout">Checkout</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">商品の配送先住所を入力する。郵便番号検索による住所自動入力機能あり。</span></span></span></span> |
| idempotent | <a id="doUpdateQuantity"></a>[doUpdateQuantity](#doUpdateQuantity) | <span style="white-space: normal;">カート内アイテムの数量更新</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#quantity">quantity</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-cart">cart</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ShoppingCart">ShoppingCart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">カート内の特定商品の数量を更新する。0以下の数値は指定できない。在庫数を超える数量はエラーとなる。</span></span></span></span> |
| unsafe | <a id="doUserInfo"></a>[doUserInfo](#doUserInfo) | <span style="white-space: normal;">ユーザー情報の入力</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#userName">userName</a><br><span class="type-indicator-small semantic" title="Semantic"></span><a href="#userEmail">userEmail</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-customer">customer</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Checkout">Checkout</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文者の氏名とメールアドレスを入力する。メールアドレスは正規表現による検証が行われる。</span></span></span></span> |
| safe | <a id="goGetBookDetails"></a>[goGetBookDetails](#goGetBookDetails) | <span style="white-space: normal;">書籍詳細の取得</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">item</span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Book">Book</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">指定された書籍IDに基づいて、特定の書籍の詳細情報を取得する。在庫状況や関連書籍の情報も含まれる。</span></span></span></span> |
| safe | <a id="goGetCategories"></a>[goGetCategories](#goGetCategories) | <span style="white-space: normal;">カテゴリー一覧の取得</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Catalog">Catalog</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">利用可能なすべての書籍カテゴリーの一覧を取得する。階層構造を持つカテゴリーの場合は親子関係も返される。</span></span></span></span> |
| safe | <a id="goListBooks"></a>[goListBooks](#goListBooks) | <span style="white-space: normal;">書籍一覧の取得</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Catalog">Catalog</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">カタログ内のすべての書籍一覧を取得する。ページネーション（デフォルト20件/ページ）やソート順（新着順、価格順、人気順等）の指定が可能。</span></span></span></span> |
| safe | <a id="goListCartItems"></a>[goListCartItems](#goListCartItems) | <span style="white-space: normal;">カート内アイテム一覧の取得</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-cart">cart</a></span></span></span><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ShoppingCart">ShoppingCart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">現在のショッピングカート内のすべての商品と、その数量、小計、合計金額を取得する。</span></span></span></span> |
| safe | <a id="goOrderDetails"></a>[goOrderDetails](#goOrderDetails) | <span style="white-space: normal;">注文詳細の表示</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-order">order</a></span></span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#OrderConfirmation">OrderConfirmation</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">確定した注文の詳細情報を表示する。注文番号、購入商品一覧、合計金額、配送先、支払い方法などが含まれる。</span></span></span></span> |
| safe | <a id="goSearchBooks"></a>[goSearchBooks](#goSearchBooks) | <span style="white-space: normal;">書籍の検索</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#query">query</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">rel:</span><span class="meta-tag rel-tag">collection</span></span><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Catalog">Catalog</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">指定された検索クエリに基づいて書籍を検索する。タイトル、著者名、内容説明、ISBNなどの複数フィールドから検索可能。</span></span></span></span> |
| safe | <a id="goToBookDetails"></a>[goToBookDetails](#goToBookDetails) | <span style="white-space: normal;">書籍詳細画面に移動</span> | <span class="type-indicator-small semantic" title="Semantic"></span><a href="#id">id</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Book">Book</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">選択した書籍の詳細情報画面に遷移する。書籍IDを指定する必要がある。</span></span></span></span> |
| safe | <a id="goToCart"></a>[goToCart](#goToCart) | <span style="white-space: normal;">カート画面に移動</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#ShoppingCart">ShoppingCart</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">現在のショッピングカートの内容を表示する画面に遷移する。</span></span></span></span> |
| safe | <a id="goToCatalog"></a>[goToCatalog](#goToCatalog) | <span style="white-space: normal;">カタログ画面に移動</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Catalog">Catalog</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍カタログ一覧画面に遷移する。全書籍が表示される。</span></span></span></span> |
| safe | <a id="goToCheckout"></a>[goToCheckout](#goToCheckout) | <span style="white-space: normal;">決済画面に移動</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Checkout">Checkout</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">カートの内容を確認し、購入手続きを行う画面に遷移する。カートが空の場合は遷移できない。</span></span></span></span> |
| safe | <a id="goToHome"></a>[goToHome](#goToHome) | <span style="white-space: normal;">ホーム画面に移動</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">rt:</span><span class="meta-tag rt-tag"><a href="#Home">Home</a></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">アプリケーションのホーム画面に遷移する。どの画面からでもアクセス可能。</span></span></span></span> |
| semantic | <a id="Home"></a>[Home](#Home) | <span style="white-space: normal;">ホーム画面</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goToCatalog">goToCatalog</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToCart">goToCart</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-navigation">navigation</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">アプリケーションの開始点となるホーム画面。サイト全体のナビゲーションとプロモーション情報を表示。</span></span></span></span> |
| semantic | <a id="id"></a>[id](#id) | <span style="white-space: normal;">識別子</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/identifier" target="_blank">schema.org/identifier</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-core">core</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">各リソースの一意の識別子。UUIDまたは自動採番された整数値。</span></span></span></span> |
| semantic | <a id="isbn"></a>[isbn](#isbn) | <span style="white-space: normal;">ISBN</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/isbn" target="_blank">schema.org/isbn</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍の国際標準図書番号。ISBN-13形式（ハイフン付き）で記載。</span></span></span></span> |
| semantic | <a id="OrderConfirmation"></a>[OrderConfirmation](#OrderConfirmation) | <span style="white-space: normal;">注文確認画面</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goOrderDetails">goOrderDetails</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToHome">goToHome</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-order">order</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文完了後の確認画面。注文番号、合計金額、配送予定日等の情報を表示。確認メールが自動送信される。</span></span></span></span> |
| semantic | <a id="paymentMethod"></a>[paymentMethod](#paymentMethod) | <span style="white-space: normal;">支払い方法</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/paymentMethod" target="_blank">schema.org/paymentMethod</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-payment">payment</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文の支払い方法。クレジットカード、代金引換、銀行振込等から選択。</span></span></span></span> |
| semantic | <a id="price"></a>[price](#price) | <span style="white-space: normal;">価格</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/price" target="_blank">schema.org/price</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-commerce">commerce</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍の販売価格。税抜き価格で、通貨単位は円（JPY）。</span></span></span></span> |
| semantic | <a id="quantity"></a>[quantity](#quantity) | <span style="white-space: normal;">数量</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/quantityValue" target="_blank">schema.org/quantityValue</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-commerce">commerce</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">カート内の書籍の数量。1以上の整数値。</span></span></span></span> |
| semantic | <a id="query"></a>[query](#query) | <span style="white-space: normal;">検索クエリ</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍検索に使用するキーワードや条件。タイトル、著者名、ISBNなどで検索可能。</span></span></span></span> |
| semantic | <a id="shippingAddress"></a>[shippingAddress](#shippingAddress) | <span style="white-space: normal;">配送先住所</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/address" target="_blank">schema.org/address</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-shipping">shipping</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">商品の配送先住所。郵便番号、都道府県、市区町村、番地、建物名等を含む。</span></span></span></span> |
| semantic | <a id="ShoppingCart"></a>[ShoppingCart](#ShoppingCart) | <span style="white-space: normal;">ショッピングカート</span> | <span class="type-indicator-small safe" title="Safe"></span><a href="#goListCartItems">goListCartItems</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToCheckout">goToCheckout</a><br><span class="type-indicator-small safe" title="Safe"></span><a href="#goToCatalog">goToCatalog</a><br><span class="type-indicator-small idempotent" title="Idempotent"></span><a href="#doUpdateQuantity">doUpdateQuantity</a><br><span class="type-indicator-small idempotent" title="Idempotent"></span><a href="#doRemoveFromCart">doRemoveFromCart</a> | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/ShoppingCart" target="_blank">schema.org/ShoppingCart</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-cart">cart</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">ユーザーが購入予定の書籍が入るカート。数量変更、削除、合計金額の確認ができる。セッションベースで管理。</span></span></span></span> |
| semantic | <a id="title"></a>[title](#title) | <span style="white-space: normal;">タイトル</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/name" target="_blank">schema.org/name</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-catalog">catalog</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">書籍のタイトルまたはカテゴリー名。200文字以内の文字列。</span></span></span></span> |
| semantic | <a id="totalAmount"></a>[totalAmount](#totalAmount) | <span style="white-space: normal;">合計金額</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/totalPrice" target="_blank">schema.org/totalPrice</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-commerce">commerce</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文またはカート内の全商品の合計金額。税込み表示。</span></span></span></span> |
| semantic | <a id="userEmail"></a>[userEmail](#userEmail) | <span style="white-space: normal;">メールアドレス</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/email" target="_blank">schema.org/email</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-customer">customer</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文者の連絡先メールアドレス。注文確認メールの送信先となる。</span></span></span></span> |
| semantic | <a id="userName"></a>[userName](#userName) | <span style="white-space: normal;">ユーザー名</span> |  | <span style="white-space: normal;"><span class="meta-container"><span class="meta-item"><span class="meta-label">def:</span><span class="meta-tag def-tag"><a href="https://schema.org/name" target="_blank">schema.org/name</a></span></span><span class="meta-item"><span class="meta-label">tag:</span><span class="meta-values"><span class="meta-tag tag-tag"><a href="#tag-customer">customer</a></span></span></span><span class="meta-item"><span class="meta-label">doc:</span><span class="meta-tag doc-tag">注文者の氏名。姓名をスペースで区切って記載。</span></span></span></span> |

## Links
* <a rel="issue" href="https://github.com/example/online-bookstore-api/issues">issue</a>


---

## Profile
<pre><code>&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;
&lt;alps
        xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot;
        xsi:noNamespaceSchemaLocation=&quot;https://alps-io.github.io/schemas/alps.xsd&quot;&gt;
    &lt;title&gt;ALPS Book Store&lt;/title&gt;
    &lt;doc&gt;オンライン書店の書籍カタログを管理し、ユーザーの購買フローを定義するためのALPSプロファイル。このプロファイルはRESTfulなAPIとUIの両方のためのセマンティクス定義を提供します。&lt;/doc&gt;
    &lt;link href=&quot;https://github.com/example/online-bookstore-api/issues&quot; rel=&quot;issue&quot;/&gt;

    &lt;!-- オントロジー --&gt;
    &lt;descriptor id=&quot;id&quot; def=&quot;https://schema.org/identifier&quot; title=&quot;識別子&quot; tag=&quot;core&quot;&gt;
        &lt;doc&gt;各リソースの一意の識別子。UUIDまたは自動採番された整数値。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;title&quot; def=&quot;https://schema.org/name&quot; title=&quot;タイトル&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;書籍のタイトルまたはカテゴリー名。200文字以内の文字列。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;author&quot; def=&quot;https://schema.org/author&quot; title=&quot;著者&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;書籍の著者名。複数の著者がいる場合はカンマ区切りで記載。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;isbn&quot; def=&quot;https://schema.org/isbn&quot; title=&quot;ISBN&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;書籍の国際標準図書番号。ISBN-13形式（ハイフン付き）で記載。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;price&quot; def=&quot;https://schema.org/price&quot; title=&quot;価格&quot; tag=&quot;commerce&quot;&gt;
        &lt;doc&gt;書籍の販売価格。税抜き価格で、通貨単位は円（JPY）。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;category&quot; def=&quot;https://schema.org/category&quot; title=&quot;カテゴリー&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;書籍のジャンルまたはカテゴリー。複数のカテゴリーに属する場合あり。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;quantity&quot; def=&quot;https://schema.org/quantityValue&quot; title=&quot;数量&quot; tag=&quot;commerce&quot;&gt;
        &lt;doc&gt;カート内の書籍の数量。1以上の整数値。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;totalAmount&quot; def=&quot;https://schema.org/totalPrice&quot; title=&quot;合計金額&quot; tag=&quot;commerce&quot;&gt;
        &lt;doc&gt;注文またはカート内の全商品の合計金額。税込み表示。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;userName&quot; def=&quot;https://schema.org/name&quot; title=&quot;ユーザー名&quot; tag=&quot;customer&quot;&gt;
        &lt;doc&gt;注文者の氏名。姓名をスペースで区切って記載。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;userEmail&quot; def=&quot;https://schema.org/email&quot; title=&quot;メールアドレス&quot; tag=&quot;customer&quot;&gt;
        &lt;doc&gt;注文者の連絡先メールアドレス。注文確認メールの送信先となる。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;shippingAddress&quot; def=&quot;https://schema.org/address&quot; title=&quot;配送先住所&quot; tag=&quot;shipping&quot;&gt;
        &lt;doc&gt;商品の配送先住所。郵便番号、都道府県、市区町村、番地、建物名等を含む。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;paymentMethod&quot; def=&quot;https://schema.org/paymentMethod&quot; title=&quot;支払い方法&quot; tag=&quot;payment&quot;&gt;
        &lt;doc&gt;注文の支払い方法。クレジットカード、代金引換、銀行振込等から選択。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;query&quot; title=&quot;検索クエリ&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;書籍検索に使用するキーワードや条件。タイトル、著者名、ISBNなどで検索可能。&lt;/doc&gt;
    &lt;/descriptor&gt;

    &lt;!-- タクソノミー --&gt;
    &lt;descriptor id=&quot;Home&quot; title=&quot;ホーム画面&quot; tag=&quot;navigation&quot;&gt;
        &lt;doc&gt;アプリケーションの開始点となるホーム画面。サイト全体のナビゲーションとプロモーション情報を表示。&lt;/doc&gt;
        &lt;descriptor href=&quot;#goToCatalog&quot;/&gt;
        &lt;descriptor href=&quot;#goToCart&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Catalog&quot; def=&quot;https://schema.org/CollectionPage&quot; title=&quot;書籍カタログ&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;全書籍の一覧表示画面。カテゴリー別フィルタリングやキーワード検索、ソート機能を提供。デフォルトでは新着順に表示。&lt;/doc&gt;
        &lt;descriptor href=&quot;#goListBooks&quot;/&gt;
        &lt;descriptor href=&quot;#goSearchBooks&quot;/&gt;
        &lt;descriptor href=&quot;#goGetCategories&quot;/&gt;
        &lt;descriptor href=&quot;#goToBookDetails&quot;/&gt;
        &lt;descriptor href=&quot;#goToCart&quot;/&gt;
        &lt;descriptor href=&quot;#Book&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Book&quot; def=&quot;https://schema.org/Book&quot; title=&quot;書籍&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;個別の書籍情報を表示する画面。詳細情報、レビュー、関連書籍などを表示。この画面からカートに追加可能。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#title&quot;/&gt;
        &lt;descriptor href=&quot;#author&quot;/&gt;
        &lt;descriptor href=&quot;#isbn&quot;/&gt;
        &lt;descriptor href=&quot;#price&quot;/&gt;
        &lt;descriptor href=&quot;#category&quot;/&gt;
        &lt;descriptor href=&quot;#doAddToCart&quot;/&gt;
        &lt;descriptor href=&quot;#goToCatalog&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Category&quot; def=&quot;https://schema.org/Category&quot; title=&quot;カテゴリー&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;書籍のジャンル分類。階層構造を持ち、親カテゴリーと子カテゴリーが存在する場合がある。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#title&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;ShoppingCart&quot; def=&quot;https://schema.org/ShoppingCart&quot; title=&quot;ショッピングカート&quot; tag=&quot;cart&quot;&gt;
        &lt;doc&gt;ユーザーが購入予定の書籍が入るカート。数量変更、削除、合計金額の確認ができる。セッションベースで管理。&lt;/doc&gt;
        &lt;descriptor href=&quot;#goListCartItems&quot;/&gt;
        &lt;descriptor href=&quot;#doUpdateQuantity&quot;/&gt;
        &lt;descriptor href=&quot;#doRemoveFromCart&quot;/&gt;
        &lt;descriptor href=&quot;#goToCheckout&quot;/&gt;
        &lt;descriptor href=&quot;#goToCatalog&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;Checkout&quot; title=&quot;決済画面&quot; tag=&quot;checkout&quot;&gt;
        &lt;doc&gt;購入手続き画面。ユーザー情報、配送先、支払い方法を入力する。注文確定前に最終確認を表示。&lt;/doc&gt;
        &lt;descriptor href=&quot;#doUserInfo&quot;/&gt;
        &lt;descriptor href=&quot;#doShippingInfo&quot;/&gt;
        &lt;descriptor href=&quot;#doPaymentInfo&quot;/&gt;
        &lt;descriptor href=&quot;#doPlaceOrder&quot;/&gt;
        &lt;descriptor href=&quot;#goToCart&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;OrderConfirmation&quot; title=&quot;注文確認画面&quot; tag=&quot;order&quot;&gt;
        &lt;doc&gt;注文完了後の確認画面。注文番号、合計金額、配送予定日等の情報を表示。確認メールが自動送信される。&lt;/doc&gt;
        &lt;descriptor href=&quot;#goOrderDetails&quot;/&gt;
        &lt;descriptor href=&quot;#goToHome&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;!-- コレオグラフィー --&gt;
    &lt;descriptor id=&quot;goToHome&quot; type=&quot;safe&quot; rt=&quot;#Home&quot; title=&quot;ホーム画面に移動&quot;&gt;
        &lt;doc&gt;アプリケーションのホーム画面に遷移する。どの画面からでもアクセス可能。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goToCatalog&quot; type=&quot;safe&quot; rt=&quot;#Catalog&quot; title=&quot;カタログ画面に移動&quot;&gt;
        &lt;doc&gt;書籍カタログ一覧画面に遷移する。全書籍が表示される。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goToBookDetails&quot; type=&quot;safe&quot; rt=&quot;#Book&quot; title=&quot;書籍詳細画面に移動&quot;&gt;
        &lt;doc&gt;選択した書籍の詳細情報画面に遷移する。書籍IDを指定する必要がある。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goToCart&quot; type=&quot;safe&quot; rt=&quot;#ShoppingCart&quot; title=&quot;カート画面に移動&quot;&gt;
        &lt;doc&gt;現在のショッピングカートの内容を表示する画面に遷移する。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goToCheckout&quot; type=&quot;safe&quot; rt=&quot;#Checkout&quot; title=&quot;決済画面に移動&quot;&gt;
        &lt;doc&gt;カートの内容を確認し、購入手続きを行う画面に遷移する。カートが空の場合は遷移できない。&lt;/doc&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;goListBooks&quot; type=&quot;safe&quot; rt=&quot;#Catalog&quot; rel=&quot;collection&quot; title=&quot;書籍一覧の取得&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;カタログ内のすべての書籍一覧を取得する。ページネーション（デフォルト20件/ページ）やソート順（新着順、価格順、人気順等）の指定が可能。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goSearchBooks&quot; type=&quot;safe&quot; rt=&quot;#Catalog&quot; rel=&quot;collection&quot; title=&quot;書籍の検索&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;指定された検索クエリに基づいて書籍を検索する。タイトル、著者名、内容説明、ISBNなどの複数フィールドから検索可能。&lt;/doc&gt;
        &lt;descriptor href=&quot;#query&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goGetCategories&quot; type=&quot;safe&quot; rt=&quot;#Catalog&quot; rel=&quot;collection&quot; title=&quot;カテゴリー一覧の取得&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;利用可能なすべての書籍カテゴリーの一覧を取得する。階層構造を持つカテゴリーの場合は親子関係も返される。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goGetBookDetails&quot; type=&quot;safe&quot; rt=&quot;#Book&quot; rel=&quot;item&quot; title=&quot;書籍詳細の取得&quot; tag=&quot;catalog&quot;&gt;
        &lt;doc&gt;指定された書籍IDに基づいて、特定の書籍の詳細情報を取得する。在庫状況や関連書籍の情報も含まれる。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;doAddToCart&quot; type=&quot;unsafe&quot; rt=&quot;#ShoppingCart&quot; rel=&quot;collection&quot; title=&quot;カートに追加&quot; tag=&quot;cart&quot;&gt;
        &lt;doc&gt;指定された書籍をショッピングカートに追加する。既にカートに存在する場合は数量が加算される。在庫数を超える注文はエラーとなる。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#quantity&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;goListCartItems&quot; type=&quot;safe&quot; rt=&quot;#ShoppingCart&quot; rel=&quot;collection&quot; title=&quot;カート内アイテム一覧の取得&quot; tag=&quot;cart&quot;&gt;
        &lt;doc&gt;現在のショッピングカート内のすべての商品と、その数量、小計、合計金額を取得する。&lt;/doc&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doUpdateQuantity&quot; type=&quot;idempotent&quot; rt=&quot;#ShoppingCart&quot; title=&quot;カート内アイテムの数量更新&quot; tag=&quot;cart&quot;&gt;
        &lt;doc&gt;カート内の特定商品の数量を更新する。0以下の数値は指定できない。在庫数を超える数量はエラーとなる。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
        &lt;descriptor href=&quot;#quantity&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doRemoveFromCart&quot; type=&quot;idempotent&quot; rt=&quot;#ShoppingCart&quot; title=&quot;カートからアイテムを削除&quot; tag=&quot;cart&quot;&gt;
        &lt;doc&gt;指定されたアイテムをカートから完全に削除する。該当アイテムがカートに存在しない場合は何も変更されない。&lt;/doc&gt;
        &lt;descriptor href=&quot;#id&quot;/&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;doUserInfo&quot; type=&quot;unsafe&quot; rt=&quot;#Checkout&quot; title=&quot;ユーザー情報の入力&quot; tag=&quot;customer&quot;&gt;
        &lt;doc&gt;注文者の氏名とメールアドレスを入力する。メールアドレスは正規表現による検証が行われる。&lt;/doc&gt;
        &lt;descriptor href=&quot;#userName&quot;/&gt;
        &lt;descriptor href=&quot;#userEmail&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doShippingInfo&quot; type=&quot;unsafe&quot; rt=&quot;#Checkout&quot; title=&quot;配送情報の入力&quot; tag=&quot;shipping&quot;&gt;
        &lt;doc&gt;商品の配送先住所を入力する。郵便番号検索による住所自動入力機能あり。&lt;/doc&gt;
        &lt;descriptor href=&quot;#shippingAddress&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doPaymentInfo&quot; type=&quot;unsafe&quot; rt=&quot;#Checkout&quot; title=&quot;支払い情報の入力&quot; tag=&quot;payment&quot;&gt;
        &lt;doc&gt;注文の支払い方法を選択し、必要な支払い情報を入力する。クレジットカード選択時はカード情報の入力と検証を行う。&lt;/doc&gt;
        &lt;descriptor href=&quot;#paymentMethod&quot;/&gt;
    &lt;/descriptor&gt;
    &lt;descriptor id=&quot;doPlaceOrder&quot; type=&quot;unsafe&quot; rt=&quot;#OrderConfirmation&quot; title=&quot;注文の確定&quot; tag=&quot;order&quot;&gt;
        &lt;doc&gt;ユーザーの入力情報を基に注文を確定し、注文確認画面に遷移する。支払い処理が実行され、在庫が確保される。この操作は取り消せない。&lt;/doc&gt;
    &lt;/descriptor&gt;

    &lt;descriptor id=&quot;goOrderDetails&quot; type=&quot;safe&quot; rt=&quot;#OrderConfirmation&quot; title=&quot;注文詳細の表示&quot; tag=&quot;order&quot;&gt;
        &lt;doc&gt;確定した注文の詳細情報を表示する。注文番号、購入商品一覧、合計金額、配送先、支払い方法などが含まれる。&lt;/doc&gt;
    &lt;/descriptor&gt;
&lt;/alps&gt;
</code></pre>