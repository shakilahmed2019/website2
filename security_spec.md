# Security Specification: Tanvir's Science Square LMS

## 1. Data Invariants
1. **Identity Integrity**: Users can only create or update their own `users/{uid}` profile (`id == request.auth.uid`) and cannot self-assign `role == 'admin'` unless verified against `admins/{uid}` or the bootstrapped verified admin email.
2. **Paid Course Access Gate**: A student cannot create an `enrollments/{uid}_{courseId}` document for a paid course (`priceBdt > 0`). Only an Admin approving a `payments/{paymentId}` record can unlock paid courses via atomic batch write.
3. **Payment State Integrity**: Students can only submit `payments` with `status == 'pending'`, `userId == request.auth.uid`, valid 11-digit BD mobile (`^01[3-9][0-9]{8}$`), and valid `transactionId` (`^[A-Z0-9]{6,18}$`). Once terminal (`approved`/`rejected`), students cannot modify payments.
4. **PII Isolation**: `users/{uid}` (email) and `payments/{paymentId}` (phone) are readable only by the owner (`userId == request.auth.uid`) or an Admin. `examResults` stores zero PII so the leaderboard is safely public.
5. **Temporal Integrity**: `createdAt` and `updatedAt` are validated against `request.time` via `serverTimestamp()`, and `createdAt` is immutable on update.
6. **Path & Payload Limits**: All document IDs match `^[a-zA-Z0-9_\\-]+$` (`<= 128` chars), and every string and array has bounded `.size()` checks plus strict `hasAll` / `hasOnly` key allowlists.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. Self-escalation: `users/{uid}` with `role: "admin"` by non-admin -> `PERMISSION_DENIED`.
2. Shadow field injection: `users/{uid}` with extra `isVerified: true` -> `PERMISSION_DENIED`.
3. Spoofed enrollment: `enrollments/{otherUid}_{courseId}` created by attacker -> `PERMISSION_DENIED`.
4. Paid course bypass: `enrollments/{uid}_{paidCourseId}` created directly by student -> `PERMISSION_DENIED`.
5. Payment pre-approval: `payments/{id}` created by student with `status: "approved"` -> `PERMISSION_DENIED`.
6. Payment phone poisoning: `payments/{id}` with invalid phone `"not-a-phone"` -> `PERMISSION_DENIED`.
7. Payment TrxID spoofing / status flip: student updating own `payments/{id}` to `status: "approved"` -> `PERMISSION_DENIED`.
8. PII scrape: student listing all `payments` without `userId == request.auth.uid` -> `PERMISSION_DENIED`.
9. Exam score forgery for another student: `examResults/{id}` with `userId: otherUid` -> `PERMISSION_DENIED`.
10. Admin catalog hijack: student creating/deleting `courses/{id}` -> `PERMISSION_DENIED`.
11. Notice injection: student creating `notices/{id}` -> `PERMISSION_DENIED`.
12. ID poisoning: creating doc with 200-char ID or invalid characters -> `PERMISSION_DENIED`.
