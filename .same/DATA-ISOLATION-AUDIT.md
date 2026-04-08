# 🔒 Data Isolation Audit - OrdainedPro Portal

## Executive Summary

This document analyzes how data is separated between:
1. **Different Officiants** (multi-tenant isolation)
2. **Different Couples** (within an officiant's account)

---

## 📊 Current Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         OFFICIANT (user_id)                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Profile, Scripts, Contracts, Meetings, Wedding Events      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  COUPLE 1   │  │  COUPLE 2   │  │  COUPLE 3   │             │
│  │ (couple_id) │  │ (couple_id) │  │ (couple_id) │             │
│  │             │  │             │  │             │             │
│  │ - Messages  │  │ - Messages  │  │ - Messages  │             │
│  │ - Payments  │  │ - Payments  │  │ - Payments  │             │
│  │ - Ceremony  │  │ - Ceremony  │  │ - Ceremony  │             │
│  │ - Tasks     │  │ - Tasks     │  │ - Tasks     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Systems That ARE Properly Isolated

### 1. **Couples** ✅
- **File:** `supabase-api.ts` line 50-54
- **Filter:** `user_id` (officiant-level)
- **Status:** ✅ ISOLATED - Each officiant only sees their own couples

### 2. **Scripts** ✅
- **File:** `supabase-api.ts` line 295-298
- **Filter:** `user_id` (officiant-level)
- **Status:** ✅ ISOLATED - Each officiant only sees their own scripts

### 3. **Contracts** ✅
- **File:** `ContractsSection.tsx` line 102-106
- **Filter:** `user_id` (officiant-level)
- **Status:** ✅ ISOLATED - Each officiant only sees their own contracts

### 4. **Profiles** ✅
- **File:** `supabase-api.ts` line 388-392
- **Filter:** `user_id` (officiant-level)
- **Status:** ✅ ISOLATED - Each officiant has their own profile

### 5. **Meetings** ✅
- **File:** `CalendarSection.tsx` line 118-121
- **Filter:** `user_id` (officiant-level)
- **Status:** ✅ ISOLATED - Each officiant sees their own meetings

---

## ⚠️ Systems That NEED Couple-Level Isolation

### 6. **Messages** ⚠️ CRITICAL
- **API Filter:** `couple_id` in `supabase-api.ts` line 200-203 ✅
- **UI Issue:** The CommunicationPortal needs to pass the correct `couple_id` when switching couples
- **Problem:** If messages are showing across couples, it's because:
  1. The frontend isn't updating `couple_id` when switching couples, OR
  2. The messages aren't being re-fetched when a new couple is selected

**REQUIRED FIX:** Ensure messages are re-fetched with the new `couple_id` when user switches couples

### 7. **Payments** ⚠️
- **API Filter:** `couple_id` in `supabase-api.ts` line 237-240 ✅
- **Status:** API is correct, but UI needs to use correct couple_id

### 8. **Tasks** ⚠️
- **Filter:** Has both `user_id` AND `couple_id`
- **Status:** Should filter by BOTH for proper isolation

### 9. **Wedding Events** ⚠️
- **File:** `CalendarSection.tsx`
- **Current Filter:** Only `user_id`
- **MISSING:** Should also filter by `couple_id` for couple-specific events

---

## 🚨 ROOT CAUSE OF MESSAGE COMINGLING

The issue is likely in **CommunicationPortal.tsx** where:

1. When user switches from "Couple A" to "Couple B", the `couple_id` variable updates
2. BUT the messages state doesn't get re-fetched with the new `couple_id`
3. The old messages from "Couple A" remain displayed for "Couple B"

**SOLUTION:**
```typescript
// When activeCoupleIndex changes, refetch messages for the new couple
useEffect(() => {
  const currentCouple = allCouples[activeCoupleIndex];
  if (currentCouple?.id) {
    fetchMessagesForCouple(currentCouple.id);
  }
}, [activeCoupleIndex]);
```

---

## 🛡️ DATABASE-LEVEL PROTECTION (RLS)

### Current Status: ❓ MAY NOT BE APPLIED

The RLS policies exist in `.same/RLS-POLICIES.sql` but may not have been executed on Supabase.

### Why RLS is Important:
- Even if the UI code has bugs, RLS prevents data leakage at the database level
- A user CAN'T access another user's data even with a malicious API call

### To Apply RLS:
1. Go to Supabase Dashboard → SQL Editor
2. Run the entire contents of `.same/RLS-POLICIES.sql`
3. Verify with the verification query at the bottom of the file

---

## 📋 ISOLATION CHECKLIST BY TABLE

| Table | user_id Filter | couple_id Filter | RLS Enabled | Status |
|-------|----------------|------------------|-------------|--------|
| profiles | ✅ | N/A | ❓ | ✅ if RLS applied |
| couples | ✅ | N/A | ❓ | ✅ if RLS applied |
| ceremonies | ✅ | ✅ | ❓ | ✅ if RLS applied |
| messages | ✅ | ✅ | ❓ | ⚠️ UI needs fix |
| payments | ✅ | ✅ | ❓ | ⚠️ Verify couple_id |
| scripts | ✅ | N/A | ❓ | ✅ if RLS applied |
| contracts | ✅ | Optional | ❓ | ✅ if RLS applied |
| meetings | ✅ | Optional | ❓ | ✅ if RLS applied |
| tasks | ✅ | ✅ | ❓ | ⚠️ Verify both filters |
| wedding_events | ✅ | ⚠️ Missing | ❓ | ⚠️ Add couple_id filter |
| user_files | ✅ | ✅ | ❓ | ✅ if RLS applied |

---

## 🔧 RECOMMENDED FIXES

### Priority 1: Fix Message Comingling (HIGH)
1. Ensure `fetchMessages()` is called with correct `couple_id` when switching couples
2. Clear message state before loading new couple's messages
3. Add loading state to prevent showing stale data

### Priority 2: Apply RLS Policies (HIGH)
1. Run `.same/RLS-POLICIES.sql` in Supabase SQL Editor
2. This provides database-level protection even if UI has bugs

### Priority 3: Add couple_id to Wedding Events (MEDIUM)
1. Update `wedding_events` table to include `couple_id`
2. Filter events by both `user_id` AND `couple_id`

### Priority 4: Audit All Data Fetching (LOW)
1. Review each component that fetches data
2. Ensure proper filters are applied consistently

---

## 🧪 HOW TO TEST ISOLATION

### Test Officiant Isolation:
1. Create two test officiant accounts
2. Add couples to each
3. Verify one officiant cannot see the other's couples

### Test Couple Isolation:
1. Add two couples to the same officiant account
2. Add messages to Couple A
3. Switch to Couple B
4. Verify Couple A's messages don't appear

---

## ✅ ACTION ITEMS

- [ ] Run RLS policies SQL on Supabase database
- [ ] Fix message fetching when switching couples
- [ ] Add couple_id filter to wedding_events queries
- [ ] Add loading states when switching couples
- [ ] Test isolation between officiants
- [ ] Test isolation between couples

---

*Last Updated: April 8, 2026*
