# resident_manager

نظام عربي متكامل لإدارة المقيمين في مخيمات الإيواء يهدف إلى تسهيل:

- إدارة بيانات المقيمين
- إدارة العائلات وربط أفراد الأسرة
- إدارة المساعدات الإنسانية
- إدارة الحالات الصحية
- تتبع الخيام ومواقع الإيواء
- إنشاء التقارير والإحصائيات

تم بناء المشروع باستخدام:

- Next.js (App Router)
- TypeScript
- MariaDB
- TypeORM
- Tailwind CSS

---

# المميزات الرئيسية

- واجهة عربية كاملة RTL
- تصميم احترافي مناسب للاستخدام الميداني
- دعم الأجهزة اللوحية والهواتف
- إدارة العائلات وربط أفراد الأسرة
- احتساب العمر تلقائياً
- تصنيف ذكي للفئات العمرية والحالات الخاصة
- إدارة المساعدات الإنسانية
- منع تكرار المساعدات خلال فترة زمنية محددة
- تقارير تفصيلية للأفراد والعائلات
- بحث عربي متوافق مع utf8mb4
- جداول احترافية مع:
  - Pagination
  - Sticky Headers
  - Search & Filters
- تنبيهات ورسائل واضحة للمستخدم
- Clean Architecture
- REST API كاملة
- Backend باستخدام Route Handlers
- Production Ready
- قابل للتوسعة مستقبلاً

---

# متطلبات التشغيل (Windows)

## نظام التشغيل

- Windows 10 أو Windows 11
- يفضل Windows 11 64-bit

---

## Node.js

### الإصدار المطلوب

```bash
Node.js v20.11.1 LTS
```

### التحقق من الإصدار

```bash
node -v
```

### التحميل

```txt
https://nodejs.org
```

---

## npm

يأتي تلقائياً مع Node.js

### الإصدار المقترح

```bash
npm 10+
```

### التحقق من الإصدار

```bash
npm -v
```

---

## MariaDB Server

### الإصدار المطلوب

```bash
MariaDB 11.4+
```

### التحميل

```txt
https://mariadb.org/download/
```

### أثناء التثبيت

قم بتفعيل:

- MariaDB Server
- Command Line Client

### معلومات مهمة أثناء التثبيت

احفظ:

- اسم المستخدم
- كلمة المرور
- المنفذ

المنفذ الافتراضي:

```txt
3306
```

### التحقق من التثبيت

```bash
mysql --version
```

---

## Git

### الإصدار المقترح

```bash
Git 2.45+
```

### التحميل

```txt
https://git-scm.com/download/win
```

### التحقق من الإصدار

```bash
git --version
```

---

# إنشاء قاعدة البيانات

افتح MariaDB Command Line أو أي أداة إدارة قواعد بيانات ثم نفذ:

إذا كانت mysql مضافة إلى PATH اكتب الأمر مباشرة.

إذا لم تكن مضافة افتح مجلد MariaDB ثم ادخل إلى مجلد bin ونفذ:

```bash
mysql -u root -p
```

أدخل كلمة المرور ثم اضغط Enter.

ثم نفذ:

```sql
CREATE DATABASE resident_manager_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

# إنشاء المشروع

## استنساخ المشروع

```bash
git clone https://github.com/your-username/resident_manager
```

---

## الدخول إلى المشروع

```bash
cd resident_manager
```

---

# تثبيت الحزم

```bash
npm install
```

---

# الحزم الأساسية المستخدمة

## Backend

```txt
next
react
react-dom
typescript
typeorm
mysql2
reflect-metadata
class-validator
class-transformer
jsonwebtoken
bcryptjs
```

---

## Frontend

```txt
tailwindcss
postcss
autoprefixer
react-hook-form
zod
```

---

# إعداد ملف البيئة

أنشئ ملف:

```txt
.env
```

ثم أضف:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=resident_manager_db



JWT_SECRET=your_secret_key

NEXT_PUBLIC_APP_NAME=resident_manager
```

---

# تشغيل المشروع

## وضع التطوير

```bash
npm run dev
```

ثم افتح:

```txt
http://localhost:3000
```

---

# بناء المشروع للإنتاج

```bash
npm run build
```

---

# تشغيل نسخة الإنتاج

```bash
npm start
```

---

# هيكل النظام

## إدارة المقيمين

يدعم النظام إدارة:

- الاسم الكامل
- الرقم الوطني
- الجنس
- تاريخ الميلاد
- العمر (محسوب تلقائياً)
- الحالة الاجتماعية
- أرقام الهواتف
- الحالات الصحية
- الإعاقة
- الأمراض المزمنة

---

## إدارة العائلات

- ربط أفراد الأسرة برب الأسرة
- تحديد صلة القرابة
- إدارة الأسرة كوحدة واحدة
- مشاركة الخيمة بين أفراد الأسرة

---

## إدارة المساعدات

يدعم النظام:

- المساعدات النقدية
- المساعدات الغذائية
- المساعدات الطبية
- المساعدات الخاصة بالملابس

ويشمل:

- قيمة المساعدة
- تاريخ المساعدة
- مصدر المساعدة
- منع التكرار خلال فترة زمنية محددة

---

# التقارير

## تقارير الأفراد

- كبار السن
- أصحاب الأمراض المزمنة
- الحوامل
- المرضعات
- الأطفال أقل من سنتين
- الأطفال أقل من خمس سنوات

---

## تقارير العائلات

- العائلات التي لم تتلقَ مساعدات
- سجل مساعدات الأسرة
- تقارير حسب نوع المساعدة
- تقارير حسب الفترة الزمنية

---

# قواعد البيانات والعلاقات

## قاعدة البيانات

```txt
resident_manager_db
```

---

## الترميز

```txt
utf8mb4
```

---

## الكيانات الرئيسية

- User
- Resident
- AidRecord

---

## العلاقات

- Self Relation للعائلة
- One-to-Many بين رب الأسرة والأفراد

---

## الفهارس (Indexes)

- nationalId
- headOfHouseholdId
- dateOfBirth
- aidDate

---

# مراحل تنفيذ المشروع

يتم تنفيذ المشروع على مراحل واضحة ومنفصلة لضمان:

- سهولة الاختبار
- تقليل الأخطاء
- الحفاظ على جودة الكود
- احترام الاعتماديات بين المكونات

---

## مراحل التنفيذ

### Phase 1

Project Setup

### Phase 2

Database & TypeORM Setup

### Phase 3

Entities

### Phase 4

Database Connection Test

### Phase 5

REST API (CRUD)

### Phase 6

Business Logic

### Phase 7

Reports Queries

### Phase 8

UI & UX Implementation

---

# قواعد التطوير

## عند إنشاء ملفات جديدة

يجب دائماً توفير:

- المسار الكامل للملف
- المحتوى الكامل للملف

---

## عند تعديل ملفات موجودة

### إذا كان التعديل أقل من أو يساوي 20 سطر

يجب توفير:

- المسار الكامل
- أرقام الأسطر
- الكود القديم
- الكود الجديد

### إذا كان التعديل أكبر من 20 سطر

يجب إعادة كتابة الملف كاملاً.

---

# معايير تجربة المستخدم

- واجهة عربية RTL كاملة
- خطوط عربية واضحة
- تصميم بسيط وسريع
- أقل عدد نقرات ممكن
- رسائل أخطاء واضحة
- Inline Validation
- Mobile Friendly
- سرعة تحميل عالية
- مكونات خفيفة وسريعة

---

# API Endpoints

## Residents

```http
POST   /api/residents
PUT    /api/residents/:id
DELETE /api/residents/:id
GET    /api/residents
GET    /api/residents/:id
```

---

## Families

```http
GET /api/families
GET /api/families/:id
```

---

## Aid Records

```http
POST   /api/aid-records
GET    /api/aid-records
PUT    /api/aid-records/:id
DELETE /api/aid-records/:id
```

---

## Reports

```http
GET /api/reports/elderly
GET /api/reports/chronic-disease
GET /api/reports/pregnant
GET /api/reports/breastfeeding
GET /api/reports/children-under-2
GET /api/reports/children-under-5
GET /api/reports/no-aid
GET /api/reports/household-aid
```

---

# المصادقة Authentication

يدعم النظام:

- JWT Authentication
- حماية المسارات الحساسة
- جلسات تسجيل دخول آمنة

---

# الترخيص

```txt
MIT License
```