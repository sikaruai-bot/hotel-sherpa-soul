# 🛡️ Hotel Sherpa Soul PMS – Disaster Recovery & Backup Runbook

> **Hotel Name**: Hotel Sherpa Soul  
> **PAN Number**: 119205419  
> **Address**: Bhagawati Marg-26, Thamel, Kathmandu, Nepal  
> **Hotline**: +977-1-4530311 / 9851068219  
> **Production URL**: [https://pms.hotelsherpasoul.com](https://pms.hotelsherpasoul.com)  
> **GitHub Repository**: `https://github.com/sikaruai-bot/hotel-sherpa-soul.git`  
> **Primary Branch**: `pms` | **Redundant Backup Branch**: `pms-stable`  

---

## 📌 १. ब्याकअप र सुरक्षा नीति (Backup Architecture)

तपाईंको PMS प्रणालीमा ३ तहको सुरक्षा (3-Tier Redundancy) व्यवस्था गरिएको छ, जसले गर्दा कुनै पनि प्राविधिक गडबडी वा कम्प्युटर बिग्रिए पनि डेटा कहिल्यै हराउँदैन:

1. **कोड सुरक्षा (Codebase Redundancy)**:
   - सबै कोड, कम्पोनेन्ट, फारम, र स्क्रिप्टहरू GitHub को `pms` र `pms-stable` ब्रान्चमा सुरक्षित छन्।
   - स्थायी प्रोडक्सन रिलिज ट्याग `v1.0.0-pms-production` ले कोडलाई सुरक्षित राखेको छ।
2. **डेटाबेस सुरक्षा (Database Snapshot Policy)**:
   - प्रत्येक बुकिङ, पाहुनाको विवरण, परिचयपत्र/कागजात, कोठा स्थिति, बिल र भुक्तानीहरू PostgreSQL क्लाउड डेटाबेसमा सुरक्षित हुन्छन्।
   - ब्याकअप फाइल `backups/` फोल्डरमा टाइमस्ट्याम्पसहित JSON ढाँचामा भण्डारण हुन्छ।
3. **सर्भर लचिलोपन (Serverless Crash-Proof Shield)**:
   - `src/lib/prisma.ts` मा कनेक्शन पुलिङ, टाइमआउट र एरर-ह्यान्डलर शील्ड राखिएको छ, जसले गर्दा इन्टरनेटमा अस्थायी समस्या आए पनि सर्भर क्र्यास हुँदैन।

---

## ⚡ २. १-क्लिक ब्याकअप कमाण्ड (Instant 1-Click Backup)

कुनै पनि बेला तत्काल सम्पूर्ण डेटाबेसको ब्याकअप लिन:

```bash
npm run db:backup
```

**यसले के गर्छ?**
- कोठा (Rooms), पाहुनाहरू (Guests), बुकिङहरू (Reservations), बिलहरू (Invoices), र भुक्तानीहरू (Payments) सबैलाई सुरक्षित गरी `backups/latest-pms-backup.json` मा सेभ गर्छ।

---

## 🔄 ३. १-क्लिक पुनःस्थापना कमाण्ड (Instant 1-Click Restore)

यदि कसैले गल्तीले डेटा मेट्यो वा डेटाबेसमा समस्या आयो भने तुरुन्तै पूर्ववत गर्न:

```bash
npm run db:restore
```

- यसले पछिल्लो ब्याकअपबाट सबै डेटा १ सेकेन्डमै पुनःस्थापना (Restore) गर्छ।
- यदि कुनै पुरानो मितिको विशिष्ट ब्याकअप फाइलबाट पुनःस्थापना गर्नुपरेमा:
  ```bash
  npx tsx scripts/restore-db.ts backups/pms-backup-2026-09-14T12-43-49-981Z.json
  ```

---

## 🚨 ४. विपद् व्यवस्थापन कार्यविधि (Disaster Scenarios & Solutions)

### परिस्थिति १: कम्प्युटर बिग्रियो वा नयाँ कम्प्युटरमा PMS सार्नुपर्यो भने (New Machine Setup)
नयाँ कम्प्युटरमा २ मिनेटमै पूरा सिस्टम सुरु गर्ने तरिका:
```bash
# १. GitHub बाट कोड डाउनलोड गर्नुहोस्
git clone https://github.com/sikaruai-bot/hotel-sherpa-soul.git -b pms

# २. फोल्डरभित्र जानुहोस्
cd hotel-sherpa-soul

# ३. आवश्यक प्याकेजहरू इन्स्टल गर्नुहोस्
npm install

# ४. डेटाबेस पुनःस्थापना गर्नुहोस्
npm run db:restore

# ५. लाइभ सर्भरमा डिप्लोय गर्नुहोस्
npm run deploy
```

### परिस्थिति २: Vercel सर्भरमा केही गडबडी आएमा (Instant Live Redeploy)
कम्प्युटरबाट १-कमाण्डमा लाइभ बनाउन:
```bash
npx vercel --prod --yes
```

---

## 📞 प्राविधिक सम्पर्क (Emergency Contacts)
- **होटल व्यवस्थापक**: Mingma Sherpa / Pasang Sherpa
- **होटल फोन**: +977-1-4530311 / 9851068219
- **आधिकारिक इमेल**: info@hotelsherpasoul.com
