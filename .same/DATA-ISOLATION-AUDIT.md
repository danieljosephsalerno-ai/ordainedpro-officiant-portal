# Data Isolation Audit Report

## OrdainedPro Portal - Multi-Tenant Data Separation Analysis

### Executive Summary

The portal has **TWO LEVELS** of data isolation:

1. **Officiant-level isolation** (user_id) - **PROPERLY IMPLEMENTED** at database level via Row Level Security (RLS)
2. **Couple-level isolation** (couple_id) - **HAS ISSUES** at application level

---

## ✅ SYSTEMS THAT ARE PROPERLY ISOLATED (by user_id via RLS)

The following systems are **COMPLETELY SEPARATE** between different officiants:

| System | Database Table | RLS Policy | Status |
|--------|---------------|------------|--------|
| **Profiles** | `profiles` | `auth.uid() = user_id` | ✅ SECURE |
| **Couples** | `couples` | `auth.uid() = user_id` | ✅ SECURE |
| **Ceremonies** | `ceremonies` | `auth.uid() = user_id` | ✅ SECURE |
| **Messages** | `messages` | `auth.uid() = user_id` | ✅ SECURE |
| **Payments** | `payments` | `auth.uid() = user_id` | ✅ SECURE |
| **Scripts** | `scripts` | `auth.uid() = user_id` | ✅ SECURE |
| **Documents** | `documents` | `auth.uid() = user_id` | ✅ SECURE |
| **Tasks** | `tasks` | `auth.uid() = user_id` | ✅ SECURE |
| **Meetings** | `meetings` | `auth.uid() = user_id` | ✅ SECURE |
| **Contracts** | `contracts` | `auth.uid() = user_id` | ✅ SECURE |
| **Subscriptions** | `subscriptions` | `auth.uid() = user_id` | ✅ SECURE |

**Conclusion:** One officiant CANNOT see another officiant's data. This is enforced at the database level by Supabase Row Level Security (RLS).

---

## ⚠️ ISSUE: Cross-Couple Data Pollution WITHIN Same Officiant

The problem you're seeing is that **within a single officiant's account**, data from different couples may be mixing. This is an **APPLICATION-LEVEL BUG**, not a database security issue.

### Root Cause Analysis

Several components are **HARDCODING `couple_id: 1`** instead of using the currently selected couple's ID:

#### 1. AddTaskDialog.tsx (Line 115)
```typescript
// PROBLEM: Hardcoded coupleId = 1
let coupleId = 1;
```

#### 2. ContractUploadDialog.tsx (Line 175)
```typescript
// PROBLEM: Hardcoded coupleId = 1
const coupleId = 1
```

#### 3. ScheduleMeetingDialog.tsx (Line 374)
```typescript
// PROBLEM: Hardcoded coupleId = 1
const coupleId = 1;
```

#### 4. CalendarSection.tsx (Line 295)
```typescript
// PROBLEM: couple_id set to null
couple_id: null,
```

### What This Causes

When an officiant:
1. Creates a task → it gets assigned to couple_id 1 (wrong couple)
2. Uploads a contract → it gets assigned to couple_id 1 (wrong couple)
3. Schedules a meeting → it gets assigned to couple_id 1 (wrong couple)
4. Views messages → may see messages for the wrong couple if not properly filtered by couple_id

---

## 📊 Detailed System Breakdown

### 1. MESSAGES - ⚠️ NEEDS FIX
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** Messages are fetched by `couple_id`, but the selected couple may not be properly tracked
- **Risk:** Messages from different couples could appear on wrong profiles if couple selection is lost

### 2. UPLOADED FILES / DOCUMENTS - ⚠️ NEEDS FIX
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** Some components hardcode `couple_id: 1`
- **Risk:** Files could be associated with wrong couples

### 3. BILLING/PAYMENTS - ⚠️ NEEDS FIX
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** Payments are fetched by `couple_id` but same hardcoding issue may exist
- **Risk:** Payment records could appear on wrong couple profiles

### 4. SCHEDULING/MEETINGS - ⚠️ NEEDS FIX
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** `ScheduleMeetingDialog.tsx` hardcodes `couple_id: 1`
- **Risk:** All meetings assigned to first couple

### 5. CONTACTS (Couple Info) - ✅ WORKING
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** Properly uses couple selector
- **Risk:** Low - couples are fetched correctly by user_id

### 6. SCRIPT BUILDING - ✅ WORKING
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** Scripts are user-level (not couple-specific)
- **Risk:** None - scripts belong to officiant, not couples

### 7. TASKS - ⚠️ NEEDS FIX
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** `AddTaskDialog.tsx` hardcodes `couple_id: 1`
- **Risk:** All tasks assigned to first couple

### 8. CONTRACTS - ⚠️ NEEDS FIX
- **Database Level:** Secure (RLS by user_id)
- **Application Level:** `ContractUploadDialog.tsx` hardcodes `couple_id: 1`
- **Risk:** All contracts assigned to first couple

---

## 🔧 REQUIRED FIXES

To properly isolate data between couples, each component needs to:

1. **Receive the active `coupleId`** as a prop from the parent component
2. **Use that `coupleId`** when creating/fetching records
3. **Never hardcode `couple_id: 1`**

### Components That Need Updates:

1. `AddTaskDialog.tsx` - Pass coupleId prop
2. `ContractUploadDialog.tsx` - Pass coupleId prop
3. `ScheduleMeetingDialog.tsx` - Pass coupleId prop
4. `CalendarSection.tsx` - Pass coupleId prop
5. `CommunicationPortal.tsx` - Track and pass active coupleId to all child components

---

## 🛡️ Security Summary

| Isolation Level | Status | Risk |
|-----------------|--------|------|
| **Between Officiants** | ✅ SECURE | None - RLS enforced at DB level |
| **Between Couples (same officiant)** | ⚠️ BUGGY | Moderate - data mixing within account |

**Note:** This is NOT a security breach where one user can see another user's data. This is a data organization bug where data from multiple couples belonging to the SAME officiant may get mixed up.

---

## Recommended Action Plan

1. **Immediate:** Fix the hardcoded `couple_id: 1` in all components
2. **Short-term:** Add proper couple selection tracking in the portal state
3. **Long-term:** Add validation to ensure `couple_id` is always provided when required
