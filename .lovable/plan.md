
## Measurement Page Redesign

### What's Changing

The current measurement form uses a basic 2-column grid of 16 fields. The new design follows the reference image with:
- Numbered fields listed vertically (one per row), like a professional tailoring form
- Special **table-style inputs** for Sleeves (4 sets × 2 rows) and Blouse Length (3 sets × 2 rows)
- A divider section for file upload (drag & drop + camera, multiple images)
- A "Design Instructions" textarea (replaces "custom notes")
- Save/Submit button at the bottom

---

### New Measurement Fields

The reference image has some fields that don't exist in the current database. Here is the mapping:

**Fields already in DB (kept, possibly renamed):**
- chest → Chest
- waist → Waist
- hip → Hip
- shoulder_width → Shoulder Width
- front_length → Front Length / Blouse Length
- back_length → Back Length / Blouse Length
- sleeve_length → Sleeves (Length row)
- arm_circumference → Sleeves (Armround row)
- thigh → Thigh round
- knee → Knee round
- neck → Neck round
- inseam, outseam, calf, wrist, bust → kept

**New fields to add to DB:**
- `upper_chest` — Upper Chest (#1)
- `armhole` — Armhole (#5)
- `cross_armhole` — Cross Armhole (#6)
- `sleeve_length_2`, `sleeve_length_3`, `sleeve_length_4` — Extra sleeve columns
- `armround_1`, `armround_2`, `armround_3`, `armround_4` — Armround rows in sleeves table
- `front_neck_depth` — Front Neck Depth (#9)
- `back_neck_depth` — Back Neck Depth (#10)
- `blouse_front_1`, `blouse_front_2`, `blouse_front_3` — Blouse front length columns
- `blouse_back_1`, `blouse_back_2`, `blouse_back_3` — Blouse back length columns
- `top_length` — Top Length (#12)
- `full_length` — Full Length (#13)
- `dart_point` — Dart Point (#14)
- `apex_to_apex` — Apex to Apex (#15)
- `yoke_length` — Yoke Length (#17)
- `others` — Others (#18)
- `lower_waist` — Lower Waist (#19)
- `lower_length` — Lower Length (#20)
- `bottom_round` — Bottom Round (#24)
- `design_instructions` — replaces `custom_notes`

---

### Technical Plan

**Step 1 — Database migration**
Add all new columns to the `measurements` table using a SQL migration. Existing data is safe since all columns are nullable. The `custom_notes` column stays as-is (kept in DB, just displayed differently in UI).

**Step 2 — Rebuild `MeasurementForm.tsx`**
- Replace the 2-column grid layout with a numbered vertical list
- Add the Sleeves table (4 columns × Sleeve Length / Armround rows)
- Add the Blouse Length table (3 columns × Front Length / Back Length rows)
- Move image upload (currently in `ImageGallery.tsx`) directly into the form as a "File Upload" section after a "NEXT" divider
- Add "Design Instructions" textarea
- Add a "Save" button (green, full width) at the bottom

**Step 3 — Update `CustomerDetail.tsx`**
- Remove the separate `ImageGallery` card since upload is now embedded in the measurement form
- Keep the customer info header (name, phone, etc.) and edit/delete controls

**Step 4 — Keep `ImageGallery.tsx`**
- The existing gallery logic (upload, delete, list images) will be reused inside the new measurement form rather than as a separate card. The component itself can be adapted or its logic inlined.

---

### UI Layout (Mobile-First)

```text
┌─────────────────────────────────┐
│ ← Back    Customer Name   ✏ 🗑  │
├─────────────────────────────────┤
│ Client Measurement Details       │
│ [No Measurement Saved / last saved]
│                                 │
│ 1. Upper Chest                  │
│ [___________________]           │
│                                 │
│ 2. Chest                        │
│ [___________________]           │
│  ...                            │
│ 7. Sleeves                      │
│ ┌──────┬────┬────┬────┬────┐   │
│ │      │ 1  │ 2  │ 3  │ #7 │   │
│ ├──────┼────┼────┼────┼────┤   │
│ │ Slv  │    │    │    │    │   │
│ ├──────┼────┼────┼────┼────┤   │
│ │ Arm  │    │    │    │    │   │
│ └──────┴────┴────┴────┴────┘   │
│  ...                            │
│ ──────────── NEXT ──────────── │
│                                 │
│ File Upload                     │
│ ┌─────────────────────────────┐│
│ │  ☁ Browse Files             ││
│ │  Drag and drop files here   ││
│ └─────────────────────────────┘│
│ [image thumbnails with delete] │
│                                 │
│ Design Instructions             │
│ ┌─────────────────────────────┐│
│ │                             ││
│ └─────────────────────────────┘│
│                                 │
│  [  Save Measurements  ]        │
└─────────────────────────────────┘
```

---

### What Stays the Same
- Customer list, add/edit customer form — no changes
- Image compression logic (`src/lib/image-compression.ts`) — reused
- Storage bucket and upload helpers — reused
- App navigation in `Index.tsx` — no changes

---

### Files to Change
1. **New SQL migration** — add ~20 new columns to `measurements` table
2. **`src/components/MeasurementForm.tsx`** — full redesign with new fields + integrated file upload
3. **`src/components/CustomerDetail.tsx`** — remove standalone `ImageGallery` (now inside form)
4. **`src/components/ImageGallery.tsx`** — adapt to be embeddable (no Card wrapper, inline style)
