# Security Specification - Personal Finance Control App

## 1. Data Invariants
1. **User Isolation**: A user can only access, create, read, update, and delete their own profile (`/users/{userId}` where `request.auth.uid == userId`).
2. **Transaction Integrity**: Every transaction must have `userId == request.auth.uid`, valid non-empty description, positive or non-negative amount, and valid transaction type (`despesa` or `receita`).
3. **Budget Scope**: Monthly budgets and category allocations can only be written by the document owner (`request.auth.uid == userId`).
4. **No Cross-User Access**: Unauthenticated users and other authenticated users cannot read or modify another user's financial transactions or budgets.
5. **String & Boundary Safety**: Document IDs, descriptions, categories, and payment methods must respect maximum lengths and valid characters to avoid resource exhaustion attacks.

## 2. The Dirty Dozen Payloads (Must be Rejected)
1. **Unauthenticated Read**: Attempting to read `/users/{userId}/transactions` without logging in.
2. **Cross-User Snooping**: User B attempting to read `/users/userA/transactions`.
3. **Cross-User Transaction Injection**: User B attempting to create a transaction under `/users/userA/transactions/tx1`.
4. **Spoofed User ID in Payload**: User A creating a transaction where `data.userId = 'userB'`.
5. **Invalid Document ID Poisoning**: Creating a transaction with a 2KB malicious string as ID.
6. **Negative or Non-Numeric Amount**: Creating a transaction with `amount = "invalid_string"` or `NaN`.
7. **Invalid Transaction Type**: Creating a transaction with `type = "free_money"` (not `despesa` or `receita`).
8. **Missing Mandatory Fields**: Creating a transaction without `amount` or `category`.
9. **Oversized Description Attack**: Submitting a 50,000 character description string to exhaust quota.
10. **Budget Modification by Impersonator**: User B attempting to modify User A's monthly planned budget.
11. **Shadow Field Injection**: Attempting to inject `isAdmin: true` into the `UserProfile` document.
12. **Modifying Immutable Ownership**: Attempting an update to `/users/{userId}/transactions/{id}` that changes `userId`.

## 3. Test Runner Design
The security tests in `firestore.rules.test.ts` assert that all 12 payloads fail with `PERMISSION_DENIED`.
