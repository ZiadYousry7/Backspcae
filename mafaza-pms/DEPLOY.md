# نشر موقع Mafaza PMS على الإنترنت

## الخطوة 1 — إنشاء قاعدة البيانات (Supabase) — 5 دقائق

### 1. اذهب إلى [supabase.com](https://supabase.com) وسجّل حساب مجاني

### 2. أنشئ مشروعاً جديداً
- اضغط **New Project**
- اسم المشروع: `mafaza-pms`
- ضع كلمة سر قوية واحفظها
- اضغط **Create new project** وانتظر دقيقتين

### 3. شغّل قاعدة البيانات
- اضغط على **SQL Editor** في القائمة الجانبية
- افتح ملف `supabase/schema.sql` من هذا المشروع
- انسخ كل المحتوى
- الصقه في SQL Editor
- اضغط **Run** (الزر الأخضر)

### 4. أنشئ أول مستخدم (أدمن)
- في نفس SQL Editor، اضغط **New query**
- الصق هذا الكود واضغط **Run**:

```sql
INSERT INTO public.profiles (id, email, full_name, role, is_active, password_hash)
VALUES (
  gen_random_uuid(),
  'admin@mafaza.com',
  'مدير النظام',
  'super_admin',
  true,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
);
```
> كلمة المرور الافتراضية هي: **Admin@123** — غيّرها بعد أول دخول

### 5. احفظ مفاتيح الـ API
- اضغط **Settings → API** من القائمة الجانبية
- احفظ هذه القيم الثلاث:
  - **Project URL** (مثال: `https://abcxyz.supabase.co`)
  - **anon public** key
  - **service_role** key

---

## الخطوة 2 — نشر الموقع (Vercel) — 3 دقائق

### اضغط هذا الزر للنشر التلقائي:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ZiadYousry7/Backspcae&root=mafaza-pms&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,AUTH_SECRET,NEXTAUTH_URL&envDescription=Required%20environment%20variables%20for%20Mafaza%20PMS&project-name=mafaza-pms&repo-name=mafaza-pms)

**أو اتبع هذه الخطوات:**

1. اذهب إلى [vercel.com](https://vercel.com) وسجّل حساب مجاني بحساب GitHub
2. اضغط **Add New → Project**
3. ابحث عن مشروع **ZiadYousry7/Backspcae** واضغط **Import**
4. في **Root Directory** اكتب: `mafaza-pms`
5. في **Environment Variables** أضف هذه القيم:

| الاسم | القيمة |
|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL من Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key من Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key من Supabase |
| `AUTH_SECRET` | أي نص عشوائي (32 حرف على الأقل) مثل: `mafaza-super-secret-key-2025-change-me` |
| `NEXTAUTH_URL` | اتركه فارغاً الآن، ستضيفه بعد النشر |

6. اضغط **Deploy** وانتظر دقيقتين
7. ستحصل على رابط مثل: `https://mafaza-pms-xyz.vercel.app`
8. ارجع إلى **Settings → Environment Variables** وأضف:
   - `NEXTAUTH_URL` = رابط موقعك الكامل

---

## الدخول إلى الموقع

بعد النشر:
- **البريد الإلكتروني:** `admin@mafaza.com`
- **كلمة المرور:** `Admin@123`

**غيّر كلمة المرور فوراً!**

---

## هل تحتاج مساعدة؟

إذا واجهت أي مشكلة في أي خطوة، أخبرني وسأساعدك.
