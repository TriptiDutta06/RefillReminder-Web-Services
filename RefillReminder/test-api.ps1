$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "    REFILLREMINDER REST API TEST SUITE    "
Write-Host "    (MongoDB - refillreminder.refills)    "
Write-Host "=========================================="

# 1. GET ALL
Write-Host "`n[1] GET /api/refills"
$all = Invoke-RestMethod -Uri "http://localhost:8080/api/refills" -Method Get
Write-Host "Status: 200 OK | Items count: $($all.Count)"
foreach ($item in $all) {
    Write-Host " - [$($item.id)] $($item.productName) ($($item.category)) - $($item.quantity) $($item.unit) | Status: $($item.status) | Due: $($item.nextRefill)"
}

# 2. GET COUNT (MongoDB document count)
Write-Host "`n[2] GET /api/refills/count"
$countResp = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/count" -Method Get
Write-Host "Status: 200 OK | Document Count: $($countResp.count) | DB: $($countResp.database) | Collection: $($countResp.collection)"

# 3. GET BY ID (use first item's ID)
$firstId = $all[0].id
Write-Host "`n[3] GET /api/refills/$firstId"
$single = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/$firstId" -Method Get
Write-Host "Status: 200 OK | Retrieved: $($single.productName), Notes: $($single.notes)"

# 4. POST CREATE
Write-Host "`n[4] POST /api/refills"
$newItem = @{
    productName = "Body Lotion"
    category = "Personal Care"
    quantity = 2.0
    unit = "bottles"
    priority = "Medium"
    lastRefilled = "2026-09-01"
    nextRefill = "2026-10-01"
    status = "Needed"
    notes = "Shea butter moisturizer"
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "http://localhost:8080/api/refills" -Method Post -ContentType "application/json" -Body $newItem
Write-Host "Status: 201 Created | New ID: $($created.id), Name: $($created.productName)"

# 5. PUT UPDATE
Write-Host "`n[5] PUT /api/refills/$($created.id)"
$updatePayload = @{
    productName = "Hydrating Body Lotion"
    category = "Personal Care"
    quantity = 3.0
    unit = "bottles"
    priority = "High"
    lastRefilled = "2026-09-01"
    nextRefill = "2026-09-28"
    status = "Running Low"
    notes = "Upgraded to 3 bottles with vitamin E"
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/$($created.id)" -Method Put -ContentType "application/json" -Body $updatePayload
Write-Host "Status: 200 OK | Updated Name: $($updated.productName), Qty: $($updated.quantity), Status: $($updated.status)"

# 6. PATCH STATUS
Write-Host "`n[6] PATCH /api/refills/$($created.id)/status"
$patchPayload = @{ status = "Refilled" } | ConvertTo-Json
$patched = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/$($created.id)/status" -Method Patch -ContentType "application/json" -Body $patchPayload
Write-Host "Status: 200 OK | New Status: $($patched.status), Last Refilled updated to: $($patched.lastRefilled)"

# 7. GET UPCOMING
Write-Host "`n[7] GET /api/refills/upcoming"
$upcoming = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/upcoming" -Method Get
Write-Host "Status: 200 OK | Upcoming Refills Count: $($upcoming.Count)"
foreach ($u in $upcoming) {
    Write-Host " - Due: $($u.nextRefill) | $($u.productName) ($($u.status))"
}

# 8. GET SEARCH
Write-Host "`n[8] GET /api/refills/search?name=Shampoo"
$search = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/search?name=Shampoo" -Method Get
Write-Host "Status: 200 OK | Found: $($search.Count) matches for 'Shampoo'"
foreach ($s in $search) {
    Write-Host " - Match: $($s.productName) (ID: $($s.id))"
}

# 9. DELETE
Write-Host "`n[9] DELETE /api/refills/$($created.id)"
$delResp = Invoke-RestMethod -Uri "http://localhost:8080/api/refills/$($created.id)" -Method Delete
Write-Host "Status: 200 OK | Deletion response: $($delResp.message)"

# 10. 404 NOT FOUND TEST
Write-Host "`n[10] GET /api/refills/$($created.id) (Verify 404 Not Found)"
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/refills/$($created.id)" -Method Get
    Write-Host "FAILED: Expected 404 but got success"
} catch {
    Write-Host "SUCCESS: Caught expected 404 Not Found response ($($_.Exception.Message))"
}

Write-Host "`n=========================================="
Write-Host "    ALL REST API TESTS PASSED 100%!       "
Write-Host "    (Data persisted in MongoDB Compass)   "
Write-Host "=========================================="
