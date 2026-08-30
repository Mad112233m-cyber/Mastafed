import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  CircleDashed,
  Plus,
  ChevronRight,
  Pencil,
  Trash2,
  Wallet,
  TrendingUp,
  X,
  Check,
  BellRing,
  LogOut,
  Mail,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { db, auth } from "./firebase.js";

import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// ===============================
// حساب صاحب الدفتر
// ===============================
const ADMIN_UID = "GFsIqeLOFAgtPc98Kq8bu3253b42";

// ===============================
// ألوان التطبيق
// ===============================
const COLORS = {
  cover: "#16241F",
  coverDeep: "#0E1815",
  paper: "#F4EEDC",
  paperLine: "#E4D8B4",
  ink: "#26332B",
  inkSoft: "#5C6B5F",
  gold: "#B8902E",
  goldDeep: "#8E6E1F",
  stampRed: "#A6392C",
  stampMuted: "#8B7355",
  profit: "#3B6B4A",
};

const FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Rakkas&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');";

// ===============================
// مراجع Firestore
// ===============================
function getUserDocRef(uid) {
  return doc(db, "users", uid, "app-data", "beneficiaries");
}

function getProfileDocRef(uid) {
  return doc(db, "users", uid, "profile", "info");
}

function getPendingUserRef(uid) {
  return doc(db, "pendingUsers", uid);
}

// ===============================
// أدوات
// ===============================
function toEnglishDigits(text) {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternExtra = "۰۱۲۳۴۵۶۷۸۹";

  return text
    .split("")
    .map((ch) => {
      const i1 = arabicIndic.indexOf(ch);
      if (i1 !== -1) return String(i1);

      const i2 = easternExtra.indexOf(ch);
      if (i2 !== -1) return String(i2);

      return ch;
    })
    .join("");
}

function uid() {
  return (
    "b_" +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36)
  );
}

function money(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("ar-SA");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isDueOrOverdue(item) {
  if (item.paid || !item.dueDate) return false;
  return item.dueDate <= todayISO();
}

function daysUntil(dueDate) {
  const today = new Date(todayISO() + "T00:00:00");
  const due = new Date(dueDate + "T00:00:00");

  return Math.round((due - today) / 86400000);
}

function dueLabel(dueDate) {
  const d = daysUntil(dueDate);

  if (d === 0) return "يستحق اليوم";
  if (d < 0) return `متأخر ${Math.abs(d)} يوم`;

  return `متبقي ${d} يوم`;
}

function dueColor(dueDate) {
  const d = daysUntil(dueDate);

  if (d < 0) return COLORS.stampRed;
  if (d <= 3) return "#C9762E";

  return COLORS.goldDeep;
}

// ===============================
// ختم
// ===============================
function Stamp({ paid, size = 64 }) {
  const color = paid ? COLORS.stampRed : COLORS.stampMuted;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px ${paid ? "solid" : "dashed"} ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${paid ? -8 : 6}deg)`,
        color,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          border: `1px ${paid ? "solid" : "dashed"} ${color}`,
          opacity: 0.6,
        }}
      />

      {paid ? (
        <Check size={size * 0.38} strokeWidth={3} />
      ) : (
        <CircleDashed size={size * 0.34} strokeWidth={2.5} />
      )}
    </div>
  );
}

// ===============================
// خلفية الورق
// ===============================
function DotPaper({ children, style }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.paper,
        backgroundImage: `radial-gradient(${COLORS.paperLine} 1px, transparent 1px)`,
        backgroundSize: "18px 18px",
        minHeight: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ===============================
// الشريط العلوي
// ===============================
function TopBar({ title, onBack, right }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.cover,
        color: COLORS.paper,
        padding: "18px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
      }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            background: "rgba(244,238,220,0.1)",
            border: "none",
            color: COLORS.paper,
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronRight size={20} />
        </button>
      ) : (
        <div style={{ width: 34 }} />
      )}

      <div
        style={{
          fontFamily: "'Rakkas', serif",
          fontSize: 21,
          flex: 1,
          textAlign: "center",
        }}
      >
        {title}
      </div>

      <div
        style={{
          width: 34,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {right}
      </div>
    </div>
  );
}

// ===============================
// الخانات الرئيسية
// ===============================
function StatTile({ icon, label, count, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#FFFDF6",
        border: `1px solid ${COLORS.paperLine}`,
        borderRight: `5px solid ${accent}`,
        borderRadius: 10,
        padding: "16px",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(38,51,43,0.08)",
        textAlign: "right",
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: accent + "1A",
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: COLORS.ink,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 12,
            color: COLORS.inkSoft,
            marginTop: 2,
          }}
        >
          عرض القائمة
        </div>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: accent,
          minWidth: 30,
          textAlign: "center",
        }}
      >
        {count}
      </div>
    </button>
  );
}

// ===============================
// الحقول
// ===============================
function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div
        style={{
          fontSize: 13,
          color: COLORS.inkSoft,
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 8,
  border: `1px solid ${COLORS.paperLine}`,
  background: "#FFFDF6",
  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
  fontSize: 15,
  color: COLORS.ink,
  outline: "none",
};

// ===============================
// التطبيق
// ===============================
export default function App() {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  const [initError, setInitError] = useState("");
  const [slowLoad, setSlowLoad] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useState("home");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    given: "",
    toReturn: "",
    date: todayISO(),
    dueDate: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingError, setPendingError] = useState("");

  const isAdmin = user?.uid === ADMIN_UID;

  // ===============================
  // مراقبة تسجيل الدخول
  // ===============================
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user === undefined) {
        setSlowLoad(true);
        setInitError(
          "تعذر الاتصال بخدمة تسجيل الدخول"
        );
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        clearTimeout(timer);
        setSlowLoad(false);
        setInitError("");
        setUser(currentUser || null);
      },
      (err) => {
        clearTimeout(timer);
        setSlowLoad(true);

        setInitError(
          err?.code
            ? `${err.code}: ${err.message}`
            : "تعذر الاتصال"
        );

        setUser(null);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // ===============================
  // جلب طلبات الحسابات للأدمن
  // ===============================
  useEffect(() => {
    if (!isAdmin) {
      setPendingUsers([]);
      setPendingError("");
      return;
    }

    const pendingRef = collection(db, "pendingUsers");

    const q = query(
      pendingRef,
      where("approved", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPendingUsers(
          snap.docs.map((d) => ({
            uid: d.id,
            email: d.data().email || "",
          }))
        );

        setPendingError("");
      },
      (err) => {
        console.error("PENDING USERS ERROR:", err);

        setPendingUsers([]);

        if (err?.code === "permission-denied") {
          setPendingError(
            "ما عندك صلاحية لجلب الحسابات"
          );
        } else {
          setPendingError(
            "تعذر جلب الحسابات"
          );
        }
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // ===============================
  // الموافقة على حساب
  // ===============================
  async function approveUser(uid) {
    try {
      setError("");

      // تفعيل الحساب
      await updateDoc(
        getProfileDocRef(uid),
        {
          approved: true,
        }
      );

      // حذف طلب الموافقة
      await deleteDoc(
        getPendingUserRef(uid)
      );

    } catch (e) {
      console.error("APPROVE ERROR:", e);

      setError(
        e?.code === "permission-denied"
          ? "ما عندك صلاحية للموافقة على الحساب"
          : "تعذر الموافقة على الحساب"
      );
    }
  }

  // ===============================
  // جلب ملف المستخدم
  // ===============================
  useEffect(() => {
    if (!user) {
      setProfile(undefined);
      return;
    }

    // الأدمن يدخل مباشرة
    if (user.uid === ADMIN_UID) {
      setProfile({
        email: user.email || "",
        approved: true,
      });
      return;
    }

    const unsubscribe = onSnapshot(
      getProfileDocRef(user.uid),
      (snap) => {
        setProfile(
          snap.exists()
            ? snap.data()
            : null
        );
      },
      (err) => {
        console.error("PROFILE ERROR:", err);
        setProfile(null);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ===============================
  // جلب بيانات المستفيدين
  // ===============================
  useEffect(() => {
    if (
      !user ||
      profile === undefined ||
      profile === null ||
      !profile.approved
    ) {
      setItems([]);
      setLoaded(false);
      return;
    }

    const unsubscribe = onSnapshot(
      getUserDocRef(user.uid),
      (snap) => {
        if (snap.exists()) {
          setItems(
            snap.data().items || []
          );
        } else {
          setItems([]);
        }

        setLoaded(true);
      },
      (err) => {
        console.error("DATA ERROR:", err);

        setError(
          err?.code === "permission-denied"
            ? "ما عندك صلاحية للوصول للبيانات"
            : "تعذر الاتصال بقاعدة البيانات"
        );

        setLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user, profile]);

  // ===============================
  // حفظ البيانات
  // ===============================
  const persist = useCallback(
    async (next) => {
      if (!user) return;

      setItems(next);

      try {
        await setDoc(
          getUserDocRef(user.uid),
          {
            items: next,
          }
        );
      } catch (e) {
        console.error("SAVE ERROR:", e);

        setError(
          e?.code === "permission-denied"
            ? "ما عندك صلاحية لحفظ البيانات"
            : "تعذر حفظ البيانات"
        );
      }
    },
    [user]
  );

  // ===============================
  // تسجيل الدخول / إنشاء حساب
  // ===============================
  async function handleAuthSubmit() {
    setAuthError("");

    const email = authForm.email.trim();
    const password = authForm.password;

    if (!email || !password) {
      setAuthError(
        "اكتب الإيميل وكلمة المرور"
      );
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        // إنشاء الحساب في Firebase Authentication
        const cred =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        // إنشاء ملف المستخدم
        await setDoc(
          getProfileDocRef(
            cred.user.uid
          ),
          {
            email,
            approved: false,
          }
        );

        // إنشاء طلب موافقة للأدمن
        await setDoc(
          getPendingUserRef(
            cred.user.uid
          ),
          {
            email,
            approved: false,
            uid: cred.user.uid,
            createdAt:
              new Date().toISOString(),
          }
        );

      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
    } catch (e) {
      console.error("AUTH ERROR:", e);

      const map = {
        "auth/email-already-in-use":
          "هذا الإيميل مسجل من قبل",

        "auth/invalid-email":
          "صيغة الإيميل غير صحيحة",

        "auth/weak-password":
          "كلمة المرور لازم تكون 6 أحرف أو أكثر",

        "auth/invalid-credential":
          "الإيميل أو كلمة المرور غير صحيحة",

        "auth/user-not-found":
          "لا يوجد حساب بهذا الإيميل",

        "auth/wrong-password":
          "كلمة المرور غير صحيحة",

        "auth/too-many-requests":
          "محاولات كثيرة، انتظر شوي ثم حاول مرة ثانية",

        "permission-denied":
          "ما عندك صلاحية لتنفيذ العملية",
      };

      setAuthError(
        map[e.code] ||
          "صار خطأ، حاول مرة ثانية"
      );
    } finally {
      setAuthLoading(false);
    }
  }

  // ===============================
  // تسجيل الخروج
  // ===============================
  async function handleLogout() {
    try {
      await signOut(auth);
      setView("home");
    } catch (e) {
      setAuthError(
        "تعذر تسجيل الخروج"
      );
    }
  }

  // ===============================
  // الإحصائيات
  // ===============================
  const totalGiven = items.reduce(
    (s, i) =>
      s + (Number(i.given) || 0),
    0
  );

  const totalProfit = items
    .filter((i) => i.paid)
    .reduce(
      (s, i) =>
        s +
        (Number(i.toReturn) -
          Number(i.given)),
      0
    );

  const paidCount =
    items.filter((i) => i.paid).length;

  const unpaidCount =
    items.filter((i) => !i.paid).length;

  const dueItems =
    items.filter(isDueOrOverdue);

  // ===============================
  // التنقل
  // ===============================
  function openList(f) {
    setFilter(f);
    setView("list");
  }

  function openDetail(id) {
    setSelectedId(id);
    setView("detail");
  }

  function openAddForm() {
    setEditingId(null);

    setForm({
      name: "",
      given: "",
      toReturn: "",
      date: todayISO(),
      dueDate: "",
      notes: "",
    });

    setError("");
    setView("form");
  }

  function openEditForm(item) {
    setEditingId(item.id);

    setForm({
      name: item.name,
      given: String(item.given),
      toReturn: String(item.toReturn),
      date: item.date || todayISO(),
      dueDate: item.dueDate || "",
      notes: item.notes || "",
    });

    setError("");
    setView("form");
  }

  // ===============================
  // حفظ المستفيد
  // ===============================
  async function submitForm() {
    if (!form.name.trim()) {
      setError(
        "اكتب اسم المستفيد"
      );
      return;
    }

    if (
      form.given === "" ||
      isNaN(Number(form.given))
    ) {
      setError(
        "اكتب المبلغ المعطى بشكل صحيح"
      );
      return;
    }

    if (
      form.toReturn === "" ||
      isNaN(Number(form.toReturn))
    ) {
      setError(
        "اكتب المبلغ الذي سيرجع بشكل صحيح"
      );
      return;
    }

    setSaving(true);
    setError("");

    let next;

    if (editingId) {
      next = items.map((i) =>
        i.id === editingId
          ? {
              ...i,
              name: form.name.trim(),
              given: Number(
                form.given
              ),
              toReturn: Number(
                form.toReturn
              ),
              date: form.date,
              dueDate: form.dueDate,
              notes: form.notes,
            }
          : i
      );
    } else {
      next = [
        ...items,
        {
          id: uid(),
          name: form.name.trim(),
          given: Number(
            form.given
          ),
          toReturn: Number(
            form.toReturn
          ),
          date: form.date,
          dueDate: form.dueDate,
          notes: form.notes,
          paid: false,
        },
      ];
    }

    await persist(next);

    setSaving(false);

    if (editingId) {
      openDetail(editingId);
    } else {
      setView("home");
    }
  }

  // ===============================
  // تغيير حالة السداد
  // ===============================
  async function togglePaid(id) {
    const next = items.map((i) =>
      i.id === id
        ? {
            ...i,
            paid: !i.paid,
          }
        : i
    );

    await persist(next);
  }

  // ===============================
  // حذف مستفيد
  // ===============================
  async function deleteItem(id) {
    const next = items.filter(
      (i) => i.id !== id
    );

    await persist(next);
    setView("home");
  }

  const selected = items.find(
    (i) => i.id === selectedId
  );

  const listItems =
    filter === "paid"
      ? items.filter((i) => i.paid)
      : filter === "unpaid"
      ? items.filter((i) => !i.paid)
      : filter === "due"
      ? items.filter(isDueOrOverdue)
      : items;

  const filterTitle =
    filter === "paid"
      ? "تم السداد"
      : filter === "unpaid"
      ? "لم يتم السداد"
      : filter === "due"
      ? "مواعيد السداد المستحقة"
      : "المستفيدين";

  // ===============================
  // واجهة التطبيق
  // ===============================
  return (
    <div
      dir="rtl"
      style={{
        height: "100%",
        minHeight: "100vh",
        background: COLORS.cover,
      }}
    >
      <style>
        {`
          ${FONTS_IMPORT}

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
          }

          ::placeholder {
            color: #A69B85;
          }

          button {
            font-family: 'IBM Plex Sans Arabic', sans-serif;
          }
        `}
      </style>

      {/* =========================
          تحميل Firebase
      ========================= */}
      {user === undefined ? (
        <div
          style={{
            color: COLORS.paper,
            textAlign: "center",
            padding: 60,
            fontFamily:
              "'IBM Plex Sans Arabic', sans-serif",
          }}
        >
          جار التحميل...

          {slowLoad && (
            <div
              style={{
                marginTop: 20,
                fontSize: 12,
                color: "#E4A0A0",
                lineHeight: 1.9,
              }}
            >
              الاتصال يأخذ وقت أطول من المعتاد

              {initError && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                  }}
                >
                  {initError}
                </div>
              )}

              <div
                style={{
                  marginTop: 14,
                }}
              >
                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  style={{
                    background:
                      "rgba(244,238,220,0.1)",
                    border: "none",
                    color: COLORS.paper,
                    borderRadius: 8,
                    padding:
                      "8px 16px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          )}
        </div>
      ) : !user ? (
        /* =========================
           تسجيل الدخول
        ========================= */
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontFamily:
                  "'Rakkas', serif",
                fontSize: 30,
                color: COLORS.paper,
              }}
            >
              دفتر المستفيدين
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#C9BFA0",
                marginTop: 6,
              }}
            >
              {authMode === "login"
                ? "سجل دخولك لمتابعة دفترك"
                : "انشئ حساب جديد"}
            </div>
          </div>

          <div
            style={{
              background: COLORS.paper,
              borderRadius: 16,
              padding: 22,
            }}
          >
            <Field label="الإيميل">
              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  style={{
                    ...inputStyle,
                    paddingLeft: 38,
                  }}
                  type="email"
                  value={
                    authForm.email
                  }
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      email:
                        e.target.value,
                    })
                  }
                  placeholder="example@email.com"
                  dir="ltr"
                />

                <Mail
                  size={16}
                  color={COLORS.inkSoft}
                  style={{
                    position:
                      "absolute",
                    left: 12,
                    top: 13,
                  }}
                />
              </div>
            </Field>

            <Field label="كلمة المرور">
              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  style={{
                    ...inputStyle,
                    paddingLeft: 38,
                  }}
                  type="password"
                  value={
                    authForm.password
                  }
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      password:
                        e.target.value,
                    })
                  }
                  placeholder="6 أحرف على الأقل"
                  dir="ltr"
                />

                <Lock
                  size={16}
                  color={COLORS.inkSoft}
                  style={{
                    position:
                      "absolute",
                    left: 12,
                    top: 13,
                  }}
                />
              </div>
            </Field>

            {authError && (
              <div
                style={{
                  color:
                    COLORS.stampRed,
                  fontSize: 13,
                  marginBottom: 12,
                  lineHeight: 1.6,
                }}
              >
                {authError}
              </div>
            )}

            <button
              onClick={
                handleAuthSubmit
              }
              disabled={
                authLoading
              }
              style={{
                width: "100%",
                background:
                  COLORS.ink,
                color:
                  COLORS.paper,
                border: "none",
                borderRadius: 10,
                padding: "13px",
                fontSize: 15,
                fontWeight: 600,
                cursor:
                  authLoading
                    ? "default"
                    : "pointer",
                opacity:
                  authLoading
                    ? 0.7
                    : 1,
                marginTop: 4,
              }}
            >
              {authLoading
                ? "جار التحقق..."
                : authMode === "login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
            </button>

            <button
              onClick={() => {
                setAuthMode(
                  authMode === "login"
                    ? "signup"
                    : "login"
                );
                setAuthError("");
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color:
                  COLORS.goldDeep,
                fontSize: 13,
                padding: 12,
                cursor: "pointer",
              }}
            >
              {authMode === "login"
                ? "ما عندك حساب؟ انشئ واحد"
                : "عندك حساب؟ سجل دخول"}
            </button>
          </div>
        </div>
      ) : isAdmin ? (
        /* =========================
           الأدمن
        ========================= */
        !loaded ? (
          <div
            style={{
              color: COLORS.paper,
              textAlign: "center",
              padding: 60,
              fontFamily:
                "'IBM Plex Sans Arabic', sans-serif",
            }}
          >
            جار التحميل...
          </div>
        ) : (
          <>
            {view === "home" && (
              <div>
                <div
                  style={{
                    background:
                      `linear-gradient(180deg, ${COLORS.cover}, ${COLORS.coverDeep})`,
                    padding:
                      "34px 20px 26px",
                    color:
                      COLORS.paper,
                    position:
                      "relative",
                  }}
                >
                  <div
                    style={{
                      fontFamily:
                        "'Rakkas', serif",
                      fontSize: 30,
                      textAlign:
                        "center",
                      marginBottom: 4,
                    }}
                  >
                    دفتر المستفيدين
                  </div>

                  <button
                    onClick={
                      handleLogout
                    }
                    style={{
                      position:
                        "absolute",
                      left: 16,
                      top: 30,
                      background:
                        "rgba(244,238,220,0.08)",
                      border: "none",
                      color:
                        "#C9BFA0",
                      borderRadius: 8,
                      padding:
                        "6px 10px",
                      fontSize: 11,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 4,
                      cursor:
                        "pointer",
                    }}
                  >
                    <LogOut size={13} />
                    خروج
                  </button>

                  <button
                    onClick={() =>
                      setView("admin")
                    }
                    style={{
                      position:
                        "absolute",
                      right: 16,
                      top: 30,
                      background:
                        pendingUsers.length >
                        0
                          ? COLORS.stampRed
                          : "rgba(244,238,220,0.08)",
                      border:
                        "none",
                      color:
                        pendingUsers.length >
                        0
                          ? "#FFF"
                          : "#C9BFA0",
                      borderRadius: 8,
                      padding:
                        "6px 10px",
                      fontSize: 11,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: 4,
                      cursor:
                        "pointer",
                    }}
                  >
                    <ShieldCheck
                      size={13}
                    />
                    إدارة الحسابات

                    {pendingUsers.length >
                      0 &&
                      ` (${pendingUsers.length})`}
                  </button>

                  <div
                    style={{
                      textAlign:
                        "center",
                      fontSize: 12,
                      color:
                        "#C9BFA0",
                      marginBottom: 24,
                    }}
                  >
                    متابعة السلف والسداد
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        background:
                          "rgba(244,238,220,0.06)",
                        border:
                          "1px solid rgba(184,144,46,0.35)",
                        borderRadius: 12,
                        padding:
                          "14px 12px",
                        textAlign:
                          "center",
                      }}
                    >
                      <Wallet
                        size={18}
                        color={
                          COLORS.gold
                        }
                      />

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            "#C9BFA0",
                          margin:
                            "6px 0 4px",
                        }}
                      >
                        رأس المال
                      </div>

                      <div
                        style={{
                          fontWeight:
                            700,
                          fontSize: 18,
                          color:
                            COLORS.gold,
                        }}
                      >
                        {money(
                          totalGiven
                        )}{" "}
                        ريال
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        background:
                          "rgba(244,238,220,0.06)",
                        border:
                          "1px solid rgba(59,107,74,0.45)",
                        borderRadius: 12,
                        padding:
                          "14px 12px",
                        textAlign:
                          "center",
                      }}
                    >
                      <TrendingUp
                        size={18}
                        color="#6FBF8B"
                      />

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            "#C9BFA0",
                          margin:
                            "6px 0 4px",
                        }}
                      >
                        إجمالي الربح
                      </div>

                      <div
                        style={{
                          fontWeight:
                            700,
                          fontSize: 18,
                          color:
                            "#6FBF8B",
                        }}
                      >
                        {money(
                          totalProfit
                        )}{" "}
                        ريال
                      </div>
                    </div>
                  </div>
                </div>

                <DotPaper
                  style={{
                    padding: 16,
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: 12,
                    borderTopLeftRadius: 22,
                    borderTopRightRadius: 22,
                    marginTop: -14,
                  }}
                >
                  <div style={{ height: 6 }} />

                  <StatTile
                    icon={<Users size={20} />}
                    label="المستفيدين"
                    count={items.length}
                    accent={COLORS.goldDeep}
                    onClick={() =>
                      openList("all")
                    }
                  />

                  <StatTile
                    icon={
                      <CheckCircle2 size={20} />
                    }
                    label="تم السداد"
                    count={paidCount}
                    accent={COLORS.profit}
                    onClick={() =>
                      openList("paid")
                    }
                  />

                  <StatTile
                    icon={
                      <CircleDashed size={20} />
                    }
                    label="لم يتم السداد"
                    count={unpaidCount}
                    accent={COLORS.stampRed}
                    onClick={() =>
                      openList("unpaid")
                    }
                  />

                  <StatTile
                    icon={
                      <BellRing size={20} />
                    }
                    label="مواعيد السداد المستحقة"
                    count={dueItems.length}
                    accent={COLORS.stampRed}
                    onClick={() =>
                      openList("due")
                    }
                  />

                  <button
                    onClick={
                      openAddForm
                    }
                    style={{
                      marginTop: 10,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap: 8,
                      background:
                        COLORS.ink,
                      color:
                        COLORS.paper,
                      border:
                        "none",
                      borderRadius: 10,
                      padding:
                        "13px",
                      fontSize: 15,
                      fontWeight:
                        600,
                      cursor:
                        "pointer",
                    }}
                  >
                    <Plus size={18} />
                    إضافة مستفيد جديد
                  </button>
                </DotPaper>
              </div>
            )}

            {view === "list" && (
              <div>
                <TopBar
                  title={filterTitle}
                  onBack={() =>
                    setView("home")
                  }
                />

                <DotPaper
                  style={{
                    padding: 16,
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: 10,
                  }}
                >
                  {listItems.length ===
                    0 && (
                    <div
                      style={{
                        textAlign:
                          "center",
                        color:
                          COLORS.inkSoft,
                        fontSize: 13,
                        marginTop: 30,
                      }}
                    >
                      لا يوجد أحد بهذه القائمة
                    </div>
                  )}

                  {listItems.map((it) => {
                    const profit =
                      Number(
                        it.toReturn
                      ) -
                      Number(
                        it.given
                      );

                    return (
                      <button
                        key={it.id}
                        onClick={() =>
                          openDetail(
                            it.id
                          )
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 12,
                          background:
                            "#FFFDF6",
                          border:
                            `1px solid ${COLORS.paperLine}`,
                          borderRadius: 10,
                          padding:
                            "13px 14px",
                          cursor:
                            "pointer",
                          textAlign:
                            "right",
                        }}
                      >
                        <Stamp
                          paid={
                            it.paid
                          }
                          size={40}
                        />

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight:
                                600,
                              color:
                                COLORS.ink,
                            }}
                          >
                            {it.name}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color:
                                COLORS.inkSoft,
                              marginTop: 2,
                            }}
                          >
                            معطى{" "}
                            {money(
                              it.given
                            )}{" "}
                            ·{" "}
                            {it.paid
                              ? `ربح ${money(
                                  profit
                                )}`
                              : "بانتظار السداد"}
                          </div>

                          {!it.paid &&
                            it.dueDate && (
                              <div
                                style={{
                                  fontSize: 11,
                                  marginTop: 3,
                                  fontWeight: 700,
                                  color:
                                    dueColor(
                                      it.dueDate
                                    ),
                                }}
                              >
                                {dueLabel(
                                  it.dueDate
                                )}
                              </div>
                            )}
                        </div>

                        <ChevronRight
                          size={18}
                          color={
                            COLORS.inkSoft
                          }
                          style={{
                            transform:
                              "rotate(180deg)",
                          }}
                        />
                      </button>
                    );
                  })}
                </DotPaper>
              </div>
            )}

            {view === "detail" &&
              selected && (
                <div>
                  <TopBar
                    title="تفاصيل المستفيد"
                    onBack={() =>
                      setView("list")
                    }
                    right={
                      <button
                        onClick={() =>
                          openEditForm(
                            selected
                          )
                        }
                        style={{
                          background:
                            "none",
                          border:
                            "none",
                          color:
                            COLORS.paper,
                          cursor:
                            "pointer",
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                    }
                  />

                  <DotPaper
                    style={{
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
                        marginBottom: 20,
                      }}
                    >
                      <Stamp
                        paid={
                          selected.paid
                        }
                        size={72}
                      />

                      <div
                        style={{
                          fontFamily:
                            "'Rakkas', serif",
                          fontSize: 24,
                          color:
                            COLORS.ink,
                          marginTop: 12,
                        }}
                      >
                        {
                          selected.name
                        }
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color:
                            COLORS.inkSoft,
                          marginTop: 4,
                        }}
                      >
                        {
                          selected.date
                        }{" "}
                        ·{" "}
                        {selected.paid
                          ? "تم السداد"
                          : "لم يتم السداد"}
                      </div>

                      {selected.dueDate &&
                        !selected.paid && (
                          <div
                            style={{
                              marginTop: 12,
                              background:
                                isDueOrOverdue(
                                  selected
                                )
                                  ? "#FBEAE6"
                                  : "#FFFDF6",
                              border:
                                `1.5px solid ${dueColor(
                                  selected.dueDate
                                )}`,
                              borderRadius: 10,
                              padding:
                                "10px 16px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 8,
                              fontSize: 14,
                              fontWeight: 700,
                              color:
                                dueColor(
                                  selected.dueDate
                                ),
                            }}
                          >
                            {isDueOrOverdue(
                              selected
                            ) && (
                              <BellRing
                                size={16}
                              />
                            )}

                            <span>
                              {dueLabel(
                                selected.dueDate
                              )}
                            </span>
                          </div>
                        )}
                    </div>

                    <div
                      style={{
                        background:
                          "#FFFDF6",
                        border:
                          `1px solid ${COLORS.paperLine}`,
                        borderRadius: 12,
                        overflow:
                          "hidden",
                        marginBottom: 16,
                      }}
                    >
                      <Row
                        label="المبلغ المعطى"
                        value={money(
                          selected.given
                        )}
                        color={
                          COLORS.goldDeep
                        }
                      />

                      <Row
                        label="المبلغ الذي سيرجع"
                        value={money(
                          selected.toReturn
                        )}
                        color={
                          COLORS.ink
                        }
                      />

                      {selected.paid ? (
                        <Row
                          label="الربح"
                          value={money(
                            Number(
                              selected.toReturn
                            ) -
                              Number(
                                selected.given
                              )
                          )}
                          color={
                            COLORS.profit
                          }
                          last
                        />
                      ) : (
                        <div
                          style={{
                            padding:
                              "14px 16px",
                            fontSize: 12,
                            color:
                              COLORS.stampMuted,
                            textAlign:
                              "center",
                          }}
                        >
                          الربح يظهر بعد تحديد تم السداد
                        </div>
                      )}
                    </div>

                    {selected.notes && (
                      <div
                        style={{
                          background:
                            "#FFFDF6",
                          border:
                            `1px solid ${COLORS.paperLine}`,
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 16,
                          fontSize: 14,
                          color:
                            COLORS.ink,
                          lineHeight: 1.7,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              COLORS.inkSoft,
                            marginBottom: 6,
                            fontWeight: 600,
                          }}
                        >
                          ملاحظات
                        </div>

                        {
                          selected.notes
                        }
                      </div>
                    )}

                    <button
                      onClick={() =>
                        togglePaid(
                          selected.id
                        )
                      }
                      style={{
                        width: "100%",
                        background:
                          selected.paid
                            ? "transparent"
                            : COLORS.profit,
                        color:
                          selected.paid
                            ? COLORS.profit
                            : "#FFFDF6",
                        border:
                          `1.5px solid ${COLORS.profit}`,
                        borderRadius: 10,
                        padding:
                          "13px",
                        fontSize: 15,
                        fontWeight:
                          600,
                        cursor:
                          "pointer",
                        marginBottom: 10,
                      }}
                    >
                      {selected.paid
                        ? "تراجع عن السداد"
                        : "تحديد كمسدد"}
                    </button>

                    <button
                      onClick={() =>
                        deleteItem(
                          selected.id
                        )
                      }
                      style={{
                        width: "100%",
                        background:
                          "transparent",
                        color:
                          COLORS.stampRed,
                        border:
                          "none",
                        padding:
                          "10px",
                        fontSize: 14,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap: 6,
                        cursor:
                          "pointer",
                      }}
                    >
                      <Trash2 size={15} />
                      حذف المستفيد
                    </button>
                  </DotPaper>
                </div>
              )}

            {view === "form" && (
              <div>
                <TopBar
                  title={
                    editingId
                      ? "تعديل مستفيد"
                      : "مستفيد جديد"
                  }
                  onBack={() =>
                    setView(
                      editingId
                        ? "detail"
                        : "home"
                    )
                  }
                  right={
                    <button
                      onClick={() =>
                        setView(
                          editingId
                            ? "detail"
                            : "home"
                        )
                      }
                      style={{
                        background:
                          "none",
                        border:
                          "none",
                        color:
                          COLORS.paper,
                        cursor:
                          "pointer",
                      }}
                    >
                      <X size={18} />
                    </button>
                  }
                />

                <DotPaper
                  style={{
                    padding: 20,
                  }}
                >
                  <Field label="اسم المستفيد">
                    <input
                      style={
                        inputStyle
                      }
                      value={
                        form.name
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name:
                            e.target
                              .value,
                        })
                      }
                      placeholder="مدالله العنزي"
                    />
                  </Field>

                  <Field label="المبلغ المعطى">
                    <input
                      style={
                        inputStyle
                      }
                      value={
                        form.given
                      }
                      inputMode="decimal"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          given:
                            toEnglishDigits(
                              e.target
                                .value
                            ),
                        })
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field label="المبلغ الذي سيرجع">
                    <input
                      style={
                        inputStyle
                      }
                      value={
                        form.toReturn
                      }
                      inputMode="decimal"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          toReturn:
                            toEnglishDigits(
                              e.target
                                .value
                            ),
                        })
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field label="التاريخ">
                    <input
                      style={
                        inputStyle
                      }
                      type="date"
                      value={
                        form.date
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          date:
                            e.target
                              .value,
                        })
                      }
                    />
                  </Field>

                  <Field label="موعد السداد">
                    <input
                      style={
                        inputStyle
                      }
                      type="date"
                      value={
                        form.dueDate
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dueDate:
                            e.target
                              .value,
                        })
                      }
                    />
                  </Field>

                  <Field label="ملاحظات">
                    <textarea
                      style={{
                        ...inputStyle,
                        minHeight: 70,
                        resize:
                          "vertical",
                      }}
                      value={
                        form.notes
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          notes:
                            e.target
                              .value,
                        })
                      }
                    />
                  </Field>

                  {error && (
                    <div
                      style={{
                        color:
                          COLORS.stampRed,
                        fontSize: 13,
                        marginBottom: 12,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    onClick={
                      submitForm
                    }
                    disabled={
                      saving
                    }
                    style={{
                      width: "100%",
                      background:
                        COLORS.ink,
                      color:
                        COLORS.paper,
                      border:
                        "none",
                      borderRadius: 10,
                      padding:
                        "13px",
                      fontSize: 15,
                      fontWeight:
                        600,
                      cursor:
                        "pointer",
                      opacity:
                        saving
                          ? 0.7
                          : 1,
                    }}
                  >
                    {saving
                      ? "جار الحفظ..."
                      : editingId
                      ? "حفظ التعديلات"
                      : "إضافة المستفيد"}
                  </button>
                </DotPaper>
              </div>
            )}

            {/* =========================
                إدارة الحسابات
            ========================= */}
            {view === "admin" && (
              <div>
                <TopBar
                  title="إدارة الحسابات"
                  onBack={() =>
                    setView("home")
                  }
                />

                <DotPaper
                  style={{
                    padding: 16,
                  }}
                >
                  {pendingError && (
                    <div
                      style={{
                        background:
                          "#FBEAE6",
                        color:
                          COLORS.stampRed,
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 13,
                        marginBottom: 12,
                        textAlign:
                          "center",
                      }}
                    >
                      {pendingError}
                    </div>
                  )}

                  {error && (
                    <div
                      style={{
                        background:
                          "#FBEAE6",
                        color:
                          COLORS.stampRed,
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 13,
                        marginBottom: 12,
                        textAlign:
                          "center",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {pendingUsers.length ===
                  0 ? (
                    <div
                      style={{
                        textAlign:
                          "center",
                        color:
                          COLORS.inkSoft,
                        fontSize: 13,
                        marginTop: 30,
                        lineHeight: 1.8,
                      }}
                    >
                      ما فيه طلبات تسجيل جديدة
                      <br />
                      بانتظار الموافقة
                    </div>
                  ) : (
                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: 10,
                      }}
                    >
                      {pendingUsers.map(
                        (u) => (
                          <div
                            key={u.uid}
                            style={{
                              background:
                                "#FFFDF6",
                              border:
                                `1px solid ${COLORS.paperLine}`,
                              borderRadius: 10,
                              padding:
                                "13px 14px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight:
                                    600,
                                  color:
                                    COLORS.ink,
                                  direction:
                                    "ltr",
                                  textAlign:
                                    "right",
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {
                                  u.email
                                }
                              </div>

                              <div
                                style={{
                                  fontSize: 11,
                                  color:
                                    COLORS.inkSoft,
                                  marginTop: 3,
                                }}
                              >
                                حساب جديد
                                بانتظار الموافقة
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                approveUser(
                                  u.uid
                                )
                              }
                              style={{
                                background:
                                  COLORS.profit,
                                color:
                                  "#FFFDF6",
                                border:
                                  "none",
                                borderRadius: 8,
                                padding:
                                  "9px 14px",
                                fontSize: 13,
                                fontWeight:
                                  600,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 6,
                                cursor:
                                  "pointer",
                              }}
                            >
                              <UserCheck
                                size={
                                  15
                                }
                              />
                              موافقة
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </DotPaper>
              </div>
            )}
          </>
        )
      ) : profile === undefined ? (
        <div
          style={{
            color: COLORS.paper,
            textAlign: "center",
            padding: 60,
            fontFamily:
              "'IBM Plex Sans Arabic', sans-serif",
          }}
        >
          جار التحميل...
        </div>
      ) : !profile ||
        !profile.approved ? (
        /* =========================
           انتظار الموافقة
        ========================= */
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent:
              "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily:
                "'Rakkas', serif",
              fontSize: 26,
              color:
                COLORS.paper,
              marginBottom: 14,
            }}
          >
            بانتظار الموافقة
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#C9BFA0",
              lineHeight: 1.9,
              maxWidth: 280,
              marginBottom: 24,
            }}
          >
            حسابك ({user.email}) بانتظار
            موافقة صاحب الدفتر عشان تقدرين
            توصلين لبياناتك
          </div>

          <button
            onClick={handleLogout}
            style={{
              background:
                "rgba(244,238,220,0.1)",
              border: "none",
              color: "#C9BFA0",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <LogOut size={14} />
            تسجيل الخروج
          </button>
        </div>
      ) : !loaded ? (
        <div
          style={{
            color: COLORS.paper,
            textAlign: "center",
            padding: 60,
            fontFamily:
              "'IBM Plex Sans Arabic', sans-serif",
          }}
        >
          جار التحميل...
        </div>
      ) : (
        <div
          style={{
            color: COLORS.paper,
            textAlign: "center",
            padding: 60,
          }}
        >
          حدث خطأ في تحميل التطبيق
        </div>
      )}
    </div>
  );
}

// ===============================
// صف البيانات
// ===============================
function Row({
  label,
  value,
  color,
  last,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        padding: "14px 16px",
        borderBottom: last
          ? "none"
          : `1px solid ${COLORS.paperLine}`,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color:
            COLORS.inkSoft,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color,
        }}
      >
        {value}{" "}
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
          }}
        >
          ريال
        </span>
      </span>
    </div>
  );
}
