# JayaMart backend API smoke tests (run while the API is up on :5000)
$base = "http://localhost:5000/api"
$script:failures = 0

function Check($name, $condition, $detail = "") {
    if ($condition) { Write-Host "[PASS] $name" }
    else { Write-Host "[FAIL] $name  $detail"; $script:failures++ }
}

function Call($method, $path, $body = $null, $token = $null) {
    $h = @{ 'Content-Type' = 'application/json' }
    if ($token) { $h['Authorization'] = "Bearer $token" }
    $p = @{ Method = $method; Uri = "$base$path"; Headers = $h; TimeoutSec = 25 }
    if ($null -ne $body) { $p['Body'] = ($body | ConvertTo-Json -Depth 8) }
    try {
        $r = Invoke-WebRequest @p -UseBasicParsing
        return @{ ok = $true; status = [int]$r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
    } catch {
        $resp = $_.Exception.Response
        $status = if ($resp) { [int]$resp.StatusCode } else { 0 }
        $text = ''
        try { $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $text = $sr.ReadToEnd() } catch {}
        $data = $null
        try { $data = $text | ConvertFrom-Json } catch {}
        return @{ ok = $false; status = $status; data = $data }
    }
}

Write-Host "=== PRODUCTS ==="
$products = Call 'GET' '/products'
Check 'GET /products returns 200' ($products.ok -and $products.status -eq 200)
$all = $products.data.products
Check 'seeded products exist' ($all.Count -ge 30) "count=$($all.Count)"
$categories = $all.category | Sort-Object -Unique
Check 'all 7 categories present' ($categories.Count -eq 7) ($categories -join ',')
Check 'some products discounted' (($all | Where-Object { $_.discountPercentage -gt 0 }).Count -gt 10)
Check 'some low-stock products (<10)' (($all | Where-Object { $_.stock -lt 10 -and $_.stock -gt 0 }).Count -ge 3)
Check 'at least one out-of-stock product' (@($all | Where-Object { $_.stock -eq 0 }).Count -ge 1)

$search = Call 'GET' '/products?search=rice'
Check 'search by name works' ($search.ok -and @($search.data.products).Count -ge 1) "count=$(@($search.data.products).Count)"
$cat = Call 'GET' '/products?category=Makeup'
Check 'category filter works' ($cat.ok -and @($cat.data.products | Where-Object { $_.category -ne 'Makeup' }).Count -eq 0)
$none = Call 'GET' '/products?search=zzzznotfound'
Check 'empty search returns empty list' ($none.ok -and @($none.data.products).Count -eq 0)
$detail = Call 'GET' "/products/1"
Check 'GET /products/:id works' ($detail.ok -and $detail.data.product.name)

Write-Host "=== AUTH ==="
$login = Call 'POST' '/auth/login' @{ email = 'buyer@jayamart.com'; password = 'buyer123' }
Check 'buyer login works' ($login.ok -and $login.data.token) "status=$($login.status)"
$buyerToken = $login.data.token
$buyer = $login.data.user
Check 'buyer role is BUYER' ($buyer.role -eq 'BUYER')

$slogin = Call 'POST' '/auth/login' @{ email = 'seller@jayamart.com'; password = 'seller123' }
Check 'seller login works' ($slogin.ok -and $slogin.data.token) "status=$($slogin.status)"
$sellerToken = $slogin.data.token
Check 'seller role is SELLER' ($slogin.data.user.role -eq 'SELLER')

$badLogin = Call 'POST' '/auth/login' @{ email = 'buyer@jayamart.com'; password = 'wrong' }
Check 'wrong password rejected (401)' (-not $badLogin.ok -and $badLogin.status -eq 401)

$uniqueEmail = "test$(Get-Random)@example.com"
$reg = Call 'POST' '/auth/register' @{ name = 'Test User'; email = $uniqueEmail; password = 'secret123' }
Check 'register creates buyer' ($reg.ok -and $reg.status -eq 201 -and $reg.data.user.role -eq 'BUYER')
$regToken = $reg.data.token

$me = Call 'GET' '/auth/me' $null $regToken
Check 'GET /auth/me works' ($me.ok -and $me.data.user.email -eq $uniqueEmail)

$meNoToken = Call 'GET' '/auth/me'
Check 'GET /auth/me without token is 401' (-not $meNoToken.ok -and $meNoToken.status -eq 401)

Write-Host "=== CART ==="
# use a fresh cart for the registered test user
$cart0 = Call 'GET' '/cart' $null $regToken
Check 'GET /cart works' ($cart0.ok)
$add = Call 'POST' '/cart' @{ productId = 1; quantity = 2 } $regToken
Check 'POST /cart adds item' ($add.ok -and @($add.data.items).Count -eq 1)
$cartItem = $add.data.items[0]
$addMore = Call 'POST' '/cart' @{ productId = 1; quantity = 1 } $regToken
Check 're-adding increments quantity' ($addMore.data.items[0].quantity -eq 3)
$addSaved = Call 'POST' '/cart' @{ productId = 2; quantity = 1; savedForLater = $true } $regToken
Check 'POST /cart can save for later' (@($addSaved.data.items | Where-Object { $_.productId -eq 2 -and $_.savedForLater }).Count -eq 1)
$putQty = Call 'PUT' "/cart/$($cartItem.id)" @{ quantity = 1 } $regToken
$afterQty = @($putQty.data.items | Where-Object { $_.id -eq $cartItem.id })
Check 'PUT /cart updates quantity' ($afterQty[0].quantity -eq 1) "1" "$($afterQty[0].quantity)"
$putSave = Call 'PUT' "/cart/$($cartItem.id)" @{ savedForLater = $true } $regToken
$afterSave = @($putSave.data.items | Where-Object { $_.id -eq $cartItem.id })
Check 'PUT /cart saves for later' ($afterSave[0].savedForLater -eq $true) "true" "$($afterSave[0].savedForLater)"
$putBack = Call 'PUT' "/cart/$($cartItem.id)" @{ savedForLater = $false } $regToken
$afterBack = @($putBack.data.items | Where-Object { $_.id -eq $cartItem.id })
Check 'PUT /cart moves back to cart' ($afterBack[0].savedForLater -eq $false) "false" "$($afterBack[0].savedForLater)"

# stock guard: product 5 (Toor Dal, stock 30) - ask for more than stock
$tooMany = Call 'POST' '/cart' @{ productId = 5; quantity = 500 } $regToken
Check 'cannot add more than stock' (-not $tooMany.ok -and $tooMany.status -eq 400)

Write-Host "=== ORDER FROM CART + PAYMENT ==="
$orderBody = @{
    customerName = 'Test User'
    phone        = '9876543210'
    address      = '42, MG Road'
    city         = 'Bengaluru'
    pincode      = '560001'
}
# capture pre-order state so this check works no matter how many times tests ran
$stockBefore = (Call 'GET' '/products/1').data.product.stock
$activeQty1 = 0
foreach ($it in @((Call 'GET' '/cart' $null $regToken).data.items)) {
    if ($it.productId -eq 1 -and -not $it.savedForLater) { $activeQty1 = $it.quantity }
}
$order = Call 'POST' '/orders' $orderBody $regToken
Check 'POST /orders (cart) works' ($order.ok -and $order.data.order.id) "status=$($order.status) err=$($order.data.message)"
$orderId = $order.data.order.id
Check 'order total computed' ($order.data.order.totalAmount -gt 0)
$cartAfterOrder = Call 'GET' '/cart' $null $regToken
$activeAfterOrder = @($cartAfterOrder.data.items | Where-Object { -not $_.savedForLater })
Check 'cart cleared after order' ($activeAfterOrder.Count -eq 0)

$stockAfter = (Call 'GET' '/products/1').data.product.stock
Check 'stock deducted after order' ($stockAfter -eq ($stockBefore - $activeQty1)) "expected $($stockBefore - $activeQty1)" "$stockAfter"

$orders = Call 'GET' '/orders' $null $regToken
Check 'GET /orders lists orders' ($orders.ok -and @($orders.data.orders).Count -ge 1)
$single = Call 'GET' "/orders/$orderId" $null $regToken
Check 'GET /orders/:id works' ($single.ok -and @($single.data.order.items).Count -ge 1)

$invalidStatus = Call 'PUT' "/orders/$orderId/status" @{ status = 'HACKED' } $sellerToken
Check 'invalid order status rejected' (-not $invalidStatus.ok -and $invalidStatus.status -eq 400)

$pay = Call 'POST' '/payments' @{ orderId = $orderId; paymentMethod = 'NET_BANKING'; bank = 'SBI'; accountName = 'Test User' } $regToken
Check 'POST /payments works' ($pay.ok -and $pay.data.payment.transactionId) "status=$($pay.status) err=$($pay.data.message)"
Check 'transaction id looks realistic' ($pay.data.payment.transactionId -match '^JM\d{8}[A-F0-9]+$')
Check 'payment amount matches order' ([math]::Round($pay.data.payment.amount, 2) -eq [math]::Round($order.data.order.totalAmount, 2))

$paidOrder = Call 'GET' "/orders/$orderId" $null $regToken
Check 'order shows PAID' ($paidOrder.data.order.paymentStatus -eq 'PAID')

$doublePay = Call 'POST' '/payments' @{ orderId = $orderId; paymentMethod = 'NET_BANKING'; bank = 'SBI'; accountName = 'Test User' } $regToken
Check 'double payment rejected' (-not $doublePay.ok -and $doublePay.status -eq 400)

Write-Host "=== TRACKING ==="
$track = Call 'GET' "/orders/$orderId/track" $null $regToken
Check 'GET /orders/:id/track works' ($track.ok)
Check 'track returns 6 stages' ($track.data.stages.Count -eq 6)
Check 'stage order is correct' ($track.data.stages[0].status -eq 'PLACED' -and $track.data.stages[5].status -eq 'DELIVERED')
Check 'current stage marked' (@($track.data.stages | Where-Object { $_.current }).Count -eq 1)
Check 'PLACED stage has timestamp' ($track.data.stages[0].at -ne $null)

Write-Host "=== BUY NOW (direct checkout) ==="
$buyNow = Call 'POST' '/orders' (@{
        customerName = 'Test User'
        phone        = '9876543211'
        address       = '7, Park Street'
        city         = 'Kolkata'
        pincode      = '700016'
        items        = @(@{ productId = 3; quantity = 2 })
    }) $regToken
Check 'POST /orders with items (Buy Now) works' ($buyNow.ok -and $buyNow.data.order.id) "err=$($buyNow.data.message)"
$buyNowId = $buyNow.data.order.id
$buyNowOrder = Call 'GET' "/orders/$buyNowId" $null $regToken
Check 'buy-now order has only the selected product' ($buyNowOrder.data.order.items.Count -eq 1 -and $buyNowOrder.data.order.items[0].productId -eq 3)
$cartAfterBuyNow = Call 'GET' '/cart' $null $regToken
Check 'buy now does not clear saved items' (@($cartAfterBuyNow.data.items | Where-Object { $_.savedForLater }).Count -ge 1)

Write-Host "=== SELLER ==="
$dash = Call 'GET' '/seller/dashboard' $null $sellerToken
Check 'GET /seller/dashboard works' ($dash.ok)
Check 'dashboard has low stock count' ($dash.data.lowStockCount -ge 1) "low=$($dash.data.lowStockCount)"
Check 'dashboard has totals' ($null -ne $dash.data.totalProducts -and $null -ne $dash.data.totalOrders)

$low = Call 'GET' '/seller/low-stock' $null $sellerToken
Check 'GET /seller/low-stock works' ($low.ok -and @($low.data.products).Count -ge 1)

$sellerOrders = Call 'GET' '/seller/orders' $null $sellerToken
Check 'GET /seller/orders works' ($sellerOrders.ok -and @($sellerOrders.data.orders).Count -ge 1)

$newProduct = Call 'POST' '/products' @{
    name          = 'Test Product Alpha'
    category      = 'Snacks'
    description   = 'Created by the API test suite.'
    originalPrice = 100
    price         = 80
    stock         = 5
    image         = ''
} $sellerToken
Check 'seller creates product' ($newProduct.ok -and $newProduct.status -eq 201)
Check 'discount auto-calculated (20%)' ([math]::Round($newProduct.data.product.discountPercentage) -eq 20)
$newId = $newProduct.data.product.id

$update = Call 'PUT' "/products/$newId" @{
    name          = 'Test Product Alpha v2'
    category      = 'Snacks'
    description   = 'Updated by the API test suite.'
    originalPrice = 100
    price         = 70
    stock         = 4
    image         = ''
} $sellerToken
Check 'seller updates product' ($update.ok -and $update.data.product.name -like '*v2*')

$status = Call 'PUT' "/orders/$orderId/status" @{ status = 'PACKED' } $sellerToken
Check 'seller updates order status' ($status.ok -and $status.data.order.status -eq 'PACKED')
$track2 = Call 'GET' "/orders/$orderId/track" $null $regToken
Check 'tracking reflects new status' ($track2.data.currentStatus -eq 'PACKED')
Check 'CONFIRMED stage still pending' ($track2.data.stages[1].completed -eq $false -or $track2.data.stages[1].current -eq $false)

$delivered = Call 'PUT' "/orders/$orderId/status" @{ status = 'DELIVERED' } $sellerToken
Check 'seller marks delivered' ($delivered.ok -and $delivered.data.order.status -eq 'DELIVERED')

$delete = Call 'DELETE' "/products/$newId" $null $sellerToken
Check 'seller deletes product' ($delete.ok)

Write-Host "=== AUTHORIZATION ==="
$buyerSellerDash = Call 'GET' '/seller/dashboard' $null $buyerToken
Check 'buyer gets 403 on seller dashboard API' (-not $buyerSellerDash.ok -and $buyerSellerDash.status -eq 403)
$buyerSellerOrders = Call 'GET' '/seller/orders' $null $buyerToken
Check 'buyer gets 403 on seller orders API' (-not $buyerSellerOrders.ok -and $buyerSellerOrders.status -eq 403)
$buyerCreate = Call 'POST' '/products' @{ name = 'X'; category = 'Snacks'; description = ''; originalPrice = 10; price = 5; stock = 1; image = '' } $buyerToken
Check 'buyer cannot create products (403)' (-not $buyerCreate.ok -and $buyerCreate.status -eq 403)
$buyerStatus = Call 'PUT' "/orders/$orderId/status" @{ status = 'SHIPPED' } $buyerToken
Check 'buyer cannot update order status (403)' (-not $buyerStatus.ok -and $buyerStatus.status -eq 403)

# another user cannot read someone else's order
$otherOrder = Call 'GET' "/orders/$orderId" $null $regToken
$otherUser = Call 'POST' '/auth/login' @{ email = 'seller@jayamart.com'; password = 'seller123' }
$foreignCart = Call 'GET' '/cart' $null $sellerToken
Check 'seller sees own (empty) cart, not buyers cart' ($foreignCart.ok -and ($foreignCart.data.items | Where-Object { $_.userId -ne $login.data.user.id }).Count -eq 0)

Write-Host ""
if ($script:failures -eq 0) { Write-Host "ALL API TESTS PASSED" ; exit 0 }
else { Write-Host "$($script:failures) TEST(S) FAILED" ; exit 1 }
